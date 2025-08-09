/**
 * ===== CHART & VISUALIZATION UTILITIES =====
 * Clean rewrite with consistent event line handling
 * All event lines stop at data points as solid thin lines
 */

window.ChartUtils = {
  /**
   * Check if Chart.js library is available
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
   */
  displayChartError(containerId, title, message, details = "", buttonText = "Retry", buttonAction = "") {
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) return;

    const detailsHtml = details ? `<p style="color: #dc3545; font-style: italic; margin-bottom: 20px;">${details}</p>` : "";
    const buttonHtml = buttonAction ? `<button onclick="${buttonAction}" style="background: #007acc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">${buttonText}</button>` : "";

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
   */
  displayNoDataMessage(containerId) {
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) return;

    chartContainer.innerHTML = `
      <div class="no-data-message">
        <p>📈 No Chart Data Available</p>
      </div>
    `;
  },

  /**
   * Process and sort evolution data with smart sampling
   */
  procesEvolutionData(evolutionData) {
    if (!evolutionData || !Array.isArray(evolutionData)) {
      return [];
    }

    const sortedData = [...evolutionData].sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));

    // Return all data without sampling to preserve all data points
    console.log(`📊 Processing ${sortedData.length} evolution entries (no sampling)`);
    return sortedData;
  },

  /**
   * Apply smart sampling to evolution data
   */
  applySampling(sortedData) {
    const sampledData = [];
    const significantEvents = new Set();
    
    // Always include entries with events
    sortedData.forEach(entry => {
      if (entry.notes && entry.notes.trim() !== '') {
        sampledData.push(entry);
        significantEvents.add(entry.snapshot_date);
      }
    });
    
    // Sample regular data points
    const totalPoints = sortedData.length;
    const maxDisplayPoints = 150;
    const samplingInterval = Math.max(1, Math.floor(totalPoints / maxDisplayPoints));
    
    for (let i = 0; i < totalPoints; i += samplingInterval) {
      const entry = sortedData[i];
      if (!significantEvents.has(entry.snapshot_date)) {
        sampledData.push(entry);
      }
    }
    
    // Always include first and last entries
    if (sortedData.length > 0) {
      const firstEntry = sortedData[0];
      const lastEntry = sortedData[sortedData.length - 1];
      
      if (!significantEvents.has(firstEntry.snapshot_date)) {
        sampledData.unshift(firstEntry);
      }
      if (!significantEvents.has(lastEntry.snapshot_date)) {
        sampledData.push(lastEntry);
      }
    }
    
    // Remove duplicates and sort
    const uniqueSampledData = sampledData
      .filter((entry, index, arr) => arr.findIndex(e => e.snapshot_date === entry.snapshot_date) === index)
      .sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));
    
    console.log(`✅ Sampled ${sortedData.length} points down to ${uniqueSampledData.length} points`);
    return uniqueSampledData;
  },

  /**
   * Calculate Y-axis range for chart
   */
  calculateYAxisRange(portfolioValues) {
    if (!portfolioValues || portfolioValues.length === 0) {
      return { yAxisMin: 0, yAxisMax: 10000, buffer: 1000 };
    }

    const minValue = Math.min(...portfolioValues);
    const maxValue = Math.max(...portfolioValues);
    const yAxisMin = Math.max(0, Math.floor((minValue - 5000) / 5000) * 5000);
    const yAxisMax = Math.ceil(maxValue / 5000) * 5000;

    return { yAxisMin, yAxisMax, buffer: 1000 };
  },

  /**
   * Process portfolio events and group by date
   */
  processPortfolioEvents(evolutionData, portfolioEvents = [], period = "all") {
    const eventsByDate = {};

    evolutionData.forEach((evolutionEntry) => {
      const notes = evolutionEntry.notes || "";
      const eventDate = new Date(evolutionEntry.snapshot_date).toLocaleDateString();

      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = { grants: 0, sales: 0, deletions: 0 };
      }

      // Count grants received
      const grantMatches = notes.match(/Grant received: (\d+) options/g);
      if (grantMatches) {
        grantMatches.forEach((match) => {
          const quantity = parseInt(match.match(/(\d+)/)[1]);
          eventsByDate[eventDate].grants += quantity;
        });
      }

      // Count sales (handle both "Sale:" and "Sales:")
      const saleMatches = notes.match(/Sales?: (\d+) options/g);
      if (saleMatches) {
        saleMatches.forEach((match) => {
          const quantity = parseInt(match.match(/(\d+)/)[1]);
          eventsByDate[eventDate].sales += quantity;
        });
      }

      // Count deletions
      const deletionMatches = notes.match(/Grant deleted: (\d+) options/g);
      if (deletionMatches) {
        deletionMatches.forEach((match) => {
          const quantity = parseInt(match.match(/(\d+)/)[1]);
          eventsByDate[eventDate].deletions += quantity;
        });
      }

      // Legacy deletion format
      if (notes.includes("Entry deleted")) {
        eventsByDate[eventDate].deletions += 1;
      }
    });

    return eventsByDate;
  },

  /**
   * Create chart annotations - ALL lines stop at data points using array indices
   */
  createChartAnnotations(eventsByDate, sortedEvolutionData = []) {
    const annotations = {};
    let annotationIndex = 0;

    console.log(`🔍 Chart annotations: ${Object.keys(eventsByDate).length} event dates, ${sortedEvolutionData.length} data points`);
    if (sortedEvolutionData.length > 0) {
      console.log(`🔍 Sample evolution data:`, sortedEvolutionData[0]);
    }

    Object.entries(eventsByDate).forEach(([date, events]) => {
      const { grants, sales, deletions } = events;

      if (grants > 0 || sales > 0 || deletions > 0) {

        // Find the data point index and portfolio value
        let portfolioValue = 0;
        let dataPointIndex = -1;
        
        // Fast date matching with minimal parsing
        let eventDateObj;
        if (date.includes('/')) {
          const parts = date.split('/');
          eventDateObj = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`);
        } else if (date.includes('-')) {
          const parts = date.split('-');
          eventDateObj = parts[0].length <= 2 
            ? new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`)
            : new Date(date);
        }
        
        const eventDateStr = eventDateObj.toISOString().split('T')[0];
        
        // Fast index lookup
        dataPointIndex = sortedEvolutionData.findIndex(entry => {
          return new Date(entry.snapshot_date).toISOString().split('T')[0] === eventDateStr;
        });
        
        if (dataPointIndex >= 0) {
          portfolioValue = sortedEvolutionData[dataPointIndex].total_portfolio_value || 0;
          console.log(`✅ Found match: ${date} -> €${portfolioValue}`);
        } else {
          console.log(`❌ No match for ${date}. Event date: ${eventDateStr}`);
          if (sortedEvolutionData.length > 0) {
            console.log(`Available dates: ${sortedEvolutionData.slice(0,3).map(e => new Date(e.snapshot_date).toISOString().split('T')[0]).join(', ')}`);
          }
        }

        // Determine event color and label
        let borderColor = "#28a745";
        let label = "";

        if (deletions > 0) {
          borderColor = "#dc3545";
          label = `🗑️ ${deletions} deleted`;
        } else if (sales > 0) {
          borderColor = "#ffc107";
          label = `📉 ${sales} sold`;
        } else if (grants > 0) {
          borderColor = "#28a745";
          label = `📈 ${grants} granted`;
        }

        // Mixed events
        const eventCount = (grants > 0 ? 1 : 0) + (sales > 0 ? 1 : 0) + (deletions > 0 ? 1 : 0);
        if (eventCount > 1) {
          borderColor = "#000000";
          const eventParts = [];
          if (grants > 0) eventParts.push(`📈 ${grants} granted`);
          if (sales > 0) eventParts.push(`📉 ${sales} sold`);
          if (deletions > 0) eventParts.push(`🗑️ ${deletions} deleted`);
          label = eventParts.join(", ");
        }

        // Create vertical line using array index (more reliable)
        if (dataPointIndex >= 0 && portfolioValue > 0) {
          annotations[`event_${annotationIndex}`] = {
            type: "line",
            xMin: dataPointIndex,
            xMax: dataPointIndex,
            yMin: 0,
            yMax: portfolioValue,
            borderColor: borderColor,
            borderWidth: 2,
            label: {
              enabled: true,
              content: label,
              position: "top",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: borderColor,
              borderColor: borderColor,
              borderWidth: 1,
              borderRadius: 4,
              padding: 4,
              font: {
                size: 10,
                weight: "bold",
              },
              yAdjust: -10,
            },
          };
        } else {
          // Simplified fallback - just use vertical line mode
          annotations[`event_${annotationIndex}`] = {
            type: "line",
            mode: "vertical",
            scaleID: "x",
            value: date,
            borderColor: borderColor,
            borderWidth: 2,
            label: {
              enabled: true,
              content: label,
              position: "top",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: borderColor,
              borderColor: borderColor,
              borderWidth: 1,
              borderRadius: 4,
              padding: 4,
              font: {
                size: 10,
                weight: "bold",
              },
              yAdjust: -10,
            },
          };
        }

        annotationIndex++;
      }
    });

    return annotations;
  },

  /**
   * Create complete Chart.js configuration
   */
  createChartConfig(sortedEvolutionData, annotations, yAxisConfig, period = "all", eventsByDate = {}) {
    return {
      type: "line",
      data: {
        labels: sortedEvolutionData.map((e) => new Date(e.snapshot_date).toLocaleDateString()),
        datasets: [{
          label: "Portfolio Value",
          data: sortedEvolutionData.map((e) => e.total_portfolio_value || 0),
          borderColor: "#007acc",
          backgroundColor: "rgba(0, 122, 204, 0.1)",
          tension: 0.1,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#007acc",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Disable all animations for faster rendering
        interaction: {
          intersect: false,
          mode: 'index'
        },
        // Remove parsing optimizations that might hide the line
        layout: {
          padding: { top: 50, right: 30, bottom: 30, left: 30 },
        },
        plugins: {
          title: {
            display: true,
            text: `Portfolio Value Evolution${period !== "all" ? ` (${period} days)` : ""}`,
            font: { size: 18, weight: "bold" },
            padding: { bottom: 20 },
          },
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            animation: false, // Disable tooltip animations
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "#fff",
            titleFont: { size: 14, weight: "bold" },
            bodyColor: "#fff",
            bodyFont: { size: 12 },
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: (tooltipItems) => tooltipItems.length > 0 ? `Date: ${tooltipItems[0].label}` : "",
              label: (context) => `Portfolio Value: €${context.parsed.y.toLocaleString()}`,
              afterBody: (tooltipItems) => {
                if (tooltipItems.length > 0) {
                  const date = tooltipItems[0].label;
                  const events = eventsByDate[date];
                  if (events && (events.grants > 0 || events.sales > 0 || events.deletions > 0)) {
                    const eventLines = [];
                    if (events.grants > 0) eventLines.push(`📈 Added: ${events.grants}`);
                    if (events.sales > 0) eventLines.push(`📉 Sold: ${events.sales}`);
                    if (events.deletions > 0) eventLines.push(`🗑️ Deleted: ${events.deletions}`);
                    return ["", "Events:", ...eventLines];
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
            min: yAxisConfig.yAxisMin,
            max: yAxisConfig.yAxisMax,
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              callback: (value) => "€" + value.toLocaleString(),
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
   */
  createChart(canvasId, chartConfig) {
    const chartCanvas = document.getElementById(canvasId);
    if (!chartCanvas) {
      console.error("❌ Chart canvas element not found!");
      return null;
    }

    const ctx = chartCanvas.getContext("2d");
    this.destroyExistingChart(ctx);

    try {
      const chart = new Chart(ctx, chartConfig);
      console.log(`✅ Chart created successfully with ${chartConfig.data.labels.length} data points`);
      return chart;
    } catch (error) {
      console.error("❌ Error creating chart:", error);
      return null;
    }
  },

  /**
   * Update active period button styling
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

  /**
   * Create simple chart legend
   */
  createSimpleChartLegend() {
    const legendContainer = document.querySelector(".chart-legend");
    if (legendContainer) {
      legendContainer.innerHTML = `
        <div class="legend-item">
          <span class="legend-color" style="background-color: #007acc;"></span>
          <span>Portfolio Value</span>
        </div>
        <div class="legend-item">
          <span class="legend-line"></span>
          <span>Events</span>
        </div>
      `;
    }
  },
};

console.log("✅ Chart visualization utilities loaded (clean rewrite)");