"""
AI AirGuard – Email Notification Service
Sends pollution alerts via SMTP (Gmail, Outlook, or any SMTP server).
All credentials are loaded from environment variables only.
"""

import smtplib, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FROM_NAME = os.environ.get("FROM_NAME", "AI AirGuard")
FROM_ADDR = os.environ.get("FROM_ADDR", SMTP_USER)
APP_URL   = os.environ.get("APP_URL", "http://localhost:5000")


def _aqi_color(aqi: int) -> str:
    if aqi <= 50:   return "#22C55E"
    if aqi <= 100:  return "#84CC16"
    if aqi <= 200:  return "#EAB308"
    if aqi <= 300:  return "#F97316"
    if aqi <= 400:  return "#EF4444"
    return "#9333EA"

def _aqi_category(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Satisfactory"
    if aqi <= 200:  return "Moderate"
    if aqi <= 300:  return "Poor"
    if aqi <= 400:  return "Very Poor"
    return "Severe / Hazardous"

def _send(to_email: str, subject: str, html_body: str, plain_body: str) -> bool:
    if not SMTP_USER or not SMTP_PASS:
        print(f"[Email] SMTP not configured — would send to {to_email}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{FROM_NAME} <{FROM_ADDR}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body,  "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
            s.ehlo()
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(FROM_ADDR, to_email, msg.as_string())
        print(f"[Email] ✅ Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[Email] ❌ Failed to send to {to_email}: {e}")
        return False


def send_pollution_alert(user_name: str, user_email: str, location: str,
                         aqi: int, category: str = None, extra_msg: str = "") -> bool:
    cat   = category or _aqi_category(aqi)
    color = _aqi_color(aqi)
    now   = datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")

    subject = f"AI AirGuard – Air Pollution Alert for {location}!"

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body{{font-family:'Segoe UI',Arial,sans-serif;background:#0F1E32;margin:0;padding:0}}
  .wrap{{max-width:560px;margin:0 auto;background:#183B63;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4)}}
  .header{{background:linear-gradient(135deg,#0F1E32,#1a3a5c);padding:28px 32px;text-align:center;border-bottom:1px solid #35516D}}
  .logo{{font-size:2rem;margin-bottom:6px}}
  .brand{{color:#8DD8FF;font-size:1.3rem;font-weight:800;letter-spacing:-0.5px}}
  .sub{{color:#8BA8C4;font-size:0.82rem;margin-top:3px}}
  .body{{padding:28px 32px}}
  .greeting{{color:#DBEAFE;font-size:1rem;margin-bottom:16px}}
  .alert-box{{background:#0d2847;border-radius:10px;padding:20px;margin:18px 0;border-left:4px solid {color}}}
  .aqi-num{{font-size:3rem;font-weight:900;color:{color};line-height:1}}
  .aqi-label{{color:#8BA8C4;font-size:0.82rem;margin-top:4px}}
  .cat{{display:inline-block;background:{color}22;color:{color};border:1px solid {color}44;border-radius:20px;padding:4px 14px;font-size:0.82rem;font-weight:700;margin-top:8px}}
  .info-row{{display:flex;justify-content:space-between;margin:8px 0;color:#DBEAFE;font-size:0.88rem}}
  .info-label{{color:#8BA8C4}}
  .msg{{color:#DBEAFE;font-size:0.9rem;line-height:1.6;margin:16px 0}}
  .precautions{{background:#0a1f38;border-radius:8px;padding:14px 18px;margin:14px 0}}
  .prec-title{{color:#38BDF8;font-size:0.85rem;font-weight:700;margin-bottom:8px}}
  .prec-item{{color:#DBEAFE;font-size:0.82rem;margin:5px 0;padding-left:14px;position:relative}}
  .prec-item::before{{content:'•';position:absolute;left:0;color:{color}}}
  .cta{{text-align:center;margin:22px 0}}
  .btn{{display:inline-block;background:linear-gradient(135deg,#38BDF8,#0ea5e9);color:#0F1E32;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.9rem}}
  .footer{{background:#0d2847;padding:16px 32px;text-align:center;border-top:1px solid #35516D}}
  .footer p{{color:#8BA8C4;font-size:0.75rem;margin:3px 0}}
  .unsubscribe{{color:#35516D;font-size:0.72rem;margin-top:8px}}
  .unsubscribe a{{color:#35516D}}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">🌬️</div>
    <div class="brand">AI AirGuard</div>
    <div class="sub">Bengaluru Air Quality & Pollution Action Advisor</div>
  </div>
  <div class="body">
    <p class="greeting">Hello <strong style="color:#fff">{user_name}</strong>,</p>
    <p class="msg">
      ⚠️ The air quality in your selected location, <strong style="color:#8DD8FF">{location}</strong>,
      has reached an unhealthy level. We recommend taking precautionary measures.
    </p>
    <div class="alert-box">
      <div class="aqi-num">{aqi}</div>
      <div class="aqi-label">Air Quality Index (Indian AQI Scale)</div>
      <span class="cat">{cat}</span>
      <div style="margin-top:14px">
        <div class="info-row"><span class="info-label">📍 Location</span><span>{location}</span></div>
        <div class="info-row"><span class="info-label">🕐 Recorded</span><span>{now}</span></div>
      </div>
    </div>
    {'<p class="msg">' + extra_msg + '</p>' if extra_msg else ''}
    <div class="precautions">
      <div class="prec-title">🩺 Recommended Precautions</div>
      {''.join(f'<div class="prec-item">{p}</div>' for p in _get_precautions(aqi))}
    </div>
    <div class="cta">
      <a href="{APP_URL}" class="btn">View Full AirGuard Dashboard</a>
    </div>
  </div>
  <div class="footer">
    <p>Stay safe,</p>
    <p><strong style="color:#8DD8FF">AI AirGuard Team</strong> · Powered by IBM Granite · watsonx.ai</p>
    <p class="unsubscribe">You can disable email notifications in your <a href="{APP_URL}">profile settings</a>.</p>
  </div>
</div>
</body></html>"""

    plain = f"""AI AirGuard – Air Pollution Alert for {location}

Hello {user_name},

The air quality in your selected location, {location}, has reached an unhealthy level.

Current AQI: {aqi}
Pollution Category: {cat}
Recorded at: {now}

{extra_msg}

Recommended Precautions:
{chr(10).join('• ' + p for p in _get_precautions(aqi))}

Please check AI AirGuard for personalized recommendations: {APP_URL}

Stay safe,
AI AirGuard Team
Powered by IBM Granite · watsonx.ai

(To disable email notifications, update your profile settings at {APP_URL})
"""
    return _send(user_email, subject, html, plain)


def send_welcome_email(user_name: str, user_email: str) -> bool:
    subject = "Welcome to AI AirGuard – Bengaluru's Air Quality Advisor"
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{{font-family:'Segoe UI',Arial,sans-serif;background:#0F1E32;margin:0;padding:0}}
  .wrap{{max-width:560px;margin:0 auto;background:#183B63;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4)}}
  .header{{background:linear-gradient(135deg,#0F1E32,#1a3a5c);padding:28px 32px;text-align:center;border-bottom:1px solid #35516D}}
  .logo{{font-size:2.5rem;margin-bottom:8px}}
  .brand{{color:#8DD8FF;font-size:1.4rem;font-weight:800}}
  .body{{padding:28px 32px}}
  .greeting{{color:#DBEAFE;font-size:1rem;margin-bottom:14px}}
  .feature{{display:flex;align-items:flex-start;gap:12px;margin:12px 0;padding:12px 14px;background:#0d2847;border-radius:8px;border-left:3px solid #38BDF8}}
  .feat-icon{{font-size:1.3rem;flex-shrink:0;margin-top:1px}}
  .feat-title{{color:#8DD8FF;font-size:0.88rem;font-weight:700}}
  .feat-desc{{color:#8BA8C4;font-size:0.8rem;margin-top:2px}}
  .cta{{text-align:center;margin:22px 0}}
  .btn{{display:inline-block;background:linear-gradient(135deg,#38BDF8,#0ea5e9);color:#0F1E32;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:800;font-size:0.95rem}}
  .footer{{background:#0d2847;padding:16px 32px;text-align:center;border-top:1px solid #35516D}}
  .footer p{{color:#8BA8C4;font-size:0.75rem;margin:3px 0}}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">🌬️</div>
    <div class="brand">AI AirGuard</div>
  </div>
  <div class="body">
    <p class="greeting">Hello <strong style="color:#fff">{user_name}</strong>, welcome to AI AirGuard! 🎉</p>
    <p style="color:#DBEAFE;font-size:0.9rem;margin-bottom:16px">Your account is ready. Here's what you can do:</p>
    <div class="feature"><span class="feat-icon">📡</span><div><div class="feat-title">Real-Time AQI Monitoring</div><div class="feat-desc">Track PM2.5, PM10, NO2, SO2 for any Bengaluru location</div></div></div>
    <div class="feature"><span class="feat-icon">🚗</span><div><div class="feat-title">AirSafe Journey Planner</div><div class="feat-desc">Get pollution-aware route recommendations with health risk scoring</div></div></div>
    <div class="feature"><span class="feat-icon">🤖</span><div><div class="feat-title">IBM Granite AI Assistant</div><div class="feat-desc">Ask anything about Bengaluru air quality and get intelligent answers</div></div></div>
    <div class="feature"><span class="feat-icon">🚨</span><div><div class="feat-title">Email Pollution Alerts</div><div class="feat-desc">Get notified when your city's AQI exceeds your chosen threshold</div></div></div>
    <div class="cta"><a href="{APP_URL}" class="btn">Open AI AirGuard →</a></div>
  </div>
  <div class="footer">
    <p><strong style="color:#8DD8FF">AI AirGuard Team</strong> · IBM Granite · watsonx.ai · 5 AI Agents</p>
  </div>
</div>
</body></html>"""
    plain = f"Welcome to AI AirGuard, {user_name}!\n\nOpen the app: {APP_URL}\n\nStay safe,\nAI AirGuard Team"
    return _send(user_email, subject, html, plain)


def send_reset_email(user_email: str, reset_token: str) -> bool:
    reset_url = f"{APP_URL}?reset_token={reset_token}"
    subject = "AI AirGuard – Reset Your Password"
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{{font-family:'Segoe UI',Arial,sans-serif;background:#0F1E32;margin:0;padding:0}}
  .wrap{{max-width:560px;margin:0 auto;background:#183B63;border-radius:14px;overflow:hidden}}
  .header{{background:linear-gradient(135deg,#0F1E32,#1a3a5c);padding:24px 32px;text-align:center;border-bottom:1px solid #35516D}}
  .brand{{color:#8DD8FF;font-size:1.3rem;font-weight:800}}
  .body{{padding:28px 32px}}
  .msg{{color:#DBEAFE;font-size:0.9rem;line-height:1.6;margin:12px 0}}
  .token-box{{background:#0d2847;border:1px solid #35516D;border-radius:8px;padding:16px;text-align:center;margin:16px 0;word-break:break-all;color:#38BDF8;font-family:monospace;font-size:0.85rem}}
  .cta{{text-align:center;margin:22px 0}}
  .btn{{display:inline-block;background:linear-gradient(135deg,#38BDF8,#0ea5e9);color:#0F1E32;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:700}}
  .warn{{color:#8BA8C4;font-size:0.78rem;text-align:center;margin-top:12px}}
  .footer{{background:#0d2847;padding:14px 32px;text-align:center;border-top:1px solid #35516D}}
  .footer p{{color:#8BA8C4;font-size:0.75rem}}
</style></head>
<body>
<div class="wrap">
  <div class="header"><div class="brand">🌬️ AI AirGuard</div></div>
  <div class="body">
    <h2 style="color:#8DD8FF;margin-bottom:12px">Password Reset Request</h2>
    <p class="msg">We received a request to reset your password. Click the button below to set a new password. This link expires in <strong style="color:#EAB308">1 hour</strong>.</p>
    <div class="cta"><a href="{reset_url}" class="btn">🔑 Reset My Password</a></div>
    <p class="warn">If the button doesn't work, copy this link:<br><span style="color:#38BDF8;word-break:break-all;font-size:0.78rem">{reset_url}</span></p>
    <p class="warn" style="margin-top:16px">If you did not request this, you can safely ignore this email. Your password will not change.</p>
  </div>
  <div class="footer"><p>AI AirGuard Team · IBM Granite · watsonx.ai</p></div>
</div>
</body></html>"""
    plain = f"Reset your AI AirGuard password:\n{reset_url}\n\nThis link expires in 1 hour.\nIf you did not request this, ignore this email."
    return _send(user_email, subject, html, plain)


def _get_precautions(aqi: int) -> list:
    if aqi > 300:
        return ["Stay indoors — keep all windows and doors closed","Use air purifier if available","Wear N95/N99 mask if outdoor exposure is unavoidable","Seek medical attention if breathing difficulty occurs","Avoid all strenuous outdoor activities"]
    if aqi > 200:
        return ["Limit outdoor activities to essential only","Wear an N95 mask outdoors","Keep windows closed during peak traffic hours","Use AC in recirculation mode","Vulnerable groups (children, elderly, asthma) must stay indoors"]
    if aqi > 100:
        return ["Sensitive groups should limit outdoor exposure","Wear mask for outdoor activities exceeding 1 hour","Avoid exercising near busy roads","Plan outdoor activities for 11 AM – 3 PM window"]
    return ["Air quality is moderate — standard precautions apply","Avoid heavy outdoor exercise near traffic","Check AirGuard before planning outdoor activities"]
