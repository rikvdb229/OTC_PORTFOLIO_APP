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
   * Check for auto-update setting and trigger price update if enabled
   * MIGRATED FROM: renderer.js checkAutoUpdate() method
   * RISK LEVEL: LOW - Simple setting check and conditional action
   */
  async checkAutoUpdate() {
    try {
      const autoUpdate =
        await window.IPCCommunication.Settings.getSetting("auto_update_prices");
      if (autoUpdate === "true") {
        setTimeout(() => this.app.updatePrices(), 2000);
      }
    } catch (error) {
      console.error("Error checking auto-update setting:", error);
    }
  }

  // ===== NEWLY ADDED: DATA LOADING FUNCTIONS =====
  // ✅ MIGRATED FROM: renderer.js - Main data loading functions

  /**
   * Load portfolio data and update UI
   * ✅ MIGRATED FROM: renderer.js loadPortfolioData() method
   * @returns {Promise<void>}
   */
  async loadPortfolioData() {
    try {
      console.log("📊 Loading portfolio data...");

      const overview = await window.IPCCommunication.Portfolio.getOverview();

      // Store data in app for sorting
      this.app.portfolioData = overview;

      const targetPercentage =
        (await window.IPCCommunication.Settings.getSetting(
          "target_percentage"
        )) || 65;

      // Update UI components
      this.app.updatePortfolioStats(overview, parseFloat(targetPercentage));
      this.app.updatePortfolioTable(overview, parseFloat(targetPercentage));
      this.app.updateActionButtons(overview.length > 0);
      this.app.updateHeaderStats(overview);

      console.log("✅ Portfolio data loaded successfully");
    } catch (error) {
      console.error("❌ Error loading portfolio data:", error);
      // Initialize empty data on error
      this.app.portfolioData = [];
    }
  }

  /**
   * Load evolution data for specified period
   * ✅ MIGRATED FROM: renderer.js loadEvolutionData() method
   * @param {string} days - Period to load ("all", "30", "7", etc.)
   * @returns {Promise<void>}
   */
  async loadEvolutionData(days = "all") {
    try {
      console.log(`📈 Loading evolution data for: ${days}`);

      // Update active button using ActionButtons manager
      window.UIStateManager.ActionButtons.updateEvolutionButtons(days);

      // Load evolution data from IPC
      const evolutionData =
        await window.IPCCommunication.Evolution.getPortfolioEvolution(
          days === "all" ? null : parseInt(days)
        );

      if (evolutionData.error) {
        console.error("❌ Error loading evolution data:", evolutionData.error);
        return;
      }

      // Store data in app for sorting
      this.app.evolutionData = evolutionData;

      // Use HTML generator to render table
      this.app.htmlGen.renderEvolutionTable(evolutionData);

      console.log("✅ Evolution data loaded successfully");
    } catch (error) {
      console.error("❌ Error loading evolution data:", error);
      // Initialize empty data on error
      this.app.evolutionData = [];
    }
  }

  /**
   * Load chart data for specified period
   * ✅ MIGRATED FROM: renderer.js loadChartData() method
   * @param {string} period - Chart period ("all", "30", "7", etc.)
   * @returns {Promise<void>}
   */
  async loadChartData(period = "all") {
    try {
      console.log(`📊 Loading chart data for period: ${period}`);

      // Update button states
      document.querySelectorAll("#chart-tab-header .btn").forEach((btn) => {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
      });

      const activeBtn = document.querySelector(
        `#chart-tab-header [data-period="${period}"]`
      );
      if (activeBtn) {
        activeBtn.classList.remove("btn-secondary");
        activeBtn.classList.add("btn-primary");
      }

      // Check for required chart utilities
      if (!window.ChartUtils) {
        console.error("❌ ChartUtils not available");
        return;
      }

      // Load portfolio evolution data
      const days = period === "all" ? null : parseInt(period);
      const evolutionData =
        await window.IPCCommunication.Evolution.getPortfolioEvolution(days);

      if (evolutionData && evolutionData.error) {
        console.error("❌ Evolution data error:", evolutionData.error);
        return;
      }

      if (
        !evolutionData ||
        !Array.isArray(evolutionData) ||
        evolutionData.length === 0
      ) {
        window.ChartUtils.displayNoDataMessage("portfolioOverviewChart");
        return;
      }

      // Load portfolio events for annotations
      const portfolioEvents =
        await window.IPCCommunication.Portfolio.getPortfolioEvents();

      // Process data using ChartUtils
      const sortedEvolutionData =
        window.ChartUtils.procesEvolutionData(evolutionData);
      const portfolioValues = sortedEvolutionData.map(
        (e) => e.total_portfolio_value || 0
      );
      const yAxisConfig =
        window.ChartUtils.calculateYAxisRange(portfolioValues);

      // Process events and create annotations
      const eventsByDate = window.ChartUtils.processPortfolioEvents(
        sortedEvolutionData,
        portfolioEvents,
        period
      );
      const annotations =
        window.ChartUtils.createChartAnnotations(eventsByDate);

      // Create and render chart
      const chartConfig = window.ChartUtils.createChartConfig(
        sortedEvolutionData,
        annotations,
        yAxisConfig,
        period,
        eventsByDate
      );

      const chart = window.ChartUtils.createChart(
        "portfolioChart",
        chartConfig
      );

      if (chart) {
        console.log(
          `✅ Chart created successfully with ${sortedEvolutionData.length} data points`
        );

        // Add simple custom legend below the chart
        this.createSimpleChartLegend();
      }

      console.log("✅ Chart data loaded successfully");
    } catch (error) {
      console.error("❌ Error in loadChartData:", error);
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
  calculateSaleProceeds(app) {
    if (!app.currentSellEntry) return;

    const quantityToSell =
      parseInt(document.getElementById("quantityToSell").value) || 0;
    const salePrice =
      parseFloat(document.getElementById("salePrice").value) || 0;

    if (
      quantityToSell > 0 &&
      salePrice > 0 &&
      app.currentSellEntry.quantity > 0
    ) {
      const totalSaleValue = quantityToSell * salePrice;

      // Calculate proportional tax that will be reduced from remaining portfolio
      const totalTax =
        app.currentSellEntry.tax_amount ||
        app.currentSellEntry.tax_auto_calculated ||
        0;
      const taxAllocatedToSold =
        totalTax > 0
          ? (totalTax * quantityToSell) / app.currentSellEntry.quantity
          : 0;

      // Net proceeds = full sale value (tax was already paid when granted)
      const netProceeds = totalSaleValue;

      document.getElementById("totalSaleValue").textContent =
        app.helpers.formatCurrency(totalSaleValue);
      document.getElementById("proportionalTax").textContent =
        app.helpers.formatCurrency(taxAllocatedToSold);
      document.getElementById("netProceeds").textContent =
        app.helpers.formatCurrency(netProceeds);
    } else {
      document.getElementById("totalSaleValue").textContent = "€ 0.00";
      document.getElementById("proportionalTax").textContent = "€ 0.00";
      document.getElementById("netProceeds").textContent = "€ 0.00";
    }
  }
  async updateTax(app) {
    try {
      const newTaxAmount = parseFloat(
        document.getElementById("newTaxAmount").value
      );

      if (isNaN(newTaxAmount) || newTaxAmount < 0) {
        alert("Please enter a valid tax amount");
        return;
      }

      const result = await window.ipcRenderer.invoke(
        "update-tax-amount",
        app.currentEditingTaxId,
        newTaxAmount
      );

      if (result.error) {
        alert("Error updating tax: " + result.error);
        return;
      }

      app.closeModals();
      await app.loadPortfolioData();
      console.log(`✅ Updated tax amount to €${newTaxAmount}`);
    } catch (error) {
      console.error("Error updating tax:", error);
      alert("Error updating tax amount");
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
      if (app.updatePricesBtn) {
        app.updatePricesBtn.disabled = false;
        app.updatePricesBtn.textContent = "🔄 Update Prices";
      }
    }
  }
  /**
   * Confirm and execute sale transaction
   * MIGRATED FROM: renderer.js confirmSale() method
   * @param {Object} app - Application instance
   */
  async confirmSale(app) {
    if (!app.currentSellEntry) return;

    try {
      const quantityToSell = parseInt(
        document.getElementById("quantityToSell").value
      );
      const salePrice = parseFloat(document.getElementById("salePrice").value);
      const notes = document.getElementById("saleNotes").value || null;
      const saleDate = new Date().toISOString().split("T")[0];

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

      // FIXED: Use the correct IPC handler name
      const result = await window.ipcRenderer.invoke(
        "record-sale-transaction", // ✅ CORRECT: matches main.js handler
        app.currentSellEntry.id, // portfolioEntryId
        saleDate, // saleDate
        quantityToSell, // quantitySold
        salePrice, // salePrice
        notes // notes
      );

      if (result.error) {
        alert("Error recording sale: " + result.error);
        return;
      }

      console.log("✅ Sale recorded successfully:", result);

      // Close modal and refresh data
      app.closeModals();
      await app.loadPortfolioData();
      await app.loadSalesHistory();

      // FIXED: Also refresh evolution data like the original function
      await app.loadEvolutionData("all");

      // Show success notification
      window.UIStateManager.showSuccess(
        `✅ Sold ${quantityToSell.toLocaleString()} options at €${salePrice}`
      );
    } catch (error) {
      console.error("Error confirming sale:", error);
      alert("Error confirming sale: " + error.message);
    }
  }
  async confirmEditSale(app) {
    try {
      console.log("💾 Saving sale edits...");

      // Get updated values
      const updatedSale = {
        id: app.currentEditingSaleId,
        sale_date: document.getElementById("editSaleDate").value,
        sale_price: parseFloat(document.getElementById("editSalePrice").value),
        notes: document.getElementById("editSaleNotes").value.trim(),
      };

      // Validate inputs
      if (!updatedSale.sale_date) {
        alert("Please enter a sale date");
        return;
      }

      if (!updatedSale.sale_price || updatedSale.sale_price <= 0) {
        alert("Please enter a valid sale price");
        return;
      }

      // Check if date is not in future
      const saleDate = new Date(updatedSale.sale_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (saleDate > today) {
        alert("Sale date cannot be in the future");
        return;
      }

      console.log("📊 Updating sale with data:", updatedSale);

      // Save to database
      const result = await window.ipcRenderer.invoke(
        "update-sale",
        updatedSale
      );

      if (result.error) {
        alert("Error updating sale: " + result.error);
        return;
      }

      console.log("✅ Sale updated successfully:", result);

      // Close modal first
      app.closeModals();

      // Complete data refresh to ensure all calculations are updated
      console.log("🔄 Refreshing all data after sale update...");

      // 1. Refresh sales table (shows the updated sale)
      await app.loadSalesHistory();
      console.log("✅ Sales history refreshed");

      // 2. Refresh portfolio overview (main table with P&L calculations)
      await app.loadPortfolioData();
      console.log("✅ Portfolio data refreshed");

      // 3. Refresh evolution data (affects portfolio calculations)
      await app.loadEvolutionData("all");
      console.log("✅ Evolution data refreshed");

      // 4. Refresh grant history (if it exists and could be affected)
      if (typeof app.loadGrantHistory === "function") {
        await app.loadGrantHistory();
        console.log("✅ Grant history refreshed");
      }

      console.log("🎉 All data successfully refreshed after sale update");
    } catch (error) {
      console.error("❌ Error updating sale:", error);
      alert("Error updating sale: " + error.message);
    }
  }
}

// Export to global scope for use in renderer.js
window.AppHelpers = AppHelpers;

// Also support module.exports for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = AppHelpers;
}
