"""
AI AirGuard – Bengaluru Air Quality & Pollution Action Advisor
Python Flask Backend – Secure IBM Granite / watsonx.ai proxy + AQI data
Serves the React build from dist/ so the whole app runs on ONE port (5000).
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os, time, random, math
from datetime import datetime

# Resolve the React build directory (../dist relative to this backend/ folder)
_HERE = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(_HERE, "..", "dist")

app = Flask(
    __name__,
    static_folder=DIST_DIR,
    static_url_path="",
)
CORS(app, origins=["*"])

# ── Credentials (never sent to frontend) ──────────────────────────────────
WX_API_KEY    = os.environ.get("WATSONX_API_KEY", "")
WX_PROJECT_ID = os.environ.get("WATSONX_PROJECT_ID", "")
WX_BASE_URL   = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WX_MODEL      = os.environ.get("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
OWM_KEY       = os.environ.get("OWM_API_KEY", "")
GROQ_KEY      = os.environ.get("GROQ_API_KEY", "")

# ── IAM Token cache ────────────────────────────────────────────────────────
_token_cache = {"token": None, "exp": 0}

def get_iam_token():
    if _token_cache["token"] and time.time() < _token_cache["exp"] - 60:
        return _token_cache["token"]
    if not WX_API_KEY:
        return None
    try:
        import urllib.request, urllib.parse
        data = urllib.parse.urlencode({
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": WX_API_KEY,
        }).encode()
        req = urllib.request.Request(
            "https://iam.cloud.ibm.com/identity/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            import json
            d = json.loads(resp.read())
            _token_cache["token"] = d["access_token"]
            _token_cache["exp"] = time.time() + d.get("expires_in", 3600)
            return _token_cache["token"]
    except Exception as e:
        print(f"[IAM] Token error: {e}")
        return None

def _wrap_granite4_chat(prompt):
    """Wrap a plain prompt in the Granite 4 chat template so the model generates a response."""
    return (
        f"<|start_of_role|>system<|end_of_role|>"
        f"You are AI AirGuard, Bengaluru's environmental intelligence assistant powered by IBM Granite. "
        f"Respond in English only. Be concise and accurate.<|end_of_text|>\n"
        f"<|start_of_role|>user<|end_of_role|>{prompt}<|end_of_text|>\n"
        f"<|start_of_role|>assistant<|end_of_role|>"
    )

def call_granite(prompt, max_tokens=500):
    token = get_iam_token()
    if not token:
        return None, "no_token"
    import urllib.request, json
    url = f"{WX_BASE_URL}/ml/v1/text/generation?version=2023-05-29"
    # Wrap in chat template — required for granite-4-h-small
    formatted = _wrap_granite4_chat(prompt)
    payload = json.dumps({
        "model_id": WX_MODEL,
        "input": formatted,
        "parameters": {
            "decoding_method": "greedy",
            "max_new_tokens": max_tokens,
            "stop_sequences": ["<|end_of_text|>", "<|start_of_role|>"],
        },
        "project_id": WX_PROJECT_ID,
    }).encode()
    try:
        req = urllib.request.Request(url, data=payload, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        })
        with urllib.request.urlopen(req, timeout=35) as resp:
            d = json.loads(resp.read())
            text = d.get("results", [{}])[0].get("generated_text", "").strip()
            # Strip any trailing role tokens that leaked through
            for tok in ["<|end_of_text|>", "<|start_of_role|>"]:
                text = text.split(tok)[0].strip()
            if not text:
                return None, "empty_response"
            return text, "watsonx"
    except Exception as e:
        print(f"[Granite] Error: {e}")
        return None, "error"

def call_groq(messages, max_tokens=400):
    if not GROQ_KEY:
        return None
    import urllib.request, json
    payload = json.dumps({
        "model": "llama3-8b-8192",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }).encode()
    try:
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_KEY}"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            d = json.loads(resp.read())
            return d["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[Groq] Error: {e}")
        return None

# ── Bengaluru AQI Profiles ─────────────────────────────────────────────────
BLR_PROFILES = {
    "peenya":            {"aqi": 198, "pm25": 72, "pm10": 128, "no2": 65, "so2": 35, "co": 1200, "source": "Industrial Emissions"},
    "silk board":        {"aqi": 162, "pm25": 58, "pm10": 96,  "no2": 55, "so2": 22, "co": 980,  "source": "Traffic Congestion"},
    "marathahalli":      {"aqi": 155, "pm25": 54, "pm10": 92,  "no2": 48, "so2": 20, "co": 920,  "source": "Traffic + Construction"},
    "whitefield":        {"aqi": 148, "pm25": 50, "pm10": 85,  "no2": 45, "so2": 19, "co": 890,  "source": "IT Hub Traffic"},
    "hebbal":            {"aqi": 160, "pm25": 56, "pm10": 94,  "no2": 52, "so2": 21, "co": 950,  "source": "Highway + Industrial"},
    "kr puram":          {"aqi": 172, "pm25": 62, "pm10": 108, "no2": 58, "so2": 28, "co": 1050, "source": "Industrial + Traffic"},
    "bellandur":         {"aqi": 185, "pm25": 68, "pm10": 118, "no2": 62, "so2": 32, "co": 1100, "source": "Lake Pollution + Traffic"},
    "electronic city":   {"aqi": 145, "pm25": 52, "pm10": 88,  "no2": 42, "so2": 18, "co": 850,  "source": "Industrial + Traffic"},
    "koramangala":       {"aqi": 118, "pm25": 40, "pm10": 72,  "no2": 36, "so2": 14, "co": 680,  "source": "Commercial Traffic"},
    "indiranagar":       {"aqi": 112, "pm25": 38, "pm10": 68,  "no2": 34, "so2": 13, "co": 650,  "source": "Commercial Area"},
    "hsr layout":        {"aqi": 108, "pm25": 36, "pm10": 64,  "no2": 32, "so2": 12, "co": 620,  "source": "Residential IT"},
    "jayanagar":         {"aqi": 102, "pm25": 34, "pm10": 62,  "no2": 30, "so2": 11, "co": 590,  "source": "Mixed Residential"},
    "jp nagar":          {"aqi": 105, "pm25": 35, "pm10": 63,  "no2": 31, "so2": 12, "co": 600,  "source": "Residential"},
    "btm layout":        {"aqi": 115, "pm25": 39, "pm10": 70,  "no2": 35, "so2": 13, "co": 660,  "source": "Commercial"},
    "mg road":           {"aqi": 135, "pm25": 48, "pm10": 82,  "no2": 45, "so2": 18, "co": 820,  "source": "CBD Traffic"},
    "malleswaram":       {"aqi": 110, "pm25": 37, "pm10": 66,  "no2": 33, "so2": 12, "co": 630,  "source": "Old City Traffic"},
    "yelahanka":         {"aqi": 95,  "pm25": 32, "pm10": 58,  "no2": 28, "so2": 10, "co": 520,  "source": "Suburban"},
    "manyata tech park": {"aqi": 125, "pm25": 44, "pm10": 76,  "no2": 38, "so2": 15, "co": 720,  "source": "Office Traffic"},
    "outer ring road":   {"aqi": 168, "pm25": 60, "pm10": 102, "no2": 56, "so2": 26, "co": 1020, "source": "Highway Traffic"},
    "tumkur road":       {"aqi": 178, "pm25": 64, "pm10": 112, "no2": 60, "so2": 30, "co": 1080, "source": "Highway + Trucks"},
    "kengeri":           {"aqi": 88,  "pm25": 29, "pm10": 52,  "no2": 25, "so2": 9,  "co": 480,  "source": "Suburban"},
    "sarjapur":          {"aqi": 142, "pm25": 50, "pm10": 86,  "no2": 44, "so2": 18, "co": 840,  "source": "IT Corridor"},
    "banashankari":      {"aqi": 112, "pm25": 38, "pm10": 68,  "no2": 32, "so2": 12, "co": 640,  "source": "Residential"},
    "rajajinagar":       {"aqi": 128, "pm25": 44, "pm10": 78,  "no2": 40, "so2": 16, "co": 740,  "source": "Commercial"},
    "basavanagudi":      {"aqi": 100, "pm25": 34, "pm10": 61,  "no2": 29, "so2": 11, "co": 570,  "source": "Old Residential"},
    "yeshwanthpur":      {"aqi": 155, "pm25": 54, "pm10": 92,  "no2": 50, "so2": 24, "co": 930,  "source": "Industrial + Rail"},
    "bommanahalli":      {"aqi": 140, "pm25": 48, "pm10": 84,  "no2": 44, "so2": 17, "co": 820,  "source": "Industrial Outskirts"},
    "default":           {"aqi": 128, "pm25": 44, "pm10": 78,  "no2": 38, "so2": 16, "co": 740,  "source": "Mixed Urban"},
}

LOCATION_COORDS = {
    "peenya": (13.0276, 77.5202), "silk board": (12.9173, 77.6241),
    "marathahalli": (12.9591, 77.6974), "whitefield": (12.9698, 77.75),
    "hebbal": (13.0453, 77.5908), "kr puram": (13.0057, 77.7039),
    "bellandur": (12.9254, 77.6774), "electronic city": (12.8456, 77.6603),
    "koramangala": (12.9279, 77.6271), "indiranagar": (12.9784, 77.6408),
    "hsr layout": (12.9116, 77.6474), "jayanagar": (12.928, 77.5831),
    "jp nagar": (12.9105, 77.5862), "btm layout": (12.9165, 77.6101),
    "mg road": (12.9752, 77.6061), "malleswaram": (13.0027, 77.566),
    "yelahanka": (13.1007, 77.596), "manyata tech park": (13.0453, 77.6225),
    "outer ring road": (12.9279, 77.6701), "tumkur road": (13.0169, 77.5202),
    "kengeri": (12.9079, 77.4817), "sarjapur": (12.9148, 77.6762),
    "banashankari": (12.928, 77.5541), "rajajinagar": (12.9985, 77.5541),
    "yeshwanthpur": (13.0169, 77.5541), "bommanahalli": (12.8911, 77.6395),
    # Additional locations
    "electronic city phase 1": (12.8398, 77.6628), "electronic city phase 2": (12.8512, 77.6578),
    "kudlu gate": (12.8961, 77.6474), "sarjapur road": (12.9148, 77.6762),
    "varthur": (12.9394, 77.7452), "itpl": (12.9875, 77.7452),
    "domlur": (12.9593, 77.6373), "hal airport road": (12.9636, 77.6512),
    "banaswadi": (13.004, 77.653), "hennur": (13.0362, 77.64),
    "kalyan nagar": (13.0276, 77.64), "kammanahalli": (13.0132, 77.64),
    "frazer town": (12.9898, 77.6185), "cox town": (12.9981, 77.6185),
    "nagawara": (13.0453, 77.6225), "thanisandra": (13.0634, 77.64),
    "jakkur": (13.0763, 77.6185), "devanahalli": (13.2447, 77.7147),
    "peenya industrial area": (13.0276, 77.5202), "jalahalli": (13.0453, 77.5202),
    "mathikere": (13.0276, 77.5541), "vijayanagar": (12.9681, 77.533),
    "nagarbhavi": (12.9507, 77.5202), "rr nagar": (12.9165, 77.5202),
    "uttarahalli": (12.8911, 77.533), "padmanabhanagar": (12.9165, 77.5541),
    "wilson garden": (12.9418, 77.596), "richmond town": (12.9593, 77.602),
    "langford town": (12.9507, 77.602), "basavanagudi": (12.9418, 77.575),
    "seshadripuram": (12.9975, 77.5712), "gandhinagar": (12.9823, 77.5712),
    "srirampura": (13.0027, 77.5541), "majestic": (12.9775, 77.5712),
    "shivajinagar": (12.9869, 77.599), "sadashivanagar": (13.0042, 77.5712),
    "brigade road": (12.9718, 77.608), "commercial street": (12.9823, 77.6085),
    "cunningham road": (12.9869, 77.596), "residency road": (12.9681, 77.6061),
    "ashok nagar": (12.9681, 77.596), "hosur road": (12.9165, 77.6101),
}

def get_profile(location_name):
    name = location_name.lower().strip()
    for key, profile in BLR_PROFILES.items():
        if key in name or name in key:
            return profile, key
    return BLR_PROFILES["default"], "default"

def time_variation():
    h = datetime.now().hour
    if 7 <= h <= 10: return 1.25
    if 17 <= h <= 20: return 1.35
    if 2 <= h <= 5:  return 0.75
    return 1.0

def vary(val, pct=0.12):
    tv = time_variation()
    return round(val * tv * (1 + (random.random() - 0.5) * pct), 1)

def build_location_data(location, lat=None, lng=None):
    profile, matched_key = get_profile(location)
    coords = LOCATION_COORDS.get(matched_key, (12.9716, 77.5946))
    return {
        "city": location,
        "location": location,
        "lat": lat or coords[0],
        "lng": lng or coords[1],
        "aqi": int(vary(profile["aqi"], 0.18)),
        "pm25": vary(profile["pm25"]),
        "pm10": vary(profile["pm10"]),
        "no2": vary(profile["no2"]),
        "so2": vary(profile["so2"]),
        "co": vary(profile["co"], 0.2),
        "o3": round(18 + random.random() * 25, 1),
        "nh3": round(8 + random.random() * 14, 1),
        "temp": round(23 + random.random() * 7, 1),
        "humidity": int(55 + random.random() * 30),
        "windSpeed": round(2 + random.random() * 8, 1),
        "windDir": int(random.random() * 360),
        "dominantPollutant": "PM2.5" if profile["pm25"] > 50 else "NO\u2082",
        "primarySource": profile["source"],
        "updatedAt": datetime.utcnow().isoformat() + "Z",
        "isDemo": not bool(OWM_KEY),
        "dataSource": "OpenWeatherMap" if OWM_KEY else "AI AirGuard Demo — Bengaluru pollution pattern estimates",
    }

# ── ROUTES ─────────────────────────────────────────────────────────────────

@app.route("/")
def root():
    """Serve the React app. If dist/ doesn't exist yet, return a helpful message."""
    index = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index):
        return send_file(index)
    return jsonify({
        "name": "AI AirGuard Backend",
        "status": "running — but React build not found",
        "granite": "configured" if WX_API_KEY else "not_configured",
        "hint": "Run `npm run build` in the project root to generate dist/, then restart Flask.",
    })

@app.route("/<path:path>")
def catch_all(path):
    """
    Serve static assets (JS, CSS, images) from dist/.
    For any unknown path that isn't an /api/ route, fall back to index.html
    so React Router handles client-side navigation.
    """
    # API routes are handled by their own @app.route decorators above — this
    # catch-all only fires for non-API paths.
    target = os.path.join(DIST_DIR, path)
    if os.path.exists(target) and os.path.isfile(target):
        return send_from_directory(DIST_DIR, path)
    # SPA fallback
    index = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index):
        return send_file(index)
    return jsonify({"error": "React build not found. Run `npm run build`."}), 404

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "granite": bool(WX_API_KEY and WX_PROJECT_ID),
        "owm": bool(OWM_KEY),
        "groq": bool(GROQ_KEY),
        "model": WX_MODEL,
        "timestamp": datetime.utcnow().isoformat(),
    })

@app.route("/api/airquality")
def airquality():
    city = request.args.get("city", "Bengaluru")
    lat  = request.args.get("lat", type=float)
    lng  = request.args.get("lng", type=float)
    if OWM_KEY and lat and lng:
        import urllib.request, json
        try:
            url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lng}&appid={OWM_KEY}"
            with urllib.request.urlopen(url, timeout=10) as r:
                d = json.loads(r.read())["list"][0]
                c = d["components"]
                aqi_owm = d["main"]["aqi"]
                pm25 = c.get("pm2_5", 0)
                indian_aqi = max(1, min(500, int(pm25 * 4.5) if pm25 <= 12 else
                                        int(50 + (pm25 - 12) * 2.17) if pm25 <= 35 else
                                        int(100 + (pm25 - 35) * 5) if pm25 <= 55 else
                                        int(200 + (pm25 - 55) * 1.05)))
                return jsonify({
                    "city": city, "location": city, "lat": lat, "lng": lng,
                    "aqi": indian_aqi, "pm25": pm25, "pm10": c.get("pm10", 0),
                    "no2": c.get("no2", 0), "so2": c.get("so2", 0),
                    "co": c.get("co", 0), "o3": c.get("o3", 0), "nh3": c.get("nh3", 0),
                    "updatedAt": datetime.utcnow().isoformat() + "Z",
                    "isDemo": False, "dataSource": "OpenWeatherMap Air Pollution API",
                })
        except Exception as e:
            print(f"[OWM] Error: {e}")
    data = build_location_data(city, lat, lng)
    return jsonify(data)

@app.route("/api/hotspots")
def hotspots():
    spots = [
        {"name": "Peenya Industrial Area",   "lat": 13.0276, "lng": 77.5202},
        {"name": "Silk Board Junction",      "lat": 12.9173, "lng": 77.6241},
        {"name": "KR Puram",                 "lat": 13.0057, "lng": 77.7039},
        {"name": "Outer Ring Road",          "lat": 12.9279, "lng": 77.6701},
        {"name": "Bellandur Lake Road",      "lat": 12.9254, "lng": 77.6774},
        {"name": "Tumkur Road",              "lat": 13.0169, "lng": 77.5202},
        {"name": "Hebbal Flyover",           "lat": 13.0453, "lng": 77.5908},
        {"name": "Electronic City",          "lat": 12.8456, "lng": 77.6603},
        {"name": "Whitefield",               "lat": 12.9698, "lng": 77.75},
        {"name": "Marathahalli Bridge",      "lat": 12.9591, "lng": 77.6974},
        {"name": "Bommanahalli",             "lat": 12.8911, "lng": 77.6395},
        {"name": "Yeshwanthpur",             "lat": 13.0169, "lng": 77.5541},
    ]
    return jsonify([build_location_data(s["name"], s["lat"], s["lng"]) for s in spots])

@app.route("/api/watsonx/token", methods=["POST"])
def watsonx_token():
    token = get_iam_token()
    if not token:
        return jsonify({"error": "watsonx not configured or IAM error"}), 503
    return jsonify({"access_token": token, "expires_in": 3600})

@app.route("/api/granite/generate", methods=["POST"])
def granite_generate():
    body = request.get_json(force=True) or {}
    prompt = body.get("prompt", "")
    messages = body.get("messages", [])
    task_type = body.get("taskType", "general")
    location_data = body.get("locationData", {})

    if not prompt and messages:
        sys_prompt = build_system_prompt(location_data, task_type)
        history = "\n".join(
            f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('text', m.get('content', ''))}"
            for m in messages
        )
        prompt = f"{sys_prompt}\n\n{history}\nAssistant:"

    if not prompt:
        return jsonify({"error": "prompt required"}), 400

    text, source = call_granite(prompt)
    if text:
        return jsonify({"text": text, "provider": "watsonx", "model": WX_MODEL})

    # Groq fallback
    if messages:
        sys_content = build_system_prompt(location_data, task_type)
        groq_msgs = [{"role": "system", "content": sys_content}] + [
            {"role": m.get("role", "user"), "content": m.get("text", m.get("content", ""))}
            for m in messages
        ]
        groq_text = call_groq(groq_msgs)
        if groq_text:
            return jsonify({"text": groq_text, "provider": "groq", "model": "llama3-8b-8192"})

    return jsonify({"error": "no AI provider available", "demo": True}), 503

@app.route("/api/agents/analyze", methods=["POST"])
def agents_analyze():
    body = request.get_json(force=True) or {}
    location_data = body.get("locationData", {})
    task = body.get("task", "full_analysis")
    loc = location_data.get("location") or location_data.get("city", "Bengaluru")
    aqi = location_data.get("aqi", 128)
    pm25 = location_data.get("pm25", 44)
    pm10 = location_data.get("pm10", 78)
    no2  = location_data.get("no2", 38)
    source = location_data.get("primarySource", "Mixed Urban")

    prompt = f"""[ENGLISH ONLY] You are AI AirGuard, Bengaluru environmental intelligence system.
Respond in English only.

Location: {loc}, Bengaluru, India
AQI (Indian Scale): {aqi}
PM2.5: {pm25} ug/m3 (CPCB limit: 60)
PM10: {pm10} ug/m3 (CPCB limit: 100)
NO2: {no2} ug/m3
Primary Source: {source}
Task: {task}

Analyze in English (3-4 bullet points):
1. Air quality severity for {loc}
2. Main health concern and groups at risk
3. Likely pollution contributing factors
4. Recommended citizen action

Keep response concise and practical."""

    text, prov = call_granite(prompt)
    if text:
        return jsonify({"analysis": text, "provider": "watsonx", "model": WX_MODEL})

    groq_msgs = [
        {"role": "system", "content": "You are AI AirGuard, Bengaluru environmental intelligence assistant."},
        {"role": "user", "content": prompt},
    ]
    groq_text = call_groq(groq_msgs)
    if groq_text:
        return jsonify({"analysis": groq_text, "provider": "groq", "model": "llama3-8b-8192"})

    # Rule-based fallback
    fallback = generate_rule_based_analysis(loc, aqi, pm25, source)
    return jsonify({"analysis": fallback, "provider": "demo", "model": "rule-based"})

@app.route("/api/journey/analyze", methods=["POST"])
def journey_analyze():
    body = request.get_json(force=True) or {}
    origin      = body.get("origin", "").strip()
    destination = body.get("destination", "").strip()
    health_profile = body.get("healthProfile", "adults")
    request_id  = body.get("requestId", "")  # stale-result guard

    if not origin or not destination:
        return jsonify({"error": "origin and destination required"}), 400

    # 1. Resolve coordinates for both endpoints
    origin_data = build_location_data(origin)
    dest_data   = build_location_data(destination)
    o_lat, o_lng = origin_data["lat"], origin_data["lng"]
    d_lat, d_lng = dest_data["lat"],   dest_data["lng"]

    # 2. Fetch real route from OpenRouteService (free, no billing key needed for basic use)
    route_info = fetch_ors_route(o_lat, o_lng, d_lat, d_lng)

    # 3. Dynamic hotspots based on actual route corridor geometry
    route_coords = route_info.get("geometry", [])  # list of [lng, lat]
    dynamic_hotspots = get_route_corridor_hotspots(route_coords, origin, destination)

    # 4. Dynamic travel-time based on real distance
    travel_time = build_travel_time(route_info)

    # 5. Dynamic alternatives based on this specific journey
    alternatives = build_alternatives(origin, destination, o_lat, o_lng, d_lat, d_lng)

    # 6. Build Granite prompt using real route data
    dist_km  = route_info.get("distance_km", "unknown")
    dur_min  = route_info.get("duration_min", "unknown")
    hotspot_names = ", ".join(h["name"] for h in dynamic_hotspots) if dynamic_hotspots else "none identified"

    prompt = f"""[ENGLISH ONLY] You are AI AirGuard – AirSafe Journey Advisor for Bengaluru. Respond in English.

Journey: {origin} -> {destination}
Distance: {dist_km} km  |  Normal duration: {dur_min} min
Origin AQI: {origin_data['aqi']} (PM2.5: {origin_data['pm25']} ug/m3, Source: {origin_data.get('primarySource','mixed')})
Destination AQI: {dest_data['aqi']} (PM2.5: {dest_data['pm25']} ug/m3, Source: {dest_data.get('primarySource','mixed')})
Pollution hotspots near this route: {hotspot_names}
Health Profile: {health_profile}
Route data source: {"OpenRouteService" if route_info.get("source") == "ors" else "coordinate estimate"}

Provide AirSafe Journey advice in English (5 concise points):
1. Pollution comparison: origin vs destination and which is worse
2. Expected AQI exposure along this {dist_km}km route and why
3. Specific hotspots on THIS route corridor and how to minimise exposure
4. Best travel time window for this journey
5. Personalised health precaution for {health_profile} profile

Keep each point to 1-2 sentences. Be specific to {origin} -> {destination}."""

    text, prov = call_granite(prompt)
    if not text:
        groq_msgs = [
            {"role": "system", "content": "You are AI AirGuard, Bengaluru AirSafe Journey advisor. Respond in English only."},
            {"role": "user", "content": prompt},
        ]
        text = call_groq(groq_msgs)
        prov = "groq" if text else "demo"

    if not text:
        text = generate_rule_based_journey(origin, destination, health_profile,
                                           origin_data["aqi"], dest_data["aqi"])

    return jsonify({
        "requestId":    request_id,
        "routeAnalysis": text,
        "provider":     prov,
        "originData":   origin_data,
        "destData":     dest_data,
        "travelTime":   travel_time,
        "hotspots":     dynamic_hotspots,
        "alternatives": alternatives,
        "routeInfo":    {
            "distance_km":   route_info.get("distance_km"),
            "duration_min":  route_info.get("duration_min"),
            "source":        route_info.get("source", "estimate"),
            "geometry":      route_coords[:50],  # first 50 points for map
            "bbox":          route_info.get("bbox"),
        },
    })

@app.route("/api/simulate", methods=["POST"])
def simulate():
    body = request.get_json(force=True) or {}
    scenario_type = body.get("type", "traffic")
    params = body.get("params", {})
    location = body.get("location", "Bengaluru")

    prompt = f"""You are AI AirGuard environmental simulator for Bengaluru.

Simulation Scenario: {scenario_type}
Location: {location}
Parameters: {params}

Simulate the environmental impact (clearly labeled as SIMULATION):
1. Expected AQI change (increase/decrease percentage)
2. Most affected areas in Bengaluru
3. Duration of estimated impact
4. Health advisory during this scenario
5. Recommended mitigation measures

Clearly state this is a simulation estimate, not a real measurement."""

    text, prov = call_granite(prompt)
    if not text:
        text = call_groq([
            {"role": "system", "content": "You are AI AirGuard environmental simulator."},
            {"role": "user", "content": prompt},
        ])
        prov = "groq" if text else "demo"
    if not text:
        text = get_simulation_fallback(scenario_type)

    return jsonify({"result": text, "provider": prov, "isSimulation": True})

# ── Helper functions ───────────────────────────────────────────────────────

def build_system_prompt(loc_data, task_type):
    loc = loc_data.get("location") or loc_data.get("city", "Bengaluru")
    aqi = loc_data.get("aqi", "")
    base = "You are AI AirGuard, Bengaluru's environmental intelligence assistant powered by IBM Granite. ALWAYS respond in English only."
    if aqi:
        base += f" Current location: {loc} (AQI: {aqi})."
    base += " Provide concise, actionable answers in English. Focus on Bengaluru. Health recommendations are general guidance, not medical advice."
    return base

def generate_rule_based_analysis(loc, aqi, pm25, source):
    if aqi > 200:
        return (f"⚠️ POOR Air Quality at {loc} (AQI: {aqi}). PM2.5 at {pm25} μg/m³ significantly exceeds CPCB standard of 60 μg/m³. "
                f"Primary source: {source}. Health risk for all groups. "
                "Recommendations: Avoid outdoor activity, use N95 mask, keep windows closed. "
                "Authorities should increase air-quality monitoring and enforce emission norms.")
    if aqi > 100:
        return (f"🟡 Moderate Pollution at {loc} (AQI: {aqi}). PM2.5 at {pm25} μg/m³ — elevated. "
                f"Main contributor: {source}. Sensitive groups (children, elderly, asthma) should limit outdoor exposure. "
                "Mask recommended. Avoid outdoor exercise during peak hours 7–10am and 5–9pm.")
    return (f"🟢 Acceptable Air Quality at {loc} (AQI: {aqi}). PM2.5 at {pm25} μg/m³ — within manageable range. "
            f"Source: {source}. Standard precautions apply. Avoid heavy exercise near congested roads.")

def generate_rule_based_journey(origin, destination, profile, origin_aqi, dest_aqi):
    better = origin if origin_aqi < dest_aqi else destination
    worse  = destination if origin_aqi < dest_aqi else origin
    advice = {
        "children": "Keep children in filtered/AC vehicle. Avoid opening windows at traffic signals.",
        "elderly":  "Travel during 11am–3pm. Carry prescribed medications. Use AC vehicle.",
        "asthma":   "Pre-medicate before journey. Avoid Silk Board and ORR during peak hours. Carry inhaler.",
        "cardiac":  "Minimize idling in heavy traffic. Use Namma Metro if available.",
        "adults":   "Normal precautions. Avoid peak hours 7–10am and 5–9pm when possible.",
    }
    return (f"🗺️ AirSafe Journey: {origin} → {destination}\n\n"
            f"Origin AQI: {origin_aqi} | Destination AQI: {dest_aqi}\n"
            f"Comparison: {better} has relatively better air quality.\n\n"
            f"Key hotspots on this corridor: Expect elevated pollution near Silk Board, ORR, or KR Puram (depending on route).\n\n"
            f"Best travel time: 11:00 AM – 3:00 PM to avoid peak traffic pollution.\n\n"
            f"Health Advice ({profile}): {advice.get(profile, advice['adults'])}\n\n"
            f"Alternative: Namma Metro reduces pollution exposure by 40–60% compared to road travel.")

# ── OpenRouteService (free public API) ────────────────────────────────────────
ORS_KEY = os.environ.get("ORS_API_KEY", "")  # optional — public endpoint works without key

def fetch_ors_route(o_lat, o_lng, d_lat, d_lng):
    """Fetch a real driving route from OpenRouteService. Falls back to straight-line estimate."""
    import urllib.request, json, math

    # Try ORS public API
    try:
        url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
        payload = json.dumps({
            "coordinates": [[o_lng, o_lat], [d_lng, d_lat]],
            "instructions": False,
            "geometry_simplify": True,
        }).encode()
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if ORS_KEY:
            headers["Authorization"] = ORS_KEY
        req = urllib.request.Request(url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
            feat = data["features"][0]
            props = feat["properties"]["summary"]
            coords = feat["geometry"]["coordinates"]  # [[lng, lat], ...]
            dist_km  = round(props["distance"] / 1000, 1)
            dur_min  = round(props["duration"] / 60, 0)
            bbox = feat.get("bbox")
            return {
                "source": "ors",
                "geometry": coords,
                "distance_km": dist_km,
                "duration_min": int(dur_min),
                "bbox": bbox,
            }
    except Exception as e:
        print(f"[ORS] Route fetch error: {e}")

    # Fallback: Haversine straight-line distance × 1.35 road factor
    import math
    R = 6371
    dlat = math.radians(d_lat - o_lat)
    dlng = math.radians(d_lng - o_lng)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(o_lat)) * math.cos(math.radians(d_lat)) * math.sin(dlng/2)**2
    straight_km = R * 2 * math.asin(math.sqrt(a))
    road_km = round(straight_km * 1.35, 1)
    h = datetime.now().hour
    speed_kmh = 15 if (7 <= h <= 10 or 17 <= h <= 20) else 25
    dur_min = max(5, int((road_km / speed_kmh) * 60))

    # Interpolate a simple straight-line "geometry" for the map
    steps = max(2, min(20, int(road_km)))
    geometry = [
        [o_lng + (d_lng - o_lng) * i / (steps - 1),
         o_lat + (d_lat - o_lat) * i / (steps - 1)]
        for i in range(steps)
    ]
    return {
        "source": "estimate",
        "geometry": geometry,
        "distance_km": road_km,
        "duration_min": dur_min,
        "bbox": [min(o_lng, d_lng), min(o_lat, d_lat), max(o_lng, d_lng), max(o_lat, d_lat)],
    }


def point_to_segment_dist(px, py, ax, ay, bx, by):
    """Perpendicular distance from point P to segment AB (all in degrees, approx)."""
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax)**2 + (py - ay)**2) ** 0.5
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx**2 + dy**2)))
    return (((px - ax - t * dx)**2 + (py - ay - t * dy)**2) ** 0.5)


# All known Bengaluru pollution hotspots with coordinates
ALL_BLR_HOTSPOTS = [
    {"name": "Peenya Industrial Area",  "lat": 13.0276, "lng": 77.5202, "aqi": 198, "source": "Industrial Emissions",    "type": "industrial"},
    {"name": "Silk Board Junction",     "lat": 12.9173, "lng": 77.6241, "aqi": 162, "source": "Traffic Congestion",      "type": "traffic"},
    {"name": "KR Puram",                "lat": 13.0057, "lng": 77.7039, "aqi": 172, "source": "Industrial + Traffic",    "type": "industrial"},
    {"name": "Outer Ring Road (Marathahalli)", "lat": 12.9591, "lng": 77.6974, "aqi": 168, "source": "Highway Traffic", "type": "traffic"},
    {"name": "Bellandur Lake Road",     "lat": 12.9254, "lng": 77.6774, "aqi": 185, "source": "Lake Pollution + Traffic","type": "mixed"},
    {"name": "Hebbal Flyover",          "lat": 13.0453, "lng": 77.5908, "aqi": 160, "source": "Highway Junction",        "type": "traffic"},
    {"name": "Tumkur Road",             "lat": 13.0169, "lng": 77.5202, "aqi": 178, "source": "Highway + Trucks",        "type": "industrial"},
    {"name": "Electronic City Toll",    "lat": 12.8456, "lng": 77.6603, "aqi": 145, "source": "IT Hub Traffic",          "type": "traffic"},
    {"name": "Whitefield-Varthur Road", "lat": 12.9394, "lng": 77.7452, "aqi": 155, "source": "IT Corridor Traffic",     "type": "traffic"},
    {"name": "Bommanahalli Junction",   "lat": 12.8911, "lng": 77.6395, "aqi": 140, "source": "Industrial Outskirts",    "type": "industrial"},
    {"name": "Yeshwanthpur Circle",     "lat": 13.0169, "lng": 77.5541, "aqi": 155, "source": "Industrial + Rail",       "type": "industrial"},
    {"name": "Hosur Road (Madiwala)",   "lat": 12.9165, "lng": 77.6101, "aqi": 148, "source": "Commercial Traffic",      "type": "traffic"},
    {"name": "Tin Factory Junction",    "lat": 13.0040, "lng": 77.6530, "aqi": 145, "source": "Junction Traffic",        "type": "traffic"},
    {"name": "Baiyappanahalli",         "lat": 12.9992, "lng": 77.6618, "aqi": 138, "source": "Road + Rail",             "type": "mixed"},
]

def get_route_corridor_hotspots(route_coords, origin, destination, corridor_deg=0.025):
    """
    Return only hotspots that are geometrically near the actual route corridor.
    corridor_deg ≈ 2.5 km at Bengaluru latitude.
    Never returns hotspots from origin/destination name matches if they aren't near the route.
    """
    if not route_coords or len(route_coords) < 2:
        # No real route geometry — fall back to straight-line proximity
        origin_data = build_location_data(origin)
        dest_data   = build_location_data(destination)
        o_lat, o_lng = origin_data["lat"], origin_data["lng"]
        d_lat, d_lng = dest_data["lat"],   dest_data["lng"]
        route_coords = [[o_lng, o_lat], [d_lng, d_lat]]

    origin_lc = origin.lower()
    dest_lc   = destination.lower()
    near = []

    for hp in ALL_BLR_HOTSPOTS:
        hp_lng, hp_lat = hp["lng"], hp["lat"]
        # Check distance to every segment of the route
        min_dist = float("inf")
        for i in range(len(route_coords) - 1):
            ax, ay = route_coords[i][0],   route_coords[i][1]
            bx, by = route_coords[i+1][0], route_coords[i+1][1]
            d = point_to_segment_dist(hp_lng, hp_lat, ax, ay, bx, by)
            if d < min_dist:
                min_dist = d

        if min_dist <= corridor_deg:
            # Skip if it IS the origin or destination
            if hp["name"].lower() in origin_lc or origin_lc in hp["name"].lower():
                continue
            if hp["name"].lower() in dest_lc or dest_lc in hp["name"].lower():
                continue
            vary_aqi = int(hp["aqi"] * (0.88 + random.random() * 0.24))
            near.append({
                "name":     hp["name"],
                "aqi":      vary_aqi,
                "lat":      hp_lat,
                "lng":      hp_lng,
                "warning":  hp["source"],
                "type":     hp["type"],
                "distFromRoute": round(min_dist * 111, 1),  # approx km
                "dataNote": "Estimate based on Bengaluru pollution pattern — not a live sensor reading",
            })

    # Sort by AQI descending, limit to 5
    near.sort(key=lambda x: x["aqi"], reverse=True)
    return near[:5]


def build_travel_time(route_info):
    """Build travel time card from actual route distance/duration."""
    dist_km  = route_info.get("distance_km") or 0
    dur_min  = route_info.get("duration_min") or 0
    h = datetime.now().hour
    is_peak = (7 <= h <= 10) or (17 <= h <= 20)

    # Peak multiplier
    if is_peak:
        peak_min  = int(dur_min * 1.8)
        offpk_min = int(dur_min * 0.85)
    else:
        peak_min  = int(dur_min * 1.9)
        offpk_min = dur_min

    def fmt(m):
        if m < 60: return f"{m} min"
        return f"{m//60}h {m%60}min"

    source_note = "OpenRouteService" if route_info.get("source") == "ors" else "Distance estimate"

    return {
        "distance_km":    dist_km,
        "base":           fmt(dur_min),
        "peak":           fmt(peak_min),
        "offPeak":        fmt(offpk_min),
        "current":        "Peak hour — expect delays" if is_peak else "Normal traffic conditions",
        "isCurrentPeakHour": is_peak,
        "source":         source_note,
    }


def build_alternatives(origin, destination, o_lat, o_lng, d_lat, d_lng):
    """Build alternatives dynamically based on origin/destination geography."""
    import math
    # Approximate straight-line km
    R = 6371
    dlat = math.radians(d_lat - o_lat)
    dlng = math.radians(d_lng - o_lng)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(o_lat))*math.cos(math.radians(d_lat))*math.sin(dlng/2)**2
    dist_km = round(R * 2 * math.asin(math.sqrt(a)) * 1.35, 1)

    # Metro availability heuristic: both locations within metro coverage zone
    metro_zones = {
        "mg road", "indiranagar", "koramangala", "whitefield", "kr puram",
        "byappanahalli", "majestic", "yeshwanthpur", "rajajinagar", "malleswaram",
        "hebbal", "nagawara", "manyata tech park", "electronic city",
        "bommanahalli", "hongasandra", "silk board",
    }
    o_metro = any(z in origin.lower() for z in metro_zones)
    d_metro = any(z in destination.lower() for z in metro_zones)
    metro_available = o_metro or d_metro

    alts = []
    if metro_available:
        metro_time = max(10, int(dist_km * 2.5))
        alts.append({
            "route": "Namma Metro / BMRC (recommended)",
            "distance_km": dist_km,
            "duration_note": f"~{metro_time}–{metro_time+15} min (incl. walk to station)",
            "pollutionReduction": "50–65%",
            "duration": f"+{max(5, metro_time - int(dist_km*2))}–15 min vs driving",
            "recommended": True,
            "note": "Significantly lower PM2.5 exposure inside metro coaches",
        })
    else:
        alts.append({
            "route": "Public bus / BMTC (AC service if available)",
            "distance_km": dist_km,
            "duration_note": "Variable — depends on service",
            "pollutionReduction": "20–35%",
            "duration": "Similar to car off-peak",
            "recommended": True,
            "note": "Less idling time in traffic compared to private vehicle",
        })

    # Always offer off-peak / inner-road alternative
    avoid_roads = []
    if any(x in origin.lower() + destination.lower() for x in ["koramangala","hsr","btm","jayanagar","electronic"]):
        avoid_roads.append("Silk Board junction")
    if any(x in origin.lower() + destination.lower() for x in ["whitefield","marathahalli","kr puram","bellandur"]):
        avoid_roads.append("ORR Bellandur stretch")
    if any(x in origin.lower() + destination.lower() for x in ["hebbal","manyata","yelahanka","nagawara"]):
        avoid_roads.append("Hebbal flyover approach")

    avoid_note = f"Avoid {', '.join(avoid_roads)}" if avoid_roads else "Use inner BDA roads where possible"
    alts.append({
        "route": f"Off-peak drive ({avoid_note})",
        "distance_km": round(dist_km * 1.1, 1),
        "duration_note": "Best before 7 AM or after 9 PM",
        "pollutionReduction": "20–30%",
        "duration": f"~{max(5, int(dist_km*1.5))}–{max(10, int(dist_km*2.5))} min",
        "recommended": False,
        "note": "Off-peak hours reduce AQI exposure by 20-30% due to lower traffic",
    })

    return alts

def get_simulation_fallback(scenario_type):
    impacts = {
        "traffic":      "[SIMULATION] Traffic Surge: Expected AQI increase 25-40% in affected corridors. NO2 and CO will spike. Peak impact on ORR, Silk Board, Hebbal. Duration: 2-4 hours.",
        "construction": "[SIMULATION] Construction Dust: PM10 and PM2.5 increase significantly within 500m radius. HIGH impact within 200m. Water spraying every 2 hours recommended.",
        "wind":         "[SIMULATION] Wind Change: Industrial emissions from Peenya shift direction. Northern areas (Yeshwanthpur, Mathikere) may see PM2.5 increase 20-35%.",
        "rainfall":     "[SIMULATION] Rainfall: AQI expected to drop 30-50% within 2 hours. PM2.5 washout effect significant. Best post-rain window: 1-3 hours after rain stops.",
        "festival":     "[SIMULATION] Festival/Fireworks: PM2.5 spike to 200-350 ug/m3 during peak. Severe health risk for 4-6 hours. All sensitive groups should stay indoors.",
        "industrial":   "[SIMULATION] Industrial Emission Spike: SO2 and PM2.5 surge in downwind areas. 1-3km impact radius. Emergency emission monitoring recommended.",
    }
    return impacts.get(scenario_type, f"Simulation for {scenario_type}: Moderate environmental impact estimated. Monitor AQI in real-time.")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\nAI AirGuard Backend starting on port {port}")
    print(f"   Granite: {'[OK] configured' if WX_API_KEY else '[--] not configured (demo mode)'}")
    print(f"   OWM:     {'[OK] configured' if OWM_KEY else '[--] not configured (demo mode)'}")
    print(f"   Groq:    {'[OK] configured' if GROQ_KEY else '[--] not configured'}\n")
    app.run(host="0.0.0.0", port=port, debug=True)
