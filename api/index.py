"""
AI AirGuard – Vercel Serverless Entry Point
This file is the @vercel/python handler. It imports the Flask app from
backend/ and exposes it as `app` for Vercel to serve via WSGI.

Vercel mounts everything under /api/* which maps here.
The React build (dist/) is served as static files by Vercel's CDN.
"""

import sys
import os

# ── Path setup ──────────────────────────────────────────────────────────────
# Add the backend/ directory to sys.path so we can import auth, email_service, etc.
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.join(_HERE, "..", "backend")
sys.path.insert(0, _BACKEND)

# ── Override DB_PATH before importing backend modules ───────────────────────
# Vercel serverless functions can only write to /tmp/
# We patch the env var so auth.py picks it up at import time.
if not os.environ.get("AIRGUARD_DB_PATH"):
    os.environ["AIRGUARD_DB_PATH"] = "/tmp/airguard.db"

# ── Import the Flask app from backend/ ──────────────────────────────────────
# backend/app.py defines `app = Flask(...)` with all routes.
# We re-export it here so Vercel finds it as the WSGI callable.
from app import app  # noqa: F401  — `app` is the Vercel WSGI handler

# Vercel looks for `app` in this module automatically.
# No additional code needed — the Flask app is already fully configured.
