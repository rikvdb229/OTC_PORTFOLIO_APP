/**
 * ===== UI STATE MANAGEMENT UTILITY - COMPLETE MERGED VERSION =====
 * Centralized UI state management for modals, tabs, notifications, and portfolio stats
 * Your excellent existing structure + additional functionality
 */

/**
 * Tab navigation management
 */
const FooterManager = {
  /**
   * Initialize footer with version info
   * @param {Object} app - Application instance
   */
  initializeFooter(app) {
    try {
      const appVersionElement = document.getElementById("appVersion");
      const appStatusElement = document.getElementById("appStatus");
      const buildDateElement = document.getElementById("buildDate");

      if (appVersionElement) {
        appVersionElement.textContent =
          window.AppConfig.APP_CONFIG.getFullVersion();
      }

      if (appStatusElement) {
        appStatusElement.textContent = window.AppConfig.APP_CONFIG.STATUS;
        if (window.AppConfig.APP_CONFIG.isDevVersion()) {
          appStatusElement.classList.add("dev-version");
        }
      }

      if (buildDateElement) {
        buildDateElement.textContent = `Build: ${window.AppConfig.APP_CONFIG.BUILD_DATE}`;
      }

      document.title = window.AppConfig.APP_CONFIG.getFullVersion();

      console.log(
        `🚀 ${window.AppConfig.APP_CONFIG.getFullVersion()} - ${
          window.AppConfig.APP_CONFIG.STATUS
        } initialized`
      );
    } catch (error) {
      console.error("Error initializing footer:", error);
    }
  },
};

/**
 * Notification management
 */
/**
 * Notification management
 */

/**
 * Action button management
 */
const ActionButtonManager = {
  /**
   * Update action button states
   * @param {Object} app - Application instance
   * @param {boolean} hasData - Whether portfolio has data
   */
  updateActionButtons(app, hasData) {
    if (!app.addGrantsBtn) return;

    app.addGrantsBtn.disabled = !hasData;

    if (!hasData) {
      app.addGrantsBtn.textContent = "➕ Add Grants";
      app.addGrantsBtn.title =
        "Please update prices first to enable adding options";
      app.addGrantsBtn.classList.add("btn-disabled");
    } else {
      app.addGrantsBtn.textContent = "➕ Add Grants";
      app.addGrantsBtn.title = "Add new option grants to your portfolio";
      app.addGrantsBtn.classList.remove("btn-disabled");
    }
  },

  /**
   * Update button state during operations
   * @param {string} buttonId - Button element ID
   * @param {string} newText - New button text
   * @param {boolean} disabled - Whether button should be disabled
   * @param {string} originalText - Original text to restore later
   * @param {number} restoreDelay - Delay in ms before restoring (0 = no restore)
   */
  updateButtonState(
    buttonId,
    newText,
    disabled = false,
    originalText = null,
    restoreDelay = 0
  ) {
    const button = window.DOMHelpers.safeGetElementById(buttonId);
    if (!button) return;

    button.textContent = newText;
    button.disabled = disabled;

    if (originalText && restoreDelay > 0) {
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, restoreDelay);
    }
  },

  /**
   * Updated UI State Management Functions
   * REPLACE these functions in utils/ui-state-management.js
   */

  /**
   * Update button states for period/filter controls
   * @param {string} activeValue - Active button value
   * @param {string} containerSelector - Container selector
   * @param {string} dataAttribute - Data attribute to match
   */
  updatePeriodButtons(
    activeValue,
    containerSelector,
    dataAttribute = "data-period"
  ) {
    // Remove active state from all buttons in the container
    document.querySelectorAll(`${containerSelector} .btn`).forEach((btn) => {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-secondary");
    });

    // Add active state to the selected button
    const activeBtn = document.querySelector(
      `${containerSelector} [${dataAttribute}="${activeValue}"]`
    );
    if (activeBtn) {
      activeBtn.classList.remove("btn-secondary");
      activeBtn.classList.add("btn-primary");
    }
  },

  /**
   * Update evolution data buttons
   * @param {string} activeDays - Active days value
   */
  updateEvolutionButtons(activeDays) {
    // Use the correct container selector that matches your HTML structure
    this.updatePeriodButtons(activeDays, "#evolution-tab-header", "data-days");
  },

  /**
   * Update chart period buttons
   * @param {string} activePeriod - Active period value
   */
  updateChartButtons(activePeriod) {
    // Use the correct container selector that matches your HTML structure
    this.updatePeriodButtons(activePeriod, "#chart-tab-header", "data-period");
  },

  /**
   * Update sales history buttons (if applicable)
   * @param {string} activePeriod - Active period value
   */
  updateSalesButtons(activePeriod) {
    // Use the correct container selector that matches your HTML structure
    this.updatePeriodButtons(
      activePeriod,
      "#sales-history-tab-header",
      "data-period"
    );
  },
};

/**
 * Portfolio statistics management
 */
const StatsManager = {
  /**
   * Update portfolio statistics in the header
   * @param {Object} app - Application instance
   * @param {Object} stats - Portfolio statistics object
   */
  updateHeaderStats(app, stats) {
    console.log("📊 Updating header stats...");

    const headerTotalValue = document.getElementById("totalPortfolioValue");
    const headerActiveOptions = document.getElementById("totalOptions");
    const headerLastUpdate = document.getElementById("lastPriceUpdate");

    if (headerTotalValue && app.formatCurrency) {
      headerTotalValue.textContent = app.formatCurrency(stats.totalValue);
    }

    if (headerActiveOptions) {
      headerActiveOptions.textContent = stats.totalQuantityFormatted || "0";
    }

    if (headerLastUpdate) {
      headerLastUpdate.textContent = stats.latestUpdateFormatted || "Never";
    }
  },

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
    const headerActiveOptions = document.getElementById("totalOptions");
    const headerLastUpdate = document.getElementById("lastPriceUpdate");

    if (headerTotalValue) {
      headerTotalValue.textContent = app.helpers.formatCurrency(
        stats.totalValue
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

/**
 * Table management for sorting and display
 */
/**
 * Table management for sorting and display
 */

/**
 * Form management - handles Add Grants form logic
 */
const FormManager = {
  /**
   * Clear the Add Grants form
   * MIGRATED FROM: config.js FormManager.clearaddGrantsForm()
   */
  clearaddGrantsForm(app) {
    try {
      const grantDateElement = document.getElementById("grantDate");
      const exercisePriceElement = document.getElementById("exercisePrice");
      const quantityElement = document.getElementById("quantity");
      const actualTaxAmountElement = document.getElementById("actualTaxAmount");
      const estimatedTaxElement = document.getElementById("estimatedTax");
      const helpTextElement = document.getElementById("exercisePriceHelp");

      if (grantDateElement) grantDateElement.value = "";

      if (exercisePriceElement) {
        exercisePriceElement.innerHTML =
          '<option value="">First enter grant date...</option>';
        exercisePriceElement.disabled = true;
      }

      if (quantityElement) quantityElement.value = "";

      if (actualTaxAmountElement) {
        actualTaxAmountElement.value = "";
      }

      if (estimatedTaxElement) estimatedTaxElement.textContent = "€ 0.00";

      if (helpTextElement) {
        helpTextElement.textContent =
          "Options will appear after entering grant date";
      }

      // Clear stored form data
      app.currentFormData = null;
      window.UIStateManager.Validation.validateAddGrantsForm(app);
      console.log("✅ Form and stored data cleared");
    } catch (error) {
      console.warn("⚠️ Error clearing form:", error);
    }
  },

  /**
   * Handle grant date selection - loads available options for the selected date
   * MIGRATED FROM: config.js FormManager.handleGrantDateSelection()
   */
  async handleGrantDateSelection(app) {
    const grantDate = document.getElementById("grantDate").value;
    const exercisePriceSelect = document.getElementById("exercisePrice");
    const helpText = document.getElementById("exercisePriceHelp");

    if (!grantDate) {
      exercisePriceSelect.innerHTML =
        '<option value="">First enter grant date...</option>';
      exercisePriceSelect.disabled = true;
      helpText.textContent = "Options will appear after entering grant date";
      return;
    }

    try {
      const options = await ipcRenderer.invoke(
        "get-options-by-grant-date",
        grantDate
      );

      if (options.error) {
        alert("Error loading options: " + options.error);
        return;
      }

      if (options.length === 0) {
        exercisePriceSelect.innerHTML =
          '<option value="">No options available for this date</option>';
        exercisePriceSelect.disabled = true;
        helpText.textContent =
          "No option plans found for this grant date. Try a different date or update prices.";
        helpText.className = "form-help error";
        return;
      }

      exercisePriceSelect.innerHTML =
        '<option value="">Select an option...</option>';
      options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.exercise_price;
        optionElement.dataset.currentValue = option.current_value;
        optionElement.dataset.fundName = option.fund_name;

        // Show fund name prominently with price and current value
        const fundName = app.helpers.formatFundName(option.fund_name);
        optionElement.textContent = `${fundName} - €${
          option.exercise_price
        } (Current: €${option.current_value || "N/A"})`;

        exercisePriceSelect.appendChild(optionElement);
      });

      exercisePriceSelect.disabled = false;
      helpText.textContent = `Found ${options.length} option(s) for this grant date`;
      helpText.className = "form-help";

      if (options.length === 1) {
        exercisePriceSelect.selectedIndex = 1;
        // Call the tax calculation through FormManager
        this.calculateEstimatedTax(app);
      }
    } catch (error) {
      console.error("Error loading options for grant date:", error);
      exercisePriceSelect.innerHTML =
        '<option value="">Error loading options</option>';
      exercisePriceSelect.disabled = true;
      helpText.textContent = "Error loading options for this date";
      helpText.className = "form-help error";
    }
  },

  /**
   * Calculate estimated tax based on quantity and tax rate
   * MIGRATED FROM: config.js FormManager.calculateEstimatedTax()
   */
  calculateEstimatedTax(app) {
    const quantity = parseInt(document.getElementById("quantity").value) || 0;
    const taxRate = parseFloat(app.taxRate?.value) / 100 || 0.3;
    const estimatedTax = quantity * 10 * taxRate;

    document.getElementById("estimatedTax").textContent =
      app.helpers.formatCurrency(estimatedTax);

    const actualTaxField = document.getElementById("actualTaxAmount");
    if (!actualTaxField.value) {
      actualTaxField.placeholder = app.helpers
        .formatCurrency(estimatedTax)
        .replace("€", "");
    }
  },

  /**
   * Update tax display - provides real-time feedback for tax input
   * MIGRATED FROM: config.js FormManager.updateTaxDisplay()
   */
  updateTaxDisplay(app) {
    // Real-time feedback for tax input
    const actualTax = parseFloat(
      document.getElementById("actualTaxAmount").value
    );
    const estimatedTax = parseFloat(
      document.getElementById("estimatedTax").textContent.replace(/[€,]/g, "")
    );

    // Could add visual feedback here if needed
  },
};
// ADD this enhanced validation system to your FormManager in ui-state-management.js

/**
 * Enhanced form validation with real-time button state management
 */
const FormValidation = {
  /**
   * Validate form and update button state
   * @param {Object} app - Application instance
   */
  validateAddGrantsForm(app) {
    const grantDate = document.getElementById("grantDate")?.value;
    const quantity = document.getElementById("quantity")?.value;

    // ✅ FIX: Use the correct button ID
    const confirmButton = document.getElementById("confirmaddGrants");

    // ALWAYS create validation object first
    const validation = {
      isValid: true,
      errors: [],
    };

    // Check grant date
    if (!grantDate) {
      validation.isValid = false;
      validation.errors.push("Grant date is required");
    } else if (!this.isValidDate(grantDate)) {
      validation.isValid = false;
      validation.errors.push("Grant date must be a valid date<");
    } else if (this.isFutureDate(grantDate)) {
      validation.isValid = false;
      validation.errors.push("Grant date cannot be in the future");
    }

    // Check quantity
    if (!quantity) {
      validation.isValid = false;
      validation.errors.push("Quantity is required");
    } else if (
      !Number.isInteger(parseInt(quantity)) ||
      parseInt(quantity) <= 0
    ) {
      validation.isValid = false;
      validation.errors.push("Quantity must be a positive whole number");
    }

    // Try to update button state
    if (confirmButton) {
      this.updateButtonState(confirmButton, validation);
      console.log(
        "✅ Button state updated:",
        validation.isValid ? "enabled" : "disabled"
      );
    } else {
      console.warn("⚠️ confirmaddGrants button not found");
    }

    // ALWAYS return validation object
    return validation;
  },

  /**
   * Update button state and tooltip
   * @param {Element} button - The button element
   * @param {Object} validation - Validation result
   */
  updateButtonState(button, validation) {
    if (validation.isValid) {
      // Enable button
      button.disabled = false;
      button.classList.remove("btn-disabled");
      button.classList.add("btn-primary");
      button.title = "Add grants to portfolio";
    } else {
      // Disable button
      button.disabled = true;
      button.classList.add("btn-disabled");
      button.classList.remove("btn-primary");

      // ✅ Clean tooltip - prohibition icon only in text, not on button
      const tooltip = validation.errors.map((error) => `${error}`).join("\n");
      button.title = tooltip;
    }
  },
  /**
   * Validate if string is a valid date
   * @param {string} dateString - Date string to validate
   * @returns {boolean}
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Check if date is in the future
   * @param {string} dateString - Date string to check
   * @returns {boolean}
   */
  isFutureDate(dateString) {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return inputDate > today;
  },

  /**
   * Set up real-time validation listeners
   * @param {Object} app - Application instance
   */
  setupValidationListeners(app) {
    const fieldsToWatch = ["grantDate", "exercisePrice", "quantity"];

    fieldsToWatch.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        // Validate on input change
        field.addEventListener("input", () => {
          this.validateAddGrantsForm(app);
        });

        // Validate on focus out
        field.addEventListener("blur", () => {
          this.validateAddGrantsForm(app);
        });
      }
    });

    // Initial validation
    this.validateAddGrantsForm(app);
  },
  /**
   * Validate delete database confirmation text
   * @param {Object} app - Application instance
   */
  validateDeleteConfirmation(app) {
    const input = app.deleteDatabaseConfirmText;
    const confirmBtn = app.confirmDeleteDatabase;

    if (!input || !confirmBtn) {
      console.warn("⚠️ Delete confirmation elements not found");
      return;
    }

    const requiredText = "delete database";
    const userInput = input.value.toLowerCase().trim();

    console.log(
      `🔍 Validating input: "${userInput}" vs required: "${requiredText}"`
    );

    // Remove previous validation classes
    input.classList.remove("valid", "invalid");

    if (userInput === requiredText) {
      // Valid input
      input.classList.add("valid");
      confirmBtn.disabled = false;
      console.log("✅ Delete confirmation text validated - button enabled");
    } else if (userInput.length > 0) {
      // Invalid input (but user is typing)
      input.classList.add("invalid");
      confirmBtn.disabled = true;
      console.log(`❌ Invalid input: "${userInput}" - button disabled`);
    } else {
      // Empty input
      confirmBtn.disabled = true;
      console.log("📝 Empty input - button disabled");
    }
  },
};
/**
 * ===== DATABASE MANAGEMENT FUNCTIONS =====
 * Moved from renderer.js to centralize database operations
 * Add this to your existing ui-state-management.js file
 */
const DatabaseManager = {
  /**
   * Export database to file
   * @param {Object} app - Application instance (optional, for future use)
   */
  async exportDatabase(app = null) {
    try {
      console.log("📤 Starting database export...");
      const result = await window.IPCCommunication.Database.exportDatabase();
      if (app) {
        window.UIStateManager.Modals.closeSettings(app);
        console.log("✅ Settings modal closed before export");
      }
      if (result.success) {
        alert(`Database exported successfully to:\n${result.filePath}`);
        console.log("✅ Database export completed successfully");
      } else {
        alert("Export cancelled or failed");
        console.log("❌ Database export cancelled or failed");
      }
    } catch (error) {
      console.error("❌ Error exporting database:", error);
      alert("Error exporting database: " + error.message);
    }
  },

  /**
   * Import database from file
   * @param {Object} app - Application instance
   * @param {boolean} mergeMode - Whether to merge with existing data
   */
  async importDatabase(app, mergeMode = false) {
    try {
      console.log(`📥 Starting database import (merge: ${mergeMode})...`);

      const confirmMessage = mergeMode
        ? "Are you sure you want to merge the imported data with existing data?"
        : "Are you sure you want to replace all existing data with imported data?\n\nThis action cannot be undone!";

      if (!confirm(confirmMessage)) {
        console.log("📥 Database import cancelled by user");
        return;
      }
      // ✅ FIX: Close settings modal after user confirms but before starting import
      if (app) {
        window.UIStateManager.Modals.closeSettings(app);
        console.log("✅ Settings modal closed before import");
      }

      const result =
        await window.IPCCommunication.Database.importDatabase(mergeMode);

      if (result.success) {
        const successMessage = `Database ${mergeMode ? "merged" : "imported"} successfully!\nImported ${result.importedEntries} entries.`;
        alert(successMessage);
        console.log("✅ Database import completed successfully");

        // Reload data and switch to portfolio tab
        if (app && app.loadPortfolioData) {
          await app.loadPortfolioData();
        }
        if (app) {
          window.UIStateManager.Tabs.switchTab(app, "portfolio");
        }
      } else {
        alert("Import cancelled or failed");
        console.log("❌ Database import cancelled or failed");
      }
    } catch (error) {
      console.error("❌ Error importing database:", error);
      alert("Error importing database: " + error.message);
    }
  },

  /**
   * Debug database state - output to console
   * @param {Object} app - Application instance (optional, for future use)
   */
  async debugDatabase(app = null) {
    try {
      console.log("🔍 Starting database debug...");
      const result = await window.IPCCommunication.Database.debugState();

      console.log("=== DATABASE DEBUG INFO ===");
      console.log("Portfolio Entries:", result.portfolioEntries);
      console.log("Recent Price History:", result.priceHistory);
      console.log("Evolution Data:", result.evolutionData);
      console.log("Counts:", {
        entries: result.entriesCount,
        prices: result.pricesCount,
        evolution: result.evolutionCount,
      });
      console.log("=== END DEBUG ===");

      return result;
    } catch (error) {
      console.error("❌ Debug error:", error);
      return null;
    }
  },
  /**
   * Initialize delete database functionality
   * MIGRATED FROM: renderer.js initializeDeleteDatabase()
   * @param {Object} app - Application instance
   */
  initializeDeleteDatabase(app) {
    console.log("🗑️ Initializing delete database functionality...");

    // Delete database button click handler
    if (app.deleteDatabaseBtn) {
      app.deleteDatabaseBtn.addEventListener("click", () => {
        window.UIStateManager.Modals.showDeleteDatabaseModal(app);
      });
    }

    // Cancel delete database
    if (app.cancelDeleteDatabase) {
      app.cancelDeleteDatabase.addEventListener("click", () => {
        window.UIStateManager.Modals.closeAllModals(app);
      });
    }

    // Confirm delete database
    if (app.confirmDeleteDatabase) {
      app.confirmDeleteDatabase.addEventListener("click", () => {
        this.executeDeleteDatabase(app);
      });
    }

    // Text input validation - use direct DOM query as fallback
    const textInput =
      app.deleteDatabaseConfirmText ||
      document.getElementById("deleteDatabaseConfirmText");
    if (textInput) {
      console.log("✅ Found text input element, attaching validation listener");

      // Add multiple event listeners for better responsiveness
      ["input", "keyup", "paste", "change"].forEach((eventType) => {
        textInput.addEventListener(eventType, (e) => {
          console.log(
            `🔍 Text input event triggered: ${eventType}, value: "${e.target.value}"`
          );
          // Small delay to ensure paste events are processed
          setTimeout(
            () =>
              window.UIStateManager.Validation.validateDeleteConfirmation(app),
            10
          );
        });
      });

      // Test the validation immediately
      console.log("🧪 Testing validation function...");
      setTimeout(
        () => window.UIStateManager.Validation.validateDeleteConfirmation(app),
        10
      );
    } else {
      console.error("❌ Delete confirmation text input not found!");
      console.log(
        "Available element:",
        document.getElementById("deleteDatabaseConfirmText")
      );
    }

    console.log("✅ Delete database functionality initialized");
  },
  /**
   * Execute database deletion with full cleanup
   * @param {Object} app - Application instance
   */
  async executeDeleteDatabase(app) {
    console.log("🗑️ Executing database deletion...");

    try {
      // Show loading state
      if (app.confirmDeleteDatabase) {
        app.confirmDeleteDatabase.textContent = "Deleting...";
        app.confirmDeleteDatabase.disabled = true;
      }

      // Call the backend to delete the database
      console.log("📡 Calling backend delete database method...");
      const result = await window.IPCCommunication.Database.deleteDatabase();

      console.log("📡 Backend response:", result);

      if (result && result.success) {
        console.log("✅ Database deleted successfully");

        // ✅ FIX: Close ALL modals including settings modal
        window.UIStateManager.Modals.closeAllModals(app);

        // ✅ FIX: Explicitly close settings modal in case it's still open
        if (app) {
          window.UIStateManager.Modals.closeSettings(app);
          console.log("✅ Settings modal explicitly closed after delete");
        }

        // Reload the application
        await this.handlePostDeleteCleanup(app);
      } else {
        const errorMsg =
          result?.error || result?.message || "Unknown error occurred";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error deleting database:", error);
      console.error("❌ Full error object:", error);

      alert("Error deleting database: " + (error.message || error.toString()));

      // Reset button state
      if (app.confirmDeleteDatabase) {
        app.confirmDeleteDatabase.textContent = "🗑️ DELETE DATABASE";
        app.confirmDeleteDatabase.disabled = false;
      }
    }
  },

  /**
   * Handle cleanup after database deletion
   * @param {Object} app - Application instance
   */
  async handlePostDeleteCleanup(app) {
    try {
      console.log("🧹 Performing post-delete cleanup...");

      // Clear current portfolio data
      app.portfolioData = [];
      app.salesData = [];
      app.evolutionData = [];

      // Reset UI elements
      if (app.portfolioTableBody) {
        app.portfolioTableBody.innerHTML =
          '<tr><td colspan="100%">No data available</td></tr>';
      }

      // Clear header stats
      if (app.totalPortfolioValue)
        app.totalPortfolioValue.textContent = "€0.00";
      if (app.totalOptions) app.totalOptions.textContent = "0";
      if (app.lastPriceUpdate) app.lastPriceUpdate.textContent = "Never";

      // Switch to portfolio tab
      window.UIStateManager.switchTab("portfolio");

      console.log("✅ Post-delete cleanup completed");

      // Show success message
      window.UIStateManager.showSuccess("Database deleted successfully", 5000);
    } catch (error) {
      console.error("❌ Error during post-delete cleanup:", error);
    }
  },
};

/**
 * Main UI State coordinator
 */
const UIStateManager = {
  /**
   * Initialize UI state management
   * @param {Object} app - Application instance
   */
  initialize(app) {
    console.log("🎨 Initializing UI state management...");

    // Store reference to app for global access
    window.portfolioApp = app;
    // ✅ ADD THIS LINE - Initialize enhanced tab functionality
    TabManager.initializeTabSwitching(app);
    // Initialize table sorting state
    TableManager.initializeSorting(app);

    console.log("✅ UI state management initialized");
    return true;
  },

  // Expose all managers
  Tabs: window.TabManager,
  Modals: window.ModalManager,
  Settings: SettingsManager,
  Notifications: window.NotificationManager,
  ActionButtons: ActionButtonManager,
  Stats: StatsManager,
  Tables: window.TableManager,
  Footer: FooterManager,
  Forms: FormManager,
  Validation: FormValidation,
  Database: DatabaseManager,

  // Convenience methods for easy access
  updatePortfolioStats(overview, targetPercentage = 65) {
    if (window.portfolioApp) {
      StatsManager.updatePortfolioStats(
        window.portfolioApp,
        overview,
        targetPercentage
      );
    }
  },

  /**
   * ENHANCED: Smart table sorting - handles all tab detection automatically
   * @param {string} column - Column to sort by
   */
  smartSortTable(column) {
    if (window.portfolioApp) {
      TableManager.smartSort(window.portfolioApp, column);
    }
  },
  sortTable(column) {
    if (window.portfolioApp) {
      TableManager.smartSort(window.portfolioApp, column);
    }
  },

  switchTab(tabName) {
    if (window.portfolioApp) {
      TabManager.switchTab(window.portfolioApp, tabName);
    }
  },

  showSuccess(message, duration = 3000) {
    NotificationManager.showNotification(
      "priceUpdateNotification",
      message,
      "success"
    );
    if (duration > 0) {
      setTimeout(
        () => NotificationManager.hideNotification("priceUpdateNotification"),
        duration
      );
    }
  },

  showError(message, duration = 5000) {
    NotificationManager.showNotification(
      "priceUpdateNotification",
      message,
      "error"
    );
    if (duration > 0) {
      setTimeout(
        () => NotificationManager.hideNotification("priceUpdateNotification"),
        duration
      );
    }
  },

  closeAllModals() {
    if (window.portfolioApp) {
      ModalManager.closeAllModals(window.portfolioApp);
    }
  },
};

// Export to global scope
window.UIStateManager = UIStateManager;

// Debug logging
console.log(
  "✅ UI State Management loaded with managers:",
  Object.keys(UIStateManager).filter(
    (key) => typeof UIStateManager[key] === "object"
  )
);
