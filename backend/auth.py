"""
AI AirGuard – Authentication Module
Handles user registration, login, JWT sessions, profile management,
password reset tokens, and notification preferences.
Uses SQLite (zero-config, file-based) so no MySQL setup is needed.
"""

import sqlite3, bcrypt, jwt, os, secrets, re
from datetime import datetime, timedelta, timezone

DB_PATH  = os.path.join(os.path.dirname(__file__), "airguard.db")
JWT_EXPIRY_HOURS = 24 * 7   # 7-day session

def _jwt_secret():
    """Read at call time so env var changes after import are picked up."""
    return os.environ.get("JWT_SECRET", "airguard-jwt-secret-change-in-production")


# ── Database initialisation ───────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name       TEXT    NOT NULL,
            email           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
            phone           TEXT,
            city            TEXT    DEFAULT 'Bengaluru',
            password_hash   TEXT    NOT NULL,
            email_verified  INTEGER DEFAULT 0,
            notify_enabled  INTEGER DEFAULT 1,
            notify_threshold INTEGER DEFAULT 150,
            created_at      TEXT    DEFAULT (datetime('now')),
            updated_at      TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS password_resets (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            token       TEXT    NOT NULL UNIQUE,
            expires_at  TEXT    NOT NULL,
            used        INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS alert_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            location    TEXT    NOT NULL,
            aqi         INTEGER NOT NULL,
            category    TEXT    NOT NULL,
            message     TEXT    NOT NULL,
            email_sent  INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS alert_cooldowns (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            location    TEXT    NOT NULL,
            last_sent   TEXT    NOT NULL,
            UNIQUE(user_id, location)
        );
    """)
    conn.commit()
    conn.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(12)).decode()

def _check(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def _make_token(user_id: int, email: str) -> str:
    secret = _jwt_secret()
    payload = {
        "sub": str(user_id),   # PyJWT >= 2.x requires sub as string
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, secret, algorithm="HS256")

def verify_token(token: str):
    """Returns user dict or None."""
    try:
        secret = _jwt_secret()
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        user_id = int(payload["sub"])
        conn = get_db()
        row = conn.execute(
            "SELECT id, full_name, email, phone, city, notify_enabled, notify_threshold, created_at "
            "FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"[verify_token] {e}")
        return None

def _user_from_row(row) -> dict:
    if not row:
        return None
    d = dict(row)
    d.pop("password_hash", None)
    return d


# ── Auth endpoints logic ──────────────────────────────────────────────────────

def register(data: dict):
    full_name = (data.get("fullName") or "").strip()
    email     = (data.get("email") or "").strip().lower()
    phone     = (data.get("phone") or "").strip()
    city      = (data.get("city") or "Bengaluru").strip()
    password  = data.get("password") or ""
    confirm   = data.get("confirmPassword") or ""

    # Validation
    if not full_name:
        return None, "Full name is required."
    if not EMAIL_RE.match(email):
        return None, "Please enter a valid email address."
    if len(password) < 8:
        return None, "Password must be at least 8 characters."
    if password != confirm:
        return None, "Passwords do not match."

    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            return None, "An account with this email already exists."

        pw_hash = _hash(password)
        conn.execute(
            "INSERT INTO users (full_name, email, phone, city, password_hash) VALUES (?,?,?,?,?)",
            (full_name, email, phone, city, pw_hash)
        )
        conn.commit()
        user = conn.execute(
            "SELECT id, full_name, email, phone, city, notify_enabled, notify_threshold, created_at "
            "FROM users WHERE email = ?", (email,)
        ).fetchone()
        token = _make_token(user["id"], user["email"])
        return {"user": _user_from_row(user), "token": token}, None
    finally:
        conn.close()


def login(data: dict):
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return None, "Email and password are required."

    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id, full_name, email, phone, city, password_hash, notify_enabled, notify_threshold, created_at "
            "FROM users WHERE email = ?", (email,)
        ).fetchone()
        if not row or not _check(password, row["password_hash"]):
            return None, "Incorrect email or password."

        user = _user_from_row(row)
        token = _make_token(user["id"], user["email"])
        return {"user": user, "token": token}, None
    finally:
        conn.close()


def get_profile(user_id: int):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id, full_name, email, phone, city, notify_enabled, notify_threshold, created_at "
            "FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return _user_from_row(row)
    finally:
        conn.close()


def update_profile(user_id: int, data: dict):
    allowed = ["full_name", "phone", "city", "notify_enabled", "notify_threshold"]
    updates, vals = [], []
    # Map camelCase → snake_case
    mapping = {
        "fullName": "full_name", "phone": "phone", "city": "city",
        "notifyEnabled": "notify_enabled", "notifyThreshold": "notify_threshold",
    }
    for k, col in mapping.items():
        if k in data:
            updates.append(f"{col} = ?")
            vals.append(data[k])
    if not updates:
        return None, "No valid fields to update."

    # Optional password change
    if data.get("newPassword"):
        if len(data["newPassword"]) < 8:
            return None, "New password must be at least 8 characters."
        conn = get_db()
        row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.close()
        if not row or not _check(data.get("currentPassword", ""), row["password_hash"]):
            return None, "Current password is incorrect."
        updates.append("password_hash = ?")
        vals.append(_hash(data["newPassword"]))

    updates.append("updated_at = datetime('now')")
    vals.append(user_id)

    conn = get_db()
    try:
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", vals)
        conn.commit()
        return get_profile(user_id), None
    finally:
        conn.close()


def create_reset_token(email: str):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        if not row:
            # Return success anyway to avoid email enumeration
            return secrets.token_urlsafe(32), None
        token = secrets.token_urlsafe(32)
        expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        conn.execute("DELETE FROM password_resets WHERE user_id = ?", (row["id"],))
        conn.execute(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)",
            (row["id"], token, expires)
        )
        conn.commit()
        return token, row["id"]
    finally:
        conn.close()


def reset_password(token: str, new_password: str):
    if len(new_password) < 8:
        return False, "Password must be at least 8 characters."
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT user_id, expires_at, used FROM password_resets WHERE token = ?", (token,)
        ).fetchone()
        if not row:
            return False, "Invalid or expired reset link."
        if row["used"]:
            return False, "This reset link has already been used."
        if datetime.utcnow() > datetime.fromisoformat(row["expires_at"]):
            return False, "Reset link has expired. Please request a new one."
        pw_hash = _hash(new_password)
        conn.execute("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
                     (pw_hash, row["user_id"]))
        conn.execute("UPDATE password_resets SET used = 1 WHERE token = ?", (token,))
        conn.commit()
        return True, None
    finally:
        conn.close()


# ── Alert history ─────────────────────────────────────────────────────────────

def get_alert_history(user_id: int, limit: int = 20):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT id, location, aqi, category, message, email_sent, created_at "
            "FROM alert_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def log_alert(user_id: int, location: str, aqi: int, category: str, message: str, email_sent: bool = False):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO alert_history (user_id, location, aqi, category, message, email_sent) VALUES (?,?,?,?,?,?)",
            (user_id, location, aqi, category, message, 1 if email_sent else 0)
        )
        conn.commit()
    finally:
        conn.close()


def should_send_alert(user_id: int, location: str, cooldown_hours: int = 4) -> bool:
    """Returns True if enough time has passed since last alert for this user+location."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT last_sent FROM alert_cooldowns WHERE user_id = ? AND location = ?",
            (user_id, location.lower())
        ).fetchone()
        if not row:
            return True
        last = datetime.fromisoformat(row["last_sent"])
        return (datetime.utcnow() - last).total_seconds() > cooldown_hours * 3600
    finally:
        conn.close()


def mark_alert_sent(user_id: int, location: str):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO alert_cooldowns (user_id, location, last_sent) VALUES (?,?,datetime('now')) "
            "ON CONFLICT(user_id, location) DO UPDATE SET last_sent = datetime('now')",
            (user_id, location.lower())
        )
        conn.commit()
    finally:
        conn.close()


def get_users_for_location(location: str, aqi: int):
    """Return users who have this city set, want notifications, and pass the AQI threshold."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT id, full_name, email, city, notify_threshold FROM users "
            "WHERE notify_enabled = 1 AND LOWER(city) LIKE ? AND notify_threshold <= ?",
            (f"%{location.lower()}%", aqi)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
