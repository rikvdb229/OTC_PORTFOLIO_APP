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
    this.app = app;
    this.updateTimer = null;
    this.pollingTimer = null;
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
      // 2025
      "2025-01-01", // New Year's Day
      "2025-04-18", // Good Friday
      "2025-04-21", // Easter Monday
      "2025-05-01", // Labour Day
      "2025-05-29", // Ascension Day
      "2025-06-09", // Whit Monday
      "2025-07-21", // Belgian National Day
      "2025-08-15", // Assumption Day
      "2025-11-01", // All Saints Day
      "2025-11-11", // Armistice Day
      "2025-12-25", // Christmas Day
      "2025-12-26", // Boxing Day

      // 2026
      "2026-01-01", // New Year's Day
      "2026-04-03", // Good Friday
      "2026-04-06", // Easter Monday
      "2026-05-01", // Labour Day
      "2026-05-14", // Ascension Day
      "2026-05-25", // Whit Monday
      "2026-07-21", // Belgian National Day
      "2026-08-15", // Assumption Day
      "2026-11-01", // All Saints Day
      "2026-11-11", // Armistice Day
      "2026-12-25", // Christmas Day
      "2026-12-26", // Boxing Day

      // 2027
      "2027-01-01", // New Year's Day
      "2027-03-26", // Good Friday
      "2027-03-29", // Easter Monday
      "2027-05-01", // Labour Day
      "2027-05-06", // Ascension Day
      "2027-05-17", // Whit Monday
      "2027-07-21", // Belgian National Day
      "2027-08-15", // Assumption Day
      "2027-11-01", // All Saints Day
      "2027-11-11", // Armistice Day
      "2027-12-25", // Christmas Day
      "2027-12-26", // Boxing Day

      // 2028
      "2028-01-01", // New Year's Day
      "2028-04-14", // Good Friday
      "2028-04-17", // Easter Monday
      "2028-05-01", // Labour Day
      "2028-05-25", // Ascension Day
      "2028-06-05", // Whit Monday
      "2028-07-21", // Belgian National Day
      "2028-08-15", // Assumption Day
      "2028-11-01", // All Saints Day
      "2028-11-11", // Armistice Day
      "2028-12-25", // Christmas Day
      "2028-12-26", // Boxing Day

      // 2029
      "2029-01-01", // New Year's Day
      "2029-03-30", // Good Friday
      "2029-04-02", // Easter Monday
      "2029-05-01", // Labour Day
      "2029-05-10", // Ascension Day
      "2029-05-21", // Whit Monday
      "2029-07-21", // Belgian National Day
      "2029-08-15", // Assumption Day
      "2029-11-01", // All Saints Day
      "2029-11-11", // Armistice Day
      "2029-12-25", // Christmas Day
      "2029-12-26", // Boxing Day

      // 2030
      "2030-01-01", // New Year's Day
      "2030-04-19", // Good Friday
      "2030-04-22", // Easter Monday
      "2030-05-01", // Labour Day
      "2030-05-30", // Ascension Day
      "2030-06-10", // Whit Monday
      "2030-07-21", // Belgian National Day
      "2030-08-15", // Assumption Day
      "2030-11-01", // All Saints Day
      "2030-11-11", // Armistice Day
      "2030-12-25", // Christmas Day
      "2030-12-26", // Boxing Day

      // 2031
      "2031-01-01", // New Year's Day
      "2031-04-11", // Good Friday
      "2031-04-14", // Easter Monday
      "2031-05-01", // Labour Day
      "2031-05-22", // Ascension Day
      "2031-06-02", // Whit Monday
      "2031-07-21", // Belgian National Day
      "2031-08-15", // Assumption Day
      "2031-11-01", // All Saints Day
      "2031-11-11", // Armistice Day
      "2031-12-25", // Christmas Day
      "2031-12-26", // Boxing Day

      // 2032
      "2032-01-01", // New Year's Day
      "2032-03-26", // Good Friday
      "2032-03-29", // Easter Monday
      "2032-05-01", // Labour Day
      "2032-05-06", // Ascension Day
      "2032-05-17", // Whit Monday
      "2032-07-21", // Belgian National Day
      "2032-08-15", // Assumption Day
      "2032-11-01", // All Saints Day
      "2032-11-11", // Armistice Day
      "2032-12-25", // Christmas Day
      "2032-12-26", // Boxing Day

      // 2033
      "2033-01-01", // New Year's Day
      "2033-04-15", // Good Friday
      "2033-04-18", // Easter Monday
      "2033-05-01", // Labour Day
      "2033-05-26", // Ascension Day
      "2033-06-06", // Whit Monday
      "2033-07-21", // Belgian National Day
      "2033-08-15", // Assumption Day
      "2033-11-01", // All Saints Day
      "2033-11-11", // Armistice Day
      "2033-12-25", // Christmas Day
      "2033-12-26", // Boxing Day

      // 2034
      "2034-01-01", // New Year's Day
      "2034-04-07", // Good Friday
      "2034-04-10", // Easter Monday
      "2034-05-01", // Labour Day
      "2034-05-18", // Ascension Day
      "2034-05-29", // Whit Monday
      "2034-07-21", // Belgian National Day
      "2034-08-15", // Assumption Day
      "2034-11-01", // All Saints Day
      "2034-11-11", // Armistice Day
      "2034-12-25", // Christmas Day
      "2034-12-26", // Boxing Day

      // 2035
      "2035-01-01", // New Year's Day
      "2035-03-23", // Good Friday
      "2035-03-26", // Easter Monday
      "2035-05-01", // Labour Day
      "2035-05-03", // Ascension Day
      "2035-05-14", // Whit Monday
      "2035-07-21", // Belgian National Day
      "2035-08-15", // Assumption Day
      "2035-11-01", // All Saints Day
      "2035-11-11", // Armistice Day
      "2035-12-25", // Christmas Day
      "2035-12-26", // Boxing Day

      // 2036
      "2036-01-01", // New Year's Day
      "2036-04-11", // Good Friday
      "2036-04-14", // Easter Monday
      "2036-05-01", // Labour Day
      "2036-05-22", // Ascension Day
      "2036-06-02", // Whit Monday
      "2036-07-21", // Belgian National Day
      "2036-08-15", // Assumption Day
      "2036-11-01", // All Saints Day
      "2036-11-11", // Armistice Day
      "2036-12-25", // Christmas Day
      "2036-12-26", // Boxing Day

      // 2037
      "2037-01-01", // New Year's Day
      "2037-04-03", // Good Friday
      "2037-04-06", // Easter Monday
      "2037-05-01", // Labour Day
      "2037-05-14", // Ascension Day
      "2037-05-25", // Whit Monday
      "2037-07-21", // Belgian National Day
      "2037-08-15", // Assumption Day
      "2037-11-01", // All Saints Day
      "2037-11-11", // Armistice Day
      "2037-12-25", // Christmas Day
      "2037-12-26", // Boxing Day

      // 2038
      "2038-01-01", // New Year's Day
      "2038-04-23", // Good Friday
      "2038-04-26", // Easter Monday
      "2038-05-01", // Labour Day
      "2038-06-03", // Ascension Day
      "2038-06-14", // Whit Monday
      "2038-07-21", // Belgian National Day
      "2038-08-15", // Assumption Day
      "2038-11-01", // All Saints Day
      "2038-11-11", // Armistice Day
      "2038-12-25", // Christmas Day
      "2038-12-26", // Boxing Day

      // 2039
      "2039-01-01", // New Year's Day
      "2039-04-08", // Good Friday
      "2039-04-11", // Easter Monday
      "2039-05-01", // Labour Day
      "2039-05-19", // Ascension Day
      "2039-05-30", // Whit Monday
      "2039-07-21", // Belgian National Day
      "2039-08-15", // Assumption Day
      "2039-11-01", // All Saints Day
      "2039-11-11", // Armistice Day
      "2039-12-25", // Christmas Day
      "2039-12-26", // Boxing Day

      // 2040
      "2040-01-01", // New Year's Day
      "2040-03-30", // Good Friday
      "2040-04-02", // Easter Monday
      "2040-05-01", // Labour Day
      "2040-05-10", // Ascension Day
      "2040-05-21", // Whit Monday
      "2040-07-21", // Belgian National Day
      "2040-08-15", // Assumption Day
      "2040-11-01", // All Saints Day
      "2040-11-11", // Armistice Day
      "2040-12-25", // Christmas Day
      "2040-12-26"  // Boxing Day
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
  minutesUntil902AM(hour, minute) {
    if (hour >= 9) return 0;
    const minutesUntil9 = (9 - hour) * 60 - minute;
    return minutesUntil9 + 2;
  }

  async checkAutoUpdate() {
    try {
      const hasUpdated = await window.IPCCommunication.Price.hasUpdatedToday();
      if (hasUpdated) {
        this.setButtonState('updated');
        return;
      }

      let time;

      try {
        time = await window.IPCCommunication.Price.getBelgianTime();
      } catch (error) {
        console.warn('⚠️ Cannot verify time, assuming after 09:00');
        time = { isAfter9AM: true, hour: 9, minute: 0 };
      }

      if (time.isAfter9AM) {
        this.setButtonState('ready');

        const autoUpdate = await window.IPCCommunication.Settings.getSetting("auto_update_prices");
        if (autoUpdate === "true" && this.isBankWorkDay(new Date())) {
          console.log('📊 Triggering immediate auto-update');
          setTimeout(() => this.app.updatePrices(), 2000);
        }
      } else {
        this.setButtonState('waiting');

        const autoUpdate = await window.IPCCommunication.Settings.getSetting("auto_update_prices");
        if (autoUpdate === "true") {
          const minutes = this.minutesUntil902AM(time.hour, time.minute);

          if (minutes < 180) {
            this.scheduleUpdateAt902(minutes);
          } else {
            console.log(`⏰ Update in ${minutes} min (>3h), skipping schedule`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error in checkAutoUpdate:", error);
    }
  }

  scheduleUpdateAt902(minutesUntil) {
    const ms = minutesUntil * 60 * 1000;
    console.log(`⏰ Scheduling update in ${minutesUntil} minutes (at 09:02)`);

    this.updateTimer = setTimeout(async () => {
      console.log('⏰ Scheduled timer fired');
      await this.handleScheduledUpdate();
    }, ms);

    this.pollingTimer = setInterval(async () => {
      console.log('🔄 Polling check');
      await this.checkTimeAndUpdateIfReady();
    }, 10 * 60 * 1000);

    console.log('✅ Timer and polling backup active');
  }

  async checkTimeAndUpdateIfReady() {
    try {
      const time = await window.IPCCommunication.Price.getBelgianTime();
      console.log(`🕐 Poll: ${time.hour}:${String(time.minute).padStart(2, '0')}`);

      if (time.isAfter9AM) {
        console.log('✅ Poll detected time passed, triggering update');
        await this.handleScheduledUpdate();
      }
    } catch (error) {
      console.warn('⚠️ Polling time check failed:', error.message);
    }
  }

  async handleScheduledUpdate() {
    this.cancelAllTimers();

    const hasUpdated = await window.IPCCommunication.Price.hasUpdatedToday();
    if (hasUpdated) {
      this.setButtonState('updated');
      return;
    }

    this.setButtonState('ready');

    const autoUpdate = await window.IPCCommunication.Settings.getSetting("auto_update_prices");
    if (autoUpdate === "true" && this.isBankWorkDay(new Date())) {
      console.log('🚀 Auto-triggering price update');
      setTimeout(() => this.app.updatePrices(), 1000);
    }
  }

  cancelAllTimers() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  setButtonState(state) {
    const button = this.app.updatePricesBtn;
    const notification = document.getElementById('priceUpdateNotification');

    switch(state) {
      case 'updated':
        button.disabled = true;
        button.textContent = "✅ Updated Today";
        button.title = "Next update available tomorrow after 09:00";
        if (notification) notification.style.display = 'none';
        break;

      case 'waiting':
        button.disabled = false;
        button.textContent = "📊 Update Prices";
        button.title = "Prices available after 09:00 Belgian time";
        window.UIStateManager.Notifications.showNotification(
          "priceUpdateNotification",
          "Available after 09:00",
          "info"
        );
        break;

      case 'ready':
        button.disabled = false;
        button.textContent = "📊 Update Prices";
        button.title = "Click to update prices";
        window.UIStateManager.Notifications.showNotification(
          "priceUpdateNotification",
          "New prices available",
          "warning"
        );
        break;
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
  async updatePrices(app, force = false) {
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
      if (progressText) progressText.textContent = force ? "Force updating prices..." : "Starting price update...";
      if (statusOutput)
        statusOutput.textContent = force ? "Bypassing time restrictions..." : "Connecting to KBC servers...";
    });

    try {
      const result = await window.IPCCommunication.Price.updatePrices(force);

      // SAFE: Get elements fresh from DOM
      const progressBar =
        app.updateProgressBar || document.getElementById("updateProgressBar");
      const progressText =
        app.updateProgressText || document.getElementById("updateProgressText");
      const statusOutput =
        app.updateStatusOutput || document.getElementById("updateStatusOutput");

      if (result.success || (result.priceEntriesUpdated && result.priceEntriesUpdated > 0)) {
        if (progressBar) progressBar.style.width = "100%";

        if (result.errors && result.errors.length > 0) {
          if (progressText) progressText.textContent = `Updated ${result.priceEntriesUpdated} grant(s) - ${result.errors.length} failed`;
          if (statusOutput) statusOutput.textContent = `⚠️ ${result.message}`;
          console.warn('⚠️ Some grants failed to update:', result.errors);
        } else {
          if (progressText) progressText.textContent = "Update Complete!";
          if (statusOutput) statusOutput.textContent = "✅ Successfully updated prices";
        }

        console.log("🔄 Refreshing data after price update...");
        await app.loadPortfolioData();
        await app.checkDataAvailability();
        await window.IPCCommunication.Price.checkPriceUpdateStatus(app);

        setTimeout(() => {
          window.UIStateManager.Modals.closeAllModals(app);
        }, 3000);
      } else {
        throw new Error(result.error || result.message || "Price update failed");
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
