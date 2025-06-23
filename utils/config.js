/**
 * ===== APP CONFIGURATION & CONSTANTS =====
 * Shared configuration for both main and renderer processes
 */

const APP_CONFIG = {
  VERSION: "1.0.2",
  APP_NAME: "Portfolio tracker", // Changed from "KBC ESOP Portfolio Tracker"
  STATUS: "Development Version",
  BUILD_DATE: "2025-06-19",
  AUTHOR: "Portfolio Manager",

  // Version helpers
  getFullVersion() {
    return `${this.APP_NAME} v${this.VERSION}`;
  },

  getVersionWithStatus() {
    return `v${this.VERSION} - ${this.STATUS}`;
  },

  isDevVersion() {
    return this.STATUS.toLowerCase().includes("development");
  },
};
/**
 * Form management - handles form clearing and validation
 */
const FormManager = {
  /**
   * Clear the add options form
   * @param {Object} app - Application instance
   */
  clearAddOptionsForm(app) {
    try {
      const grantDateElement = document.getElementById("grantDate");
      const exercisePriceElement = document.getElementById("exercisePrice");
      const quantityElement = document.getElementById("quantity");
      const actualTaxAmountElement = document.getElementById("actualTaxAmount");
      const estimatedTaxElement = document.getElementById("estimatedTax");
      const helpTextElement = document.getElementById("exercisePriceHelp");

      if (grantDateElement) grantDateElement.value = "";

      if (exercisePriceElement) {
        exercisePriceElement.innerHTML =
          '<option value="">First enter grant date...</option>';
        exercisePriceElement.disabled = true;
      }

      if (quantityElement) quantityElement.value = "";

      if (actualTaxAmountElement) {
        actualTaxAmountElement.value = "";
        // 🆕 ADD THIS LINE: Clear the placeholder too
        actualTaxAmountElement.placeholder = "";
      }

      if (estimatedTaxElement) estimatedTaxElement.textContent = "€ 0.00";

      if (helpTextElement) {
        helpTextElement.textContent =
          "Options will appear after entering grant date";
      }

      // Clear stored form data
      app.currentFormData = null;

      console.log("✅ Form and stored data cleared");
    } catch (error) {
      console.warn("⚠️ Error clearing form:", error);
    }
  },
};

// Export to global scope
window.AppConfig = {
  APP_CONFIG,
  FormManager,
};

// Debug logging
console.log("✅ Config loaded:", window.AppConfig);
