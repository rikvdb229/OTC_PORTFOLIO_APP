const KBCScraper = require("./kbcScraperService");
const fs = require("fs");
const Papa = require("papaparse");

// Cache for CSV data to avoid downloading multiple times per session
let csvCache = {
    data: null,
    timestamp: null,
    filePath: null
};

// Promise to track ongoing download (prevents parallel downloads)
let downloadPromise = null;

// Download and parse KBC CSV once, cache for subsequent calls
async function getKbcCsvData() {
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // Return cached data if still fresh
    if (csvCache.data && csvCache.timestamp && (now - csvCache.timestamp) < cacheExpiry) {
        console.log("📦 Using cached KBC CSV data");
        return csvCache;
    }

    // If a download is already in progress, wait for it
    if (downloadPromise) {
        console.log("⏳ Waiting for ongoing KBC CSV download...");
        await downloadPromise;
        return csvCache;
    }

    // Start new download
    console.log("⬇️ Downloading fresh KBC CSV data");
    downloadPromise = (async () => {
        try {
            const scraper = new KBCScraper();

            // Get latest CSV data
            const result = await scraper.scrapeData();
            if (!result.success || !result.filePath) {
                throw new Error(result.error || "Failed to fetch KBC data");
            }

            // Parse CSV content
            const csvContent = fs.readFileSync(result.filePath, "utf-8");
            const parsedData = Papa.parse(csvContent, {
                header: false,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimiter: ","
            });

            // Update cache
            csvCache = {
                data: parsedData.data,
                timestamp: now,
                filePath: result.filePath
            };

            console.log(`✅ KBC CSV cached with ${parsedData.data.length} rows`);
        } finally {
            // Clear the download promise when done
            downloadPromise = null;
        }
    })();

    await downloadPromise;
    return csvCache;
}

async function fetchKbcPrice(grant) {
    // Get cached or fresh CSV data
    const { data: parsedData } = await getKbcCsvData();

    // Find matching row for grant
    const matchingRow = parsedData.find(row =>
        row[2] === grant.grant_date &&
        parseFloat(row[3]) === grant.exercise_price &&
        row[7]?.trim() === grant.fund_name
    );

    if (!matchingRow) {
        throw new Error("No matching price found in KBC data");
    }

    return {
        price: parseFloat(matchingRow[5]),
        timestamp: new Date(matchingRow[6] || Date.now()).getTime()
    };
}

// Clear cache (useful for testing)
function clearKbcCache() {
    csvCache = {
        data: null,
        timestamp: null,
        filePath: null
    };
    console.log("🗑️ KBC CSV cache cleared");
}

module.exports = { fetchKbcPrice, clearKbcCache };