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
window.TabManager = TabManager;
