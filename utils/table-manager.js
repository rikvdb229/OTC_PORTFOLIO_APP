const TableManager = {
  /**
   * Initialize table sorting state
   * @param {Object} app - Application instance
   */
  initializeSorting(app) {
    app.currentSortColumn = null;
    app.currentSortDirection = "asc";
  },

  /**
   * ENHANCED: Smart table sorting that handles tab detection and data mapping
   * @param {Object} app - Application instance
   * @param {string} column - Column to sort by
   */
  smartSort(app, column) {
    console.log(`🎯 Smart sort requested for column: ${column}`);

    // Determine the active tab and get appropriate data mapping
    const tabInfo = this.getActiveTabInfo(app);
    if (!tabInfo) {
      console.warn("Cannot determine active tab for smart sorting");
      return;
    }

    console.log(`📊 Sorting ${tabInfo.tabName} table by ${column}`);

    // Perform the sort using the tab-specific data and callback
    this.sortTable(app, column, tabInfo.data, tabInfo.updateMethod);
  },

  /**
   * Determine the active tab and return relevant data mapping
   * @param {Object} app - Application instance
   * @returns {Object|null} Tab info with data and update method
   */
  getActiveTabInfo(app) {
    const activeTab = document.querySelector(".nav-tab.active");
    if (!activeTab) {
      console.warn("No active tab found");
      return null;
    }

    const tabText = activeTab.textContent.trim().toLowerCase();
    console.log(`🔍 Active tab detected: ${tabText}`);

    // Define mappings between tab keywords and data sources
    const tabMappings = [
      {
        keywords: ["portfolio"],
        tabName: "portfolio",
        getData: () => app.portfolioData,
        updateMethod: (sortedData) => {
          app.portfolioData = sortedData;
          app.htmlGen.renderPortfolioTable(sortedData);
        },
      },
      {
        keywords: ["evolution"],
        tabName: "evolution",
        getData: () => app.evolutionData,
        updateMethod: (sortedData) => {
          app.evolutionData = sortedData;
          app.htmlGen.renderEvolutionTable(sortedData);
        },
      },
      {
        keywords: ["sales"],
        tabName: "sales",
        getData: () => app.salesData,
        updateMethod: (sortedData) => {
          app.salesData = sortedData;
          app.htmlGen.renderSalesTable(sortedData);
        },
      },
      {
        keywords: ["grant"],
        tabName: "grant",
        getData: () => app.grantData,
        updateMethod: (sortedData) => {
          app.grantData = sortedData;
          app.htmlGen.renderGrantTable(sortedData);
        },
      },
    ];

    // Find matching tab mapping
    for (const mapping of tabMappings) {
      if (mapping.keywords.some((keyword) => tabText.includes(keyword))) {
        const data = mapping.getData();
        return {
          tabName: mapping.tabName,
          data: data,
          updateMethod: mapping.updateMethod,
        };
      }
    }

    console.warn(`Unknown tab: ${tabText}`);
    return null;
  },

  /**
   * Handle table sorting functionality (existing method, enhanced)
   * @param {Object} app - Application instance
   * @param {string} column - Column to sort by
   * @param {Array} data - Data array to sort
   * @param {Function} renderCallback - Callback to re-render table
   */
  sortTable(app, column, data, renderCallback) {
    console.log(`🔄 Sorting table by column: ${column}`);

    // Toggle sort direction if same column
    if (app.currentSortColumn === column) {
      app.currentSortDirection =
        app.currentSortDirection === "asc" ? "desc" : "asc";
    } else {
      app.currentSortColumn = column;
      app.currentSortDirection = "asc";
    }

    // Update column headers
    this.updateSortHeaders(column, app.currentSortDirection);

    // Sort the data
    const sortedData = this.performSort(data, column, app.currentSortDirection);

    // Re-render with sorted data
    if (renderCallback && typeof renderCallback === "function") {
      renderCallback(sortedData);
    }

    console.log(`✅ Table sorted by ${column} (${app.currentSortDirection})`);
    return sortedData;
  },

  /**
   * Update table headers with sort indicators (existing method)
   * @param {string} activeColumn - Currently sorted column
   * @param {string} direction - Sort direction
   */
  updateSortHeaders(activeColumn, direction) {
    console.log(
      `🔄 Updating sort headers for column: ${activeColumn} (${direction})`
    );

    // Get the currently active tab to determine which table to update
    const activeTab = document.querySelector(".nav-tab.active");
    if (!activeTab) {
      console.warn("No active tab found for sort header update");
      return;
    }

    const tabText = activeTab.textContent.trim().toLowerCase();
    let tableSelector;

    // Map tabs to their table selectors
    if (tabText.includes("portfolio")) {
      tableSelector = "#portfolioTable";
    } else if (tabText.includes("evolution")) {
      tableSelector = "#evolutionTable";
    } else if (tabText.includes("sales")) {
      tableSelector = "#salesTable";
    } else if (tabText.includes("grant")) {
      tableSelector = "#grantTable";
    } else {
      console.warn(`Unknown tab for sort headers: ${tabText}`);
      return;
    }

    // Only update sortable headers in the current active table
    const currentTable = document.querySelector(tableSelector);
    if (!currentTable) {
      console.warn(`Table not found: ${tableSelector}`);
      return;
    }

    // Remove existing sort indicators and classes from current table only
    currentTable.querySelectorAll(".sortable").forEach((header) => {
      header.classList.remove("sorted-asc", "sorted-desc");

      // Remove any old sort indicator spans that might exist
      const indicator = header.querySelector(".sort-indicator");
      if (indicator) {
        indicator.remove();
      }
    });

    // Add sort class to active column in current table only
    const activeHeader = currentTable.querySelector(
      `th[data-sort="${activeColumn}"]`
    );
    if (activeHeader) {
      activeHeader.classList.add(`sorted-${direction}`);
      console.log(
        `✅ Applied sorted-${direction} class to ${activeColumn} header in ${tableSelector}`
      );
    } else {
      console.warn(
        `Active header not found: th[data-sort="${activeColumn}"] in ${tableSelector}`
      );
    }
  },

  /**
   * Perform actual sorting of data (existing method)
   * @param {Array} data - Data to sort
   * @param {string} column - Column to sort by
   * @param {string} direction - Sort direction
   * @returns {Array} Sorted data
   */
  performSort(data, column, direction) {
    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle different data types
      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      // Handle dates
      if (column.includes("date") || column.includes("Date")) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? 1 : -1;
      if (bVal == null) return direction === "asc" ? -1 : 1;

      // Perform comparison
      let comparison = 0;
      if (aVal > bVal) {
        comparison = 1;
      } else if (aVal < bVal) {
        comparison = -1;
      }

      return direction === "desc" ? -comparison : comparison;
    });
  },

  /**
   * Show/hide loading indicator for tables (existing method)
   * @param {boolean} show - Whether to show loading
   * @param {string} containerId - Container element ID
   * @param {string} message - Loading message
   */
  toggleLoading(show, containerId, message = "Loading...") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (show) {
      container.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="color: #666; margin-top: 10px;">${message}</p>
          </td>
        </tr>
      `;
    }
    // If hiding, the calling function should update with actual content
  },

  /**
   * ===== GRANT HISTORY FILTERING FUNCTIONALITY =====
   * MOVED FROM: renderer.js filterGrantHistory()
   * Apply filtering logic to grant history table rows
   * @param {Object} app - Application instance (optional, for future extension)
   */
  filterGrantHistory(statusFilter = "all") {
    console.log("🎛️ Applying grant filters with improved matching...");

    // Get active filter states
    const activeFilters = new Set();
    document
      .querySelectorAll("#grant-history-tab-header .filter-toggle.active")
      .forEach((toggle) => {
        activeFilters.add(toggle.dataset.filter);
      });

    console.log("Active filters:", Array.from(activeFilters));

    // Apply filtering to table rows - ROBUST STATUS MATCHING
    const tableRows = document.querySelectorAll(
      "#grantTableBody tr:not(.no-data)"
    );
    let visibleCount = 0;
    let totalCount = 0;

    tableRows.forEach((row) => {
      totalCount++;
      const statusCell = row.querySelector("td:last-child"); // Status column

      if (statusCell) {
        // Get the actual text content and normalize it
        const statusText = statusCell.textContent.toLowerCase().trim();

        // Debug log for each row
        console.log(`Row status text: "${statusText}"`);

        let shouldShow = false;

        // ROBUST MATCHING - Handle all variations
        if (activeFilters.has("active")) {
          if (statusText === "active" || statusText.includes("active")) {
            shouldShow = true;
          }
        }

        if (activeFilters.has("partially-sold")) {
          if (
            statusText === "partially sold" ||
            statusText.includes("partially sold") ||
            statusText.includes("partially") ||
            statusText === "partial"
          ) {
            shouldShow = true;
          }
        }

        if (activeFilters.has("sold")) {
          if (
            (statusText === "sold" || statusText.includes("sold")) &&
            !statusText.includes("partially")
          ) {
            shouldShow = true;
          }
        }

        // Clear any existing filter classes first
        row.classList.remove("filtered-hidden");
        row.style.display = "";

        // Then apply filtering
        if (shouldShow) {
          visibleCount++;
        } else {
          row.classList.add("filtered-hidden");
          row.style.display = "none";
        }
      }
    });

    console.log(
      `✅ Grant filtering applied: ${visibleCount}/${totalCount} rows visible`
    );
    console.log(
      `Filter states: Active=${activeFilters.has(
        "active"
      )}, Partially-Sold=${activeFilters.has(
        "partially-sold"
      )}, Sold=${activeFilters.has("sold")}`
    );

    // Update filter summary
    this.updateGrantFilterSummary(activeFilters, visibleCount, totalCount);
  },

  /**
   * Update grant filter summary display
   * MOVED FROM: renderer.js updateGrantFilterSummary()
   * @param {Set} activeFilters - Set of active filter names
   * @param {number} visibleCount - Number of visible rows
   * @param {number} totalCount - Total number of rows
   */
  updateGrantFilterSummary(activeFilters, visibleCount, totalCount) {
    const filterCount = activeFilters.size;

    if (filterCount === 3 || filterCount === 0) {
      console.log(`📊 All filters active: ${totalCount} grants shown`);
    } else {
      const filterNames = Array.from(activeFilters).join(", ");
      console.log(
        `📊 Filtered by: ${filterNames} (${visibleCount}/${totalCount} grants shown)`
      );
    }
  },

  /**
   * Initialize grant filters to active state
   * MOVED FROM: renderer.js initializeGrantFilters()
   * @param {Object} app - Application instance (optional, for consistency)
   */
  initializeGrantFilters(app = null) {
    console.log("🔧 Initializing grant filters...");

    // Set all filters to active by default
    const toggles = document.querySelectorAll(
      "#grant-history-tab-header .filter-toggle"
    );
    toggles.forEach((toggle) => {
      toggle.classList.add("active");
      toggle.classList.remove("inactive");
    });

    // Apply initial filtering (should show all)
    this.filterGrantHistory(app);
  },
  /**
   * Update grant filter counts display
   * @param {Object} app - Application instance
   * @param {Set} activeFilters - Currently active filters
   */
  updateGrantFilterCounts(app, activeFilters) {
    // Summary cards should NOT change with filtering
    // They represent the actual data totals, not filtered view

    // Only log the filtering state for debugging
    const visibleRows = document.querySelectorAll(
      "#grantTableBody tr:not(.no-data):not(.filtered-hidden)"
    );
    console.log(
      `📊 Filter applied: ${visibleRows.length} grants visible in current view`
    );

    // Summary cards remain unchanged - they show actual totals
    // Total Grants = all grants in database
    // Total Options Granted = all options ever granted
    // Still Active = Active + Partially Sold (regardless of filter)
  },
};
window.TableManager = TableManager;
