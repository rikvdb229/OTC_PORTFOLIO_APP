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
  /**
   * Update tax for a portfolio entry
   * @param {Object} app - Application instance
   */
  async updateTax(app) {
    console.log("🔄 IPCCommunication: updateTax called");

    if (!app || !app.currentEditingTaxId) {
      console.log("❌ No app or currentEditingTaxId found");
      return;
    }

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

      console.log("✅ Tax updated successfully");

      // Show success notification
      window.UIStateManager.showSuccess(
        `Tax updated: €${newTaxAmount.toFixed(2)}`,
        3000
      );

      // Close modal and refresh data
      app.closeModals();
      await app.loadPortfolioData();

      // Clear current editing ID
      app.currentEditingTaxId = null;
    } catch (error) {
      console.error("❌ Error updating tax:", error);
      alert("Error updating tax: " + error.message);
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
  async getAvailableExercisePrices() {
    try {
      return await window.ipcRenderer.invoke("get-available-exercise-prices");
    } catch (error) {
      console.error("❌ Error getting available exercise prices:", error);
      throw error;
    }
  },
  /**
   * Refresh UI after grant operations
   * HELPER METHOD
   */
  async proceedWithDirectAddition(app) {
    const formData = app.currentFormData;
    const { grantDate, exercisePrice, quantity, actualTaxAmount } = formData;

    console.log("💾 Adding grant to database...");

    // Add to database via IPC - use existing addEntry method
    const result = await this.addEntry(
      grantDate,
      exercisePrice,
      quantity,
      actualTaxAmount,
      null // notes
    );

    if (result.error) {
      console.error("❌ Database error:", result.error);
      alert("Error adding grants: " + result.error);
      return;
    }

    console.log("✅ Database operation successful, updating UI...");

    // Close modal FIRST to prevent UI blocking
    app.closeModals();
    console.log("✅ Modal closed");

    // Use shared UI refresh method
    await this.refreshUIAfterGrantOperation(app);

    // Clear form
    this.clearGrantForm();

    console.log(
      `🎉 Successfully added ${quantity} grants at €${exercisePrice}${
        actualTaxAmount ? ` with manual tax €${actualTaxAmount}` : ""
      }`
    );

    // Show success feedback
    this.showSuccessFeedback("Added");
  },
  /**
   * Clear the grant form after successful submission
   */
  clearGrantForm() {
    try {
      const grantDateElement = document.getElementById("grantDate");
      const exercisePriceElement = document.getElementById("exercisePrice");
      const quantityElement = document.getElementById("quantity");
      const actualTaxAmountElement = document.getElementById("actualTaxAmount");

      if (grantDateElement) grantDateElement.value = "";
      if (exercisePriceElement) {
        exercisePriceElement.innerHTML =
          '<option value="">First enter grant date...</option>';
        exercisePriceElement.disabled = true;
      }
      if (quantityElement) quantityElement.value = "";
      if (actualTaxAmountElement) actualTaxAmountElement.value = "";

      const estimatedTaxElement = document.getElementById("estimatedTax");
      if (estimatedTaxElement) estimatedTaxElement.textContent = "€ 0.00";

      const helpTextElement = document.getElementById("exercisePriceHelp");
      if (helpTextElement) {
        helpTextElement.textContent =
          "Options will appear after entering grant date";
      }

      console.log("✅ Form cleared");
    } catch (formError) {
      console.warn("⚠️ Form clearing error:", formError);
    }
  },

  /**
   * Show success feedback to user
   */
  ShowSuccessFeedback(action = "Added") {
    const addButton = document.getElementById("confirmAddOptions");
    if (addButton) {
      const originalText = addButton.textContent;
      addButton.textContent = `✅ ${action}!`;
      addButton.style.background = "#28a745";

      setTimeout(() => {
        addButton.textContent = originalText;
        addButton.style.background = "";
      }, 2000);
    }
  },
  /**
   * Confirm and execute portfolio entry deletion
   * @param {Object} app - Application instance
   */
  async confirmDelete(app) {
    try {
      const result = await window.ipcRenderer.invoke(
        "delete-portfolio-entry",
        app.currentDeletingEntryId
      );

      if (result.error) {
        alert("Error deleting entry: " + result.error);
        return;
      }

      app.closeModals();
      await app.loadPortfolioData();
      console.log(`✅ Deleted portfolio entry`);
    } catch (error) {
      console.error("Error deleting portfolio entry:", error);
      alert("Error deleting entry");
    }
  },
  /**
   * Check if price data exists in the database
   * ✅ EXTRACTED FROM: renderer.js checkIfPriceDataExists() method
   * @returns {Promise<boolean>} True if price data exists
   */
  async checkIfPriceDataExists() {
    try {
      const prices = await ipcRenderer.invoke("get-available-exercise-prices");
      return prices && prices.length > 0 && !prices.error;
    } catch (error) {
      console.error("Error checking price data existence:", error);
      return false;
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
      const today = new Date().toLocaleDateString("en-CA"); // Returns YYYY-MM-DD format
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
          buttonTooltip = `Latest available: ${new Date(
            latestPriceDate
          ).toLocaleDateString()}. KBC updates weekdays at 09:00.`;
          notificationTooltip = `Markets closed on weekends. Latest prices from ${new Date(
            latestPriceDate
          ).toLocaleDateString()}. KBC updates weekdays at 09:00.`;
        } else if (currentHour < 9) {
          notificationMessage = "Before 09:00: Yesterday's prices";
          notificationIcon = "🕒";
          buttonTooltip = `Current: ${new Date(
            latestPriceDate
          ).toLocaleDateString()}. KBC updates at 09:00 today.`;
          notificationTooltip = `Too early for today's update. KBC publishes new prices at 09:00 on weekdays. Current prices from ${new Date(
            latestPriceDate
          ).toLocaleDateString()}.`;
        } else if (daysDiff === 1) {
          notificationMessage = "Yesterday's prices - Check for update";
          notificationIcon = "📊";
          buttonTooltip = `Prices from ${new Date(
            latestPriceDate
          ).toLocaleDateString()}. Click to check for today's update.`;
          notificationTooltip = `Prices are from yesterday (${new Date(
            latestPriceDate
          ).toLocaleDateString()}). Click 'Update Prices' to check for today's data.
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
      const result = await window.ipcRenderer.invoke("get-setting", key);
      return result;
    } catch (error) {
      console.error(`❌ Error getting setting '${key}':`, error);
      throw error;
    }
  },

  async updateSetting(key, value) {
    try {
      const result = await window.ipcRenderer.invoke(
        "update-setting",
        key,
        value
      );
      console.log(`🔍 DEBUG: IPC result for ${key}:`, result);
      return result;
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
      console.log("🔍 DEBUG: saveAllSettings called with:", settings);
      const results = {};

      for (const [key, value] of Object.entries(settings)) {
        console.log(`🔍 DEBUG: Saving ${key} = ${value}`);
        results[key] = await this.updateSetting(key, value);
        console.log(`🔍 DEBUG: Save result for ${key}:`, results[key]);
      }

      console.log("🔍 DEBUG: All settings saved, results:", results);
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
  /**
   * Confirm and execute sale transaction
   * @param {Object} app - Application instance
   */
  async confirmSale(app) {
    console.log("🔄 IPCCommunication: confirmSale called");

    if (!app || !app.currentSellEntry) {
      console.log("❌ No app or currentSellEntry found");
      return;
    }

    try {
      const quantityToSell = parseInt(
        document.getElementById("quantityToSell").value
      );
      const salePrice = parseFloat(document.getElementById("salePrice").value);
      const notes = document.getElementById("saleNotes").value || null;
      const saleDateInput = document.getElementById("saleDate");
      const saleDate = saleDateInput
        ? saleDateInput.value
        : new Date().toISOString().split("T")[0];

      // Call the existing recordSale method
      const result = await this.recordSale(
        app.currentSellEntry.id,
        saleDate,
        quantityToSell,
        salePrice,
        notes
      );

      if (result.error) {
        alert("Error recording sale: " + result.error);
        return;
      }

      console.log("✅ Sale recorded successfully");

      // Show success notification
      window.UIStateManager.showSuccess(
        `Sale recorded: ${quantityToSell} options at €${salePrice}`,
        3000
      );

      // Close modal and refresh data
      app.closeModals();
      await app.loadPortfolioData();

      // Refresh the current tab data
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
  },

  /**
   * Confirm and save sale edits
   * @param {Object} app - Application instance
   */
  async confirmEditSale(app) {
    console.log("🔄 IPCCommunication: confirmEditSale called");

    if (!app || !app.currentEditingSaleId) {
      console.log("❌ No app or currentEditingSaleId found");
      return;
    }

    try {
      const saleDate = document.getElementById("editSaleDate").value;
      const salePrice = parseFloat(
        document.getElementById("editSalePrice").value
      );
      const notes = document.getElementById("editSaleNotes").value || null;

      // Validation
      if (!saleDate) {
        alert("Please enter a valid sale date");
        return;
      }

      if (!salePrice || salePrice <= 0) {
        alert("Please enter a valid sale price");
        return;
      }

      // Update the sale transaction
      const result = await window.ipcRenderer.invoke("update-sale", {
        id: app.currentEditingSaleId,
        sale_date: saleDate,
        sale_price: salePrice,
        notes: notes,
      });

      if (result.error) {
        alert("Error updating sale: " + result.error);
        return;
      }

      console.log("✅ Sale updated successfully:", result);

      // Show success notification
      window.UIStateManager.showSuccess(
        `Sale updated: ${salePrice.toLocaleString()} per option`,
        3000
      );

      // Close modal and refresh data
      app.closeModals();
      await app.loadPortfolioData();

      // Refresh the current tab data
      if (app.activeTab === "sales-history") {
        await app.loadSalesHistory();
      }

      // Clear current editing sale ID
      app.currentEditingSaleId = null;
    } catch (error) {
      console.error("❌ Error confirming edit sale:", error);
      alert("Error updating sale: " + error.message);
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
  /**
   * Select import file without importing
   * @returns {Promise} Result with file path and info
   */
  async selectImportFile() {
    try {
      console.log("📁 Opening file selection dialog");
      return await window.ipcRenderer.invoke("select-import-file");
    } catch (error) {
      console.error("❌ Error selecting import file:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Import database from specific file path
   * @param {string} filePath - Path to the backup file
   * @param {boolean} mergeMode - Whether to merge or replace
   * @returns {Promise} Import result
   */
  async importDatabaseFromFile(filePath, mergeMode = false) {
    try {
      console.log("📥 Importing database from file:", filePath);
      return await window.ipcRenderer.invoke(
        "import-database-from-file",
        filePath,
        mergeMode
      );
    } catch (error) {
      console.error("❌ Error importing database from file:", error);
      return { success: false, error: error.message };
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
  initialize(app) {
    console.log("📡 Setting up IPC event listeners...");

    if (!window.ipcRenderer) {
      console.error("❌ ipcRenderer not available");
      return false;
    }

    // DETAILED progress updates during scraping
    window.ipcRenderer.on("scrape-progress", (event, progressText) => {
      console.log(`📊 Received detailed progress: ${progressText}`);

      if (app.updateProgress && typeof app.updateProgress === "function") {
        app.updateProgress(progressText);
      }

      // Also update UI state manager
      if (window.UIStateManager && window.UIStateManager.Modals) {
        window.UIStateManager.Modals.updateProgress(app, progressText);
      }
    });

    // SIMPLIFIED progress updates (fallback)
    window.ipcRenderer.on("scrape-progress-simple", (event, progressText) => {
      console.log(`📊 Received simple progress: ${progressText}`);

      // Only use if detailed progress isn't working
      if (app.updateProgress && typeof app.updateProgress === "function") {
        app.updateProgress(progressText);
      }
    });

    console.log("✅ IPC event listeners initialized");
    return true;
  },

  cleanup() {
    if (window.ipcRenderer) {
      window.ipcRenderer.removeAllListeners("scrape-progress");
      window.ipcRenderer.removeAllListeners("scrape-progress-simple");
      console.log("🧹 IPC listeners cleaned up");
    }
  },
};
/**
 * Grant management operations
 * These handle the complex grant addition, merging, and form management
 */
/**
 * Grant management operations
 * These handle the complex grant addition, merging, and form management
 */
const GrantOperations = {
  /**
   * Add grants with merge checking
   * @param {Object} app - Application instance with context
   */
  async addGrants(app) {
    try {
      console.log("🔄 Starting addGrants process...");
      console.log("📱 App context available:", !!app);

      // Get form elements
      const grantDateElement = document.getElementById("grantDate");
      const exercisePriceElement = document.getElementById("exercisePrice");
      const quantityElement = document.getElementById("quantity");
      const actualTaxAmountElement = document.getElementById("actualTaxAmount");

      if (!grantDateElement || !exercisePriceElement || !quantityElement) {
        alert("Required form elements not found");
        return;
      }

      // Get form values
      const grantDate = grantDateElement.value;
      const exercisePrice = parseFloat(exercisePriceElement.value);
      const quantity = parseInt(quantityElement.value);
      const actualTaxAmount = actualTaxAmountElement?.value
        ? parseFloat(actualTaxAmountElement.value) || null
        : null;

      console.log("📝 Form data validated:", {
        grantDate,
        exercisePrice,
        quantity,
        actualTaxAmount,
      });

      // ✅ Enhanced validation - the button should already be disabled if invalid
      // But we'll do a final check for safety
      const validation =
        window.UIStateManager.Validation.validateAddGrantsForm(app);
      if (!validation.isValid) {
        console.warn("⚠️ Form validation failed:", validation.errors);
        return; // Don't show alert, button should already be disabled
      }

      // ✅ STORE FORM DATA in app context
      app.currentFormData = {
        grantDate: grantDate,
        exercisePrice: exercisePrice,
        quantity: quantity,
        actualTaxAmount: actualTaxAmount,
      };

      console.log("📝 Form data stored successfully:", app.currentFormData);

      // Add verification log
      if (app.currentFormData && app.currentFormData.grantDate) {
        console.log("✅ Form data verification passed");
      } else {
        console.error("❌ Form data verification failed!", app.currentFormData);
      }

      console.log("🔍 Checking for existing grants...");

      // Check for existing grants
      try {
        const existingGrants = await window.ipcRenderer.invoke(
          "check-existing-grant",
          grantDate,
          exercisePrice
        );

        console.log("🔍 Existing grants check result:", existingGrants);

        if (existingGrants && !existingGrants.error) {
          console.log("📋 Found existing grant, showing merge modal");

          // ✅ STORE existing grants in app context
          app.existingGrants = Array.isArray(existingGrants)
            ? existingGrants
            : [existingGrants];

          // Show merge modal using UI state manager
          window.UIStateManager.Modals.showMergeGrantsModal(
            app,
            existingGrants,
            quantity,
            actualTaxAmount
          );
          return;
        } else {
          console.log(
            "✅ No existing grants found, proceeding with normal add"
          );
        }
      } catch (mergeCheckError) {
        console.warn(
          "⚠️ Error checking for existing grants, proceeding with add:",
          mergeCheckError
        );
      }

      // No existing grant found, check if we should fetch historical prices
      console.log("➕ Proceeding with normal grant addition...");

      // Check if we should fetch historical prices for this grant
      const shouldFetchHistorical = await this.shouldFetchHistoricalPrices(grantDate, exercisePrice);
      
      if (shouldFetchHistorical) {
        console.log("📊 Triggering historical price fetch before adding grant...");
        
        // Store grant data for later use
        app.pendingGrantData = {
          grantDate,
          exercisePrice,
          quantity,
          actualTaxAmount
        };
        
        // Show historical price fetch modal
        await window.HistoricalPriceManager.showFetchModal(
          `Option ${grantDate} €${exercisePrice}`,
          exercisePrice,
          grantDate
        );
        
        // The actual grant addition will continue after historical prices are fetched
        return;
      }

      // Proceed with normal grant addition (no historical prices needed/wanted)
      await this.completeGrantAddition(app, grantDate, exercisePrice, quantity, actualTaxAmount);
    } catch (error) {
      console.error("❌ Error in addGrants:", error);
      alert("Error adding options: " + error.message);
    }
  },

  /**
   * Confirm merge grants decision
   * @param {Object} app - Application instance with context
   */
  async confirmMergeGrants(app) {
    try {
      console.log("🔄 Processing merge grants decision...");

      // Get user's choice from radio buttons
      const mergeChoice = document.querySelector(
        'input[name="grantChoice"]:checked'
      );

      if (!mergeChoice) {
        alert("Please select an option (Merge or Keep Separate)");
        return;
      }

      const choice = mergeChoice.value; // "merge" or "separate"
      console.log("📋 User choice:", choice);

      if (choice === "separate") {
        console.log("➕ User chose to keep separate");
        await this.proceedWithSeparateGrant(app);
        return;
      }

      if (choice === "merge") {
        console.log("🔄 Single grant merge - processing without closing modal");
        await this.proceedWithMergeGrant(app);
        return;
      }
    } catch (error) {
      console.error("❌ Error in confirmMergeGrants:", error);
      alert("Error processing grant choice: " + error.message);
    }
  },

  /**
   * Proceed with separate grant creation
   * @param {Object} app - Application instance with context
   */
  async proceedWithSeparateGrant(app) {
    try {
      console.log("➕ Proceeding with separate grant creation...");

      // Use stored form data from app context
      const formData = app.currentFormData;

      if (!formData) {
        console.error("❌ No stored form data found!");
        alert("Error: Form data lost. Please try adding the grants again.");
        window.UIStateManager.Modals.closeAllModals(app);
        return;
      }

      const { grantDate, exercisePrice, quantity, actualTaxAmount } = formData;

      console.log("📝 Using stored form data for separate grant:", formData);

      // Validate the stored data
      if (!grantDate || !exercisePrice || !quantity) {
        console.error("❌ Invalid stored form data:", formData);
        alert("Error: Invalid form data. Please try adding the grants again.");
        window.UIStateManager.Modals.closeAllModals(app);
        return;
      }

      // Close modal BEFORE making the API call
      window.UIStateManager.Modals.closeAllModals(app);

      const result = await window.ipcRenderer.invoke(
        "add-portfolio-entry",
        grantDate,
        exercisePrice,
        quantity,
        actualTaxAmount
      );

      if (result.error) {
        console.error("❌ Error adding separate grant:", result.error);
        alert("Error adding options: " + result.error);
        return;
      }

      console.log("✅ Separate grant added successfully:", result);

      // Refresh UI
      await app.loadPortfolioData();
      await app.loadEvolutionData("all");
      await app.checkDataAvailability();

      // Clear form AND stored data using UI state manager
      window.UIStateManager.Forms.clearaddGrantsForm(app);
      app.currentFormData = null;

      console.log(
        `🎉 Successfully added ${quantity} options as separate grant`
      );
    } catch (error) {
      console.error("❌ Error in proceedWithSeparateGrant:", error);
      alert("Error creating separate grant: " + error.message);
      try {
        window.UIStateManager.Modals.closeAllModals(app);
      } catch (modalError) {
        console.error("❌ Could not close modal:", modalError);
      }
    }
  },

  /**
   * Proceed with merge grant
   * @param {Object} app - Application instance with context
   */
  async proceedWithMergeGrant(app) {
    try {
      console.log("🔄 Processing grant merge...");
      console.log("🔍 Available data when merging:", {
        currentFormData: app.currentFormData,
        hasExistingGrants: !!app.existingGrants,
        existingGrantsLength: app.existingGrants
          ? app.existingGrants.length
          : 0,
      });

      // Use stored form data from app context
      const formData = app.currentFormData;

      if (!formData) {
        console.error("❌ No stored form data found!");
        alert("Error: Form data lost. Please try adding the grants again.");
        window.UIStateManager.Modals.closeAllModals(app);
        return;
      }

      const { quantity, actualTaxAmount } = formData;

      // Get the target grant to merge with
      let targetGrantId;

      // ✅ Fix: Check if existingGrants exists and has data
      if (!app.existingGrants || app.existingGrants.length === 0) {
        console.error("❌ No existing grants found!");
        alert("Error: No grants to merge with. Please try again.");
        app.closeModals();
        return;
      }

      if (app.existingGrants.length === 1) {
        // Single grant scenario
        targetGrantId = app.existingGrants[0].id;
        console.log("📝 Single grant merge with ID:", targetGrantId);
      } else {
        // Multiple grants scenario - get selected grant
        const selectedRadio = document.querySelector(
          'input[name="grantSelection"]:checked'
        );

        if (!selectedRadio) {
          console.error("❌ No radio button selected!");
          alert("Please select which grant to merge with");
          return; // Don't close modal - let user select
        }
        targetGrantId = parseInt(selectedRadio.value);
        console.log(
          "📝 Multiple grants merge with selected ID:",
          targetGrantId
        );
      }

      // ✅ Close modal AFTER getting all the data we need
      window.UIStateManager.Modals.closeAllModals(app);

      console.log("📝 Merge data:", {
        targetGrantId,
        newQuantity: quantity,
        newTaxAmount: actualTaxAmount,
      });

      // Call backend to perform the merge
      const result = await window.ipcRenderer.invoke(
        "merge-grant",
        targetGrantId,
        quantity,
        actualTaxAmount
      );

      if (result.error) {
        console.error("❌ Merge error:", result.error);
        alert("Error merging grants: " + result.error);
        return;
      }

      console.log("✅ Grant merge successful:", result);

      // Refresh UI
      await app.loadPortfolioData();
      await app.loadEvolutionData("all");
      await app.checkDataAvailability();

      // ✅ Clear form data AFTER successful operation using UI state manager
      window.UIStateManager.Forms.clearaddGrantsForm(app);
      app.currentFormData = null;

      console.log(
        `🎉 Successfully merged ${quantity} options into existing grant`
      );
    } catch (error) {
      console.error("❌ Error in proceedWithMergeGrant:", error);
      alert("Error merging grants: " + error.message);
      try {
        app.closeModals();
      } catch (modalError) {
        console.error("❌ Could not close modal:", modalError);
      }
    }
  },

  /**
   * Check if we should fetch historical prices for a grant
   * @param {string} grantDate - Grant date
   * @param {number} exercisePrice - Exercise price
   * @returns {Promise<boolean>} True if historical prices should be fetched
   */
  async shouldFetchHistoricalPrices(grantDate, exercisePrice) {
    try {
      // For now, always return true to offer historical price fetching
      // TODO: Add logic to check if historical prices already exist
      return true;
    } catch (error) {
      console.warn('Error checking historical prices, defaulting to fetch:', error);
      return true; // Default to fetching if check fails
    }
  },

  /**
   * Complete grant addition with the actual IPC call
   * @param {Object} app - Application instance
   * @param {string} grantDate - Grant date
   * @param {number} exercisePrice - Exercise price
   * @param {number} quantity - Quantity
   * @param {number} actualTaxAmount - Tax amount
   */
  async completeGrantAddition(app, grantDate, exercisePrice, quantity, actualTaxAmount) {
    try {
      const result = await window.ipcRenderer.invoke(
        "add-portfolio-entry",
        grantDate,
        exercisePrice,
        quantity,
        actualTaxAmount
      );

      if (result.error) {
        console.error("❌ Error adding grant:", result.error);
        alert("Error adding options: " + result.error);
        return;
      }

      console.log("✅ Grant added successfully:", result);
      window.UIStateManager.Modals.closeAllModals(app);
      
      // Refresh UI
      await app.loadPortfolioData();
      await app.loadEvolutionData("all");
      await app.checkDataAvailability();

      // Clear form using UI state manager
      window.UIStateManager.Forms.clearaddGrantsForm(app);
      app.currentFormData = null;
      app.pendingGrantData = null; // Clear pending data

      console.log(`🎉 Successfully added ${quantity} options`);
    } catch (error) {
      console.error("❌ Error in completeGrantAddition:", error);
      alert("Error adding options: " + error.message);
    }
  },

  /**
   * Continue with grant addition after historical prices are fetched
   * Called by HistoricalPriceManager after successful fetch
   * @param {Object} app - Application instance
   */
  async continueGrantAdditionAfterHistoricalFetch(app) {
    console.log("🔄 Continuing grant addition after historical price fetch...");
    
    if (!app.pendingGrantData) {
      console.error("❌ No pending grant data found");
      return;
    }

    const { grantDate, exercisePrice, quantity, actualTaxAmount } = app.pendingGrantData;
    
    await this.completeGrantAddition(app, grantDate, exercisePrice, quantity, actualTaxAmount);
  },
};

/**
 * Main IPC Communication coordinator
 */
/**
 * Main IPC Communication coordinator - SAFE VERSION
 * REPLACE your existing IPCCommunication object with this
 */
const IPCCommunication = {
  /**
   * Initialize IPC communication layer
   * @param {Object} app - Application instance
   */
  initialize(app) {
    console.log("🌐 Initializing IPC communication layer...");

    // Load ipcRenderer if not available
    if (!window.ipcRenderer) {
      try {
        window.ipcRenderer = require("electron").ipcRenderer;
        console.log("✅ ipcRenderer loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load ipcRenderer:", error);
        return false;
      }
    }

    // SAFE CHECK: Make sure IPCEventListeners exists before calling it
    if (
      typeof IPCEventListeners !== "undefined" &&
      IPCEventListeners &&
      IPCEventListeners.initialize
    ) {
      try {
        const listenersInitialized = IPCEventListeners.initialize(app);

        if (listenersInitialized) {
          console.log("✅ IPC Communication layer initialized successfully");
          return true;
        } else {
          console.error("❌ Failed to initialize IPC listeners");
          return false;
        }
      } catch (error) {
        console.error("❌ Error initializing IPC listeners:", error);
        return false;
      }
    } else {
      console.warn(
        "⚠️ IPCEventListeners not available, continuing without event listeners"
      );
      console.log(
        "📝 This is usually fine - event listeners will be added later"
      );
      return true; // Allow app to continue
    }
  },

  /**
   * Setup IPC listeners - SAFE VERSION
   * @param {Object} app - Application instance
   */
  setupIpcListeners(app) {
    console.log("📡 Setting up IPC listeners with communication layer...");
    return this.initialize(app);
  },

  // Expose all operation groups (keep your existing references)
  Window: WindowOperations,
  Portfolio: PortfolioOperations,
  Grants: GrantOperations,
  Price: PriceOperations,
  Settings: SettingsOperations,
  Sales: SalesOperations,
  Evolution: EvolutionOperations,
  Database: DatabaseOperations,
  App: AppOperations,
  Events: IPCEventListeners, // This will be undefined at first, but that's OK
};

// Export to global scope
window.IPCCommunication = IPCCommunication;

console.log("✅ IPC Communication module loaded successfully");
window.IPCCommunication = IPCCommunication;
