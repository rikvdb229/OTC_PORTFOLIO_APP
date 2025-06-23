/**
 * ===== EVENT HANDLERS UTILITY =====
 * Organized event listener setup for portfolio application
 *
 * STEP 3.1: Create this file as utils/event-handlers.js
 */

/**
 * Header action event handlers
 */
const HeaderActionHandlers = {
  /**
   * Set up header button listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("📊 Setting up header action handlers...");

    // Update prices button
    if (app.updatePricesBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.updatePricesBtn,
        "click",
        () => {
          app.updatePrices();
        }
      );
    }

    // Settings toggle button
    if (app.settingsToggle) {
      window.DOMHelpers.safeAddEventListener(
        app.settingsToggle,
        "click",
        () => {
          app.openSettings();
        }
      );
    }

    console.log("✅ Header action handlers initialized");
  },
};

/**
 * Navigation tab event handlers
 */
const NavigationHandlers = {
  /**
   * Set up navigation tab listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("🗂️ Setting up navigation handlers...");

    // Navigation tabs (NodeList)
    if (app.navTabs && app.navTabs.length > 0) {
      app.navTabs.forEach((tab) => {
        window.DOMHelpers.safeAddEventListener(tab, "click", () => {
          app.switchTab(tab.dataset.tab);
        });
      });
      console.log(`✅ Set up ${app.navTabs.length} navigation tab handlers`);
    } else {
      console.warn("⚠️ No navigation tabs found");
    }
  },
};

/**
 * Settings panel event handlers
 */
const SettingsHandlers = {
  /**
   * Set up settings panel listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("⚙️ Setting up settings handlers...");

    // Settings close button
    if (app.closeSettings) {
      window.DOMHelpers.safeAddEventListener(app.closeSettings, "click", () => {
        app.closeSettingsPanel();
      });
    }

    // Settings overlay (click outside to close)
    if (app.settingsOverlay) {
      window.DOMHelpers.safeAddEventListener(
        app.settingsOverlay,
        "click",
        () => {
          app.closeSettingsPanel();
        }
      );
    }

    // Additional close button (if exists)
    const closeSettingsBtn =
      window.DOMHelpers.safeGetElementById("closeSettingsBtn");
    if (closeSettingsBtn) {
      window.DOMHelpers.safeAddEventListener(closeSettingsBtn, "click", () => {
        app.closeSettingsPanel();
      });
    }

    // Save settings button
    if (app.saveSettingsBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.saveSettingsBtn,
        "click",
        () => {
          app.saveSettings();
        }
      );
    }

    console.log("✅ Settings handlers initialized");
  },
};

/**
 * Portfolio action event handlers
 */
const PortfolioActionHandlers = {
  /**
   * Set up portfolio action listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("💼 Setting up portfolio action handlers...");

    // Add options button
    if (app.addOptionsBtn) {
      window.DOMHelpers.safeAddEventListener(app.addOptionsBtn, "click", () => {
        app.showAddOptionsModal();
      });
    }
    console.log("✅ Portfolio action handlers initialized");
  },
};

/**
 * Dynamic control event handlers (elements found via selectors)
 */
const DynamicControlHandlers = {
  /**
   * Set up handlers for dynamically found elements
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("🔄 Setting up dynamic control handlers...");

    // Evolution controls - Updated selector to match HTML structure
    const evolutionControls = window.DOMHelpers.safeQuerySelectorAll(
      "#evolution-tab-header .btn"
    );
    evolutionControls.forEach((btn) => {
      window.DOMHelpers.safeAddEventListener(btn, "click", () => {
        console.log(`Evolution button clicked: ${btn.dataset.days} days`);
        app.loadEvolutionData(btn.dataset.days);
      });
    });

    // Chart controls - Updated selector to match HTML structure
    const chartControls = window.DOMHelpers.safeQuerySelectorAll(
      "#chart-tab-header .btn"
    );
    chartControls.forEach((btn) => {
      window.DOMHelpers.safeAddEventListener(btn, "click", () => {
        console.log(`Chart button clicked: ${btn.dataset.period} period`);
        app.loadChartData(btn.dataset.period);
      });
    });

    // Sales History controls - Add if needed
    const salesControls = window.DOMHelpers.safeQuerySelectorAll(
      "#sales-history-tab-header .btn"
    );
    salesControls.forEach((btn) => {
      window.DOMHelpers.safeAddEventListener(btn, "click", () => {
        console.log(
          `Sales button clicked: ${
            btn.dataset.period || btn.dataset.days
          } period`
        );
        // Determine if this should call loadEvolutionData or loadChartData based on button's data attribute
        if (btn.dataset.days) {
          app.loadEvolutionData(btn.dataset.days);
        } else if (btn.dataset.period) {
          app.loadChartData(btn.dataset.period);
        }
      });
    });
    // Grant History controls - Modern toggle filters
    // Grant History controls - Modern toggle filters
    const grantToggles = window.DOMHelpers.safeQuerySelectorAll(
      "#grant-history-tab-header .filter-toggle"
    );
    grantToggles.forEach((toggle) => {
      window.DOMHelpers.safeAddEventListener(toggle, "click", () => {
        const filter = toggle.dataset.filter;
        console.log(`Grant filter toggle clicked: ${filter}`);

        // Toggle the filter state
        toggle.classList.toggle("active");
        toggle.classList.toggle("inactive");

        // Apply the filtering using existing method name
        app.filterGrantHistory();
      });
    });

    // Sortable table headers
    const sortableHeaders = window.DOMHelpers.safeQuerySelectorAll(".sortable");
    sortableHeaders.forEach((header) => {
      window.DOMHelpers.safeAddEventListener(header, "click", () => {
        app.sortTable(header.dataset.sort);
      });
    });

    console.log(
      `✅ Dynamic controls initialized: ${
        evolutionControls.length +
        chartControls.length +
        salesControls.length +
        grantToggles.length +
        sortableHeaders.length
      } elements`
    );
    console.log(`   - Evolution buttons: ${evolutionControls.length}`);
    console.log(`   - Chart buttons: ${chartControls.length}`);
    console.log(`   - Sales buttons: ${salesControls.length}`);
    console.log(`   - Grant toggles: ${grantToggles.length}`);
    console.log(`   - Sortable headers: ${sortableHeaders.length}`);
  },
};

/**
 * Modal event handlers
 */
const ModalHandlers = {
  /**
   * Set up modal-related event listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("📱 Setting up modal handlers...");

    // Modal backdrop clicks (close modal when clicking outside)
    const modals = window.DOMHelpers.safeQuerySelectorAll(".modal");
    modals.forEach((modal) => {
      window.DOMHelpers.safeAddEventListener(modal, "click", (event) => {
        // Only close if clicking the backdrop (modal itself), not the content
        if (event.target === modal) {
          app.closeModals();
        }
      });
    });

    // Prevent modal content clicks from bubbling up to backdrop
    const modalContents =
      window.DOMHelpers.safeQuerySelectorAll(".modal-content");
    modalContents.forEach((content) => {
      window.DOMHelpers.safeAddEventListener(content, "click", (event) => {
        event.stopPropagation();
      });
    });

    // Specific modal button handlers
    this.setupModalButtons(app);

    console.log(`✅ Modal handlers initialized: ${modals.length} modals`);
  },

  /**
   * Set up specific modal button handlers
   * @param {Object} app - Application instance (this)
   */
  setupModalButtons(app) {
    // Define modal button mappings
    const modalButtons = [
      // Add Options Modal
      { id: "cancelAddOptions", handler: () => app.closeModals() },
      { id: "confirmAddOptions", handler: () => app.addOptions() },

      // Merge Grants Modal
      { id: "cancelMergeGrants", handler: () => app.closeModals() },
      { id: "confirmMergeGrants", handler: () => app.confirmMergeGrants() },

      // Sell Options Modal
      { id: "cancelSellOptions", handler: () => app.closeModals() },
      { id: "confirmSellOptions", handler: () => app.confirmSale() },

      // Edit Tax Modal
      { id: "cancelEditTax", handler: () => app.closeModals() },
      { id: "confirmEditTax", handler: () => app.updateTax() },

      // Delete Confirmation Modal
      { id: "cancelDelete", handler: () => app.closeModals() },
      { id: "confirmDelete", handler: () => app.confirmDelete() },

      // Option Info Modal
      { id: "closeOptionInfo", handler: () => app.closeModals() },
      // Edit Sale Modal
      { id: "cancelEditSale", handler: () => app.closeModals() },
      { id: "confirmEditSale", handler: () => app.confirmEditSale() },
    ];

    // Set up each button handler
    modalButtons.forEach(({ id, handler }) => {
      const button = window.DOMHelpers.safeGetElementById(id);
      if (button) {
        window.DOMHelpers.safeAddEventListener(button, "click", handler);
      }
    });
  },
};

/**
 * Form input event handlers
 */
const FormHandlers = {
  /**
   * Set up form input listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("📝 Setting up form handlers...");

    // Define form input mappings
    const formInputs = [
      // Add Options form
      {
        id: "grantDate",
        event: "change",
        handler: () => app.handleGrantDateSelection(),
      },
      {
        id: "quantity",
        event: "input",
        handler: () => app.calculateEstimatedTax(),
      },
      {
        id: "exercisePrice",
        event: "change",
        handler: () => app.calculateEstimatedTax(),
      },
      {
        id: "actualTaxAmount",
        event: "input",
        handler: () => app.updateTaxDisplay(),
      },

      // Sell Options form
      {
        id: "quantityToSell",
        event: "input",
        handler: () => app.calculateSaleProceeds(),
      },
      {
        id: "salePrice",
        event: "input",
        handler: () => app.calculateSaleProceeds(),
      },
    ];

    // Set up each form input handler
    formInputs.forEach(({ id, event, handler }) => {
      const input = window.DOMHelpers.safeGetElementById(id);
      if (input) {
        window.DOMHelpers.safeAddEventListener(input, event, handler);
      }
    });

    console.log(
      `✅ Form handlers initialized: ${formInputs.length} form inputs`
    );
  },
};

/**
 * Database management event handlers
 */
const DatabaseHandlers = {
  /**
   * Set up database operation listeners
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("💾 Setting up database handlers...");

    // Database management buttons
    if (app.exportDatabaseBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.exportDatabaseBtn,
        "click",
        () => {
          app.exportDatabase();
        }
      );
    }

    if (app.importDatabaseBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.importDatabaseBtn,
        "click",
        () => {
          app.importDatabase(false);
        }
      );
    }

    if (app.importMergeBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.importMergeBtn,
        "click",
        () => {
          app.importDatabase(true);
        }
      );
    }
    if (app.deleteDatabaseBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.deleteDatabaseBtn,
        "click",
        () => {
          app.showDeleteDatabaseModal();
        }
      );
    }

    console.log("✅ Database handlers initialized");
  },
};

/**
 * Main event handler coordinator
 */
const EventHandlerCoordinator = {
  /**
   * Initialize all event handler groups
   * @param {Object} app - Application instance (this)
   */
  initializeAll(app) {
    console.log("🎯 Initializing all event handlers...");

    // Store reference to ipcRenderer globally for handlers to use
    window.ipcRenderer = require("electron").ipcRenderer;

    // Initialize all handler groups
    const handlerGroups = [
      HeaderActionHandlers,
      NavigationHandlers,
      SettingsHandlers,
      PortfolioActionHandlers,
      DynamicControlHandlers,
      ModalHandlers,
      FormHandlers,
      DatabaseHandlers,
    ];

    let totalHandlers = 0;
    handlerGroups.forEach((handlerGroup, index) => {
      try {
        handlerGroup.initialize(app);
        totalHandlers++;
      } catch (error) {
        console.error(`❌ Error initializing handler group ${index}:`, error);
      }
    });

    console.log(
      `✅ Event handler initialization complete: ${totalHandlers}/${handlerGroups.length} groups`
    );
  },
};

// Export to global scope
window.EventHandlers = {
  HeaderActionHandlers,
  NavigationHandlers,
  SettingsHandlers,
  PortfolioActionHandlers,
  DynamicControlHandlers,
  ModalHandlers,
  FormHandlers,
  DatabaseHandlers,
  EventHandlerCoordinator,
};

// Debug logging
console.log("✅ Event Handlers loaded:", Object.keys(window.EventHandlers));
