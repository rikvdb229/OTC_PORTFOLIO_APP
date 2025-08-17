// utils/app-helpers.js
// Simple helper methods extracted from renderer.js
// These are just wrapper methods - SAFEST EXTRACTION

/**
 * App Helper Methods
 * These methods are simple wrappers around already-extracted utilities
 * RISK LEVEL: VERY LOW - Just moving wrapper methods
 * ✅ NEWLY ADDED: Data loading functions moved from renderer.js
 */

class AppHelpers {
  constructor(app) {
    this.app = app; // Reference to main portfolio app for accessing properties
  }
  // Removed duplicate confirmEditSale - using IPCCommunication.Sales.confirmEditSale instead
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
   * Format currency amount
   * EXTRACTED FROM: renderer.js formatCurrency() method
   */
  formatCurrency(amount) {
    const symbol = this.app.currencySymbol?.value || "€";
    return window.FormatHelpers.formatCurrencyValue(amount, symbol);
  }

  /**
   * Create helper function to check Bank Work days
   */
  isBankWorkDay = (date) => {
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;

    // Optionally check for holidays
    // Future proofing: can add more holidays dynamically
    const holidays = [
      "2025-01-01", // New Year's Day
      "2025-04-18", // Good Friday
      "2025-04-21", // Easter Monday
      "2025-05-01", // Labour Day
      "2025-05-29", // Ascension Day
      "2025-06-09", // White Monday
      "2025-07-21", // Belgian National Day
      "2025-08-15", // Assumption Day
      "2025-11-01", // All Saints' Day
      "2025-11-11", // Armistice Day
      "2025-12-25", // Christmas Day
      "2025-12-26"  // Boxing Day
    ];

    const iso = date.toISOString().slice(0, 10);
    return !holidays.includes(iso);
  };

  /**
   * Check for auto-update setting and trigger price update if enabled
   * MIGRATED FROM: renderer.js checkAutoUpdate() method
   * UPDATED: Only auto-update if prices are not current to avoid annoying users
   * RISK LEVEL: LOW - Simple setting check and conditional action
   */
  async checkAutoUpdate() {
    try {
      const autoUpdate =
        await window.IPCCommunication.Settings.getSetting("auto_update_prices");
      if (autoUpdate === "true") {
        console.log('🔍 Auto-update enabled, checking if prices need updating...');

        // Check if prices are current before auto-updating
        const priceStatus = await window.IPCCommunication.Price.getPriceUpdateStatus();

        if (priceStatus && !priceStatus.isCurrent && this.isBankWorkDay(new Date())) {
          console.log('📊 Prices are not current, starting auto-update...');
          setTimeout(() => this.app.updatePrices(), 2000);
        } else {
          if (!this.isBankWorkDay(new Date())) {
            console.warn('⚠️ Auto-update skipped: Today is NOT a bank work day');
          } else {
            console.log('✅ Prices are already current, skipping auto-update');
          }
        }
      }
    } catch (error) {
      console.error("Error checking auto-update setting:", error);
    }
  }

  /**
   * Create simple chart legend
   * ✅ MIGRATED FROM: renderer.js createSimpleChartLegend() method
   * Helper method for loadChartData()
   */
  createSimpleChartLegend() {
    const legendContainer = document.querySelector(".chart-legend");
    if (legendContainer) {
      legendContainer.innerHTML = `
        <div class="legend-item">
          <span class="legend-color" style="background-color: #007bff;"></span>
          <span>Portfolio Value</span>
        </div>
        <div class="legend-item">
          <span class="legend-line" style="background-color: #333;"></span>
          <span>Event</span>
        </div>
      `;
      console.log("✅ Simple chart legend created: Portfolio Value + Events");
    } else {
      console.warn("⚠️ Chart legend container not found");
    }
  }
  // FIX for calculateSaleProceeds in app-helpers.js
  // Replace your current calculateSaleProceeds function with this:

  calculateSaleProceeds(app) {
    if (!app.currentSellEntry) {
      return;
    }

    const quantityToSell =
      parseInt(document.getElementById("quantityToSell").value) || 0;
    const salePrice =
      parseFloat(document.getElementById("salePrice").value) || 0;

    if (quantityToSell > 0 && salePrice > 0) {
      // Calculate total sale value
      const totalSaleValue = quantityToSell * salePrice;

      // Calculate profit/loss vs target using the same formula as the overview
      // Formula: (Current Total Value - Tax) - Target Value
      const currentTotalValue = quantityToSell * salePrice; // For sold options, current value = sale price

      // Calculate proportional tax for sold options
      const totalTax =
        app.currentSellEntry.tax_amount ||
        app.currentSellEntry.tax_auto_calculated ||
        0;
      const remainingQuantity =
        app.currentSellEntry.quantity_remaining ||
        app.currentSellEntry.quantity;
      const taxPerOption =
        remainingQuantity > 0 ? totalTax / remainingQuantity : 0;
      const taxForSoldOptions = taxPerOption * quantityToSell;

      // Target value = quantity × grant_date_price × target_percentage (same as portfolio overview)
      const targetPercentage = app.targetPercentage?.value || 65;
      const grantDatePrice = app.currentSellEntry.grant_date_price || 10; // Use grant date price, fallback to 10
      const targetValue = quantityToSell * grantDatePrice * (targetPercentage / 100);

      // Final calculation: (Sale Value - Tax) - Target Value
      const profitLossVsTarget =
        currentTotalValue - taxForSoldOptions - targetValue;


      // Update Total Sale Value
      const totalSaleValueElement = document.getElementById("totalSaleValue");
      if (totalSaleValueElement) {
        totalSaleValueElement.textContent =
          window.FormatHelpers.formatCurrencyValue(totalSaleValue);
        console.log("🐛 DEBUG: Updated totalSaleValue");
      }

      // Update Profit/Loss vs Target
      const profitLossElement = document.getElementById("profitLossVsTarget");
      if (profitLossElement) {
        profitLossElement.textContent =
          window.FormatHelpers.formatCurrencyValue(profitLossVsTarget);

        // Apply color formatting
        const plClass =
          window.FormatHelpers.getProfitLossClass(profitLossVsTarget);
        profitLossElement.className = `currency ${plClass}`;
      }
    } else {
      // Reset to zero when no valid input
      const totalSaleValueElement = document.getElementById("totalSaleValue");
      const profitLossElement = document.getElementById("profitLossVsTarget");

      if (totalSaleValueElement) {
        totalSaleValueElement.textContent = "€ 0.00";
      }

      if (profitLossElement) {
        profitLossElement.textContent = "€ 0.00";
        profitLossElement.className = "currency neutral";
      }
    }
  }
  async updatePrices(app) {
    if (app.isScrapingInProgress) return;

    app.isScrapingInProgress = true;

    if (app.updatePricesBtn) {
      app.updatePricesBtn.disabled = true;
      app.updatePricesBtn.textContent = "⏳ Updating...";
    }

    // Use UI State Manager to show modal with safe element access
    window.UIStateManager.Modals.showModal("updatePricesModal", () => {
      // SAFE: Get elements fresh from DOM if not in app object
      const progressBar =
        app.updateProgressBar || document.getElementById("updateProgressBar");
      const progressText =
        app.updateProgressText || document.getElementById("updateProgressText");
      const statusOutput =
        app.updateStatusOutput || document.getElementById("updateStatusOutput");

      if (progressBar) progressBar.style.width = "0%";
      if (progressText) progressText.textContent = "Starting price update...";
      if (statusOutput)
        statusOutput.textContent = "Connecting to KBC servers...";
    });

    try {
      const result = await window.IPCCommunication.Price.updatePrices();

      // SAFE: Get elements fresh from DOM
      const progressBar =
        app.updateProgressBar || document.getElementById("updateProgressBar");
      const progressText =
        app.updateProgressText || document.getElementById("updateProgressText");
      const statusOutput =
        app.updateStatusOutput || document.getElementById("updateStatusOutput");

      if (result.success) {
        if (progressBar) progressBar.style.width = "100%";
        if (progressText) progressText.textContent = "Update Complete!";
        if (statusOutput)
          statusOutput.textContent = `✅ Successfully updated prices\nFile: ${result.fileName}`;

        console.log("🔄 Refreshing data after successful price update...");
        await app.loadPortfolioData();
        await app.checkDataAvailability();
        await window.IPCCommunication.Price.checkPriceUpdateStatus(app);

        setTimeout(() => {
          window.UIStateManager.Modals.closeAllModals(app);
        }, 2000);
      } else {
        throw new Error(result.error || "Price update failed");
      }
    } catch (error) {
      console.error("❌ Price update error:", error);

      // SAFE: Handle error case
      const progressBar =
        app.updateProgressBar || document.getElementById("updateProgressBar");
      const progressText =
        app.updateProgressText || document.getElementById("updateProgressText");
      const statusOutput =
        app.updateStatusOutput || document.getElementById("updateStatusOutput");

      if (progressBar) progressBar.style.width = "0%";
      if (progressText) progressText.textContent = "Update Failed";
      if (statusOutput) statusOutput.textContent = `❌ Error: ${error.message}`;

      setTimeout(() => {
        window.UIStateManager.Modals.closeAllModals(app);
      }, 3000);
    } finally {
      app.isScrapingInProgress = false;
    }
  }
  /**
   * Confirm and execute sale transaction
   * MIGRATED FROM: renderer.js confirmSale() method
   * @param {Object} app - Application instance
   */
  // FIX for confirmSale in app-helpers.js
  // Replace the existing confirmSale function with this:

  async confirmSale(app) {
    console.log("🐛 DEBUG: confirmSale called with app:", app);

    if (!app || !app.currentSellEntry) {
      console.log("🐛 DEBUG: No app or currentSellEntry found");
      return;
    }

    try {
      const quantityToSell = parseInt(
        document.getElementById("quantityToSell").value
      );
      const salePrice = parseFloat(document.getElementById("salePrice").value);
      const notes = document.getElementById("saleNotes").value || null;

      // Get the sale date from the new date field
      const saleDateInput = document.getElementById("saleDate");
      const saleDate = saleDateInput
        ? saleDateInput.value
        : new Date().toISOString().split("T")[0];

      console.log("🐛 DEBUG: Sale data:", {
        quantityToSell,
        salePrice,
        saleDate,
        notes,
      });

      // Validation
      if (
        !quantityToSell ||
        !salePrice ||
        quantityToSell <= 0 ||
        salePrice <= 0
      ) {
        alert("Please enter valid quantity and sale price");
        return;
      }

      if (quantityToSell > app.currentSellEntry.quantity_remaining) {
        alert("Cannot sell more options than available");
        return;
      }

      if (!saleDate) {
        alert("Please enter a valid sale date");
        return;
      }

      console.log("🐛 DEBUG: About to call record-sale-transaction");

      // Record the sale transaction
      const result = await window.ipcRenderer.invoke(
        "record-sale-transaction",
        app.currentSellEntry.id, // portfolioEntryId
        saleDate, // saleDate (now from user input)
        quantityToSell, // quantitySold
        salePrice, // salePrice
        notes // notes
      );

      console.log("🐛 DEBUG: IPC result:", result);

      if (result.error) {
        alert("Error recording sale: " + result.error);
        return;
      }

      console.log("✅ Sale recorded successfully:", result);

      // Show success notification instead of alert
      window.UIStateManager.showSuccess(
        `Sale recorded: ${quantityToSell.toLocaleString()} options at ${window.FormatHelpers.formatCurrencyValue(salePrice)} each`,
        5000
      );

      // Close modal and refresh data
      app.closeModals();
      await app.loadPortfolioData();

      // Refresh the current tab data instead of refreshAllTabs
      if (app.activeTab === "portfolio") {
        // Already refreshed with loadPortfolioData
      } else if (app.activeTab === "evolution") {
        await app.loadEvolutionData();
      } else if (app.activeTab === "chart") {
        await app.loadChartData();
      } else if (app.activeTab === "sales-history") {
        await app.loadSalesHistory();
      } else if (app.activeTab === "grant-history") {
        await app.loadGrantHistory();
      }

      // Clear current sell entry
      app.currentSellEntry = null;
    } catch (error) {
      console.error("❌ Error confirming sale:", error);
      alert("Error recording sale: " + error.message);
    }
  }
  async loadPortfolioData() {
    return await window.DataLoader.loadPortfolioData.call(this);
  }

  async loadEvolutionData(days = "all") {
    return await window.DataLoader.loadEvolutionData.call(this, days);
  }

  async loadChartData(period = "all") {
    return await window.DataLoader.loadChartData.call(this, period);
  }

}

// Export to global scope for use in renderer.js
window.AppHelpers = AppHelpers;

// Also support module.exports for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = AppHelpers;
}
