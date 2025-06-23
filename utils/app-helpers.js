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
}

// Export to global scope for use in renderer.js
window.AppHelpers = AppHelpers;

// Also support module.exports for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = AppHelpers;
}
