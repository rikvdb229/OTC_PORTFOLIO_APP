/**
 * Portfolio Utilities - Clean Formatters
 * All helper functions for formatting, calculations, tooltips, and status helpers
 */

// ===== CURRENCY & FORMATTING =====

function formatCurrencyValue(amount, symbol = "€") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })
    .format(amount || 0)
    .replace("€", symbol);
}

function formatFundName(fundName, maxLength = 25) {
  if (!fundName) return "Unknown Fund";

  if (fundName.length <= maxLength) {
    return fundName;
  }

  return fundName.substring(0, maxLength - 3) + "...";
}

function formatDate(date, format = "short") {
  if (!date) return "N/A";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "Invalid Date";

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString();
    case "long":
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "time":
      return dateObj.toLocaleString();
    default:
      return dateObj.toLocaleDateString();
  }
}

function formatQuantity(quantity) {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return "0";
  }
  return quantity.toLocaleString();
}

function formatPercentage(percentage, decimals = 1) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "N/A";
  }
  return `${percentage.toFixed(decimals)}%`;
}

// ===== CLASSIFICATION & CSS CLASSES =====

function getReturnClass(returnPercentage, targetPercentage = 65) {
  if (!returnPercentage || returnPercentage === null) {
    return "";
  }

  const diff = returnPercentage - targetPercentage;

  if (diff < -20) return "return-far-below";
  if (diff < -5) return "return-below";
  if (diff <= 5) return "return-near-target";
  if (diff <= 20) return "return-above";
  return "return-far-above";
}

function getTargetValueClass(currentPercentage, targetPercentage) {
  if (!currentPercentage || currentPercentage === 0) return "target-critical";

  const ratio = Math.abs(currentPercentage) / targetPercentage;

  if (currentPercentage < 0) return "target-critical"; // Losses are always critical
  if (ratio < 0.5) return "target-critical"; // < 50% of target
  if (ratio < 0.75) return "target-low"; // 50-75% of target
  if (ratio < 0.9) return "target-below"; // 75-90% of target
  if (ratio < 1.1) return "target-near"; // 90-110% of target
  if (ratio < 1.5) return "target-good"; // 110-150% of target
  return "target-excellent"; // 150%+ of target
}

function getRowStatusClass(sellingStatus) {
  switch (sellingStatus) {
    case "SELLABLE":
      return "status-sellable";
    case "WAITING_PERIOD":
      return "status-waiting";
    case "EXPIRING_SOON":
      return "status-expiring";
    case "EXPIRED":
      return "status-expired";
    case "SOLD":
      return "status-sold";
    default:
      return "";
  }
}

function getProfitLossClass(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "neutral";
  }
  return value >= 0 ? "positive" : "negative";
}

// ===== STATUS & TEXT HELPERS =====

function getSellingStatusText(status) {
  const statusTexts = {
    SELLABLE: "✅ Ready to sell",
    WAITING_PERIOD: "⏳ Waiting period (1 year minimum)",
    EXPIRING_SOON: "⚠️ Expiring soon (within 1 year)",
    EXPIRED: "❌ Expired (10 year limit reached)",
  };
  return statusTexts[status] || status;
}

// ===== TOOLTIP & BADGE HELPERS =====

function getSellButtonTooltip(status, canSellAfter, expiresOn) {
  switch (status) {
    case "WAITING_PERIOD":
      return `Cannot sell until ${new Date(
        canSellAfter
      ).toLocaleDateString()} (1 year minimum holding period)`;
    case "EXPIRING_SOON":
      return `⚠️ Options expire on ${new Date(
        expiresOn
      ).toLocaleDateString()} - sell soon!`;
    case "EXPIRED":
      return `❌ Options expired on ${new Date(
        expiresOn
      ).toLocaleDateString()} - cannot sell`;
    case "SELLABLE":
      return "Click to record a sale of these options";
    default:
      return "Sell options";
  }
}

function getSellingStatusBadge(status, canSellAfter, expiresOn) {
  switch (status) {
    case "WAITING_PERIOD":
      return `<small class="selling-status-waiting">⏳ Wait until ${new Date(
        canSellAfter
      ).toLocaleDateString()}</small>`;
    case "EXPIRING_SOON":
      return `<small class="selling-status-expiring">⚠️ Expires ${new Date(
        expiresOn
      ).toLocaleDateString()}</small>`;
    case "EXPIRED":
      return `<small class="selling-status-expired">❌ Expired</small>`;
    case "SELLABLE":
      return `<small class="selling-status-sellable">✅ Sellable</small>`;
    default:
      return `<small class="selling-status-unknown">❓ Unknown</small>`;
  }
}

function generateTooltip(type, data) {
  switch (type) {
    case "profit_loss":
      return `P&L against ${data.targetPercentage || 65}% target`;
    case "return_percentage":
      return `Return vs ${data.targetPercentage || 65}% target`;
    case "sell_button":
      return getSellButtonTooltip(
        data.status,
        data.canSellAfter,
        data.expiresOn
      );
    default:
      return "";
  }
}

// ===== CLEAN EXPORTS =====

// Export to global scope for existing code
window.FormatHelpers = {
  // Currency & Formatting
  formatCurrencyValue,
  formatFundName,
  formatDate,
  formatQuantity,
  formatPercentage,

  // CSS Classes
  getReturnClass,
  getTargetValueClass,
  getRowStatusClass,
  getProfitLossClass,

  // Status & Text
  getSellingStatusText,
  getSellButtonTooltip,
  getSellingStatusBadge,
  generateTooltip,
};

// Export for module imports (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    formatCurrencyValue,
    formatFundName,
    formatDate,
    formatQuantity,
    formatPercentage,
    getReturnClass,
    getTargetValueClass,
    getRowStatusClass,
    getProfitLossClass,
    getSellingStatusText,
    getSellButtonTooltip,
    getSellingStatusBadge,
    generateTooltip,
  };
}

console.log(
  "✅ Clean formatters utility loaded - All functions available in window.FormatHelpers"
);
