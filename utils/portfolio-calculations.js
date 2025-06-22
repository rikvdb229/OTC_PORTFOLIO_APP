/**
 * ===== PORTFOLIO CALCULATION UTILITIES =====
 * Pure business logic functions for portfolio calculations
 */

/**
 * Calculate total portfolio value from overview data
 * @param {Array} overview - Portfolio overview data
 * @returns {number} Total portfolio value
 */
function calculateTotalValue(overview) {
  return overview.reduce(
    (sum, entry) => sum + (entry.current_total_value || 0),
    0
  );
}

/**
 * Calculate total quantity of options
 * @param {Array} overview - Portfolio overview data
 * @returns {number} Total quantity of options
 */
function calculateTotalQuantity(overview) {
  return overview.reduce((sum, entry) => sum + entry.quantity_remaining, 0);
}

/**
 * Calculate weighted average return percentage
 * @param {Array} overview - Portfolio overview data
 * @returns {number} Weighted average return percentage
 */
function calculateWeightedAverageReturn(overview) {
  let totalWeightedReturn = 0;
  let totalWeight = 0;

  overview.forEach((entry) => {
    if (
      entry.current_return_percentage !== null &&
      entry.current_return_percentage !== undefined &&
      entry.current_total_value > 0
    ) {
      const weight = entry.current_total_value;
      totalWeightedReturn += entry.current_return_percentage * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
}

/**
 * Calculate total profit/loss vs target
 * @param {Array} overview - Portfolio overview data
 * @returns {number} Total profit/loss vs target
 */
function calculateTotalProfitLoss(overview) {
  return overview.reduce(
    (sum, entry) => sum + (entry.profit_loss_vs_target || 0),
    0
  );
}

/**
 * Find the latest price update date from portfolio data
 * @param {Array} overview - Portfolio overview data
 * @returns {Date|null} Latest update date or null if none found
 */
function findLatestPriceUpdate(overview) {
  return overview.reduce((latest, entry) => {
    if (!entry.last_price_update) return latest;
    const entryDate = new Date(entry.last_price_update);
    return !latest || entryDate > latest ? entryDate : latest;
  }, null);
}

/**
 * Generate portfolio statistics summary
 * @param {Array} overview - Portfolio overview data
 * @returns {Object} Portfolio statistics
 */
function generatePortfolioStats(overview) {
  const totalValue = calculateTotalValue(overview);
  const totalQuantity = calculateTotalQuantity(overview);
  const avgReturn = calculateWeightedAverageReturn(overview);
  const totalProfitLoss = calculateTotalProfitLoss(overview);
  const latestUpdate = findLatestPriceUpdate(overview);

  return {
    totalValue,
    totalQuantity,
    avgReturn,
    totalProfitLoss,
    latestUpdate,
    // Formatted versions for display
    totalValueFormatted: totalValue,
    totalQuantityFormatted: totalQuantity.toLocaleString(),
    avgReturnFormatted:
      isNaN(avgReturn) || !isFinite(avgReturn)
        ? "0.0%"
        : avgReturn.toFixed(1) + "%",
    totalProfitLossFormatted: totalProfitLoss,
    latestUpdateFormatted: latestUpdate
      ? latestUpdate.toLocaleDateString()
      : "No data",
  };
}

/**
 * Check if portfolio has any data
 * @param {Array} overview - Portfolio overview data
 * @returns {boolean} True if portfolio has data
 */
function hasPortfolioData(overview) {
  return Array.isArray(overview) && overview.length > 0;
}

/**
 * Get portfolio status indicators
 * @param {Object} stats - Portfolio statistics from generatePortfolioStats
 * @returns {Object} Status indicators
 */
function getPortfolioStatusIndicators(stats, targetPercentage = 65) {
  return {
    hasData: stats.totalQuantity > 0,
    isProfitable: stats.avgReturn > 0,
    hasProfitLoss: stats.totalProfitLoss !== 0,
    hasRecentUpdate:
      stats.latestUpdate &&
      new Date() - stats.latestUpdate < 7 * 24 * 60 * 60 * 1000, // 7 days
    returnClass: getReturnClass(stats.avgReturn, targetPercentage), // ✅ NEW WAY
    profitLossClass: stats.totalProfitLoss >= 0 ? "positive" : "negative",
  };
}

// Export to global scope
window.PortfolioCalculations = {
  calculateTotalValue,
  calculateTotalQuantity,
  calculateWeightedAverageReturn,
  calculateTotalProfitLoss,
  findLatestPriceUpdate,
  generatePortfolioStats,
  hasPortfolioData,
  getPortfolioStatusIndicators,
};
