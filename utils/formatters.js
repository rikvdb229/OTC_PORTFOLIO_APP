/**
 * Portfolio Utilities - All helper functions
 * Formatting, calculations, tooltips, and status helpers
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
    default:
      return "";
  }
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
      return `<small class="selling-status-sellable">✅ Sellable</small>`; // Changed from "Ready"
    default:
      return `<small class="selling-status-unknown">❓ Unknown</small>`;
  }
}
/**
 * ===== ENHANCED FORMATTERS UTILITY =====
 * Portfolio Utilities - All helper functions
 * Formatting, calculations, tooltips, and status helpers
 *
 * INSTRUCTIONS: Add these functions to your existing utils/formatters.js
 * (Keep your existing functions and add these new ones)
 */

// ===== ADD THESE NEW FUNCTIONS TO YOUR EXISTING FORMATTERS =====

// Extend existing FormatHelpers object
window.FormatHelpers = window.FormatHelpers || {};

/**
 * Format currency (enhanced version that handles more cases)
 * @param {number} amount - Amount to format
 * @param {string} symbol - Currency symbol
 * @returns {string} Formatted currency
 */
window.FormatHelpers.formatCurrency = function (amount, symbol = "€") {
  // Use existing formatCurrencyValue if available, otherwise provide fallback
  if (typeof window.FormatHelpers.formatCurrencyValue === "function") {
    return window.FormatHelpers.formatCurrencyValue(amount, symbol);
  }

  // Fallback implementation
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`;
  }

  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = amount < 0 ? "-" : "";
  return `${sign}${symbol}${formatted}`;
};

/**
 * Enhanced fund name formatting (if not already present)
 * @param {string} fundName - Fund name to format
 * @param {number} maxLength - Maximum length
 * @returns {string} Formatted fund name
 */
window.FormatHelpers.formatFundName =
  window.FormatHelpers.formatFundName ||
  function (fundName, maxLength = 25) {
    if (!fundName || fundName === "Unknown Fund") {
      return '<span class="unknown-fund">Unknown Fund</span>';
    }

    if (fundName.length <= maxLength) {
      return fundName;
    }

    return `<span title="${fundName}">${fundName.substring(
      0,
      maxLength - 3
    )}...</span>`;
  };

/**
 * Get return percentage CSS class (enhanced)
 * @param {number} returnPercentage - Current return percentage
 * @param {number} targetPercentage - Target percentage
 * @returns {string} CSS class name
 */
window.FormatHelpers.getReturnPercentageClass = function (
  returnPercentage,
  targetPercentage = 65
) {
  // Use existing getReturnClass if available
  if (typeof window.FormatHelpers.getReturnClass === "function") {
    return window.FormatHelpers.getReturnClass(
      returnPercentage,
      targetPercentage
    );
  }

  // Fallback implementation
  if (returnPercentage === null || returnPercentage === undefined) {
    return "return-na";
  }

  if (returnPercentage >= targetPercentage) {
    return "return-positive";
  } else if (returnPercentage >= targetPercentage * 0.8) {
    return "return-moderate";
  } else {
    return "return-negative";
  }
};

/**
 * Enhanced selling status badge generation
 * @param {string} status - Selling status
 * @param {string} canSellAfter - Date when can sell
 * @param {string} expiresOn - Expiration date
 * @returns {string} HTML for status badge
 */
window.FormatHelpers.getSellingStatusBadge =
  window.FormatHelpers.getSellingStatusBadge ||
  function (status, canSellAfter, expiresOn) {
    const badges = {
      SELLABLE:
        '<span class="badge badge-success" title="Can sell now">✅ Sellable</span>', // Changed from "Sellable"
      WAITING_PERIOD: `<span class="badge badge-warning" title="Can sell after ${canSellAfter}">⏳ Waiting</span>`,
      EXPIRING_SOON: `<span class="badge badge-warning" title="Expires on ${expiresOn}">⚠️ Expiring</span>`,
      EXPIRED: `<span class="badge badge-danger" title="Expired on ${expiresOn}">❌ Expired</span>`,
      SOLD: '<span class="badge badge-info" title="Already sold">💰 Sold</span>',
    };

    return (
      badges[status] || `<span class="badge badge-secondary">${status}</span>`
    );
  };

/**
 * Enhanced row status class
 * @param {string} sellingStatus - Selling status
 * @returns {string} CSS class name
 */
window.FormatHelpers.getRowStatusClass =
  window.FormatHelpers.getRowStatusClass ||
  function (sellingStatus) {
    const statusClasses = {
      SELLABLE: "status-sellable",
      WAITING_PERIOD: "status-waiting",
      EXPIRING_SOON: "status-expiring",
      EXPIRED: "status-expired",
      SOLD: "status-sold",
    };

    return statusClasses[sellingStatus] || "status-unknown";
  };

// ===== NEW UTILITY FUNCTIONS FOR RENDERER EXTRACTION =====

/**
 * Format percentage display
 * @param {number} percentage - Percentage value
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
window.FormatHelpers.formatPercentage = function (percentage, decimals = 1) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "N/A";
  }
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type
 * @returns {string} Formatted date
 */
window.FormatHelpers.formatDate = function (date, format = "short") {
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
};

/**
 * Format quantity with thousands separators
 * @param {number} quantity - Quantity to format
 * @returns {string} Formatted quantity
 */
window.FormatHelpers.formatQuantity = function (quantity) {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return "0";
  }
  return quantity.toLocaleString();
};

/**
 * Get profit/loss CSS class based on value
 * @param {number} value - Profit/loss value
 * @returns {string} CSS class name
 */
window.FormatHelpers.getProfitLossClass = function (value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "neutral";
  }
  return value >= 0 ? "positive" : "negative";
};

/**
 * Format a change value with + or - prefix
 * @param {number} changeValue - Change value
 * @param {boolean} isPercentage - Whether it's a percentage
 * @returns {string} Formatted change
 */
window.FormatHelpers.formatChange = function (
  changeValue,
  isPercentage = false
) {
  if (changeValue === null || changeValue === undefined || isNaN(changeValue)) {
    return "N/A";
  }

  const prefix = changeValue >= 0 ? "+" : "";
  const suffix = isPercentage ? "%" : "";

  if (isPercentage) {
    return `${prefix}${changeValue.toFixed(1)}${suffix}`;
  } else {
    return `${prefix}${this.formatCurrency(changeValue)}`;
  }
};

/**
 * Generate tooltip text for various elements
 * @param {string} type - Tooltip type
 * @param {Object} data - Data for tooltip
 * @returns {string} Tooltip text
 */
window.FormatHelpers.generateTooltip = function (type, data) {
  switch (type) {
    case "profit_loss":
      return `P&L against ${data.targetPercentage || 65}% target`;
    case "return_percentage":
      return `Return vs ${data.targetPercentage || 65}% target`;
    case "sell_button":
      return this.getSellButtonTooltip(
        data.status,
        data.canSellAfter,
        data.expiresOn
      );
    default:
      return "";
  }
};

console.log("✅ Enhanced formatters utility functions loaded");
// ===== EXPORTS =====

// Export to global scope for existing code
window.FormatHelpers = {
  formatCurrencyValue,
  getReturnClass,
  getSellingStatusText,
  getRowStatusClass,
  formatFundName,
  // Add the new functions to global scope too
  getTargetValueClass,
  getSellButtonTooltip,
  getSellingStatusBadge,
};

// Export for module imports
module.exports = {
  formatCurrencyValue,
  getReturnClass,
  getTargetValueClass,
  getSellingStatusText,
  getRowStatusClass,
  formatFundName,
  getSellButtonTooltip,
  getSellingStatusBadge,
};
