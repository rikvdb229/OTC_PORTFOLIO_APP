const StatsManager = {
  /**
   * Update portfolio statistics using business logic
   * @param {Object} app - Application instance
   * @param {Array} overview - Portfolio overview data
   */
  async updatePortfolioStats(app, overview, targetPercentage = 65) {
    if (!app) {
      console.error("App instance not available for updatePortfolioStats");
      return;
    }

    // Use extracted business logic
    const stats = window.PortfolioCalculations.generatePortfolioStats(overview);
    const indicators =
      window.PortfolioCalculations.getPortfolioStatusIndicators(
        stats,
        targetPercentage
      );

    // Update main stats using direct DOM access
    const totalPortfolioValueEl = document.getElementById(
      "totalPortfolioValue"
    );
    if (totalPortfolioValueEl && app.formatCurrency) {
      totalPortfolioValueEl.textContent = app.formatCurrency(stats.totalValue);
    }

    const totalOptionsEl = document.getElementById("totalOptions");
    if (totalOptionsEl) {
      totalOptionsEl.textContent = stats.totalQuantityFormatted;
    }

    // Update target achievement element
    const targetAchievementElement = document.getElementById(
      "totalReturnPercentage"
    );
    if (targetAchievementElement) {
      targetAchievementElement.textContent = stats.avgReturnFormatted;
      targetAchievementElement.className = `stat-value ${indicators.returnClass}`;
    }

    // Update last price update
    const lastUpdateEl = document.getElementById("lastPriceUpdate");
    if (lastUpdateEl) {
      lastUpdateEl.textContent = stats.latestUpdateFormatted;
    }

    // FIXED: Get actual change from previous portfolio evolution
    try {
      const evolutionData = await EvolutionOperations.getPortfolioEvolution(30); // Get last 30 days
      const portfolioChangeEl = document.getElementById("portfolioChange");

      if (portfolioChangeEl && evolutionData && evolutionData.length >= 2) {
        // Take the first two entries (most recent and second most recent)
        const latestSnapshot = evolutionData[0]; // Most recent snapshot
        const previousSnapshot = evolutionData[1]; // Previous snapshot

        // Calculate change between these two snapshots
        const changeFromPrevious =
          latestSnapshot.total_portfolio_value -
          previousSnapshot.total_portfolio_value;

        if (changeFromPrevious !== 0) {
          // Format and display the change
          const changeSymbol = changeFromPrevious >= 0 ? "+" : "";
          const formattedChange = app.helpers
            ? app.helpers.formatCurrency(changeFromPrevious)
            : window.FormatHelpers.formatCurrencyValue(changeFromPrevious, "€");

          portfolioChangeEl.textContent = `${changeSymbol}${formattedChange}`;
          portfolioChangeEl.className = `stat-change ${
            changeFromPrevious >= 0 ? "positive" : "negative"
          }`;

          // Optional: Add debug info to console
          console.log("📊 Portfolio Change Calculation:", {
            latest: latestSnapshot.total_portfolio_value,
            previous: previousSnapshot.total_portfolio_value,
            change: changeFromPrevious,
            latestDate: latestSnapshot.snapshot_date,
            previousDate: previousSnapshot.snapshot_date,
            latestNotes: latestSnapshot.notes,
            previousNotes: previousSnapshot.notes,
          });
        } else {
          // No change between snapshots
          const formattedZero = app.helpers
            ? app.helpers.formatCurrency(0)
            : "€0.00";
          portfolioChangeEl.textContent = formattedZero;
          portfolioChangeEl.className = "stat-change";
        }
      } else if (evolutionData && evolutionData.length === 1) {
        // Only one snapshot exists - show as no change
        portfolioChangeEl.textContent = "€0.00";
        portfolioChangeEl.className = "stat-change";
        console.log("📊 Only one portfolio snapshot exists - showing €0.00");
      } else {
        // No evolution data available
        portfolioChangeEl.textContent = "---";
        portfolioChangeEl.className = "stat-change";
        console.log("📊 No portfolio evolution data available");
      }
    } catch (error) {
      console.log("Could not get portfolio change data:", error);
      const portfolioChangeEl = document.getElementById("portfolioChange");
      if (portfolioChangeEl) {
        portfolioChangeEl.textContent = "---";
        portfolioChangeEl.className = "stat-change";
      }
    }

    console.log("📊 Portfolio stats updated:", {
      totalValue: stats.totalValue,
      totalQuantity: stats.totalQuantity,
      avgReturn: stats.avgReturn,
    });
  },
  /**
   * Update header statistics display
   * @param {Object} app - Application instance
   * @param {Array} overview - Portfolio overview data
   */
  updateHeaderStats(app, overview) {
    const stats = window.PortfolioCalculations.generatePortfolioStats(overview);

    // Update header values using calculated stats
    const headerTotalValue = document.getElementById("totalPortfolioValue");
    const headerSellableValue = document.getElementById("totalSellableValue");
    const headerActiveOptions = document.getElementById("totalOptions");
    const headerLastUpdate = document.getElementById("lastPriceUpdate");

    if (headerTotalValue) {
      headerTotalValue.textContent = app.helpers.formatCurrency(
        stats.totalValue
      );
    }
    if (headerSellableValue) {
      headerSellableValue.textContent = app.helpers.formatCurrency(
        stats.totalSellableValue
      );
    }
    if (headerActiveOptions) {
      headerActiveOptions.textContent = stats.totalQuantityFormatted;
    }
    if (headerLastUpdate) {
      headerLastUpdate.textContent = stats.latestUpdateFormatted;
    }
  },
};
window.StatsManager = StatsManager;
