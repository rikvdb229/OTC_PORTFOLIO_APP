const { fetchIngPrice } = require('./ingService');
const { fetchKbcPrice } = require('./kbcService');

/**
 * Unified price service for all grant types
 * @param {Object} grant - Grant object containing:
 * @param {string} grant.source - "KBC" or "ING"
 * @param {string} grant.grant_date - Date in YYYY-MM-DD format
 * @param {number} grant.exercise_price - Exercise price of the option
 * @param {string} grant.fund_name - Name of the fund/stock
 * @param {string} [grant.isin] - Required for ING grants
 * @param {boolean} [fetchFullHistory=false] - Fetch full history or just latest price
 * @returns {Promise<{timestamp: number, price: number}>}
 */
async function getPrice(grant, fetchFullHistory = false) {
    switch (grant.source) {
        case "KBC":
            return await fetchKbcPrice(grant);
        case "ING":
            if (!grant.isin) {
                throw new Error("ING grant must have an ISIN");
            }
            return await fetchIngPrice(grant, fetchFullHistory);
        default:
            throw new Error(`Unsupported grant source: ${grant.source}`);
    }
}

module.exports = { getPrice };