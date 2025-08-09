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
  } catch (error) {
    console.error("❌ Error loading portfolio data:", error);
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

    // Calculate and display period stats
    updateEvolutionPeriodStats(evolutionData);

    console.log("✅ Evolution data loaded successfully");
  } catch (error) {
    console.error("❌ Error loading evolution data:", error);
    // Initialize empty data on error
    this.app.evolutionData = [];
  }
}

function updateEvolutionPeriodStats(evolutionData) {
  const gainLossEl = document.getElementById("evolution-gain-loss");
  const changePercentEl = document.getElementById("evolution-change-percent");
  const oldestDateEl = document.getElementById("evolution-oldest-date");
  const statsContainer = document.querySelector(".evolution-period-stats");
  
  if (!gainLossEl || !changePercentEl || !oldestDateEl || !statsContainer) return;
  
  // If no data available, hide the entire stats section
  if (!evolutionData || evolutionData.length < 2) {
    statsContainer.style.display = "none";
    return; // Need at least 2 data points
  }
  
  // Show stats container when data is available
  statsContainer.style.display = "flex";
  
  // Reset to default state
  gainLossEl.textContent = "---";
  changePercentEl.textContent = "---";
  oldestDateEl.textContent = "---";
  gainLossEl.className = "evolution-stat-value";
  changePercentEl.className = "evolution-stat-value";
  
  // Sort by date (newest first - evolutionData is already sorted DESC)
  const sortedData = [...evolutionData].sort((a, b) => 
    new Date(b.snapshot_date) - new Date(a.snapshot_date)
  );
  
  const newestEntry = sortedData[0];
  const oldestEntry = sortedData[sortedData.length - 1];
  
  const newestValue = parseFloat(newestEntry.total_portfolio_value) || 0;
  const oldestValue = parseFloat(oldestEntry.total_portfolio_value) || 0;
  
  if (oldestValue === 0) return; // Prevent division by zero
  
  // Calculate gain/loss and percentage change
  const gainLoss = newestValue - oldestValue;
  const changePercent = ((newestValue - oldestValue) / oldestValue) * 100;
  
  // Format currency using window formatters
  const formattedGainLoss = window.FormatHelpers?.formatCurrencyValue 
    ? window.FormatHelpers.formatCurrencyValue(Math.abs(gainLoss), "€")
    : `€${Math.abs(gainLoss).toFixed(2)}`;
  
  // Format percentage
  const formattedPercent = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
  
  // Apply formatting and colors
  const isPositive = gainLoss >= 0;
  const colorClass = isPositive ? "positive" : "negative";
  const sign = gainLoss >= 0 ? "+" : "-";
  
  // Format oldest date
  const oldestDate = new Date(oldestEntry.snapshot_date);
  const formattedOldestDate = oldestDate.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  gainLossEl.textContent = `${sign}${formattedGainLoss}`;
  changePercentEl.textContent = `(${formattedPercent})`;
  oldestDateEl.textContent = formattedOldestDate;
  
  gainLossEl.className = `evolution-stat-value ${colorClass}`;
  changePercentEl.className = `evolution-stat-value ${colorClass}`;
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
    const annotations = window.ChartUtils.createChartAnnotations(eventsByDate, sortedEvolutionData);

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
      window.ChartUtils.createSimpleChartLegend();
    }

    console.log("✅ Chart data loaded successfully");
  } catch (error) {
    console.error("❌ Error in loadChartData:", error);
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
  } catch (error) {
    console.error("Error updating tax:", error);
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
  updateEvolutionPeriodStats,
};
