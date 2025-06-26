const ActionButtonManager = {
  /**
   * Update action button states
   * @param {Object} app - Application instance
   * @param {boolean} hasData - Whether portfolio has data
   */
  updateActionButtons(app, hasData) {
    if (!app.addGrantsBtn) {
      console.warn("⚠️ addGrantsBtn not found, retrying...");
      // Retry after a short delay
      setTimeout(() => {
        app.addGrantsBtn = document.getElementById("addGrantsBtn");
        if (app.addGrantsBtn) {
          this.updateActionButtons(app, hasData);
        }
      }, 100);
      return;
    }

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
window.ActionButtonManager = ActionButtonManager;
