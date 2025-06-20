/**
 * ===== UI STATE MANAGEMENT UTILITY - COMPLETE MERGED VERSION =====
 * Centralized UI state management for modals, tabs, notifications, and portfolio stats
 * Your excellent existing structure + additional functionality
 */

/**
 * Tab navigation management
 */
/**
 * Enhanced Tab navigation management
 */
const TabManager = {
  /**
   * Switch to a specific tab (ENHANCED VERSION)
   * @param {Object} app - Application instance
   * @param {string} tabName - Name of tab to switch to
   */
  switchTab(app, tabName) {
    try {
      console.log(`🗂️ Switching to tab: ${tabName}`);

      // Update active tab state
      app.activeTab = tabName;

      // Hide all tab content
      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.remove("active");
      });

      // Hide all tab headers
      document.querySelectorAll(".tab-header-content").forEach((header) => {
        header.classList.remove("active");
      });

      // Show selected tab content
      const selectedTab = document.getElementById(`${tabName}-tab`);
      if (selectedTab) {
        selectedTab.classList.add("active");
      }

      // Show corresponding tab header
      const selectedHeader = document.getElementById(`${tabName}-tab-header`);
      if (selectedHeader) {
        selectedHeader.classList.add("active");
      }

      // Update nav button states using safer approach
      this.updateNavButtons(app, tabName);

      // Update tab content visibility using app reference
      this.updateTabContent(app, tabName);

      // Load tab-specific data
      this.loadTabData(app, tabName);

      // Store current tab in state (if currentState exists)
      if (typeof currentState !== "undefined") {
        currentState.activeTab = tabName;
      }

      // Trigger custom event for tab change
      document.dispatchEvent(
        new CustomEvent("tabChanged", {
          detail: { tabName },
        })
      );

      console.log(`✅ Successfully switched to ${tabName} tab`);
    } catch (error) {
      console.error("❌ Error switching tabs:", error);
    }
  },

  /**
   * Update navigation button states
   * @param {Object} app - Application instance
   * @param {string} activeTabName - Currently active tab
   */
  updateNavButtons(app, activeTabName) {
    // Clear all active states
    document.querySelectorAll(".nav-tab").forEach((nav) => {
      nav.classList.remove("active");
    });

    // Set active state on current tab
    const activeNavTab = document.querySelector(
      `[data-tab="${activeTabName}"]`
    );
    if (activeNavTab) {
      activeNavTab.classList.add("active");
    }

    // Update using app.navTabs if available
    if (app.navTabs && app.navTabs.length > 0) {
      app.navTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === activeTabName);
      });
    }
  },

  /**
   * Update tab content visibility
   * @param {Object} app - Application instance
   * @param {string} activeTabName - Currently active tab
   */
  updateTabContent(app, activeTabName) {
    // Update using app.tabContents if available
    if (app.tabContents && app.tabContents.length > 0) {
      app.tabContents.forEach((content) => {
        content.classList.toggle(
          "active",
          content.id === `${activeTabName}-tab`
        );
      });
    }
  },

  /**
   * Load data for specific tab (ENHANCED VERSION)
   * @param {Object} app - Application instance
   * @param {string} tabName - Name of tab
   */
  loadTabData(app, tabName) {
    console.log(`📊 Loading data for ${tabName} tab...`);

    switch (tabName) {
      case "evolution":
        if (app.loadEvolutionData) {
          console.log("📈 Loading evolution data...");
          app.loadEvolutionData("all");
        }
        break;

      case "chart":
        if (app.loadChartData) {
          console.log("📊 Loading chart data...");
          app.loadChartData("all");
        }
        break;

      case "sales-history":
        if (app.loadSalesHistory) {
          console.log("💰 Loading sales history...");
          app.loadSalesHistory();
        }
        break;

      case "grant-history":
        if (app.loadGrantHistory) {
          console.log("📋 Loading grant history...");
          app.loadGrantHistory();
        }
        break;

      case "portfolio":
        // Portfolio data loads automatically, but refresh if needed
        if (app.loadPortfolioData) {
          console.log("🗂️ Refreshing portfolio data...");
          app.loadPortfolioData();
        }
        break;

      default:
        console.log(`ℹ️ No specific data loading for tab: ${tabName}`);
    }
  },

  /**
   * Get the currently active tab
   * @returns {string} The name of the active tab
   */
  getCurrentTab() {
    const activeTab = document.querySelector(".nav-tab.active");
    return activeTab ? activeTab.getAttribute("data-tab") : "portfolio";
  },

  /**
   * Switch to next tab (for keyboard shortcuts)
   * @param {Object} app - Application instance
   */
  switchToNextTab(app) {
    const tabs = [
      "portfolio",
      "evolution",
      "chart",
      "sales-history",
      "grant-history",
    ];
    const currentIndex = tabs.indexOf(app.activeTab || this.getCurrentTab());
    const nextIndex = (currentIndex + 1) % tabs.length;
    this.switchTab(app, tabs[nextIndex]);
  },

  /**
   * Switch to previous tab (for keyboard shortcuts)
   * @param {Object} app - Application instance
   */
  switchToPreviousTab(app) {
    const tabs = [
      "portfolio",
      "evolution",
      "chart",
      "sales-history",
      "grant-history",
    ];
    const currentIndex = tabs.indexOf(app.activeTab || this.getCurrentTab());
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    this.switchTab(app, tabs[prevIndex]);
  },

  /**
   * Initialize enhanced tab switching functionality
   * @param {Object} app - Application instance
   */
  initializeTabSwitching(app) {
    try {
      console.log("🗂️ Initializing enhanced tab switching...");

      // Set up click handlers for tab navigation
      document.querySelectorAll(".nav-tab").forEach((tab) => {
        tab.addEventListener("click", (event) => {
          event.preventDefault();
          const tabName = tab.getAttribute("data-tab");
          if (tabName) {
            this.switchTab(app, tabName);
          }
        });
      });

      // Set up keyboard shortcuts
      document.addEventListener("keydown", (event) => {
        // Escape key functionality (if not handled elsewhere)
        if (event.key === "Escape") {
          // Close modals if any are open
          if (window.UIStateManager && window.UIStateManager.closeAllModals) {
            window.UIStateManager.closeAllModals();
          }
        }

        // Ctrl/Cmd + Tab switches between tabs
        if ((event.ctrlKey || event.metaKey) && event.key === "Tab") {
          event.preventDefault();
          this.switchToNextTab(app);
        }

        // Ctrl/Cmd + Shift + Tab switches to previous tab
        if (
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === "Tab"
        ) {
          event.preventDefault();
          this.switchToPreviousTab(app);
        }
      });

      // Initialize with portfolio tab
      this.switchTab(app, "portfolio");

      console.log("✅ Enhanced tab switching initialized");
    } catch (error) {
      console.error("❌ Error initializing tab switching:", error);
    }
  },

  /**
   * Validate tab exists before switching
   * @param {string} tabName - Tab name to validate
   * @returns {boolean} True if tab exists
   */
  validateTab(tabName) {
    const tabElement = document.getElementById(`${tabName}-tab`);
    const navElement = document.querySelector(`[data-tab="${tabName}"]`);

    if (!tabElement || !navElement) {
      console.warn(`⚠️ Tab '${tabName}' not found in DOM`);
      return false;
    }

    return true;
  },

  /**
   * Safe tab switch with validation
   * @param {Object} app - Application instance
   * @param {string} tabName - Name of tab to switch to
   */
  safeTabSwitch(app, tabName) {
    if (this.validateTab(tabName)) {
      this.switchTab(app, tabName);
    } else {
      console.error(`❌ Cannot switch to invalid tab: ${tabName}`);
      // Fall back to portfolio tab
      if (tabName !== "portfolio" && this.validateTab("portfolio")) {
        this.switchTab(app, "portfolio");
      }
    }
  },
};

/**
 * Modal management
 */
const ModalManager = {
  /**
   * Show a specific modal
   * @param {string} modalId - ID of modal to show
   * @param {Function} setupCallback - Optional setup function
   */
  showModal(modalId, setupCallback = null) {
    console.log(`📱 Showing modal: ${modalId}`);

    const modal = window.DOMHelpers.safeGetElementById(modalId);
    if (!modal) {
      console.error(`❌ Modal not found: ${modalId}`);
      return false;
    }

    // Run setup callback if provided
    if (setupCallback && typeof setupCallback === "function") {
      try {
        setupCallback();
      } catch (error) {
        console.error(`❌ Error in modal setup callback:`, error);
      }
    }

    // Show the modal
    modal.classList.add("active");
    return true;
  },

  /**
   * Close all modals
   * @param {Object} app - Application instance for cleanup
   */
  /**
   * Close all modals
   * @param {Object} app - Application instance for cleanup
   */
  closeAllModals(app) {
    console.log("📱 Closing all modals");

    const modals = window.DOMHelpers.safeQuerySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.classList.remove("active");

      // 🆕 Clear user input fields only (not display elements)
      const inputs = modal.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        // Skip read-only and disabled inputs
        if (input.readOnly || input.disabled) return;

        if (input.type === "checkbox" || input.type === "radio") {
          input.checked = false;
        } else {
          input.value = "";
        }
      });

      // 🆕 Clear ONLY user-editable calculated displays (be very selective)
      const userEditableDisplays = modal.querySelectorAll(
        "#estimatedTax, #totalSaleValue, #netProceeds, #proportionalTax, " +
          ".calculated-value:not(.persistent), .display-value:not(.persistent)"
      );
      userEditableDisplays.forEach((display) => {
        if (display.textContent !== undefined) {
          display.textContent = "";
        }
      });

      // 🆕 Reset select elements to their first option (but not disabled ones)
      const selects = modal.querySelectorAll("select:not([disabled])");
      selects.forEach((select) => {
        if (select.options.length > 0) {
          select.selectedIndex = 0;
        }
      });

      // 🆕 DO NOT clear these important display elements:
      // - autoTaxAmount, currentTaxAmount (edit tax modal)
      // - canvas elements (charts)
      // - Any element with class 'persistent'
      // - Any element with data-preserve="true"
    });

    // Reset modal-related state
    this.resetModalState(app);

    // 🆕 Ensure body scrolling is restored
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  },

  /**
/**
 * Reset modal-related application state
 * @param {Object} app - Application instance
 */
  resetModalState(app) {
    // Reset editing state
    app.currentEditingTaxId = null;
    app.currentDeletingEntryId = null;
    app.currentSellEntry = null;
    app.existingGrant = null;
    app.newGrantQuantity = null;
    app.newGrantTaxAmount = null;

    // ADD THIS LINE:
    app.currentEditingSaleId = null;

    // Clean up event listeners
    if (app.editSaleInputHandler) {
      const salePriceInput =
        window.DOMHelpers.safeGetElementById("editSalePrice");
      if (salePriceInput) {
        salePriceInput.removeEventListener("input", app.editSaleInputHandler);
      }
      app.editSaleInputHandler = null;
    }
  },

  /**
   * Show Add Options modal with setup
   * @param {Object} app - Application instance
   */
  showAddOptionsModal(app) {
    this.showModal("addOptionsModal", () => {
      // Reset form fields
      window.DOMHelpers.safeSetContent(
        window.DOMHelpers.safeGetElementById("grantDate"),
        ""
      );

      const exercisePriceSelect =
        window.DOMHelpers.safeGetElementById("exercisePrice");
      if (exercisePriceSelect) {
        exercisePriceSelect.innerHTML =
          '<option value="">First enter grant date...</option>';
        exercisePriceSelect.disabled = true;
      }

      // Reset other form fields
      const fieldsToReset = ["quantity", "actualTaxAmount"];
      fieldsToReset.forEach((fieldId) => {
        const field = window.DOMHelpers.safeGetElementById(fieldId);
        if (field) field.value = "";
      });

      // Reset estimated tax display
      window.DOMHelpers.safeSetContent(
        window.DOMHelpers.safeGetElementById("estimatedTax"),
        "€ 0.00"
      );

      // Reset help text
      window.DOMHelpers.safeSetContent(
        window.DOMHelpers.safeGetElementById("exercisePriceHelp"),
        "Options will appear after entering grant date"
      );
    });
  },

  /**
   * Show merge grants modal with data
   * @param {Object} app - Application instance
   * @param {Array} existingGrants - Existing grant data
   * @param {number} newQuantity - New quantity to merge
   * @param {number} newTaxAmount - New tax amount
   */
  showMergeGrantsModal(app, existingGrants, newQuantity, newTaxAmount) {
    console.log("🔄 Showing merge modal with data:", {
      existingGrants,
      newQuantity,
      newTaxAmount,
    });

    const modalExists = this.showModal("mergeGrantsModal");
    if (!modalExists) {
      console.warn(
        "⚠️ Merge grants modal not found, proceeding with separate grant"
      );
      if (app.proceedWithSeparateGrant) {
        app.proceedWithSeparateGrant();
      }
      return;
    }

    // Store data for later use
    app.existingGrants = Array.isArray(existingGrants)
      ? existingGrants
      : [existingGrants];
    app.newGrantQuantity = newQuantity;
    app.newGrantTaxAmount = newTaxAmount;

    // Populate modal fields
    this.populateMergeModalFields(
      app.existingGrants[0],
      newQuantity,
      newTaxAmount
    );
  },

  /**
   * Populate merge modal fields
   * @param {Object} existingGrant - Existing grant data
   * @param {number} newQuantity - New quantity
   * @param {number} newTaxAmount - New tax amount
   */
  populateMergeModalFields(existingGrant, newQuantity, newTaxAmount) {
    // First populate the basic fields that always exist
    const baseFields = {
      existingGrantDate: new Date(
        existingGrant.grant_date
      ).toLocaleDateString(),
      existingExercisePrice: `€${existingGrant.exercise_price}`,
      existingQuantity: existingGrant.quantity_remaining?.toString() || "0",
    };

    // Populate base fields
    for (const [fieldId, value] of Object.entries(baseFields)) {
      const element = window.DOMHelpers.safeGetElementById(fieldId);
      if (element) {
        window.DOMHelpers.safeSetContent(element, value);
      }
    }

    // ✅ Handle new quantity fields (both single and multiple versions)
    const newQtyValue = newQuantity?.toString() || "0";

    // Try both possible element IDs from your HTML
    const newQuantitySingle =
      window.DOMHelpers.safeGetElementById("newQuantitySingle");
    const newQuantityMultiple = window.DOMHelpers.safeGetElementById(
      "newQuantityMultiple"
    );

    if (newQuantitySingle) {
      window.DOMHelpers.safeSetContent(newQuantitySingle, newQtyValue);
    }
    if (newQuantityMultiple) {
      window.DOMHelpers.safeSetContent(newQuantityMultiple, newQtyValue);
    }

    // ✅ Calculate and display total after merge in mergeDetails element
    const totalAfter =
      (existingGrant.quantity_remaining || 0) + (newQuantity || 0);
    const mergeDetails = window.DOMHelpers.safeGetElementById("mergeDetails");
    if (mergeDetails) {
      window.DOMHelpers.safeSetContent(
        mergeDetails,
        `- Add to existing grant (Total: ${totalAfter.toLocaleString()} options)`
      );
    }

    console.log("✅ Merge modal fields populated successfully", {
      existingGrant: existingGrant.quantity_remaining,
      newQuantity,
      totalAfter,
      foundElements: {
        newQuantitySingle: !!newQuantitySingle,
        newQuantityMultiple: !!newQuantityMultiple,
        mergeDetails: !!mergeDetails,
      },
    });
  },
  /**
   /**

// FIXED: showEditSaleModal with proper context binding
// Replace the existing showEditSaleModal method in utils/ui-state-management.js

/**
 * Show edit sale modal with sale data (FIXED: Context binding)
 * @param {Object} app - Application instance
 * @param {number} saleId - ID of the sale to edit
 */
  async showEditSaleModal(app, saleId) {
    try {
      console.log(`✏️ Showing edit sale modal for ID: ${saleId}`);
      console.log(`📊 SaleId type: ${typeof saleId}, value: ${saleId}`);

      // Validate saleId
      if (!saleId || isNaN(saleId)) {
        console.error("❌ Invalid saleId:", saleId);
        alert("Error: Invalid sale ID");
        return false;
      }

      // Get sale details from database
      console.log("📡 Requesting sale details from database...");
      const saleData = await ipcRenderer.invoke("get-sale-details", saleId);

      console.log("📦 Raw sale data received:", saleData);

      // Check for errors in response
      if (saleData && saleData.error) {
        console.error(
          "❌ Database error loading sale details:",
          saleData.error
        );
        alert("Error loading sale details: " + saleData.error);
        return false;
      }

      // Check if saleData is null or undefined
      if (!saleData) {
        console.error("❌ No sale data returned from database");
        alert("Error: Sale not found in database");
        return false;
      }

      // Validate required fields
      const requiredFields = [
        "id",
        "sale_date",
        "quantity_sold",
        "sale_price",
        "grant_date",
        "exercise_price",
      ];
      const missingFields = requiredFields.filter(
        (field) => saleData[field] === undefined || saleData[field] === null
      );

      if (missingFields.length > 0) {
        console.error(
          "❌ Missing required fields in sale data:",
          missingFields
        );
        console.error("❌ Available fields:", Object.keys(saleData));
        alert(
          `Error: Sale data is incomplete. Missing fields: ${missingFields.join(
            ", "
          )}`
        );
        return false;
      }

      console.log("✅ Sale data validation passed");

      // Store current editing sale ID in app
      app.currentEditingSaleId = saleId;

      // FIXED: Store reference to ModalManager for proper context binding
      const modalManager = this;

      // Show modal with setup callback - FIXED context binding
      console.log("📱 Showing modal with validated data...");
      const modalExists = this.showModal("editSaleModal", () => {
        // FIXED: Use bound reference instead of 'this'
        modalManager.populateEditSaleModal(app, saleData);
      });

      if (!modalExists) {
        console.error("❌ Edit sale modal not found in DOM");
        return false;
      }

      console.log("✅ Edit sale modal displayed successfully");
      return true;
    } catch (error) {
      console.error("❌ Critical error in showEditSaleModal:", error);
      console.error("❌ Error stack:", error.stack);
      alert("Error opening edit sale modal: " + error.message);
      return false;
    }
  },

  // SIMPLEST SOLUTION: Replace populateEditSaleModal with inline functions
  // This avoids all context binding issues completely

  /**
   * Populate edit sale modal with data (SIMPLE INLINE FUNCTIONS)
   * @param {Object} app - Application instance
   * @param {Object} saleData - Sale data from database
   */
  populateEditSaleModal(app, saleData) {
    try {
      console.log("📝 Populating edit sale modal with data:", saleData);

      // Validate app.helpers exists
      if (!app.helpers) {
        console.error("❌ app.helpers is not available");
        app.helpers = window.AppHelpers
          ? new window.AppHelpers(app)
          : {
              formatCurrency: (amount) => `€${amount?.toFixed(2) || "0.00"}`,
              formatFundName: (name) => name || "Unknown Fund",
            };
      }

      // Populate read-only fields with safe fallbacks
      const grantDateElement =
        window.DOMHelpers.safeGetElementById("editSaleGrantDate");
      if (grantDateElement && saleData.grant_date) {
        try {
          const grantDate = new Date(saleData.grant_date);
          const formattedDate = grantDate.toLocaleDateString();
          window.DOMHelpers.safeSetContent(grantDateElement, formattedDate);
        } catch (dateError) {
          console.warn("⚠️ Error formatting grant date:", dateError);
          window.DOMHelpers.safeSetContent(grantDateElement, "Invalid Date");
        }
      }

      const fundNameElement =
        window.DOMHelpers.safeGetElementById("editSaleFundName");
      if (fundNameElement) {
        const fundName = app.helpers.formatFundName(
          saleData.fund_name || "Unknown Fund"
        );
        window.DOMHelpers.safeSetContent(fundNameElement, fundName);
      }

      const quantityElement =
        window.DOMHelpers.safeGetElementById("editSaleQuantity");
      if (quantityElement && saleData.quantity_sold !== undefined) {
        const quantity = Number(saleData.quantity_sold).toLocaleString();
        window.DOMHelpers.safeSetContent(quantityElement, quantity);
      }

      const exercisePriceElement = window.DOMHelpers.safeGetElementById(
        "editSaleExercisePrice"
      );
      if (exercisePriceElement && saleData.exercise_price !== undefined) {
        const exercisePrice = app.helpers.formatCurrency(
          saleData.exercise_price
        );
        window.DOMHelpers.safeSetContent(exercisePriceElement, exercisePrice);
      }

      // Populate editable fields
      const saleDateInput =
        window.DOMHelpers.safeGetElementById("editSaleDate");
      if (saleDateInput && saleData.sale_date) {
        try {
          const saleDate = new Date(saleData.sale_date);
          saleDateInput.value = saleDate.toISOString().split("T")[0];

          // Set date constraints (cannot be in future)
          const today = new Date().toISOString().split("T")[0];
          saleDateInput.max = today;
        } catch (dateError) {
          console.warn("⚠️ Error setting sale date:", dateError);
        }
      }

      const salePriceInput =
        window.DOMHelpers.safeGetElementById("editSalePrice");
      if (salePriceInput && saleData.sale_price !== undefined) {
        salePriceInput.value = Number(saleData.sale_price).toFixed(2);
      }

      const notesInput = window.DOMHelpers.safeGetElementById("editSaleNotes");
      if (notesInput) {
        notesInput.value = saleData.notes || "";
      }

      // SIMPLE SOLUTION: Create inline functions instead of calling methods

      // Function to update calculations
      function updateCalculations() {
        try {
          const salePriceInput =
            window.DOMHelpers.safeGetElementById("editSalePrice");
          const newSalePrice = parseFloat(salePriceInput?.value) || 0;

          // Calculate new totals
          const totalSaleValue = newSalePrice * saleData.quantity_sold;

          // FIXED: Cost basis is €10 per option (not exercise price)
          const costBasis = saleData.quantity_sold * 10; // €10 per option cost basis
          const realizedPL = totalSaleValue - costBasis;

          console.log("📊 Calculation details:", {
            salePrice: newSalePrice,
            quantity: saleData.quantity_sold,
            totalSaleValue: totalSaleValue,
            costBasis: costBasis,
            realizedPL: realizedPL,
            exercisePrice: saleData.exercise_price, // For reference, but not used in calculation
          });

          // Update display
          const totalElement =
            window.DOMHelpers.safeGetElementById("editTotalSaleValue");
          if (totalElement) {
            window.DOMHelpers.safeSetContent(
              totalElement,
              app.helpers.formatCurrency(totalSaleValue)
            );
          }

          const plElement =
            window.DOMHelpers.safeGetElementById("editRealizedPL");
          if (plElement) {
            window.DOMHelpers.safeSetContent(
              plElement,
              app.helpers.formatCurrency(realizedPL)
            );
            plElement.className = `currency ${
              realizedPL >= 0 ? "positive" : "negative"
            }`;
          }

          console.log("✅ Calculations updated with correct formula");
        } catch (error) {
          console.error("❌ Error updating calculations:", error);
        }
      }

      // Run initial calculation
      updateCalculations();

      // Set up event listener for real-time updates
      if (salePriceInput) {
        // Remove existing listeners to prevent duplicates
        const existingHandler = app.editSaleInputHandler;
        if (existingHandler) {
          salePriceInput.removeEventListener("input", existingHandler);
        }

        // Create new handler (simple function reference)
        app.editSaleInputHandler = updateCalculations;

        // Add the event listener
        window.DOMHelpers.safeAddEventListener(
          salePriceInput,
          "input",
          app.editSaleInputHandler
        );
      }

      console.log("✅ Modal population completed successfully");
    } catch (error) {
      console.error("❌ Error populating edit sale modal:", error);
      alert("Error setting up edit sale form: " + error.message);
    }
  },

  /**
   * Show delete confirmation modal
   * @param {Object} app - Application instance
   * @param {number} entryId - Entry ID to delete
   * @param {string} grantDate - Grant date
   * @param {number} quantity - Quantity
   * @param {number} exercisePrice - Exercise price
   * @param {number} currentValue - Current value
   */
  showDeleteConfirmModal(
    app,
    entryId,
    grantDate,
    quantity,
    exercisePrice,
    currentValue
  ) {
    app.currentDeletingEntryId = entryId;

    this.showModal("deleteConfirmModal", () => {
      const fields = {
        deleteGrantDate: new Date(grantDate).toLocaleDateString(),
        deleteQuantity: quantity.toLocaleString(),
        deleteExercisePrice: app.formatCurrency
          ? app.formatCurrency(exercisePrice)
          : `€${exercisePrice.toFixed(2)}`,
        deleteCurrentValue: app.formatCurrency
          ? app.formatCurrency(currentValue)
          : `€${parseFloat(currentValue || 0).toFixed(2)}`, // Ensure proper formatting
      };

      for (const [fieldId, value] of Object.entries(fields)) {
        window.DOMHelpers.safeSetContent(
          window.DOMHelpers.safeGetElementById(fieldId),
          value
        );
      }
    });
  },
};

/**
 * Settings panel management
 */
const SettingsManager = {
  /**
   * Open settings panel
   * @param {Object} app - Application instance
   */
  openSettings(app) {
    console.log("⚙️ Opening settings panel");

    if (app.settingsSidebar) {
      app.settingsSidebar.classList.add("active");
    }
    if (app.settingsOverlay) {
      app.settingsOverlay.classList.add("active");
    }

    // Load current settings
    if (app.loadSettings) {
      app.loadSettings();
    }
  },

  /**
   * Close settings panel
   * @param {Object} app - Application instance
   */
  closeSettings(app) {
    console.log("⚙️ Closing settings panel");

    if (app.settingsSidebar) {
      app.settingsSidebar.classList.remove("active");
    }
    if (app.settingsOverlay) {
      app.settingsOverlay.classList.remove("active");
    }
  },
};

/**
 * Notification management
 */
const NotificationManager = {
  /**
   * Show notification
   * @param {string} notificationId - ID of notification element
   * @param {string} message - Message to display
   * @param {string} type - Type of notification (info, warning, error, success)
   */
  showNotification(notificationId, message, type = "info") {
    console.log(`🔔 Showing ${type} notification: ${message}`);

    const notification = window.DOMHelpers.safeGetElementById(notificationId);
    if (!notification) {
      console.error(`❌ Notification element not found: ${notificationId}`);
      return false;
    }

    // Update message if message element exists
    const messageElement = notification.querySelector(".notification-text");
    if (messageElement && message) {
      window.DOMHelpers.safeSetContent(messageElement, message);
    }

    // Add type class
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    return true;
  },

  /**
   * Hide notification
   * @param {string} notificationId - ID of notification element
   */
  hideNotification(notificationId) {
    console.log(`🔔 Hiding notification: ${notificationId}`);

    const notification = window.DOMHelpers.safeGetElementById(notificationId);
    if (notification) {
      notification.style.display = "none";
    }
  },

  /**
   * Show price update notification
   * @param {Object} app - Application instance
   */
  showPriceUpdateNotification(app) {
    const success = this.showNotification(
      "priceUpdateNotification",
      "Prices outdated", // Shorter message for header
      "warning"
    );

    // ADD THIS BLOCK:
    if (success) {
      const notification = document.getElementById("priceUpdateNotification");
      if (notification && !notification.title) {
        // Set default title if not already set
        notification.title =
          "Prices not current. KBC updates weekdays excluding bank holidays after 09:00. Click 'Update Prices' to get latest data.";
      }
    }
  },

  /**
   * Hide price update notification
   * @param {Object} app - Application instance
   */
  hidePriceUpdateNotification(app) {
    this.hideNotification("priceUpdateNotification");
  },
};

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
    if (!app.addOptionsBtn) return;

    app.addOptionsBtn.disabled = !hasData;

    if (!hasData) {
      app.addOptionsBtn.textContent = "➕ Add Options";
      app.addOptionsBtn.title =
        "Please update prices first to enable adding options";
      app.addOptionsBtn.classList.add("btn-disabled");
    } else {
      app.addOptionsBtn.textContent = "➕ Add Options";
      app.addOptionsBtn.title = "Add new option grants to your portfolio";
      app.addOptionsBtn.classList.remove("btn-disabled");
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
  async updatePortfolioStats(app, overview) {
    if (!app) {
      console.error("App instance not available for updatePortfolioStats");
      return;
    }

    // Use extracted business logic
    const stats = window.PortfolioCalculations.generatePortfolioStats(overview);
    const indicators =
      window.PortfolioCalculations.getPortfolioStatusIndicators(stats);

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
      const evolutionData = await EvolutionOperations.getPortfolioEvolution(2); // Get last 2 entries
      const portfolioChangeEl = document.getElementById("portfolioChange");

      if (portfolioChangeEl && evolutionData && evolutionData.length > 0) {
        const latestEntry = evolutionData[0];
        const changeFromPrevious = latestEntry.change_from_previous || 0;

        if (changeFromPrevious !== 0) {
          // FIXED: Use app.helpers.formatCurrency instead of app.formatCurrency
          const changeSymbol = changeFromPrevious >= 0 ? "+" : "";
          const formattedChange = app.helpers
            ? app.helpers.formatCurrency(changeFromPrevious)
            : window.FormatHelpers.formatCurrencyValue(changeFromPrevious, "€");
          portfolioChangeEl.textContent = `${changeSymbol}${formattedChange}`;
          portfolioChangeEl.className = `stat-change ${
            changeFromPrevious >= 0 ? "positive" : "negative"
          }`;
        } else {
          const formattedZero = app.helpers
            ? app.helpers.formatCurrency(0)
            : "€0.00";
          portfolioChangeEl.textContent = formattedZero;
          portfolioChangeEl.className = "stat-change";
        }
      } else {
        // No evolution data available
        const portfolioChangeEl = document.getElementById("portfolioChange");
        if (portfolioChangeEl) {
          portfolioChangeEl.textContent = "---";
          portfolioChangeEl.className = "stat-change";
        }
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
};

/**
 * Table management for sorting and display
 */
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
   * Handle table sorting functionality
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
   * Update table headers with sort indicators
   * @param {string} activeColumn - Currently sorted column
   * @param {string} direction - Sort direction
   */
  /**
   * Update table headers with sort indicators
   * @param {string} activeColumn - Currently sorted column
   * @param {string} direction - Sort direction
   */
  updateSortHeaders(activeColumn, direction) {
    // Remove existing sort indicators and classes
    document.querySelectorAll(".sortable").forEach((header) => {
      header.classList.remove("sorted-asc", "sorted-desc");

      // Remove any old sort indicator spans that might exist
      const indicator = header.querySelector(".sort-indicator");
      if (indicator) {
        indicator.remove();
      }
    });

    // Add sort class to active column
    const activeHeader = document.querySelector(
      `th[data-sort="${activeColumn}"]`
    );
    if (activeHeader) {
      activeHeader.classList.add(`sorted-${direction}`);
    }
  },

  /**
   * Perform actual sorting of data
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
   * Show/hide loading indicator for tables
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
  Tabs: TabManager,
  Modals: ModalManager,
  Settings: SettingsManager,
  Notifications: NotificationManager,
  ActionButtons: ActionButtonManager,
  Stats: StatsManager,
  Tables: TableManager,

  // Convenience methods for easy access
  updatePortfolioStats(overview) {
    if (window.portfolioApp) {
      StatsManager.updatePortfolioStats(window.portfolioApp, overview);
    }
  },

  sortTable(column, data, renderCallback) {
    if (window.portfolioApp) {
      return TableManager.sortTable(
        window.portfolioApp,
        column,
        data,
        renderCallback
      );
    }
    return data;
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
