/**
 * ===== IPC COMMUNICATION UTILITY =====
 * Centralized IPC communication layer for portfolio application
 *
 * STEP 4.1: Create this file as utils/ipc-communication.js
 */

/**
 * Window control operations
 */
const WindowOperations = {
  async minimize() {
    try {
      return await window.ipcRenderer.invoke("window-minimize");
    } catch (error) {
      console.error("❌ Error minimizing window:", error);
      throw error;
    }
  },

  async maximize() {
    try {
      return await window.ipcRenderer.invoke("window-maximize");
    } catch (error) {
      console.error("❌ Error maximizing window:", error);
      throw error;
    }
  },

  async close() {
    try {
      return await window.ipcRenderer.invoke("window-close");
    } catch (error) {
      console.error("❌ Error closing window:", error);
      throw error;
    }
  },
};

/**
 * Portfolio data operations
 */
/**
 * Portfolio data operations
 */
const PortfolioOperations = {
  async getOverview() {
    try {
      const result = await window.ipcRenderer.invoke("get-portfolio-overview");
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (error) {
      console.error("❌ Error getting portfolio overview:", error);
      throw error;
    }
  },

  async addEntry(grantDate, exercisePrice, quantity, taxAmount, notes) {
    try {
      return await window.ipcRenderer.invoke(
        "add-portfolio-entry",
        grantDate,
        exercisePrice,
        quantity,
        taxAmount,
        notes
      );
    } catch (error) {
      console.error("❌ Error adding portfolio entry:", error);
      throw error;
    }
  },

  async updateEntry(id, quantity, taxAmount, notes) {
    try {
      return await window.ipcRenderer.invoke(
        "update-portfolio-entry",
        id,
        quantity,
        taxAmount,
        notes
      );
    } catch (error) {
      console.error("❌ Error updating portfolio entry:", error);
      throw error;
    }
  },

  async deleteEntry(id) {
    try {
      return await window.ipcRenderer.invoke("delete-portfolio-entry", id);
    } catch (error) {
      console.error("❌ Error deleting portfolio entry:", error);
      throw error;
    }
  },

  async checkExistingGrant(grantDate, exercisePrice) {
    try {
      return await window.ipcRenderer.invoke(
        "check-existing-grant",
        grantDate,
        exercisePrice
      );
    } catch (error) {
      console.error("❌ Error checking existing grant:", error);
      throw error;
    }
  },

  async getOptionsByGrantDate(grantDate) {
    try {
      return await window.ipcRenderer.invoke(
        "get-options-by-grant-date",
        grantDate
      );
    } catch (error) {
      console.error("❌ Error getting options by grant date:", error);
      throw error;
    }
  },

  /**
   * Load sales history data via IPC
   * MOVED FROM: renderer.js loadSalesHistory()
   * @param {Object} app - Application instance for data storage
   * @returns {Array} Sales history data
   */
  async loadSalesHistory(app) {
    try {
      const salesHistory = await window.ipcRenderer.invoke("get-sales-history");

      if (salesHistory.error) {
        console.error("Error loading sales history:", salesHistory.error);
        // Initialize empty on error
        if (app) {
          app.salesData = [];
        }
        return [];
      }

      // Store data for sorting if app instance provided
      if (app) {
        app.salesData = salesHistory;
      }

      // Use HTML generator to render
      if (app && app.htmlGen) {
        app.htmlGen.renderSalesTable(salesHistory);
      }

      return salesHistory;
    } catch (error) {
      console.error("Error loading sales history:", error);
      // Initialize empty on error
      if (app) {
        app.salesData = [];
      }
      return [];
    }
  },

  /**
   * Load grant history data via IPC
   * MOVED FROM: renderer.js loadGrantHistory()
   * @param {Object} app - Application instance for data storage
   * @returns {Array} Grant history data
   */
  async loadGrantHistory(app) {
    try {
      const grantHistory = await window.ipcRenderer.invoke("get-grant-history");

      console.log("Grant history received:", grantHistory);

      if (grantHistory.error) {
        console.error("Error loading grant history:", grantHistory.error);

        // Show error message in table if app instance provided
        if (app) {
          const tableBody = document.getElementById("grantTableBody");
          if (tableBody) {
            tableBody.innerHTML = `
              <tr class="no-data">
                <td colspan="7">
                  <div class="no-data-message">
                    <p>Error loading grant history: ${grantHistory.error}</p>
                  </div>
                </td>
              </tr>
            `;
          }

          // Initialize grant filters and empty data
          if (app.initializeGrantFilters) {
            app.initializeGrantFilters();
          }
          app.grantData = [];
        }

        return [];
      }

      // Store data for sorting if app instance provided
      if (app) {
        app.grantData = grantHistory;
      }

      // Use HTML generator to render
      if (app && app.htmlGen) {
        app.htmlGen.renderGrantTable(grantHistory);
      }

      return grantHistory;
    } catch (error) {
      console.error("Error loading grant history:", error);
      // Initialize empty on error
      if (app) {
        app.grantData = [];
      }
      return [];
    }
  },
  /**
   * Get portfolio events for chart annotations
   * @returns {Array} Portfolio events data
   */
  async getPortfolioEvents() {
    try {
      return await window.ipcRenderer.invoke("get-portfolio-events");
    } catch (error) {
      console.error("❌ Error getting portfolio events:", error);
      throw error;
    }
  },
};

/**
 * Price update operations
 */
const PriceOperations = {
  /**
   * Check price update status and show appropriate notifications
   * @param {Object} app - Application instance
   */
  async checkPriceUpdateStatus(app) {
    try {
      // Get the latest price_date from the database (this comes from CSV column 6)
      const latestPriceDate = await window.ipcRenderer.invoke(
        "get-latest-price-date"
      );

      if (!latestPriceDate) {
        // No price data at all
        window.UIStateManager.Notifications.showNotification(
          "priceUpdateNotification",
          "No data available",
          "info"
        );
        app.updatePricesBtn.disabled = false;
        app.updatePricesBtn.textContent = "📊 Update Prices";
        app.updatePricesBtn.title =
          "No price data available - click to download from KBC";

        // Add tooltip for notification
        const notification = document.getElementById("priceUpdateNotification");
        if (notification) {
          notification.title =
            "No price data available. Click 'Update Prices' to download from KBC.";
          // Set info icon
          const iconElement = notification.querySelector(".notification-icon");
          if (iconElement) {
            iconElement.textContent = "📊";
          }
        }
        return;
      }

      // Get current time and date info
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const latestPrice = new Date(latestPriceDate).toISOString().split("T")[0];
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0=Sunday, 6=Saturday
      const isWeekend = currentDay === 0 || currentDay === 6;

      console.log(
        `Price date comparison: Latest from KBC: ${latestPrice}, Today: ${today}, Hour: ${currentHour}, Weekend: ${isWeekend}`
      );

      if (latestPrice === today) {
        // We have today's prices from KBC
        window.UIStateManager.Notifications.hidePriceUpdateNotification(app);
        console.log(
          "🔔 Attempting to hide notification - element found:",
          !!document.getElementById("priceUpdateNotification")
        );
        app.updatePricesBtn.disabled = true;
        app.updatePricesBtn.textContent = "✅ Updated";
        app.updatePricesBtn.title = `Latest prices from KBC: ${new Date(
          latestPriceDate
        ).toLocaleDateString()}`;
      } else {
        // Prices are from a previous day - show context-aware notification
        const daysDiff = Math.floor(
          (new Date(today) - new Date(latestPrice)) / (1000 * 60 * 60 * 24)
        );

        // Determine context-aware message and icon
        let notificationMessage = "";
        let notificationIcon = "";
        let buttonTooltip = "";
        let notificationTooltip = "";

        if (isWeekend) {
          notificationMessage = "Weekend: Friday's prices";
          notificationIcon = "📅";
          buttonTooltip = `Latest available: ${new Date(latestPriceDate).toLocaleDateString()}. KBC updates weekdays at 09:00.`;
          notificationTooltip = `Markets closed on weekends. Latest prices from ${new Date(latestPriceDate).toLocaleDateString()}. KBC updates weekdays at 09:00.`;
        } else if (currentHour < 9) {
          notificationMessage = "Before 09:00: Yesterday's prices";
          notificationIcon = "🕒";
          buttonTooltip = `Current: ${new Date(latestPriceDate).toLocaleDateString()}. KBC updates at 09:00 today.`;
          notificationTooltip = `Too early for today's update. KBC publishes new prices at 09:00 on weekdays. Current prices from ${new Date(latestPriceDate).toLocaleDateString()}.`;
        } else if (daysDiff === 1) {
          notificationMessage = "Yesterday's prices - Check for update";
          notificationIcon = "📊";
          buttonTooltip = `Prices from ${new Date(latestPriceDate).toLocaleDateString()}. Click to check for today's update.`;
          notificationTooltip = `Prices are from yesterday (${new Date(latestPriceDate).toLocaleDateString()}). Click 'Update Prices' to check for today's data.
Note: KBC doesn't update on bank holidays.`;
        } else {
          // Same day but something's off
          notificationMessage = "Check for updates";
          notificationIcon = "🔄";
          buttonTooltip = "Click to check for latest prices from KBC";
          notificationTooltip =
            "Click 'Update Prices' to check for the latest data from KBC.";
        }

        // Show notification with appropriate type
        const notificationType = daysDiff > 2 ? "warning" : "info";
        window.UIStateManager.Notifications.showNotification(
          "priceUpdateNotification",
          notificationMessage,
          notificationType
        );

        // Configure button
        app.updatePricesBtn.disabled = false;
        app.updatePricesBtn.textContent = "📊 Update Prices";
        app.updatePricesBtn.title = buttonTooltip;

        // Configure notification details
        const notification = document.getElementById("priceUpdateNotification");
        if (notification) {
          notification.title = notificationTooltip;

          // Set appropriate icon
          const iconElement = notification.querySelector(".notification-icon");
          if (iconElement) {
            iconElement.textContent = notificationIcon;
          }
        }
      }
    } catch (error) {
      console.error("Error checking price update status:", error);
      // Fallback to allow updates on error
      window.UIStateManager.Notifications.showNotification(
        "priceUpdateNotification",
        "Status unknown",
        "warning"
      );
      app.updatePricesBtn.disabled = false;
      app.updatePricesBtn.textContent = "📊 Update Prices";
      app.updatePricesBtn.title =
        "Error checking price status - click to update";

      // Add tooltip for notification
      const notification = document.getElementById("priceUpdateNotification");
      if (notification) {
        notification.title =
          "Error checking price status. Click 'Update Prices' to try again.";
        const iconElement = notification.querySelector(".notification-icon");
        if (iconElement) {
          iconElement.textContent = "❓";
        }
      }
    }
  },
  async updatePrices() {
    try {
      return await window.ipcRenderer.invoke("scrape-data");
    } catch (error) {
      console.error("❌ Error updating prices:", error);
      throw error;
    }
  },

  async getLatestPriceDate() {
    try {
      return await window.ipcRenderer.invoke("get-latest-price-date");
    } catch (error) {
      console.error("❌ Error getting latest price date:", error);
      throw error;
    }
  },

  async testConnection() {
    try {
      return await window.ipcRenderer.invoke("test-connection");
    } catch (error) {
      console.error("❌ Error testing connection:", error);
      throw error;
    }
  },

  async getLatestCSV() {
    try {
      return await window.ipcRenderer.invoke("get-latest-csv");
    } catch (error) {
      console.error("❌ Error getting latest CSV:", error);
      throw error;
    }
  },
};

/**
 * Settings operations
 */
const SettingsOperations = {
  async getSetting(key) {
    try {
      return await window.ipcRenderer.invoke("get-setting", key);
    } catch (error) {
      console.error(`❌ Error getting setting '${key}':`, error);
      throw error;
    }
  },

  async updateSetting(key, value) {
    try {
      return await window.ipcRenderer.invoke("update-setting", key, value);
    } catch (error) {
      console.error(`❌ Error updating setting '${key}':`, error);
      throw error;
    }
  },

  async loadAllSettings() {
    try {
      const settings = {};
      const settingKeys = [
        "target_percentage",
        "tax_auto_rate",
        "currency_symbol",
        "auto_update_prices",
      ];

      for (const key of settingKeys) {
        settings[key] = await this.getSetting(key);
      }

      return settings;
    } catch (error) {
      console.error("❌ Error loading all settings:", error);
      throw error;
    }
  },

  async saveAllSettings(settings) {
    try {
      const results = {};

      for (const [key, value] of Object.entries(settings)) {
        results[key] = await this.updateSetting(key, value);
      }

      return results;
    } catch (error) {
      console.error("❌ Error saving all settings:", error);
      throw error;
    }
  },
};

/**
 * Sales transaction operations
 */
const SalesOperations = {
  async recordSale(portfolioEntryId, saleDate, quantitySold, salePrice, notes) {
    try {
      return await window.ipcRenderer.invoke(
        "record-sale-transaction",
        portfolioEntryId,
        saleDate,
        quantitySold,
        salePrice,
        notes
      );
    } catch (error) {
      console.error("❌ Error recording sale:", error);
      throw error;
    }
  },

  async getSalesHistory() {
    try {
      return await window.ipcRenderer.invoke("get-sales-history");
    } catch (error) {
      console.error("❌ Error getting sales history:", error);
      throw error;
    }
  },
};

/**
 * Evolution and chart data operations
 */
const EvolutionOperations = {
  async getPortfolioEvolution(days = null) {
    try {
      return await window.ipcRenderer.invoke("get-portfolio-evolution", days);
    } catch (error) {
      console.error("❌ Error getting portfolio evolution:", error);
      throw error;
    }
  },

  async getOptionPriceHistory(exercisePrice, days = null) {
    try {
      return await window.ipcRenderer.invoke(
        "get-option-price-history",
        exercisePrice,
        days
      );
    } catch (error) {
      console.error("❌ Error getting option price history:", error);
      throw error;
    }
  },

  async getGrantHistory() {
    try {
      return await window.ipcRenderer.invoke("get-grant-history");
    } catch (error) {
      console.error("❌ Error getting grant history:", error);
      throw error;
    }
  },
};

/**
 * Database management operations
 */
const DatabaseOperations = {
  async exportDatabase() {
    try {
      return await window.ipcRenderer.invoke("export-database");
    } catch (error) {
      console.error("❌ Error exporting database:", error);
      throw error;
    }
  },

  async importDatabase(mergeMode = false) {
    try {
      return await window.ipcRenderer.invoke("import-database", mergeMode);
    } catch (error) {
      console.error("❌ Error importing database:", error);
      throw error;
    }
  },
  /**
   * Delete the entire database
   */
  async deleteDatabase() {
    try {
      return await window.ipcRenderer.invoke("delete-database");
    } catch (error) {
      console.error("❌ Error deleting database:", error);
      throw error;
    }
  },

  async debugState() {
    try {
      return await window.ipcRenderer.invoke("debug-database-state");
    } catch (error) {
      console.error("❌ Error debugging database state:", error);
      throw error;
    }
  },
};

/**
 * App version operations
 */
const AppOperations = {
  async getVersion() {
    try {
      return await window.ipcRenderer.invoke("get-app-version");
    } catch (error) {
      console.error("❌ Error getting app version:", error);
      throw error;
    }
  },
};

/**
 * IPC Event listeners setup
 */
const IPCEventListeners = {
  /**
   * Set up IPC event listeners
   * @param {Object} app - Application instance for callbacks
   */
  initialize(app) {
    console.log("📡 Setting up IPC event listeners...");

    if (!window.ipcRenderer) {
      console.error("❌ ipcRenderer not available");
      return false;
    }

    // Progress updates during scraping
    window.ipcRenderer.on("scrape-progress", (event, progressText) => {
      if (app.updateProgress && typeof app.updateProgress === "function") {
        app.updateProgress(progressText);
      }
    });

    console.log("✅ IPC event listeners initialized");
    return true;
  },

  /**
   * Remove all IPC listeners (cleanup)
   */
  cleanup() {
    if (window.ipcRenderer) {
      window.ipcRenderer.removeAllListeners("scrape-progress");
      console.log("🧹 IPC listeners cleaned up");
    }
  },
};

/**
 * Main IPC Communication coordinator
 */
const IPCCommunication = {
  /**
   * Initialize IPC communication layer
   * @param {Object} app - Application instance
   */
  initialize(app) {
    console.log("🌐 Initializing IPC communication layer...");

    // Store ipcRenderer reference globally
    if (!window.ipcRenderer) {
      try {
        window.ipcRenderer = require("electron").ipcRenderer;
        console.log("✅ ipcRenderer loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load ipcRenderer:", error);
        return false;
      }
    }

    // Set up event listeners
    const listenersInitialized = IPCEventListeners.initialize(app);

    if (listenersInitialized) {
      console.log("✅ IPC Communication layer initialized successfully");
      return true;
    } else {
      console.error("❌ Failed to initialize IPC listeners");
      return false;
    }
  },

  // Expose all operation groups
  Window: WindowOperations,
  Portfolio: PortfolioOperations,
  Price: PriceOperations,
  Settings: SettingsOperations,
  Sales: SalesOperations,
  Evolution: EvolutionOperations,
  Database: DatabaseOperations,
  App: AppOperations,
  Events: IPCEventListeners,
};

// Export to global scope
window.IPCCommunication = IPCCommunication;

// Debug logging
console.log(
  "✅ IPC Communication loaded with modules:",
  Object.keys(IPCCommunication)
);
