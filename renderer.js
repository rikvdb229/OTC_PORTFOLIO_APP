// Use shared configuration from utils/config.js
// Use shared configuration from utils/config.js
console.log("🔍 Available AppConfig:", window.AppConfig);
// No local APP_CONFIG variable - use window.AppConfig.APP_CONFIG directly

const { ipcRenderer } = require("electron");
const FormatHelpers = require("./utils/formatters");
const HTMLGenerators = require("./ui/html-generators");
// EXISTING: Your class starts here
class EnhancedPortfolioApp {
  constructor() {
    // ✅ ADD THIS DEBUG AT THE TOP
    console.log("🔍 DEBUG: Checking AppConfig availability...");
    console.log("window.AppConfig:", window.AppConfig);
    console.log(
      "window.AppConfig.SettingsManager:",
      window.AppConfig?.SettingsManager
    );
    console.log(
      "loadSettings method:",
      window.AppConfig?.SettingsManager?.loadSettings
    );
    this.initializeElements();
    this.attachEventListeners();
    this.setupIpcListeners();
    this.isScrapingInProgress = false;
    this.currentEditingTaxId = null;
    this.currentDeletingEntryId = null;
    this.currentSellEntry = null;
    this.currentSortColumn = null;
    this.currentSortDirection = "asc";
    this.portfolioData = [];
    this.evolutionData = [];
    this.salesData = [];
    this.grantData = [];
    this.activeTab = "portfolio";
    this.htmlGen = new HTMLGenerators(this);
    this.helpers = new window.AppHelpers(this);
    // ADDED: Initialize UI state management
    window.UIStateManager.initialize(this);
    // ADDED: Initialize footer with version info
    this.initializeFooter();

    // Initialize the app
    this.loadPortfolioData();
    window.AppConfig.SettingsManager.loadSettings(this);
    this.checkDataAvailability();
    window.IPCCommunication.Price.checkPriceUpdateStatus(this);
    this.checkAutoUpdate();
  }

  // ADD HERE: New method to initialize footer (add this method to your class)
  initializeFooter() {
    window.UIStateManager.Footer.initializeFooter(this);
  }

  initializeElements() {
    console.log("🔍 Initializing DOM elements with helpers...");

    // Define all elements in one organized structure
    const elementMap = {
      // Header elements
      updatePricesBtn: "#updatePricesBtn",
      settingsToggle: "#settingsToggle",

      // Settings
      settingsSidebar: "#settingsSidebar",
      settingsOverlay: "#settingsOverlay",
      closeSettings: "#closeSettings",

      // Portfolio stats elements
      totalPortfolioValue: "#totalPortfolioValue",
      portfolioChange: "#portfolioChange",
      totalOptions: "#totalOptions",
      lastPriceUpdate: "#lastPriceUpdate",
      portfolioTableBody: "#portfolioTableBody",

      // Price update notification
      priceUpdateNotification: "#priceUpdateNotification",
      dismissNotification: "#dismissNotification",

      // Action buttons
      addGrantsBtn: "#addGrantsBtn",

      // Update prices modal
      updatePricesModal: "#updatePricesModal",
      updateProgressBar: "#updateProgressBar",
      updateProgressText: "#updateProgressText",
      updateStatusOutput: "#updateStatusOutput",

      // Modal elements
      addGrantsModal: "#addGrantsModal",
      mergeGrantsModal: "#mergeGrantsModal",
      sellOptionsModal: "#sellOptionsModal",
      editTaxModal: "#editTaxModal",
      deleteConfirmModal: "#deleteConfirmModal",
      optionInfoModal: "#optionInfoModal",
      // ADD THIS LINE:
      editSaleModal: "#editSaleModal",

      // Settings form elements
      targetPercentage: "#targetPercentage",
      taxRate: "#taxRate",
      currencySymbol: "#currencySymbol",
      autoUpdatePrices: "#autoUpdatePrices",
      saveSettingsBtn: "#saveSettingsBtn",

      // Tab content table bodies
      evolutionTableBody: "#evolutionTableBody",
      salesTableBody: "#salesTableBody",
      grantTableBody: "#grantTableBody",

      // Database management
      exportDatabaseBtn: "#exportDatabaseBtn",
      importDatabaseBtn: "#importDatabaseBtn",
      importMergeBtn: "#importMergeBtn",
      deleteDatabaseBtn: "#deleteDatabaseBtn",

      // Delete database modal elements
      deleteDatabaseModal: "#deleteDatabaseModal",
      deleteDatabaseConfirmText: "#deleteDatabaseConfirmText",
      confirmDeleteDatabase: "#confirmDeleteDatabase",
      cancelDeleteDatabase: "#cancelDeleteDatabase",
      // ✅ FIXED: Updated merge grants modal elements to match your HTML
      existingGrantDate: "#existingGrantDate",
      existingExercisePrice: "#existingExercisePrice",
      existingQuantity: "#existingQuantity",

      // Both versions for single/multiple grant scenarios
      newQuantitySingle: "#newQuantitySingle", // ✅ EXISTS in HTML
      newQuantityMultiple: "#newQuantityMultiple", // ✅ EXISTS in HTML

      // Additional merge modal elements that exist in your HTML
      singleGrantMerge: "#singleGrantMerge", // ✅ EXISTS
      multipleGrantsMerge: "#multipleGrantsMerge", // ✅ EXISTS
      existingGrantsList: "#existingGrantsList", // ✅ EXISTS
      mergeDetails: "#mergeDetails", // ✅ EXISTS
      mergeModalTitle: "#mergeModalTitle", // ✅ EXISTS
    };

    // Use DOM helpers to initialize all elements
    const initResults = window.DOMHelpers.initializeElements(elementMap, this);

    // Handle NodeList elements separately (arrays of elements)
    this.navTabs = window.DOMHelpers.safeQuerySelectorAll(".nav-tab");
    this.tabContents = window.DOMHelpers.safeQuerySelectorAll(".tab-content");

    // Log initialization results
    console.log(
      `✅ DOM Elements initialized: ${initResults.success.length}/${initResults.total}`
    );

    if (initResults.failed.length > 0) {
      console.warn(
        `⚠️ Missing ${initResults.failed.length} elements (may be added dynamically):`,
        initResults.failed
      );
    }

    // Special debug for critical missing elements
    const criticalElements = [
      "portfolioTableBody",
      "addGrantsBtn",
      "updatePricesBtn",
      "settingsToggle",
      "totalPortfolioValue",
    ];

    const missingCritical = criticalElements.filter((el) =>
      initResults.failed.includes(el)
    );

    if (missingCritical.length > 0) {
      console.error(`❌ Critical elements missing:`, missingCritical);
    }

    // Debug merge modal specifically (known issue from previous attempts)
    if (!this.mergeGrantsModal) {
      console.log("🔍 Debugging merge modal...");
      const mergeModal =
        window.DOMHelpers.safeQuerySelector("#mergeGrantsModal");
      if (mergeModal) {
        console.log("✅ Merge modal found with selector, assigning...");
        this.mergeGrantsModal = mergeModal;
      } else {
        console.warn("⚠️ Merge modal not found - may be added dynamically");
      }
    }
  }

  attachEventListeners() {
    console.log("🎯 Setting up event listeners with organized handlers...");

    // Use the event handler coordinator to set up all listeners
    window.EventHandlers.EventHandlerCoordinator.initializeAll(this);
    this.initializeDeleteDatabase();
    console.log("✅ All event listeners attached successfully");
  }
  /**
   * Toggle notes expansion/collapse in evolution table
   * @param {string} noteId - Unique ID for the note entry
   * @param {boolean} expand - Whether to expand (true) or collapse (false)
   */
  toggleNotes(noteId, expand) {
    window.UIStateManager.Tabs.toggleNotes(this, noteId, expand);
  }

  setupIpcListeners() {
    console.log("📡 Setting up IPC listeners with communication layer...");

    // Initialize IPC communication layer
    const ipcInitialized = window.IPCCommunication.initialize(this);

    if (ipcInitialized) {
      console.log("✅ IPC communication layer ready");
    } else {
      console.error("❌ Failed to initialize IPC communication");
    }
  }

  // ===== TAB NAVIGATION =====
  switchTab(tabName) {
    if (window.UIStateManager && window.UIStateManager.Tabs) {
      window.UIStateManager.Tabs.safeTabSwitch(this, tabName);
    }
  }

  // ===== SETTINGS MANAGEMENT =====
  openSettings() {
    window.UIStateManager.Modals.openSettings(app);
  }

  closeSettingsPanel() {
    window.UIStateManager.Modals.closeSettings(app);
  }
  async confirmMergeGrants() {
    // Delegate to IPC communication layer with app context
    await window.IPCCommunication.Grants.confirmMergeGrants(this);
  }

  // ADD/REPLACE these functions in your renderer.js file in the modal management section:

  // REPLACE your existing proceedWithSeparateGrant function with this:
  async proceedWithSeparateGrant() {
    // Delegate to IPC communication layer with app context
    await window.IPCCommunication.Grants.proceedWithSeparateGrant(this);
  }
  // ADD this new function for merge grant processing:
  async proceedWithMergeGrant() {
    // Delegate to IPC communication layer with app context
    await window.IPCCommunication.Grants.proceedWithMergeGrant(this);
  }
  showDeleteConfirmModal(
    entryId,
    grantDate,
    quantity,
    exercisePrice,
    currentValue
  ) {
    window.UIStateManager.Modals.showDeleteConfirmModal(
      this,
      entryId,
      grantDate,
      quantity,
      exercisePrice,
      currentValue
    );
  }

  async confirmDelete() {
    await window.IPCCommunication.Portfolio.confirmDelete(this);
  }

  closeModals() {
    window.UIStateManager.Modals.closeAllModals(this);
  }
  // UPDATE your existing clearaddGrantsForm function to also clear stored data:
  clearaddGrantsForm() {
    window.UIStateManager.Forms.clearaddGrantsForm(this);
  }

  // ===== PRICE UPDATE FUNCTIONALITY =====
  async checkPriceUpdateStatus() {
    await window.IPCCommunication.Price.checkPriceUpdateStatus(this);
  }

  // UPDATED: After successful price update, recheck status
  async updatePrices() {
    if (this.isScrapingInProgress) return;

    this.isScrapingInProgress = true;
    this.updatePricesBtn.disabled = true;
    this.updatePricesBtn.textContent = "⏳ Updating...";

    // Use UI State Manager to show modal
    window.UIStateManager.Modals.showModal("updatePricesModal", () => {
      this.updateProgressBar.style.width = "0%";
      this.updateProgressText.textContent = "Starting price update...";
      this.updateStatusOutput.textContent = "Connecting to KBC servers...";
    });

    try {
      const result = await window.IPCCommunication.Price.updatePrices();

      if (result.success) {
        this.updateProgressBar.style.width = "100%";
        this.updateProgressText.textContent = "Update Complete!";
        this.updateStatusOutput.textContent = `✅ Successfully updated prices\nFile: ${result.fileName}`;

        // Reload data
        await this.loadPortfolioData();
        await this.checkDataAvailability();
        await window.IPCCommunication.Price.checkPriceUpdateStatus(this);
        setTimeout(() => {
          // Use UI State Manager to close modal
          window.UIStateManager.Modals.closeAllModals(this);
        }, 2000);
      } else {
        this.updateProgressBar.style.width = "0%";
        this.updateProgressText.textContent = "Update Failed";
        this.updateStatusOutput.textContent = `❌ Failed to update prices\nError: ${result.error}`;

        this.updatePricesBtn.textContent = "📊 Update Prices";
        this.updatePricesBtn.disabled = false;

        setTimeout(() => {
          // Use UI State Manager to close modal
          window.UIStateManager.Modals.closeAllModals(this);
        }, 5000);
      }
    } catch (error) {
      this.updateProgressBar.style.width = "0%";
      this.updateProgressText.textContent = "Update Error";
      this.updateStatusOutput.textContent = `❌ Update error: ${error.message}`;

      this.updatePricesBtn.textContent = "📊 Update Prices";
      this.updatePricesBtn.disabled = false;

      setTimeout(() => {
        // Use UI State Manager to close modal
        window.UIStateManager.Modals.closeAllModals(this);
      }, 5000);
    } finally {
      this.isScrapingInProgress = false;
    }
  }

  async checkAutoUpdate() {
    this.helpers.checkAutoUpdate();
  }
  updateProgress(progressText) {
    window.UIStateManager.Modals.updateProgress(this, progressText);
  }

  // ===== PORTFOLIO DATA MANAGEMENT =====
  async loadPortfolioData() {
    return await this.helpers.loadPortfolioData();
  }

  // FIXED: Update header stats method
  updateHeaderStats(overview) {
    window.UIStateManager.Stats.updateHeaderStats(this, overview);
  }

  updatePortfolioStats(overview, targetPercentage = 65) {
    window.UIStateManager.updatePortfolioStats(overview, targetPercentage);
  }

  // Enhanced updatePortfolioTable method in renderer.js
  // Enhanced updatePortfolioTable method with improved styling
  updatePortfolioTable(overview, targetPercentage = 65) {
    this.htmlGen.renderPortfolioTable(overview, targetPercentage);
  }
  // FIXED: Check if price data exists
  async checkIfPriceDataExists() {
    try {
      const prices = await ipcRenderer.invoke("get-available-exercise-prices");
      return prices && prices.length > 0 && !prices.error;
    } catch (error) {
      return false;
    }
  }
  // ===== TABLE SORTING =====
  sortTable(column) {
    window.UIStateManager.smartSortTable(column);
  }
  // ===== DATA AVAILABILITY CHECK =====
  async checkDataAvailability() {
    try {
      const prices =
        await window.IPCCommunication.Portfolio.getAvailableExercisePrices();
      const hasData = prices && prices.length > 0 && !prices.error;

      // Use UI state manager to update button states
      window.UIStateManager.ActionButtons.updateActionButtons(this, hasData);
    } catch (error) {
      console.error("Error checking data availability:", error);
      window.UIStateManager.ActionButtons.updateActionButtons(this, false);
    }
  }
  showPriceUpdateNotification() {
    window.UIStateManager.Notifications.showPriceUpdateNotification(this);
  }
  hidePriceUpdateNotification() {
    window.UIStateManager.Notifications.hidePriceUpdateNotification(this);
  }
  updateActionButtons(hasData) {
    window.UIStateManager.ActionButtons.updateActionButtons(this, hasData);
  }

  // ===== MODAL MANAGEMENT =====
  async showaddGrantsModal() {
    try {
      window.UIStateManager.Modals.showaddGrantsModal(this);
    } catch (error) {
      console.error("Error showing Add Grants modal:", error);
      alert("Error loading modal data");
    }
  }

  // FIXED: Show merge grants modal with safety checks
  // REPLACE the showMergeGrantsModal method in renderer.js

  // REPLACE the showMergeGrantsModal method in renderer.js

  showMergeGrantsModal(existingGrants, newQuantity, newTaxAmount) {
    window.UIStateManager.Modals.showMergeGrantsModal(
      this,
      existingGrants,
      newQuantity,
      newTaxAmount
    );
  }

  // NEW method to handle grant selection
  selectGrant(grantId) {
    console.log("📋 User selected grant ID:", grantId);

    this.selectedGrantId = grantId;

    // Update visual selection
    document.querySelectorAll(".grant-selection-item").forEach((item) => {
      item.classList.remove("selected");
    });
    document
      .querySelector(`[data-grant-id="${grantId}"]`)
      .classList.add("selected");

    // Update radio button
    document.querySelector(`input[value="${grantId}"]`).checked = true;

    // Update merge details
    const selectedGrant = this.existingGrants.find((g) => g.id === grantId);
    if (selectedGrant) {
      const mergeDetails = document.getElementById("mergeDetails");
      const totalAfter = selectedGrant.quantity + this.newGrantQuantity;
      mergeDetails.textContent = `- Add to selected grant (Total: ${totalAfter.toLocaleString()} options)`;
    }
  }
  async showSellModal(entryId) {
    const entry = this.portfolioData.find((e) => e.id === entryId);
    if (!entry) {
      alert("Portfolio entry not found");
      return;
    }

    this.currentSellEntry = entry;

    // Enhanced sell modal with fund information
    document.getElementById("sellOptionDetails").innerHTML = `
    <div class="option-details">
      <h4>📊 ${this.helpers.formatFundName(entry.fund_name)} Option</h4>
      <p><strong>Underlying Fund:</strong> <span class="fund-highlight">${
        entry.fund_name || "Unknown Fund"
      }</span></p>
      <p><strong>Grant Date:</strong> ${new Date(
        entry.grant_date
      ).toLocaleDateString()}</p>
      <p><strong>Exercise Price:</strong> ${this.helpers.formatCurrency(
        entry.exercise_price
      )}</p>
      <p><strong>Current Value:</strong> ${this.helpers.formatCurrency(
        entry.current_value || 0
      )}</p>
      <p><strong>Available Quantity:</strong> ${entry.quantity_remaining.toLocaleString()} options</p>
      <p><strong>Performance:</strong> 
        <span class="${
          entry.current_return_percentage >= 0 ? "positive" : "negative"
        }">
          ${
            entry.current_return_percentage
              ? entry.current_return_percentage.toFixed(1) + "%"
              : "N/A"
          }
        </span>
      </p>
    </div>
  `;

    document.getElementById("quantityToSell").max = entry.quantity_remaining;
    document.getElementById("maxQuantityHelp").textContent =
      `Maximum available: ${entry.quantity_remaining.toLocaleString()} options`;
    document.getElementById("salePrice").value = entry.current_value || "";

    // Reset calculations
    this.calculateSaleProceeds();

    window.UIStateManager.Modals.showModal("sellOptionsModal");
  }

  calculateSaleProceeds() {
    this.helpers.calculateSaleProceeds(this);
  }

  async confirmSale() {
    if (!this.currentSellEntry) return;

    try {
      const quantityToSell = parseInt(
        document.getElementById("quantityToSell").value
      );
      const salePrice = parseFloat(document.getElementById("salePrice").value);
      const notes = document.getElementById("saleNotes").value || null;
      const saleDate = new Date().toISOString().split("T")[0];

      // Validation
      if (
        !quantityToSell ||
        !salePrice ||
        quantityToSell <= 0 ||
        salePrice <= 0
      ) {
        alert("Please enter valid quantity and sale price");
        return;
      }

      if (quantityToSell > this.currentSellEntry.quantity_remaining) {
        alert("Cannot sell more options than available");
        return;
      }

      const result = await ipcRenderer.invoke(
        "record-sale-transaction",
        this.currentSellEntry.id,
        saleDate,
        quantityToSell,
        salePrice,
        notes
      );

      if (result.error) {
        alert("Error recording sale: " + result.error);
        return;
      }

      this.closeModals();
      await this.loadPortfolioData();
      await this.loadEvolutionData("all"); // FIXED: Update evolution after sale
      console.log(
        `✅ Recorded sale of ${quantityToSell} options at ${this.helpers.formatCurrency(
          salePrice
        )}`
      );
    } catch (error) {
      console.error("Error confirming sale:", error);
      alert("Error recording sale: " + (error.message || error));
    }
  }

  async showOptionInfo(entryId) {
    window.UIStateManager.Modals.showOptionInfoModal(this, entryId);
  }
  /**
   * Open edit sale modal with sale data
   * @param {number} saleId - ID of the sale to edit
   */
  async editSale(saleId) {
    await window.UIStateManager.Modals.showEditSaleModal(this, saleId);
  }

  getSellingStatusText(status) {
    return window.FormatHelpers.getSellingStatusText(status);
  }

  editTax(entryId, autoTax, currentTax) {
    this.currentEditingTaxId = entryId;

    document.getElementById("autoTaxAmount").textContent =
      this.helpers.formatCurrency(autoTax);
    document.getElementById("currentTaxAmount").textContent =
      this.helpers.formatCurrency(currentTax);
    document.getElementById("newTaxAmount").value = currentTax || autoTax;

    window.UIStateManager.Modals.showModal("editTaxModal");
  }

  showDeleteDatabaseModal() {
    console.log("🗑️ Showing delete database modal");

    // Reset the confirmation input
    if (this.deleteDatabaseConfirmText) {
      this.deleteDatabaseConfirmText.value = "";
      this.deleteDatabaseConfirmText.classList.remove("valid", "invalid");
    }

    // Disable the confirm button
    if (this.confirmDeleteDatabase) {
      this.confirmDeleteDatabase.disabled = true;
    }

    // Show the modal
    if (this.deleteDatabaseModal) {
      this.deleteDatabaseModal.classList.add("active");
    }
  }

  async confirmDelete() {
    try {
      const result = await ipcRenderer.invoke(
        "delete-portfolio-entry",
        this.currentDeletingEntryId
      );

      if (result.error) {
        alert("Error deleting entry: " + result.error);
        return;
      }

      this.closeModals();
      await this.loadPortfolioData();
      console.log(`✅ Deleted portfolio entry`);
    } catch (error) {
      console.error("Error deleting portfolio entry:", error);
      alert("Error deleting entry");
    }
  }

  // ===== Add GrantS FUNCTIONALITY =====
  async handleGrantDateSelection() {
    await window.UIStateManager.Forms.handleGrantDateSelection(this);
  }

  calculateEstimatedTax() {
    window.UIStateManager.Forms.calculateEstimatedTax(this);
  }

  updateTaxDisplay() {
    window.UIStateManager.Forms.updateTaxDisplay(this);
  }
  // FIXED: Enhanced Add Grants with better error handling
  // REPLACE your existing addGrants() function in renderer.js with this complete version:

  async addOptions() {
    // Delegate to IPC communication layer with app context
    await window.IPCCommunication.Grants.addGrants(this);
  }
  /**
   * Confirm and save sale edits
   */
  async confirmEditSale() {
    try {
      console.log("💾 Saving sale edits...");

      // Get updated values
      const updatedSale = {
        id: this.currentEditingSaleId,
        sale_date: document.getElementById("editSaleDate").value,
        sale_price: parseFloat(document.getElementById("editSalePrice").value),
        notes: document.getElementById("editSaleNotes").value.trim(),
      };

      // Validate inputs
      if (!updatedSale.sale_date) {
        alert("Please enter a sale date");
        return;
      }

      if (!updatedSale.sale_price || updatedSale.sale_price <= 0) {
        alert("Please enter a valid sale price");
        return;
      }

      // Check if date is not in future
      const saleDate = new Date(updatedSale.sale_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (saleDate > today) {
        alert("Sale date cannot be in the future");
        return;
      }

      console.log("📊 Updating sale with data:", updatedSale);

      // Save to database
      const result = await ipcRenderer.invoke("update-sale", updatedSale);

      if (result.error) {
        alert("Error updating sale: " + result.error);
        return;
      }

      console.log("✅ Sale updated successfully:", result);

      // Close modal first
      this.closeModals();

      // FIXED: Complete data refresh to ensure all calculations are updated
      console.log("🔄 Refreshing all data after sale update...");

      // 1. Refresh sales table (shows the updated sale)
      await this.loadSalesHistory();
      console.log("✅ Sales history refreshed");

      // 2. Refresh portfolio overview (main table with P&L calculations)
      await this.loadPortfolioData();
      console.log("✅ Portfolio data refreshed");

      // 3. CRITICAL: Refresh evolution data (affects portfolio calculations)
      await this.loadEvolutionData("all");
      console.log("✅ Evolution data refreshed");

      // 4. Refresh grant history (if it exists and could be affected)
      if (typeof this.loadGrantHistory === "function") {
        await this.loadGrantHistory();
        console.log("✅ Grant history refreshed");
      }

      console.log("🎉 All data successfully refreshed after sale update");
    } catch (error) {
      console.error("❌ Error updating sale:", error);
      alert("Error updating sale: " + error.message);
    }
  }

  async updateTax() {
    await this.helpers.updateTax(this);
  }

  // ===== EVOLUTION TAB =====
  async loadEvolutionData(days = "all") {
    return await this.helpers.loadEvolutionData(days);
  }

  // ===== CHART TAB =====
  // FIXED: Y-axis scaling in the loadChartData method
  // UPDATED loadChartData method - Replace your current one with this

  /**
   * CORRECTED loadChartData function for renderer.js
   * Replace the existing loadChartData function
   */
  /**
   * CORRECTED loadChartData function for renderer.js
   * Replace the existing loadChartData function
   */
  async loadChartData(period = "all") {
    return await this.helpers.loadChartData(period);
  }

  // ADD this function to renderer.js:
  createSimpleChartLegend() {
    window.ChartVisualization.createSimpleChartLegend();
  }

  // UPDATED: Switch tab method to handle renamed chart tab
  switchTab(tabName) {
    window.UIStateManager.switchTab(tabName);
  }

  // ===== GRANT HISTORY TAB =====
  async loadSalesHistory() {
    return await window.IPCCommunication.Portfolio.loadSalesHistory(this);
  }

  // ===== SALES HISTORY TAB =====
  async loadGrantHistory() {
    return await window.IPCCommunication.Portfolio.loadGrantHistory(this);
  }

  // ===== UPDATE GRANT FILTER SUMMARY =====
  updateGrantFilterSummary(activeFilters, visibleCount, totalCount) {
    window.UIStateManager.Tables.updateGrantFilterSummary(
      activeFilters,
      visibleCount,
      totalCount
    );
  }
  filterGrantHistory() {
    window.UIStateManager.Tables.filterGrantHistory(this);
  }

  // ===== UPDATE FILTER BUTTON COUNTS =====
  // ===== UPDATE FILTER BUTTON COUNTS (FIXED LOGIC) =====
  updateGrantFilterCounts(activeFilters) {
    window.UIStateManager.Tables.updateGrantFilterCounts(this, activeFilters);
  }
  // ===== UPDATE GRANT FILTER SUMMARY =====
  // ===== MODERN GRANT FILTERING =====
  // ===== UPDATE GRANT FILTER SUMMARY =====
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
  }

  // ===== INITIALIZE GRANT FILTERS =====
  initializeGrantFilters() {
    window.UIStateManager.Tables.initializeGrantFilters(this);
  }

  // ===== DATABASE MANAGEMENT =====
  initializeDeleteDatabase() {
    console.log("🗑️ Initializing delete database functionality...");

    // Delete database button click handler
    if (this.deleteDatabaseBtn) {
      this.deleteDatabaseBtn.addEventListener("click", () => {
        this.showDeleteDatabaseModal();
      });
    }

    // Cancel delete database
    if (this.cancelDeleteDatabase) {
      this.cancelDeleteDatabase.addEventListener("click", () => {
        this.closeModals();
      });
    }

    // Confirm delete database
    if (this.confirmDeleteDatabase) {
      this.confirmDeleteDatabase.addEventListener("click", () => {
        this.executeDeleteDatabase();
      });
    }

    // Text input validation - use direct DOM query as fallback
    const textInput =
      this.deleteDatabaseConfirmText ||
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
          setTimeout(() => this.validateDeleteConfirmation(), 10);
        });
      });

      // Test the validation immediately
      console.log("🧪 Testing validation function...");
      this.validateDeleteConfirmation();
    } else {
      console.error("❌ Delete confirmation text input not found!");
      console.log(
        "Available element:",
        document.getElementById("deleteDatabaseConfirmText")
      );
    }

    console.log("✅ Delete database functionality initialized");
  }

  /**
   * Show the delete database confirmation modal
   */
  showDeleteDatabaseModal() {
    console.log("🗑️ Showing delete database modal");

    // Show modal using your existing modal system
    if (this.deleteDatabaseModal) {
      this.deleteDatabaseModal.classList.add("active");
      console.log("✅ Modal shown");
    }

    // Reset and setup input field
    const input = document.getElementById("deleteDatabaseConfirmText");
    const button = document.getElementById("confirmDeleteDatabase");

    if (input) {
      input.value = "";
      input.classList.remove("valid", "invalid");
      console.log("✅ Input field reset");
    }

    if (button) {
      button.disabled = true;
      console.log("✅ Button disabled");
    }

    // Set up validation with direct event listener
    setTimeout(() => {
      if (input && button) {
        console.log("🔧 Setting up validation listener...");

        // Remove existing event listeners by cloning the node
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);

        // Add fresh event listener
        newInput.addEventListener("input", function (e) {
          console.log("📝 Input event fired, value:", this.value);

          const requiredText = "delete database";
          const userInput = this.value.toLowerCase().trim();
          const isValid = userInput === requiredText;

          console.log(
            `🔍 Checking: "${userInput}" vs "${requiredText}" = ${isValid}`
          );

          // Update button
          const currentButton = document.getElementById(
            "confirmDeleteDatabase"
          );
          if (currentButton) {
            currentButton.disabled = !isValid;
            console.log(`Button is now: ${isValid ? "ENABLED" : "DISABLED"}`);
          }

          // Update input styling
          this.classList.remove("valid", "invalid");
          if (userInput.length > 0) {
            this.classList.add(isValid ? "valid" : "invalid");
          }
        });

        // Add other event types for completeness
        ["keyup", "paste", "change"].forEach((eventType) => {
          newInput.addEventListener(eventType, function (e) {
            console.log(`📝 ${eventType} event fired`);
            this.dispatchEvent(new Event("input"));
          });
        });

        console.log("✅ Validation listeners attached");
      } else {
        console.error("❌ Input or button not found during setup");
      }
    }, 200);
  }

  /**
   * Validate the confirmation text input
   */
  validateDeleteConfirmation() {
    window.UIStateManager.Validation.validateDeleteConfirmation(this);
  }
  /**
   * Execute the database deletion
   */
  async executeDeleteDatabase() {
    console.log("🗑️ Executing database deletion...");

    try {
      // Show loading state
      if (this.confirmDeleteDatabase) {
        this.confirmDeleteDatabase.textContent = "Deleting...";
        this.confirmDeleteDatabase.disabled = true;
      }

      // Call the backend to delete the database
      console.log("📡 Calling backend delete database method...");
      const result = await window.IPCCommunication.Database.deleteDatabase();

      console.log("📡 Backend response:", result);

      if (result && result.success) {
        console.log("✅ Database deleted successfully");

        // Close the modal
        window.UIStateManager.closeAllModals(this);
        // Reload the application
        await this.handlePostDeleteCleanup();
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
      if (this.confirmDeleteDatabase) {
        this.confirmDeleteDatabase.textContent = "🗑️ DELETE DATABASE";
        this.confirmDeleteDatabase.disabled = false;
      }
    }
  }

  /**
   * Handle cleanup after database deletion
   */
  async handlePostDeleteCleanup() {
    try {
      console.log("🧹 Performing post-delete cleanup...");

      // Clear current portfolio data
      this.portfolioData = [];
      this.salesData = [];
      this.evolutionData = [];

      // Reset UI elements
      if (this.portfolioTableBody) {
        this.portfolioTableBody.innerHTML =
          '<tr><td colspan="10" class="no-data">No portfolio data available</td></tr>';
      }

      if (this.totalPortfolioValue) {
        this.totalPortfolioValue.textContent = "€0.00";
      }

      // Reset charts if they exist
      if (this.portfolioChart) {
        this.portfolioChart.destroy();
        this.portfolioChart = null;
      }

      // Switch to portfolio tab
      this.switchTab("portfolio");

      // Reload the app to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("❌ Error in post-delete cleanup:", error);
      // Force reload anyway
      window.location.reload();
    }
  }
  async exportDatabase() {
    return await window.UIStateManager.Database.exportDatabase(this);
  }

  async importDatabase(mergeMode = false) {
    return await window.UIStateManager.Database.importDatabase(this, mergeMode);
  }
  debugDeleteElements() {
    window.DOMHelpers.debugDeleteElements(this);
  }

  // ===== SETTINGS MANAGEMENT =====
  async debugDatabase() {
    return await window.UIStateManager.Database.debugDatabase(this);
  }
}

// Initialize the enhanced app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("=== DOM LOADED DEBUG ===");
  console.log("1. DOM Content Loaded");
  console.log(
    "2. Merge modal at DOM ready:",
    document.getElementById("mergeGrantsModal")
  );
  console.log(
    "3. All modals at DOM ready:",
    Array.from(document.querySelectorAll(".modal")).map((m) => ({
      id: m.id,
      classes: m.className,
    }))
  );
  console.log("=== END DOM LOADED DEBUG ===");

  // Small delay to check after app initialization
  setTimeout(() => {
    console.log("=== POST-INIT DEBUG ===");
    console.log(
      "1. Merge modal after app init:",
      document.getElementById("mergeGrantsModal")
    );
    console.log("2. Portfolio app instance:", window.portfolioApp);
    if (window.portfolioApp) {
      console.log(
        "3. App's merge modal reference:",
        window.portfolioApp.mergeGrantsModal
      );
    }
    console.log("=== END POST-INIT DEBUG ===");
  }, 1000);
});
document.addEventListener("DOMContentLoaded", () => {
  window.portfolioApp = new EnhancedPortfolioApp();
  console.log("🚀 Enhanced Portfolio Management App initialized");
});
