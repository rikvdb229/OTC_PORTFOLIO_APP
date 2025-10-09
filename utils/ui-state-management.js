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
      
      // Add retry mechanism for version loading
      const updateFooterInfo = () => {
        if (appVersionElement) {
          const version = window.AppConfig.APP_CONFIG.VERSION;
          const appName = window.AppConfig.APP_CONFIG.APP_NAME;
          
          if (version && version !== "Loading...") {
            appVersionElement.textContent = `${appName} v${version}`;
          } else {
            appVersionElement.textContent = "Portfolio Tracker v0.3.4"; // Fallback
          }
        }

        if (appStatusElement) {
          const status = window.AppConfig.APP_CONFIG.STATUS;
          appStatusElement.textContent = status && status !== "Loading..." ? status : "Beta Version";
        }

        if (buildDateElement) {
          const buildDate = window.AppConfig.APP_CONFIG.BUILD_DATE;
          buildDateElement.textContent = `Build: ${buildDate && buildDate !== "Loading..." ? buildDate : "10-08-2025"}`;
        }

        // Update window title too
        const currentVersion = window.AppConfig.APP_CONFIG.VERSION;
        const currentAppName = window.AppConfig.APP_CONFIG.APP_NAME;
        if (currentVersion && currentVersion !== "Loading...") {
          document.title = `${currentAppName || "Portfolio Tracker"} v${currentVersion}`;
        } else {
          document.title = "Portfolio Tracker v0.3.4";
        }
      };

      // Update immediately
      updateFooterInfo();

      // Retry after short delays to ensure version is loaded
      setTimeout(updateFooterInfo, 500);
      setTimeout(updateFooterInfo, 1000);

      console.log(
        `🚀 Footer initialized with version info`
      );
    } catch (error) {
      console.error("Error initializing footer:", error);
      
      // Fallback if everything fails
      const appVersionElement = document.getElementById("appVersion");
      const appStatusElement = document.getElementById("appStatus");
      const buildDateElement = document.getElementById("buildDate");
      
      if (appVersionElement) appVersionElement.textContent = "Portfolio Tracker v0.3.1";
      if (appStatusElement) appStatusElement.textContent = "Beta Version";
      if (buildDateElement) buildDateElement.textContent = "Build: 10-08-2025";
      document.title = "Portfolio Tracker v0.3.1";
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

/**
 * Portfolio statistics management
 */

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
      const isinElement = document.getElementById("isin");
      const currentValuePerOptionElement = document.getElementById("currentValuePerOption");
      const totalGrantValueElement = document.getElementById("totalGrantValue");

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

      if (isinElement) isinElement.value = "";

      if (currentValuePerOptionElement) {
        currentValuePerOptionElement.textContent = "€0.00";
      }

      if (totalGrantValueElement) {
        totalGrantValueElement.textContent = "€0.00";
      }

      const currentValueGroup = document.getElementById("currentValueGroup");
      if (currentValueGroup) {
        currentValueGroup.style.display = "none";
      }

      app.currentFormData = null;
      window.UIStateManager.Validation.validateAddGrantsForm(app);
      console.log("✅ Form and stored data cleared");
    } catch (error) {
      console.warn("⚠️ Error clearing form:", error);
    }
  },

  /**
   * Initialize KBC database with progress modal
   */
  async initializeKbcDatabase(app) {
    console.log("🔔 Showing initialization modal...");
    window.UIStateManager.Modals.showModal("updatePricesModal", () => {
      const modal = document.getElementById("updatePricesModal");
      const progressBar = document.getElementById("updateProgressBar");
      const progressText = document.getElementById("updateProgressText");
      const statusOutput = document.getElementById("updateStatusOutput");

      if (modal) modal.style.zIndex = "10001";
      if (progressBar) progressBar.style.width = "10%";
      if (progressText) progressText.textContent = "Initializing database from KBC...";
      if (statusOutput) statusOutput.textContent = "Starting initialization...";

      console.log("✅ Initialization modal shown");
    });

    const progressListener = (event, progressData) => {
      const progressBar = document.getElementById("updateProgressBar");
      const progressText = document.getElementById("updateProgressText");
      const statusOutput = document.getElementById("updateStatusOutput");

      if (progressBar) progressBar.style.width = progressData.percentage + "%";
      if (progressText) progressText.textContent = progressData.text;
      if (statusOutput) statusOutput.textContent = progressData.text;
    };

    window.ipcRenderer.on('kbc-initialization-progress', progressListener);

    try {
      await ipcRenderer.invoke("initialize-kbc-database");

      setTimeout(() => {
        const modal = document.getElementById("updatePricesModal");
        if (modal) {
          modal.style.zIndex = "";
          modal.classList.remove("active");
        }
      }, 1500);
    } catch (error) {
      console.error("Error initializing KBC database:", error);
      const modal = document.getElementById("updatePricesModal");
      if (modal) {
        modal.style.zIndex = "";
        modal.classList.remove("active");
      }
      alert("Error initializing database: " + error.message);
    } finally {
      window.ipcRenderer.removeListener('kbc-initialization-progress', progressListener);
    }
  },

  /**
   * Handle grant date selection - loads available options for the selected date
   * MIGRATED FROM: config.js FormManager.handleGrantDateSelection()
   */
  async handleGrantDateSelection(app) {
    const grantSource = document.getElementById('grantSource')?.value;
    if (grantSource === 'ING') {
      return;
    }
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
        console.log("🔄 Auto-selected single option, triggering handleExercisePriceSelection");
        if (app.handleExercisePriceSelection) {
          await app.handleExercisePriceSelection();
        }
      }
    } catch (error) {
      console.error("Error loading options for grant date:", error);
      exercisePriceSelect.innerHTML =
        '<option value="">Error loading options</option>';
      exercisePriceSelect.disabled = true;
      helpText.textContent = "Error loading options for this date";
      helpText.className = "form-help error";

      const modal = document.getElementById("updatePricesModal");
      if (modal) modal.style.zIndex = "";
      window.UIStateManager.Modals.closeAllModals(app);
    } finally {
      if (progressListener) {
        window.ipcRenderer.removeListener('kbc-initialization-progress', progressListener);
      }
    }
  },

  /**
   * Calculate estimated tax based on quantity and tax rate
   * MIGRATED FROM: config.js FormManager.calculateEstimatedTax()
   */
  calculateEstimatedTax(app) {
    const quantity = parseInt(document.getElementById("quantity").value) || 0;
    const taxRate = parseFloat(app.taxRate?.value) / 100 || 0.3;
    
    // Get the current value per option (from historical price fetch or fallback to 10)
    let valuePerOption = 10; // Default fallback
    const currentValueElement = document.getElementById("currentValuePerOption");
    if (currentValueElement && currentValueElement.textContent !== "€0.00") {
      const valueText = currentValueElement.textContent.replace("€", "");
      const parsedValue = parseFloat(valueText);
      if (!isNaN(parsedValue) && parsedValue > 0) {
        valuePerOption = parsedValue;
      }
    }
    
    const estimatedTax = quantity * valuePerOption * taxRate;

    document.getElementById("estimatedTax").textContent =
      app.helpers.formatCurrency(estimatedTax);

    const actualTaxField = document.getElementById("actualTaxAmount");
    if (!actualTaxField.value) {
      actualTaxField.placeholder = app.helpers
        .formatCurrency(estimatedTax)
        .replace("€", "");
    }
    
    console.log(`💰 Tax calculation: ${quantity} options × €${valuePerOption} × ${(taxRate * 100)}% = ${app.helpers.formatCurrency(estimatedTax)}`);
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
  /**
   * Clear and set up sell form defaults
   * @param {Object} app - Application instance
   */
  clearSellForm(app) {
    if (!app.currentSellEntry) return;

    // Set up sale date field
    const saleDateInput = document.getElementById("saleDate");
    if (saleDateInput) {
      const today = new Date().toISOString().split("T")[0];
      saleDateInput.value = today;
      saleDateInput.max = today;
    }

    // Set up quantity field
    const quantityInput = document.getElementById("quantityToSell");
    if (quantityInput) {
      quantityInput.max = app.currentSellEntry.quantity_remaining;
      quantityInput.value = ""; // Start empty
    }

    // Set up price field with current value
    const priceInput = document.getElementById("salePrice");
    if (priceInput) {
      priceInput.value = app.currentSellEntry.current_value || "";
    }

    // Update help text
    const maxQuantityHelp = document.getElementById("maxQuantityHelp");
    if (maxQuantityHelp) {
      maxQuantityHelp.textContent = `Maximum available: ${app.currentSellEntry.quantity_remaining.toLocaleString()} options`;
    }

    // Clear notes
    const notesInput = document.getElementById("saleNotes");
    if (notesInput) {
      notesInput.value = "";
    }

    console.log("✅ Sell form cleared and set up");
  },
  /**
   * Clear and set up edit sale form defaults
   * @param {Object} app - Application instance
   * @param {Object} saleData - Sale data from database
   */
  clearEditSaleForm(app, saleData) {
    if (!saleData) return;

    // Set up sale date field
    const saleDateInput = document.getElementById("editSaleDate");
    if (saleDateInput && saleData.sale_date) {
      try {
        const saleDate = new Date(saleData.sale_date);
        saleDateInput.value = saleDate.toISOString().split("T")[0];
        const today = new Date().toISOString().split("T")[0];
        saleDateInput.max = today;
      } catch (dateError) {
        console.warn("⚠️ Error setting sale date:", dateError);
      }
    }

    // Set up price field
    const salePriceInput = document.getElementById("editSalePrice");
    if (salePriceInput && saleData.sale_price !== undefined) {
      salePriceInput.value = Number(saleData.sale_price).toFixed(2);
    }

    // Set up notes field
    const notesInput = document.getElementById("editSaleNotes");
    if (notesInput) {
      notesInput.value = saleData.notes || "";
    }

    console.log("✅ Edit sale form cleared and set up");
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
    const grantSource = document.getElementById('grantSource')?.value;
    const grantDate = document.getElementById("grantDate")?.value;
    const quantity = document.getElementById("quantity")?.value;
    const exercisePrice = document.getElementById("exercisePrice")?.value;
    const isin = document.getElementById("isin")?.value;

    const confirmButton = document.getElementById("confirmaddGrants");

    const validation = {
      isValid: true,
      errors: [],
    };

    if (!grantDate) {
      validation.isValid = false;
      validation.errors.push("Grant date is required");
    } else if (!this.isValidDate(grantDate)) {
      validation.isValid = false;
      validation.errors.push("Grant date must be a valid date");
    } else if (this.isFutureDate(grantDate)) {
      validation.isValid = false;
      validation.errors.push("Grant date cannot be in the future");
    }

    if (!quantity || !Number.isInteger(parseInt(quantity)) || parseInt(quantity) <= 0) {
      validation.isValid = false;
      validation.errors.push("Quantity must be a positive whole number");
    }

    if (grantSource === 'KBC') {
      if (!exercisePrice) {
        validation.isValid = false;
        validation.errors.push("Please select an available option");
      }
    } else if (grantSource === 'ING') {
      if (!isin || isin.length !== 12) {
        validation.isValid = false;
        validation.errors.push("A valid 12-character ISIN is required");
      } else if (!exercisePrice) {
        validation.isValid = false;
        validation.errors.push("Waiting for product information from ISIN...");
      }
    }

    if (confirmButton) {
      this.updateButtonState(confirmButton, validation);
    }

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
    const fieldsToWatch = ["grantDate", "exercisePrice", "quantity", "isin"];

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
  /**
   * Validate sell grants form and update button state
   * @param {Object} app - Application instance
   */
  /**
   * Enhanced validation for sell grants form WITH SELLABLE DATE VALIDATION
   * @param {Object} app - Application instance
   */
  validateSellGrantsForm(app) {
    if (!app.currentSellEntry) {
      console.log("No current sell entry, skipping validation");
      return { isValid: false, errors: ["No option selected for sale"] };
    }

    const saleDate = document.getElementById("saleDate")?.value;
    const quantityToSell = document.getElementById("quantityToSell")?.value;
    const salePrice = document.getElementById("salePrice")?.value;
    const confirmButton = document.getElementById("confirmSellOptions");

    const validation = {
      isValid: true,
      errors: [],
    };

    // Validate sale date
    if (!saleDate) {
      validation.isValid = false;
      validation.errors.push("Sale date is required");
    } else if (!this.isValidDate(saleDate)) {
      validation.isValid = false;
      validation.errors.push("Sale date must be a valid date");
    } else if (this.isFutureDate(saleDate)) {
      validation.isValid = false;
      validation.errors.push("Sale date cannot be in the future");
    } else if (
      !this.isDateWithinSellablePeriod(saleDate, app.currentSellEntry)
    ) {
      // *** NEW: Validate against sellable period ***
      const sellableDate = app.currentSellEntry.can_sell_after;
      const expiresDate = app.currentSellEntry.expires_on;

      if (new Date(saleDate) < new Date(sellableDate)) {
        validation.isValid = false;
        validation.errors.push(
          `Sale date cannot be before ${new Date(sellableDate).toLocaleDateString()} (1-year waiting period)`
        );
      } else if (new Date(saleDate) > new Date(expiresDate)) {
        validation.isValid = false;
        validation.errors.push(
          `Sale date cannot be after ${new Date(expiresDate).toLocaleDateString()} (options expired)`
        );
      }
    }

    // Validate quantity to sell
    if (!quantityToSell) {
      validation.isValid = false;
      validation.errors.push("Quantity to sell is required");
    } else {
      const qty = parseInt(quantityToSell);
      if (!Number.isInteger(qty) || qty <= 0) {
        validation.isValid = false;
        validation.errors.push("Quantity must be a positive whole number");
      } else if (qty > app.currentSellEntry.quantity_remaining) {
        validation.isValid = false;
        validation.errors.push(
          `Cannot sell more than ${app.currentSellEntry.quantity_remaining.toLocaleString()} available options`
        );
      }
    }

    // Validate sale price
    if (!salePrice) {
      validation.isValid = false;
      validation.errors.push("Sale price is required");
    } else {
      const price = parseFloat(salePrice);
      if (isNaN(price) || price <= 0) {
        validation.isValid = false;
        validation.errors.push("Sale price must be a positive number");
      } else if (price > 999999) {
        validation.isValid = false;
        validation.errors.push("Sale price seems unreasonably high");
      }
    }

    // Update button state
    if (confirmButton) {
      this.updateSellButtonState(confirmButton, validation);
      console.log(
        "✅ Sell button state updated:",
        validation.isValid ? "enabled" : "disabled"
      );
    }

    return validation;
  },

  /**
   * Update sell button state and tooltip
   * @param {Element} button - The button element
   * @param {Object} validation - Validation result
   */
  updateSellButtonState(button, validation) {
    if (validation.isValid) {
      button.disabled = false;
      button.classList.remove("btn-disabled");
      button.classList.add("btn-danger");
      button.title = "Record the sale of these options";
    } else {
      button.disabled = true;
      button.classList.add("btn-disabled");
      button.classList.remove("btn-danger");
      const tooltip = validation.errors.map((error) => `• ${error}`).join("\n");
      button.title = tooltip;
    }
  },

  /**
   * Set up real-time validation listeners for sell modal
   * @param {Object} app - Application instance
   */
  setupSellValidationListeners(app) {
    const fieldsToWatch = ["saleDate", "quantityToSell", "salePrice"];

    fieldsToWatch.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener("input", () => {
          this.validateSellGrantsForm(app);
          if (typeof app.calculateSaleProceeds === "function") {
            app.calculateSaleProceeds();
          }
        });

        field.addEventListener("blur", () => {
          this.validateSellGrantsForm(app);
        });

        console.log(`✅ Validation listener added to ${fieldId}`);
      }
    });
  },
  /**
   * Validate edit sale form and update button state
   * @param {Object} app - Application instance
   */
  /**
   * Enhanced validation for edit sale form WITH SELLABLE DATE VALIDATION
   * @param {Object} app - Application instance
   */
  async validateEditSaleForm(app) {
    if (!app.currentEditingSaleId) {
      console.log("No edit sale ID, skipping validation");
      return { isValid: false, errors: ["No sale selected for editing"] };
    }

    const saleDate = document.getElementById("editSaleDate")?.value;
    const salePrice = document.getElementById("editSalePrice")?.value;
    const confirmButton = document.getElementById("confirmEditSale");

    const validation = {
      isValid: true,
      errors: [],
    };

    // *** NEW: Get the original portfolio entry data for validation ***
    const originalSaleData = await this.getOriginalSaleData(
      app.currentEditingSaleId
    );

    if (!originalSaleData) {
      validation.isValid = false;
      validation.errors.push(
        "Could not load original sale data for validation"
      );
    } else {
      // Validate sale date against sellable period
      if (!saleDate) {
        validation.isValid = false;
        validation.errors.push("Sale date is required");
      } else if (!this.isValidDate(saleDate)) {
        validation.isValid = false;
        validation.errors.push("Sale date must be a valid date");
      } else if (this.isFutureDate(saleDate)) {
        validation.isValid = false;
        validation.errors.push("Sale date cannot be in the future");
      } else if (!this.isDateWithinSellablePeriod(saleDate, originalSaleData)) {
        // *** NEW: Validate against sellable period ***
        const sellableDate = originalSaleData.can_sell_after;
        const expiresDate = originalSaleData.expires_on;

        if (new Date(saleDate) < new Date(sellableDate)) {
          validation.isValid = false;
          validation.errors.push(
            `Sale date cannot be before ${new Date(sellableDate).toLocaleDateString()} (1-year waiting period)`
          );
        } else if (new Date(saleDate) > new Date(expiresDate)) {
          validation.isValid = false;
          validation.errors.push(
            `Sale date cannot be after ${new Date(expiresDate).toLocaleDateString()} (options expired)`
          );
        }
      }
    }

    // Validate sale price
    if (!salePrice) {
      validation.isValid = false;
      validation.errors.push("Sale price is required");
    } else {
      const price = parseFloat(salePrice);
      if (isNaN(price) || price <= 0) {
        validation.isValid = false;
        validation.errors.push("Sale price must be a positive number");
      } else if (price > 999999) {
        validation.isValid = false;
        validation.errors.push("Sale price seems unreasonably high");
      }
    }

    // Update button state
    if (confirmButton) {
      this.updateEditSaleButtonState(confirmButton, validation);
      console.log(
        "✅ Edit sale button state updated:",
        validation.isValid ? "enabled" : "disabled"
      );
    }

    return validation;
  },
  /**
   * Check if a date is within the sellable period for an option
   * @param {string} dateString - Date to check (YYYY-MM-DD)
   * @param {Object} optionData - Option data with can_sell_after and expires_on
   * @returns {boolean} True if date is within sellable period
   */
  isDateWithinSellablePeriod(dateString, optionData) {
    if (!optionData || !optionData.can_sell_after || !optionData.expires_on) {
      console.warn("Missing sellable period data for validation");
      return true; // Allow if data is missing (graceful degradation)
    }

    const checkDate = new Date(dateString);
    const sellableDate = new Date(optionData.can_sell_after);
    const expiresDate = new Date(optionData.expires_on);

    return checkDate >= sellableDate && checkDate <= expiresDate;
  },

  /**
   * Get original sale data for edit validation
   * @param {number} saleId - Sale ID
   * @returns {Object} Original portfolio entry data
   */
  async getOriginalSaleData(saleId) {
    try {
      // Get sale details with portfolio entry info
      const result = await window.ipcRenderer.invoke(
        "get-sale-with-portfolio-data",
        saleId
      );

      if (result.error) {
        console.error("Error getting original sale data:", result.error);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Error fetching original sale data:", error);
      return null;
    }
  },

  // ===== ENHANCED DATE INPUT RESTRICTIONS =====

  /**
   * Set up date input restrictions for sell modal
   * @param {Object} app - Application instance
   */
  setupSellDateRestrictions(app) {
    if (!app.currentSellEntry) return;

    const dateInput = document.getElementById("saleDate");
    if (!dateInput) return;

    // Set min and max dates based on sellable period
    const minDate = app.currentSellEntry.can_sell_after;
    const maxDate = app.currentSellEntry.expires_on;
    const today = new Date().toISOString().split("T")[0];

    // Set restrictions
    dateInput.min = minDate;
    dateInput.max = Math.min(maxDate, today); // Cannot be future or past expiry

    // Set default to today (if within valid range)
    if (!dateInput.value) {
      if (today >= minDate && today <= maxDate) {
        dateInput.value = today;
      } else if (today < minDate) {
        dateInput.value = minDate;
      } else {
        dateInput.value = maxDate;
      }
    }

    console.log(
      `📅 Date restrictions set: ${minDate} to ${Math.min(maxDate, today)}`
    );
  },

  /**
   * Set up date input restrictions for edit sale modal
   * @param {Object} originalSaleData - Original portfolio entry data
   */
  setupEditSaleDateRestrictions(originalSaleData) {
    if (!originalSaleData) return;

    const dateInput = document.getElementById("editSaleDate");
    if (!dateInput) return;

    // Set min and max dates based on sellable period
    const minDate = originalSaleData.can_sell_after;
    const maxDate = originalSaleData.expires_on;
    const today = new Date().toISOString().split("T")[0];

    // Set restrictions
    dateInput.min = minDate;
    dateInput.max = Math.min(maxDate, today); // Cannot be future or past expiry

    console.log(
      `📅 Edit date restrictions set: ${minDate} to ${Math.min(maxDate, today)}`
    );
  },

  /**
   * Update edit sale button state and tooltip
   * @param {Element} button - The button element
   * @param {Object} validation - Validation result
   */
  updateEditSaleButtonState(button, validation) {
    if (validation.isValid) {
      button.disabled = false;
      button.classList.remove("btn-disabled");
      button.classList.add("btn-primary");
      button.title = "Update the sale record";
    } else {
      button.disabled = true;
      button.classList.add("btn-disabled");
      button.classList.remove("btn-primary");
      const tooltip = validation.errors.map((error) => `• ${error}`).join("\n");
      button.title = tooltip;
    }
  },

  /**
   * Set up real-time validation listeners for edit sale modal
   * @param {Object} app - Application instance
   */
  setupEditSaleValidationListeners(app) {
    const fieldsToWatch = ["editSaleDate", "editSalePrice"];

    fieldsToWatch.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener("input", () => {
          this.validateEditSaleForm(app);
          // Update calculations when price changes
          if (fieldId === "editSalePrice" && app.editSaleInputHandler) {
            app.editSaleInputHandler();
          }
        });

        field.addEventListener("blur", () => {
          this.validateEditSaleForm(app);
        });

        console.log(`✅ Edit sale validation listener added to ${fieldId}`);
      }
    });
  },
};
/**
 * ===== DATABASE MANAGEMENT FUNCTIONS =====
 * Moved from renderer.js to centralize database operations
 * Add this to your existing ui-state-management.js file
 */
const DatabaseManager = {
  /**
   * Export database to file with notification support only
   * @param {Object} app - Application instance
   */
  async exportDatabase(app = null) {
    try {
      console.log("📤 Starting database export...");

      // Close settings modal first
      if (app) {
        window.UIStateManager.Modals.closeSettings(app);
        console.log("✅ Settings modal closed before export");
      }

      const result = await window.IPCCommunication.Database.exportDatabase();

      if (result.success) {
        // Show success notification with file path
        const successMessage = `Database exported successfully to: ${result.filePath}`;
        window.UIStateManager.showSuccess(successMessage, 8000);

        console.log("✅ Database export completed successfully");
      } else {
        window.UIStateManager.showError("Export cancelled or failed");
        console.log("❌ Database export cancelled or failed");
      }
    } catch (error) {
      console.error("❌ Error exporting database:", error);
      window.UIStateManager.showError(
        "Error exporting database: " + error.message
      );
    }
  },

  /**
   * Import database from file - now handled by ModalManager
   * @param {Object} app - Application instance
   * @param {boolean} mergeMode - Whether to merge with existing data
   */
  async importDatabase(app, mergeMode = false) {
    // This method is now deprecated in favor of the ModalManager
    // Redirect to ModalManager
    console.log("📥 Redirecting to ModalManager import modal");
    window.UIStateManager.Modals.showImportDatabaseModal(app);
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
  ActionButtons: window.ActionButtonManager,
  Stats: window.StatsManager,
  Tables: window.TableManager,
  Footer: FooterManager,
  Forms: FormManager,
  Validation: FormValidation,
  Database: DatabaseManager,

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
