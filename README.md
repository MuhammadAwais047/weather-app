# ⛅ Skycast — Weather App

A fast, responsive weather forecast app built with **vanilla JavaScript** — no frameworks, no build step, no API key required.

🔗 **Live demo:** https://muhammadawais047.github.io/weather-app/

## Features

- 🔍 City search with live autocomplete (200,000+ locations)
- 📍 One-tap geolocation ("use my location") with reverse geocoding
- 🌡️ Current conditions: temperature, feels-like, humidity, wind speed + direction, pressure, cloud cover, UV index, precipitation
- 🕐 Hourly forecast for the next 24 hours
- 📅 7-day forecast with temperature range bars
- 🌗 Day/night-aware icons and condition-themed animated backgrounds
- 🔄 °C / °F toggle — preference saved locally
- 🕘 Recent searches saved locally
- 📱 Fully responsive, keyboard accessible (`role="combobox"` search, focus states), reduced-motion friendly
- 🛡️ XSS-safe rendering (no raw HTML from API data), request timeouts, offline banner, retryable errors

## Tech stack

| Layer | Choice |
|---|---|
| Markup | Semantic HTML5, ARIA combobox pattern |
| Styling | Modern CSS (custom properties, grid, backdrop-filter, scroll-snap) |
| Logic | Vanilla ES2020 JavaScript — zero dependencies, zero build |
| Weather data | [Open-Meteo Forecast + Geocoding APIs](https://open-meteo.com/) (free, CC BY 4.0, no key) |
| Reverse geocoding | [BigDataCloud client API](https://www.bigdatacloud.com/) (free, no key) |

## Getting started

No install needed — it's a static site.

```bash
# Option 1: just open it
open index.html

# Option 2: serve it (recommended)
python -m http.server 8080
# → http://localhost:8080
```

## Project structure

```
weather-app/
├── index.html   # Markup + ARIA combobox search
├── styles.css   # Glass theme, condition-aware gradients, responsive grid
└── app.js       # State, API layer, WMO code mapping, SVG icon set, rendering
```

## How it works

1. City search queries Open-Meteo's geocoding API (debounced, 350 ms).
2. Selecting a place fetches a single forecast bundle: current conditions, 24 h hourly, 7-day daily — in the location's own timezone (`timezone=auto`).
3. WMO weather codes are mapped to descriptions, hand-built SVG icons, and page background themes.
4. °C/°F is a server-side unit conversion (re-fetch, not a math patch), so *every* value — feels-like, highs/lows — stays exact.

## License

[MIT](LICENSE) © Muhammad Awais
