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
          window.UIStateManager.Modals.openSettings(app); // ← NEW
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
const UndoRedoHandlers = {
  initialize(app) {
    console.log("🔄 Setting up undo/redo handlers...");

    if (app.undoBtn) {
      window.DOMHelpers.safeAddEventListener(app.undoBtn, "click", () => {
        window.UndoRedoManager.undo();
      });
    }

    if (app.redoBtn) {
      window.DOMHelpers.safeAddEventListener(app.redoBtn, "click", () => {
        window.UndoRedoManager.redo();
      });
    }

    console.log("✅ Undo/redo handlers initialized");
  },
};

/**
 * Settings panel event handlers
 */
const SettingsHandlers = {
  /**
   * Set up settings panel listeners including database management
   * @param {Object} app - Application instance (this)
   */
  initialize(app) {
    console.log("⚙️ Setting up settings handlers with database management...");

    // Settings close button
    if (app.closeSettings) {
      window.DOMHelpers.safeAddEventListener(app.closeSettings, "click", () => {
        window.UIStateManager.Modals.closeSettings(app);
      });
    }

    // Settings overlay (click outside to close)
    if (app.settingsOverlay) {
      window.DOMHelpers.safeAddEventListener(
        app.settingsOverlay,
        "click",
        (e) => {
          if (e.target === app.settingsOverlay) {
            window.UIStateManager.Modals.closeSettings(app);
          }
        }
      );
    }

    // Save settings button
    if (app.saveSettingsBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.saveSettingsBtn,
        "click",
        () => {
          window.AppConfig.SettingsManager.saveSettings(app);
        }
      );
    }

    // ✅ ADD: Database management buttons
    this.setupDatabaseHandlers(app);

    console.log("✅ Settings handlers initialized with database management");
  },

  /**
   * Set up database management button handlers
   * @param {Object} app - Application instance
   */
  /**
   * Set up database management button handlers - UPDATED
   * @param {Object} app - Application instance
   */
  setupDatabaseHandlers(app) {
    console.log("🗃️ Setting up database handlers in settings...");

    // Export database button
    if (app.exportDatabaseBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.exportDatabaseBtn,
        "click",
        () => {
          window.UIStateManager.Database.exportDatabase(app);
        }
      );
      console.log("✅ Export database handler set up");
    }

    // Import database button
    if (app.importDatabaseBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.importDatabaseBtn,
        "click",
        () => {
          window.UIStateManager.Modals.showImportDatabaseModal(app);
        }
      );
      console.log("✅ Import database handler set up");
    }

    // Delete database button
    if (app.deleteDatabaseBtn) {
      window.DOMHelpers.safeAddEventListener(
        app.deleteDatabaseBtn,
        "click",
        () => {
          window.UIStateManager.Modals.showDeleteDatabaseModal(app);
        }
      );
      console.log("✅ Delete database handler set up");
    }

    // ✅ CRITICAL: Set up import modal internal handlers (event delegation)
    this.setupImportModalHandlers(app);

    console.log("✅ All database handlers set up");
  },

  /**
   * Set up import modal internal handlers (once, globally)
   * @param {Object} app - Application instance
   */
  /**
   * Set up import modal internal handlers (once, globally) - FIXED METHOD CALLS
   * @param {Object} app - Application instance
   */
  setupImportModalHandlers(app) {
    console.log(
      "📥 Setting up import modal handlers with correct method calls..."
    );

    // Use event delegation to handle modal buttons that appear dynamically
    document.addEventListener("click", (e) => {
      console.log(
        "🔍 Click detected:",
        e.target.id,
        e.target.tagName,
        e.target.className
      );

      // File selection button
      if (e.target && e.target.id === "selectImportFile") {
        console.log("📁 File selection button clicked via event delegation");
        e.preventDefault();
        e.stopPropagation();

        // FIXED: Use window.ModalManager instead of window.UIStateManager.Modals
        if (window.ModalManager && window.ModalManager.handleFileSelection) {
          window.ModalManager.handleFileSelection(app);
        } else {
          console.error("❌ ModalManager.handleFileSelection not found");
        }
        return;
      }

      // Confirm database action button (for import)
      if (e.target && e.target.id === "confirmDatabaseAction") {
        const importSection = document.getElementById("importDatabaseSection");
        if (importSection && importSection.style.display !== "none") {
          console.log("📥 Confirm import button clicked via event delegation");
          e.preventDefault();
          e.stopPropagation();

          // FIXED: Use window.ModalManager instead of window.UIStateManager.Modals
          if (window.ModalManager && window.ModalManager.executeImport) {
            window.ModalManager.executeImport(app);
          } else {
            console.error("❌ ModalManager.executeImport not found");
          }
          return;
        }
      }

      // Cancel database action button
      if (e.target && e.target.id === "cancelDatabaseAction") {
        console.log("❌ Cancel button clicked via event delegation");
        e.preventDefault();
        e.stopPropagation();

        // FIXED: Use window.ModalManager instead of window.UIStateManager.Modals
        if (window.ModalManager && window.ModalManager.hideModal) {
          window.ModalManager.hideModal("databaseManagementModal");
        } else {
          console.error("❌ ModalManager.hideModal not found");
        }
        return;
      }
    });

    // Radio button changes
    document.addEventListener("change", (e) => {
      if (e.target && e.target.name === "importMode") {
        console.log("🔄 Import mode changed via event delegation");

        // FIXED: Use window.ModalManager instead of window.UIStateManager.Modals
        if (window.ModalManager && window.ModalManager.updateImportSummary) {
          window.ModalManager.updateImportSummary();
        } else {
          console.error("❌ ModalManager.updateImportSummary not found");
        }
      }
    });

    console.log(
      "✅ Import modal handlers set up with event delegation and correct method calls"
    );
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

    // Add Grants button
    if (app.addGrantsBtn) {
      window.DOMHelpers.safeAddEventListener(app.addGrantsBtn, "click", () => {
        app.showaddGrantsModal();
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
          // Special handling for historical price fetch modal
          if (modal.id === 'historicalPriceFetchModal') {
            // Check if historical price fetch is in progress
            const confirmButton = document.getElementById('confirmHistoricalFetch');
            const isInProgress = confirmButton && confirmButton.disabled && confirmButton.textContent === 'Please wait...';
            
            if (isInProgress) {
              console.log('⚠️ Cannot close historical price modal during fetch');
              return; // Don't close during fetch
            }
            
            // If not in progress, just close this modal (not all modals)
            modal.classList.remove('active');
            return;
          }
          
          // For all other modals, close all modals as usual
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
    // Define modal button mappings - STANDARDIZED VERSION
    const modalButtons = [
      // Add Grants Modal
      { id: "canceladdGrants", handler: () => app.closeModals() },
      {
        id: "confirmaddGrants",
        handler: () => window.IPCCommunication.Grants.addGrants(app),
      },

      // Merge Grants Modal
      { id: "cancelMergeGrants", handler: () => app.closeModals() },
      {
        id: "confirmMergeGrants",
        handler: () => window.IPCCommunication.Grants.confirmMergeGrants(app),
      },

      // Sell Options Modal - CHANGED TO EXTERNAL CALL
      { id: "cancelSellOptions", handler: () => app.closeModals() },
      {
        id: "confirmSellOptions",
        handler: () => window.IPCCommunication.Sales.confirmSale(app),
      },

      // Edit Tax Modal - CHANGED TO EXTERNAL CALL
      { id: "cancelEditTax", handler: () => app.closeModals() },
      {
        id: "confirmEditTax",
        handler: () => window.IPCCommunication.Portfolio.updateTax(app),
      },

      // Delete Confirmation Modal - ALREADY EXTERNAL
      { id: "cancelDelete", handler: () => app.closeModals() },
      {
        id: "confirmDelete",
        handler: () => window.IPCCommunication.Portfolio.confirmDelete(app),
      },

      // Option Info Modal
      { id: "closeOptionInfo", handler: () => app.closeModals() },

      // Edit Sale Modal - CHANGED TO EXTERNAL CALL
      { id: "cancelEditSale", handler: () => app.closeModals() },
      {
        id: "confirmEditSale",
        handler: () => window.IPCCommunication.Sales.confirmEditSale(app),
      },
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
      // Add Grants form (existing handlers)
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
        handler: () => app.handleExercisePriceSelection(),
      },
      {
        id: "isin",
        event: "input",
        handler: () => app.handleIsinInput(),
      },

      // UPDATED: Sell Options form with new date field and simplified calculation
      {
        id: "saleDate",
        event: "change",
        handler: () => app.calculateSaleProceeds(),
      },
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
        console.log(`✅ Added ${event} listener for ${id}`);
      } else {
        console.warn(`⚠️ Element not found: ${id} - will try to add listener later when modal opens`);
      }
    });

    console.log(
      `✅ Form handlers initialized: ${formInputs.length} form inputs processed`
    );
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
      UndoRedoHandlers,
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
    // ✅ ADD THIS SECTION HERE - after the handler groups:
    // Set up import modal event delegation (needs to be done once globally)
    try {
      SettingsHandlers.setupImportModalHandlers(app);
      console.log("✅ Import modal event delegation initialized");
    } catch (error) {
      console.error("❌ Error setting up import modal delegation:", error);
    }
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
  EventHandlerCoordinator,
  UndoRedoHandlers,
};

// Debug logging
console.log("✅ Event Handlers loaded:", Object.keys(window.EventHandlers));
