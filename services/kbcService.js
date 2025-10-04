const KBCScraper = require("../scraper");
const fs = require("fs");
const Papa = require("papaparse");

async function fetchKbcPrice(grant) {
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

    // Find matching row for grant
    const matchingRow = parsedData.data.find(row =>
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

module.exports = { fetchKbcPrice };