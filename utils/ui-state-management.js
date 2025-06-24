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
  /**
   * Toggle notes expansion/collapse in evolution table
   * EXTRACTED FROM: renderer.js toggleNotes() method
   * @param {Object} app - Application instance
   * @param {string} noteId - Unique ID for the note entry
   * @param {boolean} expand - Whether to expand (true) or collapse (false)
   */
  toggleNotes(app, noteId, expand) {
    try {
      const shortDiv = document.getElementById(`short-${noteId}`);
      const fullDiv = document.getElementById(`full-${noteId}`);

      if (!shortDiv || !fullDiv) {
        console.warn(`Toggle notes elements not found for ID: ${noteId}`);
        return;
      }

      if (expand) {
        // Expand notes
        shortDiv.style.display = "none";
        fullDiv.style.display = "block";

        // Smooth scroll to keep the expanded content in view
        setTimeout(() => {
          fullDiv.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }, 100);

        console.log(`📄 Expanded notes for entry: ${noteId}`);
      } else {
        // Collapse notes
        fullDiv.style.display = "none";
        shortDiv.style.display = "flex";

        console.log(`📋 Collapsed notes for entry: ${noteId}`);
      }
    } catch (error) {
      console.error("Error toggling notes:", error);
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
  /**
   * Close all modals - ENHANCED VERSION that preserves grant selection
   * @param {Object} app - Application instance for cleanup
   */
  closeAllModals(app) {
    console.log("📱 Closing all modals");

    const modals = window.DOMHelpers.safeQuerySelectorAll(".modal");
    modals.forEach((modal) => {
      // 🆕 ADD THIS: Check if Add Grants modal is being closed BEFORE removing active class
      if (modal.id === "addGrantsModal" && modal.classList.contains("active")) {
        console.log("🧹 Clearing Add Grants form on modal close");
        if (app && app.clearaddGrantsForm) {
          app.clearaddGrantsForm();
        }
      }

      modal.classList.remove("active");

      // 🆕 Clear user input fields only (not display elements)
      // BUT PRESERVE GRANT SELECTION RADIO BUTTONS
      const inputs = modal.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        // Skip read-only, disabled inputs, and grant selection radio buttons
        if (input.readOnly || input.disabled) return;
        if (input.name === "grantSelection") {
          console.log(
            "🔒 Preserving grant selection radio button:",
            input.value
          );
          return; // DON'T clear grant selection radios
        }

        if (input.type === "checkbox" || input.type === "radio") {
          // Only clear non-grant-selection radio buttons
          if (input.name !== "grantChoice") {
            input.checked = false;
          }
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
        if (display && !display.classList.contains("persistent")) {
          display.textContent = "";
        }
      });
    });

    console.log("✅ All modals closed (with grant selection preserved)");
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
   * Show Add Grants modal with setup
   * @param {Object} app - Application instance
   */
  showaddGrantsModal(app) {
    this.showModal("addGrantsModal", () => {
      // ✅ REPLACE all the reset code with just this:
      window.UIStateManager.Forms.clearaddGrantsForm(app);

      // ✅ ADD validation setup:
      // Set up enhanced validation
      window.UIStateManager.Validation.setupValidationListeners(app);

      // Initial button state (should be disabled)
      window.UIStateManager.Validation.validateAddGrantsForm(app);

      console.log("✅ Add Grants modal opened with enhanced validation");
    });
  },

  /**
   * Show merge grants modal with data - ENHANCED VERSION
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

    // Show appropriate section based on number of existing grants
    if (app.existingGrants.length === 1) {
      console.log("📝 Single grant scenario");
      this.showSingleGrantMerge(
        app.existingGrants[0],
        newQuantity,
        newTaxAmount
      );
    } else {
      console.log("📝 Multiple grants scenario:", app.existingGrants.length);
      this.showMultipleGrantsMerge(
        app.existingGrants,
        newQuantity,
        newTaxAmount
      );
    }
  },
  /**
   * Show single grant merge scenario
   */
  showSingleGrantMerge(existingGrant, newQuantity, newTaxAmount) {
    console.log("📝 Setting up single grant merge display");

    // Hide multiple grants section, show single grant section
    const singleSection =
      window.DOMHelpers.safeGetElementById("singleGrantMerge");
    const multipleSection = window.DOMHelpers.safeGetElementById(
      "multipleGrantsMerge"
    );

    if (singleSection) {
      singleSection.style.display = "block";
      console.log("✅ Single grant section shown");
    }
    if (multipleSection) {
      multipleSection.style.display = "none";
      console.log("✅ Multiple grants section hidden");
    }

    // Populate single grant fields
    this.populateMergeModalFields(existingGrant, newQuantity, newTaxAmount);
  },

  /**
   * Show multiple grants merge scenario - THE MISSING PIECE!
   */
  showMultipleGrantsMerge(existingGrants, newQuantity, newTaxAmount) {
    console.log("📝 Setting up multiple grants merge display");

    // Hide single grant section, show multiple grants section
    const singleSection =
      window.DOMHelpers.safeGetElementById("singleGrantMerge");
    const multipleSection = window.DOMHelpers.safeGetElementById(
      "multipleGrantsMerge"
    );

    if (singleSection) {
      singleSection.style.display = "none";
      console.log("✅ Single grant section hidden");
    }
    if (multipleSection) {
      multipleSection.style.display = "block";
      console.log("✅ Multiple grants section shown");
    }

    // THIS IS THE KEY MISSING PIECE - Populate the grants selection list
    this.populateGrantsList(existingGrants);

    // Set new quantity in the multiple grants section
    const newQtyMultiple = window.DOMHelpers.safeGetElementById(
      "newQuantityMultiple"
    );
    if (newQtyMultiple) {
      window.DOMHelpers.safeSetContent(
        newQtyMultiple,
        newQuantity?.toString() || "0"
      );
      console.log(
        "✅ New quantity set in multiple grants section:",
        newQuantity
      );
    }
  },

  populateGrantsList(existingGrants) {
    console.log(
      "📝 Populating grants list with",
      existingGrants.length,
      "grants"
    );

    const listContainer =
      window.DOMHelpers.safeGetElementById("existingGrantsList");
    if (!listContainer) {
      console.error("❌ existingGrantsList container not found!");
      return;
    }

    let html = "";
    existingGrants.forEach((grant, index) => {
      const isFirst = index === 0; // Auto-select first grant
      const grantDate = new Date(grant.grant_date).toLocaleDateString();
      const quantity = grant.quantity_remaining || grant.quantity || 0;

      html += `
      <div class="grant-selection-item" data-grant-id="${grant.id}">
        <input type="radio" 
               name="grantSelection" 
               value="${grant.id}" 
               id="grant_${grant.id}"
               ${isFirst ? "checked" : ""}>
        <label for="grant_${grant.id}">
          <strong>Grant ${index + 1}</strong> - Current Quantity: ${quantity.toLocaleString()} options
        </label>
      </div>
    `;
    });

    listContainer.innerHTML = html;
    console.log("✅ Grants list populated successfully");
    console.log("📝 Generated HTML:", html);

    // Verify radio buttons were created
    setTimeout(() => {
      const createdRadios = document.querySelectorAll(
        'input[name="grantSelection"]'
      );
      console.log(
        "🔍 Verification: Created",
        createdRadios.length,
        "radio buttons"
      );
      createdRadios.forEach((radio, i) => {
        console.log(
          `🔍 Radio ${i}: ID=${radio.id}, value=${radio.value}, checked=${radio.checked}`
        );
      });
    }, 100);

    // Add click event listeners to the grant items
    const grantItems = listContainer.querySelectorAll(".grant-selection-item");
    grantItems.forEach((item) => {
      item.addEventListener("click", () => {
        const radio = item.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          // Update visual selection
          grantItems.forEach((i) => i.classList.remove("selected"));
          item.classList.add("selected");
          console.log("📋 Grant selected:", radio.value);
        }
      });
    });

    // Auto-select first grant visually
    if (grantItems.length > 0) {
      grantItems[0].classList.add("selected");
    }
    this.setupGrantChoiceHandlers();
  },
  /**
   * NEW: Setup handlers for grant choice radio buttons (merge vs separate)
   */
  setupGrantChoiceHandlers() {
    const mergeRadio = document.getElementById("mergeGrants");
    const separateRadio = document.getElementById("separateGrants");
    const grantsList =
      window.DOMHelpers.safeGetElementById("existingGrantsList");

    if (!mergeRadio || !separateRadio || !grantsList) {
      console.warn("⚠️ Grant choice elements not found for setup");
      return;
    }

    const toggleGrantsListState = () => {
      const isSeparateSelected = separateRadio.checked;

      if (isSeparateSelected) {
        // Disable grants list when "Keep Separate" is selected
        grantsList.classList.add("disabled");
        console.log("🔒 Grants list disabled (keep separate selected)");
      } else {
        // Enable grants list when "Merge" is selected
        grantsList.classList.remove("disabled");
        console.log("🔓 Grants list enabled (merge selected)");
      }
    };

    // Add event listeners
    mergeRadio.addEventListener("change", toggleGrantsListState);
    separateRadio.addEventListener("change", toggleGrantsListState);

    // Set initial state
    toggleGrantsListState();

    console.log("✅ Grant choice handlers setup complete");
  },

  /**
   * Populate merge modal fields
   * @param {Object} existingGrant - Existing grant data
   * @param {number} newQuantity - New quantity
   * @param {number} newTaxAmount - New tax amount
   */
  /**
   * Populate merge modal fields - CLEANED UP VERSION
   * @param {Object} existingGrant - Existing grant data
   * @param {number} newQuantity - New quantity
   * @param {number} newTaxAmount - New tax amount
   */
  populateMergeModalFields(existingGrant, newQuantity, newTaxAmount) {
    console.log("📝 Populating single grant merge fields");

    // Only populate the relevant field - Current Quantity
    const existingQuantity =
      existingGrant.quantity_remaining?.toString() || "0";

    const existingQuantityElement =
      window.DOMHelpers.safeGetElementById("existingQuantity");
    if (existingQuantityElement) {
      window.DOMHelpers.safeSetContent(
        existingQuantityElement,
        existingQuantity
      );
    }

    // Handle new quantity fields (both single and multiple versions)
    const newQtyValue = newQuantity?.toString() || "0";

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

    // Calculate and display total after merge
    const totalAfter =
      (existingGrant.quantity_remaining || 0) + (newQuantity || 0);
    const mergeDetails = window.DOMHelpers.safeGetElementById("mergeDetails");
    if (mergeDetails) {
      window.DOMHelpers.safeSetContent(
        mergeDetails,
        `- Add to existing grant (Total: ${totalAfter.toLocaleString()} options)`
      );
    }

    console.log("✅ Single grant merge fields populated", {
      existingQuantity: existingGrant.quantity_remaining,
      newQuantity,
      totalAfter,
    });
  },

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
  /**
   * Show delete confirmation modal for portfolio entry
   * ✅ EXTRACTED FROM: renderer.js showDeleteConfirmModal() method
   * @param {Object} app - Portfolio app instance
   * @param {number} entryId - ID of entry to delete
   */
  /**
   * Show delete confirmation modal for portfolio entry - FIXED VERSION
   * ✅ EXTRACTED FROM: renderer.js showDeleteConfirmModal() method
   * @param {Object} app - Portfolio app instance
   * @param {number} entryId - ID of entry to delete
   */
  /**
   * Show delete confirmation modal for portfolio entry - FIXED VERSION
   * ✅ EXTRACTED FROM: renderer.js showDeleteConfirmModal() method
   * @param {Object} app - Portfolio app instance
   * @param {number} entryId - ID of entry to delete
   */
  /**
   * Show delete confirmation modal for portfolio entry - FIXED VERSION
   * ✅ EXTRACTED FROM: renderer.js showDeleteConfirmModal() method
   * @param {Object} app - Portfolio app instance
   * @param {number} entryId - ID of entry to delete
   */
  showDeleteConfirmModal(app, entryId) {
    try {
      console.log(`🗑️ Showing delete confirmation for entry ID: ${entryId}`);

      // FIND THE ACTUAL ENTRY DATA
      const entry = app.portfolioData.find((e) => e.id === entryId);
      if (!entry) {
        console.error(`❌ Portfolio entry not found for ID: ${entryId}`);
        alert("Portfolio entry not found");
        return;
      }

      console.log("📝 Found entry data:", entry);

      // Store the entry ID for deletion
      app.currentDeletingEntryId = entryId;

      // POPULATE THE MODAL FIELDS WITH ACTUAL DATA
      try {
        // Grant Date
        const deleteGrantDate = document.getElementById("deleteGrantDate");
        if (deleteGrantDate && entry.grant_date) {
          deleteGrantDate.textContent = window.FormatHelpers.formatDate(
            entry.grant_date
          );
        }

        // Quantity
        const deleteQuantity = document.getElementById("deleteQuantity");
        if (deleteQuantity && entry.quantity_remaining !== undefined) {
          deleteQuantity.textContent =
            entry.quantity_remaining.toLocaleString();
        }

        // Exercise Price
        const deleteExercisePrice = document.getElementById(
          "deleteExercisePrice"
        );
        if (deleteExercisePrice && entry.exercise_price !== undefined) {
          deleteExercisePrice.textContent =
            window.FormatHelpers.formatCurrencyValue(entry.exercise_price);
        }

        // Current Value
        const deleteCurrentValue =
          document.getElementById("deleteCurrentValue");
        if (deleteCurrentValue && entry.current_value !== undefined) {
          deleteCurrentValue.textContent =
            window.FormatHelpers.formatCurrencyValue(entry.current_value);
        }

        console.log("✅ Modal fields populated successfully");
      } catch (populationError) {
        console.error("❌ Error populating modal fields:", populationError);
        // Continue showing modal even if population fails
      }

      // Enable/disable confirm button based on entry ID
      if (app.confirmDeleteEntry) {
        app.confirmDeleteEntry.disabled = false;
      }

      // Show the delete confirmation modal (for portfolio entries, not database)
      if (app.deleteConfirmModal) {
        app.deleteConfirmModal.classList.add("active");
        console.log("✅ Delete confirmation modal displayed with entry data");
      } else {
        console.error("❌ Delete confirmation modal element not found");
      }
    } catch (error) {
      console.error("❌ Error showing delete confirmation modal:", error);
      alert("Error showing delete confirmation: " + error.message);
    }
  },
  /**
   * Show detailed option information modal with chart
   * @param {Object} app - Application instance
   * @param {number} entryId - Entry ID to show info for
   */
  async showOptionInfoModal(app, entryId) {
    const entry = app.portfolioData.find((e) => e.id === entryId);
    if (!entry) {
      alert("Portfolio entry not found");
      return;
    }

    try {
      console.log("📊 Loading option info for entry:", entryId);

      // Get price history for this option
      const priceHistory = await window.ipcRenderer.invoke(
        "get-option-price-history",
        entry.exercise_price,
        entry.grant_date
      );

      console.log("Price history data:", priceHistory);

      // Show modal with setup callback
      this.showModal("optionInfoModal", () => {
        // Populate modal title
        document.getElementById("optionInfoTitle").textContent =
          `${app.helpers.formatFundName(entry.fund_name)} Option Details`;

        // Populate option summary
        document.querySelector(".option-summary").innerHTML = `
          <div class="option-fund-info">
            <h5>📊 Fund Information</h5>
            <div class="fund-details">
              <div class="fund-detail">
                <strong>Underlying Fund:</strong>
                <span>${entry.fund_name || "Unknown Fund"}</span>
              </div>
              <div class="fund-detail">
                <strong>Grant Date:</strong>
                <span>${new Date(entry.grant_date).toLocaleDateString()}</span>
              </div>
              <div class="fund-detail">
                <strong>Exercise Price:</strong>
                <span>${app.helpers.formatCurrency(entry.exercise_price)}</span>
              </div>
              <div class="fund-detail">
                <strong>Quantity:</strong>
                <span>${entry.quantity_remaining.toLocaleString()} options</span>
              </div>
            </div>
          </div>
          
          <div class="info-stats">
            <div class="info-stat">
              <h4>Current Value</h4>
              <div class="stat-value">${app.helpers.formatCurrency(
                entry.current_value || 0
              )}</div>
            </div>
            <div class="info-stat">
              <h4>Total Value</h4>
              <div class="stat-value">${app.helpers.formatCurrency(
                entry.current_total_value || 0
              )}</div>
            </div>
            <div class="info-stat">
              <h4>P&L vs Target</h4>
              <div class="stat-value ${
                entry.profit_loss_vs_target >= 0 ? "positive" : "negative"
              }">
                ${app.helpers.formatCurrency(entry.profit_loss_vs_target || 0)}
              </div>
            </div>
            <div class="info-stat">
              <h4>Return %</h4>
              <div class="stat-value ${app.helpers.getReturnPercentageClass(
                entry.current_return_percentage,
                app.targetPercentage?.value || 65
              )}">
                ${
                  entry.current_return_percentage
                    ? entry.current_return_percentage.toFixed(1) + "%"
                    : "N/A"
                }
              </div>
            </div>
          </div>
          
          <div class="option-restrictions">
            <h5>🔒 Selling Information</h5>
            <p><strong>Status:</strong> ${app.getSellingStatusText(
              entry.selling_status
            )}</p>
            ${
              entry.selling_status === "WAITING_PERIOD"
                ? `<p><strong>Can sell after:</strong> ${new Date(
                    entry.can_sell_after
                  ).toLocaleDateString()}</p>`
                : ""
            }
            ${
              entry.selling_status === "EXPIRING_SOON" ||
              entry.selling_status === "EXPIRED"
                ? `<p><strong>Expires on:</strong> ${new Date(
                    entry.expires_on
                  ).toLocaleDateString()}</p>`
                : ""
            }
          </div>
        `;

        // Handle chart creation using existing ChartUtils
        const chartContainer = document.querySelector(
          ".option-chart-container"
        );
        chartContainer.innerHTML = '<canvas id="optionInfoChart"></canvas>';

        // Small delay to ensure DOM is ready
        setTimeout(() => {
          if (!window.ChartUtils.isChartLibraryAvailable()) {
            window.ChartUtils.displayChartError(
              "optionInfoChart",
              "Chart Library Missing",
              "Chart.js library not loaded"
            );
            return;
          }

          if (!priceHistory || priceHistory.length === 0) {
            window.ChartUtils.displayNoDataMessage("optionInfoChart");
            return;
          }

          // Create chart configuration for option price history
          const chartConfig = {
            type: "line",
            data: {
              labels: priceHistory.map((p) =>
                new Date(p.price_date).toLocaleDateString()
              ),
              datasets: [
                {
                  label: "Price History",
                  data: priceHistory.map((p) => p.current_value),
                  borderColor: "#007acc",
                  backgroundColor: "rgba(0, 122, 204, 0.1)",
                  borderWidth: 2,
                  fill: true,
                  tension: 0.1,
                  // 🆕 SUBTLE POINTS (only appear on hover):
                  pointRadius: 0, // No visible points normally
                  pointHoverRadius: 4, // Small points on hover
                  pointBackgroundColor: "#007acc",
                  pointBorderColor: "#ffffff",
                  pointBorderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: `${app.helpers.formatFundName(entry.fund_name)} Price History`,
                  font: { size: 14, weight: "bold" },
                },
                legend: {
                  display: false,
                },
                tooltip: {
                  mode: "index",
                  intersect: false,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  callbacks: {
                    title: function (tooltipItems) {
                      return `Date: ${tooltipItems[0].label}`;
                    },
                    label: function (context) {
                      return `Value: €${context.parsed.y.toFixed(2)}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return "€" + value.toFixed(2);
                    },
                  },
                },
              },
            },
          };

          // Use existing ChartUtils to create the chart
          const chart = window.ChartUtils.createChart(
            "optionInfoChart",
            chartConfig
          );
          if (chart) {
            console.log("✅ Option info chart created successfully");
          } else {
            window.ChartUtils.displayChartError(
              "optionInfoChart",
              "Chart Creation Failed",
              "Unable to create price history chart"
            );
          }
        }, 50);
      });
    } catch (error) {
      console.error("Error showing option info:", error);
      alert("Error loading option information: " + error.message);
    }
  },
  openSettings(app) {
    console.log("⚙️ Opening settings panel");

    if (app.settingsSidebar) {
      app.settingsSidebar.classList.add("active");
    }
    if (app.settingsOverlay) {
      app.settingsOverlay.classList.add("active");
    }

    window.AppConfig.SettingsManager.loadSettings(app);
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
  /**
   * Update progress during modal operations
   * @param {Object} app - Application instance
   * @param {string} progressText - Progress text to display
   */
  updateProgress(app, progressText) {
    console.log(`📊 Progress update: ${progressText}`);

    if (!progressText) return;

    // Update progress text
    if (app.updateProgressText) {
      app.updateProgressText.textContent = progressText;
    }

    // Update status output
    if (app.updateStatusOutput) {
      app.updateStatusOutput.textContent = progressText;
    }

    // Calculate progress percentage based on text content
    let percentage = 10; // Default progress
    if (progressText.includes("Starting")) percentage = 10;
    else if (progressText.includes("Connecting")) percentage = 20;
    else if (progressText.includes("Found")) percentage = 40;
    else if (progressText.includes("Processing")) percentage = 70;
    else if (progressText.includes("Downloading")) percentage = 90;
    else if (progressText.includes("Complete")) percentage = 100;

    // Update progress bar
    if (app.updateProgressBar) {
      app.updateProgressBar.style.width = percentage + "%";
    }
  },
};

/**
 * Notification management
 */
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

    // Remove existing type classes
    notification.classList.remove("info", "warning", "error", "success");

    // Add new type class
    notification.classList.add(type);
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
    // This method is now deprecated in favor of direct showNotification calls
    // with specific messages and types, but kept for backward compatibility
    const success = this.showNotification(
      "priceUpdateNotification",
      "Prices outdated",
      "warning"
    );

    if (success) {
      const notification = document.getElementById("priceUpdateNotification");
      if (notification && !notification.title) {
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
  filterGrantHistory(app = null) {
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

        // Close the modal
        window.UIStateManager.closeAllModals(app);

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
  Tabs: TabManager,
  Modals: ModalManager,
  Settings: SettingsManager,
  Notifications: NotificationManager,
  ActionButtons: ActionButtonManager,
  Stats: StatsManager,
  Tables: TableManager,
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
