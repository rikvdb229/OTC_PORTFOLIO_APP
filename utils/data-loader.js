async function loadPortfolioData() {
  try {
    console.log("📊 Loading portfolio data...");

    // FIRST: Get the overview
    const overview = await window.IPCCommunication.Portfolio.getOverview();

    // THEN: Use overview
    const app = this.app || this;
    app.portfolioData = overview;
    const targetPercentage =
      (await window.IPCCommunication.Settings.getSetting(
        "target_percentage"
      )) || 65;

    // Update UI components - use app instead of this.app
    window.StatsManager.updatePortfolioStats(
      app,
      overview,
      parseFloat(targetPercentage)
    );

    // ADD THIS LINE - update the actual table:
    app.updatePortfolioTable(overview, parseFloat(targetPercentage));

    window.ActionButtonManager.updateActionButtons(app, overview.length > 0);
    window.StatsManager.updateHeaderStats(app, overview);

    console.log("✅ Portfolio data loaded successfully");
  } catch (_error) {    console.error("❌ Error loading portfolio data:", error);
    // Initialize empty data on error
    const app = this.app || this;
    app.portfolioData = [];
  }
}
async function loadEvolutionData(days = "all") {
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
  } catch (_error) {    console.error("❌ Error loading evolution data:", error);
    // Initialize empty data on error
    this.app.evolutionData = [];
  }
}
async function loadChartData(period = "all") {
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
    const yAxisConfig = window.ChartUtils.calculateYAxisRange(portfolioValues);

    // Process events and create annotations
    const eventsByDate = window.ChartUtils.processPortfolioEvents(
      sortedEvolutionData,
      portfolioEvents,
      period
    );
    const annotations = window.ChartUtils.createChartAnnotations(eventsByDate);

    // Create and render chart
    const chartConfig = window.ChartUtils.createChartConfig(
      sortedEvolutionData,
      annotations,
      yAxisConfig,
      period,
      eventsByDate
    );

    const chart = window.ChartUtils.createChart("portfolioChart", chartConfig);

    if (chart) {
      console.log(
        `✅ Chart created successfully with ${sortedEvolutionData.length} data points`
      );

      // Add simple custom legend below the chart
      this.createSimpleChartLegend();
    }

    console.log("✅ Chart data loaded successfully");
  } catch (_error) {    console.error("❌ Error in loadChartData:", error);
  }
}
confirm;
async function updateTax(app) {
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
  } catch (_error) {    console.error("Error updating tax:", error);
    alert("Error updating tax amount");
  }
}
// Export at the bottom
window.DataLoader = {
  loadPortfolioData,
  loadEvolutionData,
  loadChartData,
  confirmEditSale,
  updateTax,
};
