<<<<<<< HEAD
# AI AirGuard - Daily Air Quality Action Agent

A modern, futuristic air quality monitoring web application built with React and Vite.
Monitor real-time AQI, receive personalised health recommendations, explore pollutant charts,
and ask the AI Assistant about pollution -- all in a stunning dark futuristic interface.

---

## Live Demo Features

- **City Search** -- Search any city worldwide for live or demo AQI data
- **AQI Dashboard** -- Animated AQI gauge with PM2.5, PM10, NO2, O3, CO, SO2, NH3 readings
- **Health Recommendations** -- AQI-based precautions for 5 user groups (adults, children, elderly, respiratory, outdoor workers)
- **Smart Alerts** -- Colour-coded warnings with detailed guidance at every AQI level
- **AQI Charts** -- 7-day trend graph and pollutant comparison bar chart (Recharts)
- **AI Pollution Assistant** -- Rule-based chat (upgradeable to Groq AI with API key)
- **Pollution Insights** -- AQI scale explained, pollutant profiles, WHO guidelines, reduction tips
- **Demo Mode** -- Works fully without any API key using clearly labelled sample data

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| Recharts | AQI trend and pollutant charts |
| CSS Modules | Per-component styling |
| OpenWeatherMap API | Live air quality data (optional) |
| Groq API | Real AI chat assistant (optional) |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Installation

Clone the repository and install dependencies:

\\\ash
git clone https://github.com/YOUR_USERNAME/ai-airguard.git
cd ai-airguard
npm install
\\\

### Configure Environment (Optional)

Copy the example environment file:

\\\ash
cp .env.example .env
\\\

The app works **without any API keys** in demo mode.
To enable live data, edit .env and add your keys:

\\\
VITE_OWM_API_KEY=your_openweathermap_key_here
VITE_GROQ_API_KEY=your_groq_key_here
\\\

### Run the Development Server

\\\ash
npm run dev
\\\

Open http://localhost:5173 in your browser.

### Build for Production

\\\ash
npm run build
npm run preview
\\\

---

## API Keys

Both API keys are completely optional. The website runs in demo mode without them.

### OpenWeatherMap (Live AQI Data)

1. Register free at https://openweathermap.org/appid
2. Copy your API key from the API Keys tab
3. Add to .env as VITE_OWM_API_KEY=your_key

### Groq (Real AI Assistant)

1. Register free at https://console.groq.com
2. Create an API key in the dashboard
3. Add to .env as VITE_GROQ_API_KEY=your_key

> Security note: Never commit your .env file. It is listed in .gitignore and will never be uploaded to GitHub.

---

## Project Structure

\\\
air-guard/
+-- src/
¦   +-- components/
¦   ¦   +-- BackgroundCanvas.jsx      Animated dark background with orbs and lightning
¦   ¦   +-- Navbar.jsx                Responsive floating navigation bar
¦   ¦   +-- HomePage.jsx              Landing page with hero section and city search
¦   ¦   +-- Dashboard.jsx             AQI gauge and pollutant measurement cards
¦   ¦   +-- HealthRecommendations.jsx Health precautions and personalised action plan
¦   ¦   +-- SmartAlerts.jsx           Colour-coded air quality alert banners
¦   ¦   +-- AqiCharts.jsx             Recharts area and bar charts
¦   ¦   +-- AIAssistant.jsx           Chat interface with Groq AI or rule-based fallback
¦   ¦   +-- PollutionInsights.jsx     AQI education, pollutant profiles, tips
¦   +-- services/
¦   ¦   +-- airQualityService.js      API integration with automatic demo data fallback
¦   +-- utils/
¦   ¦   +-- aqiHelpers.js             AQI level definitions, health recommendations, formatters
¦   +-- styles/
¦   ¦   +-- global.css                Design tokens and shared utilities
¦   ¦   +-- background.css            Animated background CSS
¦   ¦   +-- navbar.css                Navigation styles
¦   ¦   +-- home.css                  Home page styles
¦   ¦   +-- dashboard.css             Dashboard styles
¦   ¦   +-- recommendations.css       Health recommendation styles
¦   ¦   +-- alerts.css                Smart alert styles
¦   ¦   +-- charts.css                Chart container styles
¦   ¦   +-- assistant.css             AI chat interface styles
¦   ¦   +-- insights.css              Pollution insights styles
¦   +-- App.jsx                       Root component with page routing and loading overlay
¦   +-- main.jsx                      Application entry point
+-- .env.example                      Environment variable template (safe to share)
+-- .gitignore                        Excludes node_modules, dist, and .env files
+-- index.html                        HTML entry point
+-- package.json                      Dependencies and scripts
+-- vite.config.js                    Vite configuration
+-- README.md                         This file
\\\

---

## Design System

| Element | Value |
|---|---|
| Background | #050B18 dark navy gradient |
| Cards | rgba(15,30,50,0.75) glassmorphism with backdrop blur |
| Headings | #90CAF9 light blue |
| Accent | #8DD8FF cyan |
| Buttons | #1976D2 electric blue with glow |
| Text | #E1EDF5 light grey |
| Good AQI | Green #4CAF50 |
| Moderate AQI | Yellow #FFC107 |
| Poor AQI | Orange #FF5722 |
| Very Poor AQI | Red #B71C1C |

---

## AQI Scale Reference

| AQI | Level | Health Impact |
|---|---|---|
| 1 | Good | Little or no risk |
| 2 | Fair | Acceptable for most people |
| 3 | Moderate | Sensitive groups should reduce exertion |
| 4 | Poor | Everyone may experience effects |
| 5 | Very Poor | Health emergency -- avoid outdoor exposure |

---

## Security

- API keys are stored in .env which is excluded from Git via .gitignore
- .env.example shows the required variable names with empty values -- safe to share
- No secrets are hardcoded in any source file
- All environment variables use the VITE_ prefix (Vite convention for client-side variables)

---

## Disclaimer

Health recommendations in this application are general informational guidance only and do
not constitute medical advice. Always consult a qualified healthcare professional for
personal health decisions.

---

## Acknowledgements

- Air pollution data provided by OpenWeatherMap Air Pollution API
- AI assistant powered by Groq (llama3-8b-8192)
- Charts built with Recharts
- Built for the IBM Workshop -- AI AirGuard Daily Air Quality Action Agent

---

## License

This project is open source and available under the MIT License.
=======
# ai-airguard
>>>>>>> origin/main
