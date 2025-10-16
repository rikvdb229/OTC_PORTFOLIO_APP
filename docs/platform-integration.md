# 🧭 Platform Integration System — OTC Portfolio App

## Overview

This document describes a new feature for integrating external investment platforms (e.g. **KBC** and **ING**) directly inside the Electron-based OTC Portfolio App.

The goal is to:
1. Allow users to select their platform from a modal.
2. Load the platform’s website in a **dedicated embedded browser** inside the Electron app.
3. Assist users during login (field highlighting, optional autofill).
4. **Scrape configurable data** (portfolio, balances, transactions) from the platform using JSON-based platform definitions.
5. Perform actions on the platform (accept offers, sell options) directly from the app.
6. Synchronize all scraped and actioned data back to the **local SQLite database** for analysis and display in the app’s dashboards.

---

## 🧩 Technology Stack

This feature is implemented entirely using the existing technologies in the app:

| Component                   | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| **Electron**                | Application runtime and secure embedded browser |
| **HTML / CSS / JavaScript** | Frontend modal UI and scripting                 |
| **SQLite**                  | Local database to store synced platform data    |
| **Chart.js**                | Visualization of synced portfolio data          |

No additional frameworks or dependencies are required.

---

## ⚙️ Architecture

```
User selects platform
       ↓
Modal (HTML/JS)
       ↓
Electron main process → creates BrowserWindow
       ↓
Preload script injects scraping logic (safe bridge)
       ↓
Platform page (KBC / ING)
       ↓
Scraper extracts JSON data
       ↓
IPC message → main process → SQLite database
       ↓
App dashboard updates (Chart.js)
```

---

## 🪟 UI Flow

### 1. Platform Selection Modal

A simple HTML modal lists available platforms:

```html
<div id="platform-modal" class="modal">
  <h2>Select your platform</h2>
  <button data-platform="kbc">KBC</button>
  <button data-platform="ing">ING</button>
</div>
```

**Logic:**

```js
document.querySelectorAll('#platform-modal button').forEach(btn => {
  btn.addEventListener('click', () => {
    const platform = btn.dataset.platform;
    window.api.openPlatformWindow(platform);
    closeModal();
  });
});
```

When a user selects a platform, the renderer sends an IPC message to the Electron main process.

---

## ⚡ Electron Flow

### Main Process (`main.js`)

Responsible for:
- Opening the provider window.
- Injecting the preload script.
- Managing IPC communication.
- Writing data to SQLite.

```js
const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, 'data', 'portfolio.db'));

// Load platform config
ipcMain.handle('get-platform-config', async (event, platformId) => {
  const cfg = fs.readFileSync(`./platform-configs/${platformId}.json`, 'utf8');
  return JSON.parse(cfg);
});

// Open platform browser
ipcMain.handle('open-platform-window', async (event, platformId) => {
  const cfg = JSON.parse(fs.readFileSync(`./platform-configs/${platformId}.json`, 'utf8'));

  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL(cfg.startUrl);
});

// Receive scraped data
ipcMain.on('scraped-data', (event, payload) => {
  db.run(
    `INSERT INTO platform_sync (platform, data, timestamp) VALUES (?, ?, ?)`,
    [payload.platformId, JSON.stringify(payload.data), Date.now()]
  );
});
```

---

## 🔒 Preload Script (`preload.js`)

The preload layer acts as a **secure bridge** between the web content and Electron.

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getPlatformConfig: (id) => ipcRenderer.invoke('get-platform-config', id),
  openPlatformWindow: (id) => ipcRenderer.invoke('open-platform-window', id),
  sendScrapedData: (data) => ipcRenderer.send('scraped-data', data)
});
```

---

## 🧠 Platform Configuration (JSON)

Each platform is defined in a separate JSON file under `/platform-configs`.

Example: `platform-configs/kbc.json`

```json
{
  "id": "kbc",
  "displayName": "KBC",
  "startUrl": "https://esop.kbc.be/",
  "login": {
    "usernameSelector": "input[name='username']",
    "passwordSelector": "input[name='password']",
    "submitSelector": "button[type='submit']",
    "postLoginIndicator": "#account-overview"
  },
  "scrape": {
    "balance": {
      "selector": ".portfolio-balance .amount",
      "transform": "parseCurrency"
    },
    "positions": {
      "rowsSelector": ".options-table tbody tr",
      "columns": {
        "symbol": "td:nth-child(1)",
        "quantity": "td:nth-child(2)",
        "status": "td:nth-child(5)"
      }
    }
  }
}
```

Each selector is customizable per platform.

---

## 🕷️ Scraping Logic (Injected Script)

This logic runs **inside the platform window** after login, based on the JSON config.

```js
async function waitForSelector(selector, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}

function parseCurrency(text) {
  return parseFloat(text.replace(/[^\d,.-]/g, '').replace(',', '.'));
}

async function runScraper(config) {
  const data = {};

  // Balance
  const balEl = await waitForSelector(config.scrape.balance.selector);
  data.balance = parseCurrency(balEl.textContent);

  // Positions
  const rows = document.querySelectorAll(config.scrape.positions.rowsSelector);
  data.positions = Array.from(rows).map(r => ({
    symbol: r.querySelector(config.scrape.positions.columns.symbol)?.textContent.trim(),
    quantity: r.querySelector(config.scrape.positions.columns.quantity)?.textContent.trim(),
    status: r.querySelector(config.scrape.positions.columns.status)?.textContent.trim()
  }));

  window.api.sendScrapedData({ platformId: config.id, data });
}
```

---

## 🧾 SQLite Integration

### Table: `platform_sync`

| Column      | Type                | Description                 |
| ----------- | ------------------- | --------------------------- |
| `id`        | INTEGER PRIMARY KEY | Auto-increment              |
| `platform`  | TEXT                | Platform ID (e.g. kbc, ing) |
| `data`      | TEXT                | JSON data scraped           |
| `timestamp` | INTEGER             | UNIX timestamp              |

### Example Schema
```sql
CREATE TABLE IF NOT EXISTS platform_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT,
  data TEXT,
  timestamp INTEGER
);
```

---

## 📊 Data Visualization with Chart.js

Scraped data is rendered in the dashboard to visualize balances and positions.

Example (HTML/JS):

```html
<canvas id="balanceChart"></canvas>
<script>
  const ctx = document.getElementById('balanceChart');
  const data = [12000, 14200, 15500, 16700]; // from SQLite
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Portfolio Value (€)',
        data
      }]
    }
  });
</script>
```

---

## 🔄 Sync & Actions

After scraping:
1. The data is inserted or updated in the local SQLite database.
2. The dashboard auto-refreshes (via IPC message).
3. Future iterations will allow executing platform actions (like “Accept Offer”) directly through injected scripts.

Actions will also be defined per platform in the JSON configuration, using selectors like:

```json
"actions": {
  "acceptOffer": {
    "buttonSelector": ".accept-offer",
    "confirmationSelector": ".confirmation-popup"
  }
}
```

---

## 🧱 File Structure

```
/app
  assets/
    bank/
      kbc.png
      ing.png
      icons/
        ...
      icon.png
      icon.svg
      logo.svg
  docs/
    platform-integration.md
  libs/
    chart.min.js
    chartjs-plugin-annotation.min.js
  platform-configs/
    kbc.json
    ing.json
  screen-shots/
    ...
  services/
    historicalService.js
    ingService.js
    kbcScraperService.js
    kbcService.js
    priceService.js
    timeService.js
  styles/
    main.css
  test-scripts/
    download-portfolio-historical-data.js
    historical-price-scraper.js
    test-parse-options-table.js
    test-time-api.js
  ui/
    html-generators.js
  utils/
    ...
  index.html
  main.js
  portfolio.db
  renderer.js
  ...
```

---

## 🔐 Security Notes

- `contextIsolation` is enabled — no Node.js access from webpage.
- Credentials should **never** be stored unencrypted.
- Platform scraping should only occur **after explicit user consent**.
- For banking websites, users must confirm they understand third-party automation risks.

---

## 🚀 Future Enhancements

- [ ] Add more platforms dynamically from a config file.
- [ ] Automatic schedule for re-scraping using `setInterval`.
- [ ] Action tracking: detect “accept offer” or “sell” via DOM or network.

---

## ✅ Summary

This system allows the OTC Portfolio App to:
- Connect directly to external platforms.
- Guide the user through login safely.
- Scrape live portfolio data in a configurable way.
- Sync and visualize everything locally using SQLite and Chart.js.

All implemented **only with HTML, CSS, JavaScript, Electron, and SQLite** — no new dependencies required.
