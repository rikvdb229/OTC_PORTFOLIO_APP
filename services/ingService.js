const fetch = require("node-fetch");
const { BrowserWindow } = require("electron");

// --- Helper: fetch raw quotes from ING API ---
async function fetchIngQuotes(isin, timeframe = "INTRADAY") {
  const res = await fetch("https://api.ingmarkets.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query historicMarketsComProductQuotes($isin: String!, $timeframe: Timeframe!) {
        productQuotes: marketscom_quotes(id: $isin, timeframe: $timeframe) {
          x: unixTimestamp
          y: bid
        }
      }`,
      variables: { isin, timeframe },
      operationName: "historicMarketsComProductQuotes"
    })
  });

  const json = await res.json();
  return json?.data?.productQuotes || [];
}

// --- Helper: find nearest valid price to 09:00 CET ---
function findNearestValidPrice(quotes, targetTs) {
  const valid = quotes.filter(q => q.y > 0);
  if (valid.length === 0) return null;

  let nearest = valid[0];
  let minDiff = Math.abs(valid[0].x - targetTs);

  for (let i = 1; i < valid.length; i++) {
    const diff = Math.abs(valid[i].x - targetTs);
    if (diff < minDiff) {
      nearest = valid[i];
      minDiff = diff;
    }
  }

  return nearest;
}

// --- Main: fetch price for an ING grant ---
async function fetchIngPrice(grant, fetchFullHistory = false) {
    if (!grant.isin) {
        throw new Error("ING grant must have an ISIN");
    }

    // For daily updates, use "INTRADAY" to get detailed price movements
    // For full history, use "ALL" (faster, returns only daily close prices)
    const timeframe = fetchFullHistory ? "ALL" : "INTRADAY";

    let quotes = await fetchIngQuotes(grant.isin, timeframe);

    if (!quotes || quotes.length === 0) {
        throw new Error(`No quotes found for ISIN ${grant.isin}`);
    }

    const validQuotes = quotes.filter(q => q.y > 0);
    if (validQuotes.length === 0) {
        throw new Error(`No valid price data for ISIN ${grant.isin} (all prices were zero)`);
    }

    if (!fetchFullHistory) {
        // For daily updates, return just the latest price
        const latest = validQuotes[0];
        return [{ timestamp: latest.x, price: latest.y }];
    }

    // For full history, return all quotes
    return validQuotes.map(q => ({ timestamp: q.x, price: q.y }));
}

// Web scraping method to get FOP product info
// Returns json:
// {
//   "isin": "FOP828214702",
//   "title": "FOP Product FOP828214702",
//   "lastUpdate": "2025-10-03 14:51:00",
//   "fund_name": "iShares Core EURO STOX",
//   "exercise_price": "214.95",
//   "current_value": "94.69"
// }
async function findFopProductInfo(isin) {
  const url = `https://www.ingmarkets.com/products/${isin}`;
  const urlInvestorProfile = "https://www.ingmarkets.com/investor-profile";
  console.log(`Searching for FOP product info for ISIN: ${isin}`);

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:ingmarkets", // persistent session
    },
  });

  try {
    await win.loadURL(urlInvestorProfile, { userAgent: "Mozilla/5.0" });

    // Try to select professional investor
    const cookies = await win.webContents.session.cookies.get({ url: "https://www.ingmarkets.com" });
    const isPro = cookies.some(c => /investor/i.test(c.name) && /professional/i.test(c.value));

    if (!isPro) {
      console.log("🔹 Selecting 'Professional Investor' profile...");
      const clicked = await win.webContents.executeJavaScript(`
        (async () => {
          const delay = ms => new Promise(r => setTimeout(r, ms));
          for (let i = 0; i < 30; i++) {
            const btns = Array.from(document.querySelectorAll('button.button.secondary'));
            const btn = btns.find(b => /professional investor/i.test(b.innerText));
            if (btn) { btn.click(); return true; }
            await delay(500);
          }
          return false;
        })();
      `);

      if (clicked) {
        await new Promise(r => setTimeout(r, 1000));
        console.log("🔄 Reloading page as Professional Investor...");
        await win.loadURL(url, { userAgent: "Mozilla/5.0" });
      } else {
        console.warn("⚠️ 'Professional Investor' button not found; continuing without selecting.");
      }
    } else {
      console.log("✅ Already using Professional Investor profile (cookie found).");
    }

    // Scrape header — handle shadow DOM for iwp-date and iwp-number
    const result = await win.webContents.executeJavaScript(`
      (async () => {
        const header = document.querySelector("header[data-astro-cid-uktgvieu]");
        if (!header) return null;

        const delay = ms => new Promise(r => setTimeout(r, ms));

        // Wait for a node inside a host's shadowRoot (or light DOM) to appear
        async function waitForHostInner(hostSelector, innerSelector, timeout = 5000) {
          const started = Date.now();
          while (Date.now() - started < timeout) {
            const host = header.querySelector(hostSelector);
            if (host) {
              // shadowRoot case
              if (host.shadowRoot) {
                const el = host.shadowRoot.querySelector(innerSelector);
                if (el) return el;
              }
              // light DOM fallback
              const el2 = host.querySelector(innerSelector);
              if (el2) return el2;
            }
            // fallback: try searching header globally
            const gl = header.querySelector(innerSelector);
            if (gl) return gl;
            await delay(200);
          }
          return null;
        }

        // Format datetime into YYYY-MM-DD HH:mm:ss (always include seconds)
        function formatDate(dtString) {
          if (!dtString) return null;
          const d = new Date(dtString);
          if (isNaN(d)) return null;
          const pad = n => String(n).padStart(2, "0");
          return (
            d.getFullYear() + "-" +
            pad(d.getMonth() + 1) + "-" +
            pad(d.getDate()) + " " +
            pad(d.getHours()) + ":" +
            pad(d.getMinutes()) + ":" +
            pad(d.getSeconds())
          );
        }

        // extract numeric/display value from a <dd> — handles iwp-number (shadow root) and fallbacks
        async function extractValueFromDd(dd) {
          if (!dd) return null;

          // If contains an iwp-number, prefer its shadowRoot .value span
          const iwp = dd.querySelector('iwp-number');
          if (iwp) {
            const started = Date.now();
            while (Date.now() - started < 3000) { // wait up to 3s for hydration
              if (iwp.shadowRoot) {
                const valSpan = iwp.shadowRoot.querySelector('.value') || iwp.shadowRoot.querySelector('span.value') || iwp.shadowRoot.querySelector('span');
                if (valSpan && valSpan.textContent && valSpan.textContent.trim()) {
                  return valSpan.textContent.trim();
                }
              }
              // fallback to light DOM text in the iwp element (if any)
              if (iwp.textContent && iwp.textContent.trim()) return iwp.textContent.trim();
              await delay(150);
            }
          }

          // If the dd has a span.value directly
          const spanDirect = dd.querySelector('span.value');
          if (spanDirect && spanDirect.textContent && spanDirect.textContent.trim()) {
            return spanDirect.textContent.trim();
          }

          // fallback to innerText
          const txt = dd.innerText ? dd.innerText.trim() : null;
          return txt || null;
        }

        // Get lastUpdate from iwp-date/time (shadow root aware)
        const timeEl = await waitForHostInner('iwp-date', 'time', 5000);
        const datetime = timeEl ? (timeEl.getAttribute ? timeEl.getAttribute('datetime') : null) : null;
        const lastUpdate = formatDate(datetime);

        // Read title
        const title = header.querySelector('h1.primary-name')?.innerText?.trim() || null;

        // Walk <dl class=...> items
        let fund_name = null;
        let exercise_price = null;
        let current_value = null;

        const items = Array.from(header.querySelectorAll('dl .item'));
        for (const item of items) {
          const dt = item.querySelector('dt');
          const dd = item.querySelector('dd');
          const label = dt?.innerText?.trim() || "";
          const value = await extractValueFromDd(dd);

          if (/^Underlying$/i.test(label) || /underlying$/i.test(label)) {
            fund_name = value;
          } else if (/underlying value/i.test(label) || /Underlying value/i.test(label)) {
            exercise_price = value;
          } else if (/^Bid$/i.test(label) || /\bBid\b/i.test(label)) {
            current_value = value;
          }
        }

        // sanitize common placeholders
        if (current_value && /^n\\/a$/i.test(current_value)) current_value = null;
        if (exercise_price && exercise_price.trim() === "") exercise_price = null;

        return {
          FOP: "${isin}",
          title,
          lastUpdate,
          fund_name,
          exercise_price,
          current_value
        };
      })();
    `);

    if (result) {
      let quotes = await fetchIngQuotes(isin, "INTRADAY");

      if (quotes && quotes.length > 0) {
        result.current_value = quotes[0].y;
        const firstValidQuote = quotes.filter(q => q.y > 0).pop();
        result.first_available_price = firstValidQuote ? firstValidQuote.y : quotes[0].y;
      } else {
        quotes = await fetchIngQuotes(isin, "ALL");
        if (quotes && quotes.length > 0) {
          result.current_value = quotes[0].y;
          const firstValidQuote = quotes.filter(q => q.y > 0).pop();
          result.first_available_price = firstValidQuote ? firstValidQuote.y : quotes[0].y;
        } else {
          result.current_value = "N/A";
          result.first_available_price = "N/A";
        }
      }

      console.log(`✅ Found product info:`, result);
      return result;
    } else {
      console.log(`❌ No product info found for ISIN: ${isin}`);
      return null;
    }

  } catch (err) {
    console.error("❌ Scraping error:", err);
    return null;
  } finally {
    win.destroy();
  }
}

module.exports = { fetchIngPrice, findFopProductInfo, fetchIngQuotes };