/**
 * ===== CHART & VISUALIZATION UTILITIES =====
 * Extracted chart functions from renderer.js for better organization
 * Handles Chart.js visualization, annotations, and chart data processing
 *
 * USAGE: Call window.ChartUtils methods from renderer.js
 */

window.ChartUtils = {
  /**
   * Check if Chart.js library is available
   * @returns {boolean} True if Chart.js is loaded
   */
  isChartLibraryAvailable() {
    if (typeof Chart === "undefined") {
      console.error("❌ Chart.js library not loaded!");
      return false;
    }
    return true;
  },

  /**
   * Display error message in chart container
   * @param {string} containerId - Chart container element ID
   * @param {string} title - Error title
   * @param {string} message - Error message
   * @param {string} details - Error details (optional)
   * @param {string} buttonText - Button text (optional)
   * @param {string} buttonAction - Button onclick action (optional)
   */
  displayChartError(
    containerId,
    title,
    message,
    details = "",
    buttonText = "Retry",
    buttonAction = ""
  ) {
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) return;

    const detailsHtml = details
      ? `<p style="color: #dc3545; font-style: italic; margin-bottom: 20px;">${details}</p>`
      : "";
    const buttonHtml = buttonAction
      ? `<button onclick="${buttonAction}" style="background: #007acc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">${buttonText}</button>`
      : "";

    chartContainer.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #dc3545; font-size: 18px; margin-bottom: 10px;">${title}</p>
        <p style="color: #666; margin-bottom: 10px;">${message}</p>
        ${detailsHtml}
        ${buttonHtml}
      </div>
    `;
  },

  /**
   * Display no data message in chart container
   * @param {string} containerId - Chart container element ID
   */
  displayNoDataMessage(containerId) {
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) return;

    chartContainer.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #666; font-size: 18px; margin-bottom: 10px;">📈 No Chart Data Available</p>
        <div style="text-align: left; display: inline-block; margin: 20px 0;">
          <p style="margin-bottom: 15px;">To see your portfolio chart, you need:</p>
          <ul style="color: #666; line-height: 1.6;">
            <li>✅ Add at least one grant/option to your portfolio</li>
            <li>✅ Update prices to get current values</li>
            <li>✅ Evolution data will be created automatically</li>
          </ul>
        </div>
        <button onclick="portfolioApp.switchTab('portfolio')" style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Go to Portfolio</button>
      </div>
    `;
  },

  /**
   * Process and sort evolution data for charting
   * @param {Array} evolutionData - Raw evolution data
   * @returns {Array} Sorted evolution data
   */
  procesEvolutionData(evolutionData) {
    if (!evolutionData || !Array.isArray(evolutionData)) {
      return [];
    }

    // Sort chronologically (oldest to newest)
    return [...evolutionData].sort(
      (a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date)
    );
  },

  /**
   * Calculate Y-axis range for chart
   * @param {Array} portfolioValues - Array of portfolio values
   * @returns {Object} Y-axis configuration
   */
  calculateYAxisRange(portfolioValues) {
    if (!portfolioValues || portfolioValues.length === 0) {
      return { yAxisMax: 10000, buffer: 1000 };
    }

    const maxValue = Math.max(...portfolioValues);
    const minValue = Math.min(...portfolioValues);
    const range = maxValue - Math.min(minValue, 0);
    const buffer = Math.max(range * 0.1, 1000);
    const yAxisMax = maxValue + buffer;

    console.log(`📊 Y-axis range: 0 to €${yAxisMax.toLocaleString()}`);

    return { yAxisMax, buffer, maxValue, minValue };
  },

  /**
   * Process portfolio events and group by date for annotations
   * @param {Array} evolutionData - Evolution data
   * @param {Array} portfolioEvents - Portfolio events
   * @param {string} period - Time period filter
   * @returns {Object} Events grouped by date
   */
  processPortfolioEvents(evolutionData, portfolioEvents = [], period = "all") {
    const eventsByDate = {};

    // Filter events based on period if not 'all'
    let filteredEvents = portfolioEvents;
    if (period !== "all" && Array.isArray(portfolioEvents)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(period));
      filteredEvents = portfolioEvents.filter(
        (event) => new Date(event.date) >= cutoffDate
      );
    }

    // Process evolution entries for grants
    evolutionData.forEach((evolutionEntry) => {
      const notes = evolutionEntry.notes || "";
      const eventDate = new Date(
        evolutionEntry.snapshot_date
      ).toLocaleDateString();

      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = { grants: 0, sales: 0, deletions: 0 };
      }

      // Count grants added
      const grantMatches = notes.match(/Grant added: (\d+) options/g);
      if (grantMatches) {
        grantMatches.forEach((match) => {
          const quantity = parseInt(match.match(/(\d+)/)[1]);
          eventsByDate[eventDate].grants += quantity;
        });
      }

      // Count sales
      const saleMatches = notes.match(/Sale: (\d+) options/g);
      if (saleMatches) {
        saleMatches.forEach((match) => {
          const quantity = parseInt(match.match(/(\d+)/)[1]);
          eventsByDate[eventDate].sales += quantity;
        });
      }

      // Count deletions
      if (notes.includes("Entry deleted")) {
        eventsByDate[eventDate].deletions += 1;
      }
    });

    return eventsByDate;
  },

  /**
   * Create chart annotations from processed events
   * @param {Object} eventsByDate - Events grouped by date
   * @returns {Object} Chart.js annotations configuration
   */
  /**
   * IMPROVED Chart Annotations - Much wider spacing with label positioning
   * Replace the createChartAnnotations function in utils/chart-visualization.js
   */

  /**
   * COMPLETE FIXED createChartAnnotations function
   * Copy this entire function and replace the existing one in utils/chart-visualization.js
   */

  /**
   * SIMPLE SINGLE BLACK LINE EVENT - Just one bold black line per event date
   * Copy this entire function and replace the existing one in utils/chart-visualization.js
   */

  createChartAnnotations(eventsByDate) {
    const annotations = {};
    let annotationIndex = 0;

    Object.entries(eventsByDate).forEach(([date, events]) => {
      const { grants, sales, deletions } = events;

      // Only create annotations for significant events
      if (grants > 0 || sales > 0 || deletions > 0) {
        // Single bold black line to indicate "something happened here"
        annotations[`event_${annotationIndex}`] = {
          type: "line",
          mode: "vertical",
          scaleID: "x",
          value: date,
          borderColor: "#000000", // Black line
          borderWidth: 4, // Bold line
          borderDash: [], // Solid line
        };

        annotationIndex++;
      }
    });

    console.log(
      "📍 Simple black event line annotations prepared:",
      Object.keys(annotations).length
    );
    return annotations;
  },

  /**
   * Create complete Chart.js configuration
   * @param {Array} sortedEvolutionData - Processed evolution data
   * @param {Object} annotations - Chart annotations
   * @param {Object} yAxisConfig - Y-axis configuration
   * @param {string} period - Time period for title
   * @returns {Object} Complete Chart.js configuration
   */
  createChartConfig(
    sortedEvolutionData,
    annotations,
    yAxisConfig,
    period = "all",
    eventsByDate = {}
  ) {
    const { yAxisMax } = yAxisConfig;

    return {
      type: "line",
      data: {
        labels: sortedEvolutionData.map((e) =>
          new Date(e.snapshot_date).toLocaleDateString()
        ),
        datasets: [
          {
            label: "Portfolio Value",
            data: sortedEvolutionData.map((e) => e.total_portfolio_value || 0),
            borderColor: "#007acc",
            backgroundColor: "rgba(0, 122, 204, 0.1)",
            tension: 0.1,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBackgroundColor: "#007acc",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 50,
            right: 30,
            bottom: 30,
            left: 30,
          },
        },
        plugins: {
          title: {
            display: true,
            text: `Portfolio Value Evolution${
              period !== "all" ? ` (${period} days)` : ""
            }`,
            font: { size: 18, weight: "bold" },
            padding: { bottom: 20 },
          },
          legend: {
            display: false, // Disable Chart.js legend completely
          },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "#fff",
            titleFont: { size: 14, weight: "bold" },
            bodyColor: "#fff",
            bodyFont: { size: 12 },
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: function (tooltipItems) {
                if (tooltipItems.length > 0) {
                  return `Date: ${tooltipItems[0].label}`;
                }
                return "";
              },
              label: function (context) {
                const value = context.parsed.y;
                return `Portfolio Value: €${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
              },
              afterBody: function (tooltipItems) {
                if (tooltipItems.length > 0) {
                  const date = tooltipItems[0].label;
                  const events = eventsByDate[date];

                  if (
                    events &&
                    (events.grants > 0 ||
                      events.sales > 0 ||
                      events.deletions > 0)
                  ) {
                    const eventLines = [];

                    if (events.grants > 0) {
                      eventLines.push(`📈 Options Added: ${events.grants}`);
                    }
                    if (events.sales > 0) {
                      eventLines.push(`📉 Options Sold: ${events.sales}`);
                    }
                    if (events.deletions > 0) {
                      eventLines.push(
                        `🗑️ Options Deleted: ${events.deletions}`
                      );
                    }

                    return ["", "Portfolio Events:", ...eventLines];
                  }
                }
                return [];
              },
            },
          },
          annotation: {
            annotations: annotations,
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Date",
              font: { size: 14, weight: "bold" },
            },
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Portfolio Value (€)",
              font: { size: 14, weight: "bold" },
            },
            min: 0,
            max: yAxisMax,
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              callback: function (value) {
                return "€" + value.toLocaleString();
              },
            },
          },
        },
        elements: {
          point: {
            hoverRadius: 8,
          },
        },
      },
    };
  },

  /**
   * Destroy existing chart if it exists
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @returns {boolean} True if chart was destroyed
   */
  destroyExistingChart(ctx) {
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
      console.log("🔄 Destroyed existing chart");
      return true;
    }
    return false;
  },

  /**
   * Create and render chart
   * @param {string} canvasId - Canvas element ID
   * @param {Object} chartConfig - Chart.js configuration
   * @returns {Chart|null} Created chart instance or null if failed
   */
  createChart(canvasId, chartConfig) {
    const chartCanvas = document.getElementById(canvasId);
    if (!chartCanvas) {
      console.error("❌ Chart canvas element not found!");
      return null;
    }

    const ctx = chartCanvas.getContext("2d");

    // Destroy existing chart
    this.destroyExistingChart(ctx);

    try {
      const chart = new Chart(ctx, chartConfig);
      console.log(
        `✅ Chart created successfully with ${chartConfig.data.labels.length} data points`
      );
      return chart;
    } catch (error) {
      console.error("❌ Error creating chart:", error);
      return null;
    }
  },

  /**
   * Update active period button styling
   * @param {string} period - Active period
   * @param {string} containerSelector - Container selector for buttons
   */
  updatePeriodButtons(period, containerSelector = ".chart-controls") {
    document.querySelectorAll(`${containerSelector} .btn`).forEach((btn) => {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-secondary");
    });

    const activeBtn = document.querySelector(`[data-period="${period}"]`);
    if (activeBtn) {
      activeBtn.classList.remove("btn-secondary");
      activeBtn.classList.add("btn-primary");
    }
  },
};

console.log("✅ Chart visualization utilities loaded");
