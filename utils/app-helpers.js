// Simple helper methods extracted from renderer.js
// These are just wrapper methods - SAFEST EXTRACTION

/**
 * App Helper Methods
 * These methods are simple wrappers around already-extracted utilities
 * RISK LEVEL: VERY LOW - Just moving wrapper methods
 */

class AppHelpers {
  constructor(app) {
    this.app = app; // Reference to main portfolio app for accessing properties
  }

  /**
   * Format fund name with truncation
   * EXTRACTED FROM: renderer.js formatFundName() method
   */
  formatFundName(fundName) {
    return window.FormatHelpers.formatFundName(fundName);
  }

  /**
   * Get CSS class for row status
   * EXTRACTED FROM: renderer.js getRowStatusClass() method
   */
  getRowStatusClass(sellingStatus) {
    return window.FormatHelpers.getRowStatusClass(sellingStatus);
  }

  /**
   * Get selling status badge HTML
   * EXTRACTED FROM: renderer.js getSellingStatusBadge() method
   */
  getSellingStatusBadge(status, canSellAfter, expiresOn) {
    return FormatHelpers.getSellingStatusBadge(status, canSellAfter, expiresOn);
  }

  /**
   * Get tooltip text for sell button
   * EXTRACTED FROM: renderer.js getSellButtonTooltip() method
   */
  getSellButtonTooltip(status, canSellAfter, expiresOn) {
    return FormatHelpers.getSellButtonTooltip(status, canSellAfter, expiresOn);
  }

  /**
   * Get CSS class for return percentage
   * EXTRACTED FROM: renderer.js getReturnPercentageClass() method
   */
  getReturnPercentageClass(returnPercentage, targetPercentage = 65) {
    return window.FormatHelpers.getReturnClass(
      returnPercentage,
      targetPercentage
    );
  }

  /**
   * Get CSS class for target value
   * EXTRACTED FROM: renderer.js getTargetValueClass() method
   */
  getTargetValueClass(currentPercentage, targetPercentage) {
    return FormatHelpers.getTargetValueClass(
      currentPercentage,
      targetPercentage
    );
  }

  /**
   * Format currency amount
   * EXTRACTED FROM: renderer.js formatCurrency() method
   */
  formatCurrency(amount) {
    const symbol = this.app.currencySymbol?.value || "€";
    return window.FormatHelpers.formatCurrencyValue(amount, symbol);
  }
}

// Export to global scope for use in renderer.js
window.AppHelpers = AppHelpers;

// Also support module.exports for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = AppHelpers;
}
