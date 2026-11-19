# 🌬️ AI AirGuard — Bengaluru Air Quality & Pollution Action Advisor

> **IBM Inter-Institute Final Hackathon** — Agentic AI Solution  
> Powered by **IBM Granite (ibm/granite-4-h-small)** via **watsonx.ai**

[![IBM Granite](https://img.shields.io/badge/IBM%20Granite-4--h--small-0062ff?style=flat&logo=ibm)](https://www.ibm.com/products/watsonx-ai)
[![watsonx.ai](https://img.shields.io/badge/watsonx.ai-live-00b4d8?style=flat&logo=ibm)](https://www.ibm.com/products/watsonx-ai)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-Python-black?style=flat&logo=flask)](https://flask.palletsprojects.com)

---

## 🎯 Problem Statement

Build an Agentic AI solution that monitors Bengaluru air quality, identifies pollution hotspots, analyzes pollution sources, provides location-based health advisories, and supports environmental authorities.

---

## 🚀 Live Demo

```
http://localhost:5000
```

Single URL — React frontend + IBM Granite API served together by Flask.

---

## ✨ Key Features

### 🤖 Five Collaborating AI Agents
| Agent | Role |
|---|---|
| 📡 Air Quality Monitoring Agent | Analyzes AQI, PM2.5, PM10, NO2, SO2, CO and weather |
| 🔥 Pollution Hotspot Analysis Agent | Identifies and ranks polluted locations |
| 🏭 Pollution Source Intelligence Agent | Analyzes traffic, industrial, construction sources |
| 🩺 Citizen Health & AirSafe Journey Agent | Personalized health precautions + route planning |
| 🌍 Environmental Intelligence Agent | Supervisor — orchestrates all agents |

### 🚗 AirSafe Journey Planner
- Enter origin → destination for any Bengaluru location
- Real route geometry via **OpenRouteService**
- **Leaflet map** with route polyline, hotspot markers, live GPS dot
- Origin & destination **AQI cards** with Indian AQI classification
- Dynamic pollution hotspots filtered to actual route corridor (≤2.5 km)
- Real distance (km) + travel time (normal / peak / off-peak)
- Alternative routes with pollution reduction estimates
- **5 health profiles**: Adults, Children, Elderly, Asthma, Cardiovascular
- **Live GPS tracking** via browser Geolocation API

### 🗺️ Bengaluru-Wide Search
- 80+ localities, layouts, tech parks, landmarks
- Autocomplete with partial-name matching
- 🎤 Voice search (English & Kannada) via Web Speech API
- Dynamic geocoding + dashboard updates

### 📊 Dashboard
- Indian AQI gauge (SVG arc)
- PM2.5, PM10, NO2, SO2, CO pollutant bars
- 24-hour trend chart, 7-day history, radar chart
- CPCB standard comparison table
- Interactive Bengaluru pollution map (Leaflet + OpenStreetMap)
- Hotspot rankings and agent analysis cards

### 🛡️ 9 Guardrail Categories
1. Input Guardrails — validation, PII, prompt injection
2. Output Guardrails — hallucination checks, toxicity filtering
3. Tool Execution Guardrails — authorization, permissions
4. Data Guardrails — privacy, masking, access control
5. Security Guardrails — jailbreak, SQL injection, credential protection
6. Operational Guardrails — timeouts, token limits, rate limiting
7. Human-in-the-Loop Guardrails — verification for critical actions
8. Multi-Agent Guardrails — loop prevention, communication monitoring
9. Ethical & Compliance Guardrails — fairness, explainability, audit trails

### 📋 LLM & Agent Evaluation Dashboard
- **Accuracy & Quality**: Accuracy, Precision, Recall, F1, BLEU, ROUGE
- **RAG Metrics**: Context Precision, Faithfulness, Answer Relevancy
- **Agentic AI**: Task Completion, Tool Call Accuracy, Planning Quality
- **Safety**: Hallucination Rate, Toxicity, Bias, PII Leakage
- **Performance**: Response Latency, Tokens/sec, Cost per Request
- **Multi-Agent**: Workflow Completion, Inter-Agent Consistency
- Live agent execution logs with timestamps

### 🔬 Additional Features
- **What-If Pollution Simulator** — traffic surge, construction dust, wind, rainfall, festival, industrial accident
- **Smart Pollution Alerts** — AQI threshold alerts, rush hour warnings, hotspot notifications
- **Citizen Reporting** — submit construction dust, smoke, road dust observations
- **AI Assistant** — IBM Granite-powered conversational interface
- **Explainable AI** — all recommendations include reasoning

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | IBM Granite `ibm/granite-4-h-small` via watsonx.ai |
| **LLM Fallback** | Groq (Llama3-8b-8192) — clearly labelled |
| **Frontend** | React 18 + Vite 4 + Recharts 2 + React-Leaflet 4 |
| **Backend** | Python 3 + Flask + flask-cors |
| **Map** | Leaflet + OpenStreetMap tiles |
| **Routing** | OpenRouteService (free public API) |
| **AQI Data** | Bengaluru pollution profiles (CPCB-aligned estimates) |
| **Auth** | IBM IAM token (server-side only — keys never reach browser) |

---

## 📁 Project Structure

```
ai-airguard/
├── backend/
│   ├── app.py              # Flask server — Granite proxy + all API routes
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── components/         # 13 React components
│   │   ├── AirSafeJourney.jsx   # Route planner with map + GPS
│   │   ├── Dashboard.jsx        # AQI overview + agent results
│   │   ├── BengaluruMap.jsx     # Interactive pollution map
│   │   ├── AIAssistant.jsx      # IBM Granite chat
│   │   ├── EvaluationDashboard.jsx  # LLM & agent metrics
│   │   ├── GuardrailPanel.jsx   # 9-category guardrails
│   │   └── ...
│   ├── services/
│   │   ├── agentService.js      # 5-agent orchestration
│   │   ├── aiService.js         # Backend LLM proxy calls
│   │   └── airQualityService.js # AQI data fetching
│   ├── guardrails/
│   │   └── index.js             # All 9 guardrail categories
│   └── utils/
│       ├── aqiHelpers.js        # Indian AQI scale + formatters
│       └── bengaluruLocations.js # 80+ Bengaluru locations
├── start.bat               # Production launcher (single URL)
├── dev.bat                 # Development launcher (HMR + API)
├── env.example             # Environment variable template
└── vite.config.js          # Vite config with API proxy
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- IBM Cloud account with watsonx.ai project

### 1. Clone & Install

```bash
git clone https://github.com/poojaarenad-6906/ai-airguard.git
cd ai-airguard
npm install
pip install flask flask-cors requests
```

### 2. Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` and fill in:
```
VITE_WATSONX_API_KEY=your_ibm_cloud_api_key
VITE_WATSONX_PROJECT_ID=your_watsonx_project_id
GROQ_API_KEY=your_groq_api_key   # optional fallback
```

Also create `backend/env.local` with the same values (for Flask).

### 3. Run — Single URL (Production)

```bash
# Windows
start.bat

# Manual
npm run build
cd backend
set WATSONX_API_KEY=your_key
set WATSONX_PROJECT_ID=your_project_id
set WATSONX_MODEL_ID=ibm/granite-4-h-small
python app.py
```

Open: **http://localhost:5000**

### 4. Run — Development Mode (Live Reload)

```bash
# Windows
dev.bat

# Manual — Terminal 1 (Backend)
cd backend && python app.py

# Manual — Terminal 2 (Frontend)
npm run dev
```

Open: **http://localhost:5173**

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/health` | GET | Backend health + Granite status |
| `GET /api/airquality?city=...` | GET | AQI data for any Bengaluru location |
| `GET /api/hotspots` | GET | Top pollution hotspots |
| `POST /api/granite/generate` | POST | IBM Granite LLM generation |
| `POST /api/agents/analyze` | POST | 5-agent analysis for a location |
| `POST /api/journey/analyze` | POST | AirSafe route analysis |
| `POST /api/simulate` | POST | What-if pollution simulation |

---

## 🎨 Colour Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#0F1E32` | Page background |
| Cards | `#183B63` | Glass cards |
| Headings | `#8DD8FF` | Section titles |
| Accent | `#38BDF8` | Buttons, icons, highlights |
| Text | `#FFFFFF` | Primary text |
| Muted | `#DBEAFE` | Secondary text |
| Border | `#35516D` | Card borders |

---

## 🔒 Security

- **API keys are never sent to the browser** — all LLM calls go through the Flask backend proxy
- `env.local` and `backend/env.local` are gitignored
- IBM IAM tokens are cached server-side and refreshed automatically
- Groq is clearly labelled as a fallback — never presented as IBM Granite

---

## 📊 Data Sources

| Data | Source | Label |
|---|---|---|
| AQI & pollutants | Bengaluru pollution profile estimates | `Demo — estimates` |
| Route geometry | OpenRouteService (free API) | `OpenRouteService` or `Distance Estimate` |
| Hotspot proximity | Geometric corridor filtering | `~X km from route` |
| AI analysis | IBM Granite via watsonx.ai | `🔵 IBM Granite` |

> Live OpenWeatherMap integration is supported — set `OWM_API_KEY` in env to enable real sensor data.

---

## 👩‍💻 Team

Built for the **IBM Inter-Institute Final Hackathon**  
Theme: Agentic AI for Environmental Intelligence

---

*AI AirGuard — Making every commute in Bengaluru a safer breath.*
