/* ============================================================
   Skycast — vanilla JS weather app
   Data: Open-Meteo forecast + geocoding (free, no API key)
   Reverse geocoding: BigDataCloud client API (free, no key)
   ============================================================ */
"use strict";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const STORAGE_KEY = "skycast.v1";

const DEFAULT_PLACE = {
  name: "Islamabad",
  admin1: "Islamabad Capital Territory",
  country: "Pakistan",
  latitude: 33.6844,
  longitude: 73.0479,
};

const $ = (id) => document.getElementById(id);

const els = {
  body: document.body,
  form: $("search-form"),
  input: $("search-input"),
  suggestions: $("suggestions"),
  recents: $("recents"),
  status: $("status"),
  app: $("app"),
  placeName: $("place-name"),
  placeMeta: $("place-meta"),
  localDate: $("local-date"),
  tempValue: $("temp-value"),
  tempUnit: $("temp-unit"),
  condText: $("cond-text"),
  feelsLike: $("feels-like"),
  heroIcon: $("hero-icon"),
  details: $("details"),
  hourly: $("hourly"),
  daily: $("daily"),
  btnC: $("btn-c"),
  btnF: $("btn-f"),
  btnLocate: $("btn-locate"),
};

/* ---------------- WMO weather codes ---------------- */

const WMO = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  56: "Freezing drizzle", 57: "Heavy freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Rain showers", 82: "Violent showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Storm, light hail", 99: "Storm, heavy hail",
};

function codeGroup(code) {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "storm";
}

function backgroundClass(code, isDay) {
  const day = isDay ? "day" : "night";
  switch (codeGroup(code)) {
    case "clear": return `bg-clear-${day}`;
    case "partly": return `bg-partly-${day}`;
    case "overcast": return `bg-overcast-${day}`;
    case "fog": return `bg-fog-${day}`;
    case "drizzle":
    case "rain": return `bg-rain-${day}`;
    case "snow": return `bg-snow-${day}`;
    default: return "bg-storm";
  }
}

/* ---------------- Icons (Feather-style stroke SVG) ---------------- */

const PARTS = {
  sun:
    '<circle cx="12" cy="12" r="5"/>' +
    '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
    '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  cloudRain:
    '<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>' +
    '<line x1="8" y1="13" x2="8" y2="21"/><line x1="16" y1="13" x2="16" y2="21"/>' +
    '<line x1="12" y1="15" x2="12" y2="23"/>',
  cloudDrizzle:
    '<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>' +
    '<line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/>' +
    '<line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/>' +
    '<line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>',
  cloudSnow:
    '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>' +
    '<line x1="8" y1="16" x2="8" y2="18"/><line x1="8" y1="21" x2="8" y2="23"/>' +
    '<line x1="12" y1="17" x2="12" y2="19"/><line x1="12" y1="22" x2="12" y2="24"/>' +
    '<line x1="16" y1="16" x2="16" y2="18"/><line x1="16" y1="21" x2="16" y2="23"/>',
  cloudStorm:
    '<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>' +
    '<line x1="13" y1="11" x2="9" y2="17"/><line x1="15" y1="17" x2="11" y2="23"/>',
  arrow:
    '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
};

function svgIcon(inner, strokeWidth = 1.8) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
    strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + inner + "</svg>"
  );
}

function weatherIcon(code, isDay = 1) {
  switch (codeGroup(code)) {
    case "clear":
      return svgIcon(isDay ? PARTS.sun : PARTS.moon);
    case "partly":
      return svgIcon(
        '<g transform="scale(0.62)">' + (isDay ? PARTS.sun : PARTS.moon) + "</g>" +
        '<g transform="translate(4 5.5) scale(0.78)">' + PARTS.cloud + "</g>"
      );
    case "overcast":
      return svgIcon(
        '<g transform="translate(3.5 3.5) scale(0.8)">' + PARTS.cloud + "</g>" +
        '<g transform="translate(0 2.5) scale(0.8)" opacity="0.5">' + PARTS.cloud + "</g>"
      );
    case "fog":
      return svgIcon(
        '<g transform="translate(0 -2)">' + PARTS.cloud + "</g>" +
        '<line x1="5" y1="20" x2="19" y2="20"/><line x1="7" y1="23" x2="17" y2="23"/>'
      );
    case "drizzle":
      return svgIcon(PARTS.cloudDrizzle);
    case "rain":
      return svgIcon(PARTS.cloudRain);
    case "snow":
      return svgIcon(PARTS.cloudSnow);
    default:
      return svgIcon(PARTS.cloudStorm);
  }
}

/* ---------------- Tiny persistent store ---------------- */

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStore(patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadStore(), ...patch }));
  } catch {
    /* storage unavailable (private mode) — app still works */
  }
}

const store = loadStore();

const state = {
  unit: store.unit === "f" ? "f" : "c",
  recents: Array.isArray(store.recents) ? store.recents : [],
  last: store.last && typeof store.last.latitude === "number" ? store.last : null,
  suggestions: [],
  activeIndex: -1,
};

/* ---------------- Helpers ---------------- */

async function fetchJSON(url, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const compass = (deg) => COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];

function uvLevel(uv) {
  if (uv == null) return "";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function formatHour(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric" });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso, index) {
  if (index === 0) return "Today";
  return new Date(`${iso}T12:00`).toLocaleDateString(undefined, { weekday: "short" });
}

/* ---------------- Status banner ---------------- */

function showStatus(message, { isError = true, retry = false, onRetry = null } = {}) {
  els.status.textContent = "";
  const p = document.createElement("p");
  p.textContent = message;
  els.status.append(p);
  if (retry && onRetry) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "retry-btn";
    btn.textContent = "Retry";
    btn.addEventListener("click", onRetry);
    els.status.append(btn);
  }
  els.status.classList.toggle("is-info", !isError);
  els.status.hidden = false;
}

function hideStatus() {
  els.status.hidden = true;
  els.status.textContent = "";
}

/* ---------------- Recent searches ---------------- */

function saveRecent(place) {
  const entry = {
    name: place.name,
    admin1: place.admin1 || "",
    country: place.country || "",
    latitude: place.latitude,
    longitude: place.longitude,
  };
  state.recents = [
    entry,
    ...state.recents.filter(
      (r) => !(r.name === entry.name && Math.abs(r.latitude - entry.latitude) < 0.01)
    ),
  ].slice(0, 5);
  saveStore({ recents: state.recents });
  renderRecents();
}

function renderRecents() {
  els.recents.textContent = "";
  if (!state.recents.length) {
    els.recents.hidden = true;
    return;
  }
  state.recents.forEach((r) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = r.name;
    chip.title = [r.admin1, r.country].filter(Boolean).join(", ");
    chip.addEventListener("click", () => choosePlace(r));
    els.recents.append(chip);
  });
  els.recents.hidden = false;
}

/* ---------------- City search ---------------- */

let debounceTimer;

els.input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const q = els.input.value.trim();
  if (q.length < 2) return closeSuggestions();
  debounceTimer = setTimeout(() => runSearch(q), 350);
});

async function runSearch(q) {
  try {
    const data = await fetchJSON(
      `${GEO_URL}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
    );
    state.suggestions = data.results || [];
    state.activeIndex = -1;
    renderSuggestions();
  } catch {
    closeSuggestions();
  }
}

function renderSuggestions() {
  els.suggestions.textContent = "";
  els.input.setAttribute("aria-expanded", "true");

  if (!state.suggestions.length) {
    const empty = document.createElement("div");
    empty.className = "suggestion-empty";
    empty.textContent = "No matching city.";
    els.suggestions.append(empty);
  }

  state.suggestions.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion";
    btn.setAttribute("role", "option");
    btn.setAttribute("id", `suggestion-${i}`);

    const name = document.createElement("span");
    name.className = "s-name";
    name.textContent = s.name;

    const meta = document.createElement("span");
    meta.className = "s-meta";
    meta.textContent = [s.admin1, s.country].filter(Boolean).join(", ");

    btn.append(name, meta);
    btn.addEventListener("click", () => choosePlace(s));
    els.suggestions.append(btn);
  });

  els.suggestions.hidden = false;
}

function highlightSuggestion() {
  const items = els.suggestions.querySelectorAll(".suggestion");
  items.forEach((el, i) => el.classList.toggle("is-active", i === state.activeIndex));
  if (state.activeIndex >= 0 && items[state.activeIndex]) {
    els.input.setAttribute("aria-activedescendant", `suggestion-${state.activeIndex}`);
  }
}

function closeSuggestions() {
  els.suggestions.hidden = true;
  els.suggestions.textContent = "";
  state.suggestions = [];
  state.activeIndex = -1;
  els.input.setAttribute("aria-expanded", "false");
  els.input.removeAttribute("aria-activedescendant");
}

els.input.addEventListener("keydown", (e) => {
  if (els.suggestions.hidden || !state.suggestions.length) return;
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      state.activeIndex = (state.activeIndex + 1) % state.suggestions.length;
      highlightSuggestion();
      break;
    case "ArrowUp":
      e.preventDefault();
      state.activeIndex = (state.activeIndex - 1 + state.suggestions.length) % state.suggestions.length;
      highlightSuggestion();
      break;
    case "Enter":
      if (state.activeIndex >= 0) {
        e.preventDefault();
        choosePlace(state.suggestions[state.activeIndex]);
      }
      break;
    case "Escape":
      closeSuggestions();
      break;
  }
});

document.addEventListener("click", (e) => {
  if (!els.form.contains(e.target)) closeSuggestions();
});

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (!q) return;
  if (state.activeIndex >= 0 && state.suggestions[state.activeIndex]) {
    return choosePlace(state.suggestions[state.activeIndex]);
  }
  try {
    const data = await fetchJSON(
      `${GEO_URL}?name=${encodeURIComponent(q)}&count=1&language=en&format=json`
    );
    if (!data.results || !data.results.length) {
      showStatus(`No city found for "${q}".`, { isError: true });
      return;
    }
    choosePlace(data.results[0]);
  } catch {
    showStatus("Search failed. Check your connection and try again.", {
      isError: true,
      retry: true,
      onRetry: () => els.form.requestSubmit(),
    });
  }
});

function choosePlace(place) {
  els.input.value = "";
  closeSuggestions();
  saveRecent(place);
  loadWeather(place);
}

/* ---------------- Weather loading ---------------- */

async function loadWeather(place) {
  hideStatus();
  els.app.classList.add("is-loading");

  state.last = {
    name: place.name,
    admin1: place.admin1 || "",
    country: place.country || "",
    latitude: place.latitude,
    longitude: place.longitude,
  };
  saveStore({ last: state.last });

  const unitParam = state.unit === "f" ? "&temperature_unit=fahrenheit" : "";
  const url =
    `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day," +
    "precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m" +
    "&hourly=temperature_2m,weather_code,precipitation_probability,is_day" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset," +
    "uv_index_max,precipitation_probability_max,precipitation_sum" +
    `&timezone=auto&forecast_days=7${unitParam}`;

  try {
    const data = await fetchJSON(url);
    render(place, data);
    els.app.hidden = false;
  } catch {
    showStatus("Couldn't load the forecast. Check your connection and try again.", {
      isError: true,
      retry: true,
      onRetry: () => loadWeather(state.last || place),
    });
  } finally {
    els.app.classList.remove("is-loading");
  }
}

/* ---------------- Rendering ---------------- */

function tile(label, valueText, subText) {
  const t = document.createElement("div");
  t.className = "tile";

  const l = document.createElement("span");
  l.className = "tile-label";
  l.textContent = label;

  const v = document.createElement("span");
  v.className = "tile-value";
  v.textContent = valueText;

  t.append(l, v);

  if (subText) {
    const s = document.createElement("span");
    s.className = "tile-sub";
    s.textContent = subText;
    t.append(s);
  }
  return t;
}

function render(place, data) {
  const cur = data.current;
  const daily = data.daily;

  els.body.className = backgroundClass(cur.weather_code, cur.is_day);

  els.placeName.textContent = place.name;
  els.placeMeta.textContent = [place.admin1, place.country].filter(Boolean).join(", ");
  els.localDate.textContent = new Date(cur.time).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  els.tempValue.textContent = Math.round(cur.temperature_2m);
  els.tempUnit.textContent = cur.current_units?.temperature_2m || (state.unit === "f" ? "°F" : "°C");
  els.condText.textContent = WMO[cur.weather_code] || "Unknown";
  els.feelsLike.textContent = `Feels like ${Math.round(cur.apparent_temperature)}°`;
  els.heroIcon.innerHTML = weatherIcon(cur.weather_code, cur.is_day);

  /* Details */
  els.details.textContent = "";
  const uvToday = daily.uv_index_max?.[0];
  const precipProb = daily.precipitation_probability_max?.[0];

  els.details.append(
    tile("Humidity", `${cur.relative_humidity_2m}%`),
    tile("Wind", `${Math.round(cur.wind_speed_10m)} km/h`, `From ${compass(cur.wind_direction_10m)}`),
    tile("Pressure", `${Math.round(cur.pressure_msl)} hPa`),
    tile("Cloud cover", `${cur.cloud_cover}%`),
    tile("UV index", uvToday != null ? `${Math.round(uvToday)}` : "–", uvLevel(uvToday)),
    tile("Precipitation", `${daily.precipitation_sum?.[0] ?? 0} mm`,
      precipProb != null ? `${precipProb}% chance today` : ""),
    tile("Sunrise", formatTime(daily.sunrise[0])),
    tile("Sunset", formatTime(daily.sunset[0]))
  );

  /* Hourly — next 24 h starting from the current hour */
  els.hourly.textContent = "";
  const stamp = cur.time.slice(0, 13);
  let idx = data.hourly.time.findIndex((t) => t.slice(0, 13) === stamp);
  if (idx < 0) idx = 0;

  for (let i = idx; i < Math.min(idx + 24, data.hourly.time.length); i++) {
    const card = document.createElement("div");
    card.className = "hour-card" + (i === idx ? " is-now" : "");
    card.setAttribute("role", "listitem");

    const time = document.createElement("span");
    time.className = "hour-time";
    time.textContent = i === idx ? "Now" : formatHour(data.hourly.time[i]);

    const icon = document.createElement("span");
    icon.innerHTML = weatherIcon(data.hourly.weather_code[i], data.hourly.is_day[i]);

    const temp = document.createElement("span");
    temp.className = "hour-temp";
    temp.textContent = `${Math.round(data.hourly.temperature_2m[i])}°`;

    const pop = document.createElement("span");
    pop.className = "hour-pop";
    const p = data.hourly.precipitation_probability?.[i];
    pop.textContent = p != null && p >= 5 ? `${p}%` : "";

    card.append(time, icon, temp, pop);
    els.hourly.append(card);
  }

  /* Daily — 7 rows with range bars */
  els.daily.textContent = "";
  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);
  const span = Math.max(weekMax - weekMin, 1);

  daily.time.forEach((dayIso, i) => {
    const row = document.createElement("div");
    row.className = "day-row";
    row.setAttribute("role", "listitem");

    const name = document.createElement("span");
    name.className = "day-name";
    name.textContent = dayLabel(dayIso, i);

    const icon = document.createElement("span");
    icon.innerHTML = weatherIcon(daily.weather_code[i], 1);

    const pop = document.createElement("span");
    pop.className = "day-pop";
    const p = daily.precipitation_probability_max?.[i];
    pop.textContent = p != null && p >= 5 ? `${p}%` : "";

    const min = document.createElement("span");
    min.className = "day-min";
    min.textContent = `${Math.round(daily.temperature_2m_min[i])}°`;

    const range = document.createElement("span");
    range.className = "range";
    const fill = document.createElement("span");
    fill.className = "range-fill";
    fill.style.left = `${((daily.temperature_2m_min[i] - weekMin) / span) * 100}%`;
    fill.style.width = `${((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / span) * 100}%`;
    range.append(fill);

    const max = document.createElement("span");
    max.className = "day-max";
    max.textContent = `${Math.round(daily.temperature_2m_max[i])}°`;

    row.append(name, icon, pop, min, range, max);
    els.daily.append(row);
  });
}

/* ---------------- Unit toggle ---------------- */

function updateUnitButtons() {
  const isC = state.unit === "c";
  els.btnC.classList.toggle("is-active", isC);
  els.btnF.classList.toggle("is-active", !isC);
  els.btnC.setAttribute("aria-pressed", String(isC));
  els.btnF.setAttribute("aria-pressed", String(!isC));
}

els.btnC.addEventListener("click", () => setUnit("c"));
els.btnF.addEventListener("click", () => setUnit("f"));

function setUnit(unit) {
  if (state.unit === unit) return;
  state.unit = unit;
  saveStore({ unit });
  updateUnitButtons();
  if (state.last) loadWeather(state.last);
}

/* ---------------- Geolocation ---------------- */

els.btnLocate.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    showStatus("Geolocation is not supported by this browser.", { isError: true });
    return;
  }
  els.btnLocate.classList.add("is-loading");

  const fail = (msg) => {
    els.btnLocate.classList.remove("is-loading");
    showStatus(msg, { isError: true });
  };

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      let place = { name: "My location", latitude, longitude };
      try {
        const rev = await fetchJSON(
          `${REVERSE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          8000
        );
        place = {
          name: rev.city || rev.locality || rev.principalSubdivision || "My location",
          admin1: rev.principalSubdivision || "",
          country: rev.countryName || "",
          latitude,
          longitude,
        };
      } catch {
        /* keep fallback name — forecast still loads */
      }
      els.btnLocate.classList.remove("is-loading");
      choosePlace(place);
    },
    (err) => fail(
      err.code === err.PERMISSION_DENIED
        ? "Location permission denied. Search for a city instead."
        : "Couldn't get your location. Search for a city instead."
    ),
    { timeout: 8000, maximumAge: 300000 }
  );
});

/* ---------------- Offline awareness ---------------- */

window.addEventListener("offline", () => {
  showStatus("You're offline. Showing the last loaded data until the connection returns.", { isError: false });
});
window.addEventListener("online", hideStatus);

/* ---------------- Init ---------------- */

renderRecents();
updateUnitButtons();
loadWeather(state.last || DEFAULT_PLACE);
