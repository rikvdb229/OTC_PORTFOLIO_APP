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
    this.loadSettings();
    this.checkDataAvailability();
    window.IPCCommunication.Price.checkPriceUpdateStatus(this);
    this.checkAutoUpdate();
  }

  // ADD HERE: New method to initialize footer (add this method to your class)
  initializeFooter() {
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
      addOptionsBtn: "#addOptionsBtn",

      // Update prices modal
      updatePricesModal: "#updatePricesModal",
      updateProgressBar: "#updateProgressBar",
      updateProgressText: "#updateProgressText",
      updateStatusOutput: "#updateStatusOutput",

      // Modal elements
      addOptionsModal: "#addOptionsModal",
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
      "addOptionsBtn",
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
    window.UIStateManager.Settings.openSettings(this);
  }

  closeSettingsPanel() {
    window.UIStateManager.Settings.closeSettings(this);
  }
  async confirmMergeGrants() {
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
        await this.proceedWithSeparateGrant();
        return;
      }

      if (choice === "merge") {
        if (this.existingGrants && this.existingGrants.length > 1) {
          console.log(
            "🔄 Multiple grants merge - keeping modal open for selection"
          );
          await this.proceedWithMergeGrant();
        } else {
          console.log("🔄 Single grant merge - can close modal");
          this.closeModals();
          await this.proceedWithMergeGrant();
        }
        return;
      }
    } catch (error) {
      console.error("❌ Error in confirmMergeGrants:", error);
      alert("Error processing grant choice: " + error.message);
    }
  }

  // ADD/REPLACE these functions in your renderer.js file in the modal management section:

  // REPLACE your existing proceedWithSeparateGrant function with this:
  async proceedWithSeparateGrant() {
    try {
      console.log("➕ Proceeding with separate grant creation...");

      // Use stored form data instead of reading from DOM
      const formData = this.currentFormData;

      if (!formData) {
        console.error("❌ No stored form data found!");
        alert("Error: Form data lost. Please try adding the options again.");
        this.closeModals();
        return;
      }

      const { grantDate, exercisePrice, quantity, actualTaxAmount } = formData;

      console.log("📝 Using stored form data for separate grant:", formData);

      // Validate the stored data
      if (!grantDate || !exercisePrice || !quantity) {
        console.error("❌ Invalid stored form data:", formData);
        alert("Error: Invalid form data. Please try adding the options again.");
        this.closeModals();
        return;
      }

      // Close modal BEFORE making the API call
      this.closeModals();

      const result = await ipcRenderer.invoke(
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
      await this.loadPortfolioData();
      await this.loadEvolutionData("all");
      await this.checkDataAvailability();

      // Clear form AND stored data
      this.clearAddOptionsForm();
      this.currentFormData = null;

      console.log(
        `🎉 Successfully added ${quantity} options as separate grant`
      );
    } catch (error) {
      console.error("❌ Error in proceedWithSeparateGrant:", error);
      alert("Error adding options: " + error.message);
      try {
        this.closeModals();
      } catch (modalError) {
        console.error("❌ Could not close modal:", modalError);
      }
    }
  }
  // ADD this new function for merge grant processing:
  async proceedWithMergeGrant() {
    try {
      console.log("🔄 Processing grant merge...");

      // Use stored form data instead of reading from DOM
      const formData = this.currentFormData;

      if (!formData) {
        console.error("❌ No stored form data found!");
        alert("Error: Form data lost. Please try adding the options again.");
        this.closeModals();
        return;
      }

      const { quantity, actualTaxAmount } = formData;

      // Get the target grant to merge with
      let targetGrantId;

      if (this.existingGrants.length === 1) {
        // Single grant scenario
        targetGrantId = this.existingGrants[0].id;
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

      // Close modal BEFORE making the API call
      this.closeModals();

      console.log("📝 Merge data:", {
        targetGrantId,
        newQuantity: quantity,
        newTaxAmount: actualTaxAmount,
      });

      // Call backend to perform the merge
      const result = await ipcRenderer.invoke(
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
      await this.loadPortfolioData();
      await this.loadEvolutionData("all");
      await this.checkDataAvailability();

      // Clear form AND stored data
      this.clearAddOptionsForm();
      this.currentFormData = null;

      console.log(
        `🎉 Successfully merged ${quantity} options into existing grant`
      );
    } catch (error) {
      console.error("❌ Error in proceedWithMergeGrant:", error);
      alert("Error merging grants: " + error.message);
      try {
        this.closeModals();
      } catch (modalError) {
        console.error("❌ Could not close modal:", modalError);
      }
    }
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

  closeModals() {
    window.UIStateManager.Modals.closeAllModals(this);
  }
  // UPDATE your existing clearAddOptionsForm function to also clear stored data:
  clearAddOptionsForm() {
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
      if (actualTaxAmountElement) actualTaxAmountElement.value = "";
      if (estimatedTaxElement) estimatedTaxElement.textContent = "€ 0.00";

      if (helpTextElement) {
        helpTextElement.textContent =
          "Options will appear after entering grant date";
      }

      // Clear stored form data
      this.currentFormData = null;

      console.log("✅ Form and stored data cleared");
    } catch (error) {
      console.warn("⚠️ Error clearing form:", error);
    }
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
    if (this.updateProgressText) {
      this.updateProgressText.textContent = progressText;
    }

    let percentage = 0;
    if (progressText.includes("Connecting")) percentage = 20;
    else if (progressText.includes("Loading")) percentage = 50;
    else if (progressText.includes("Processing")) percentage = 70;
    else if (progressText.includes("Downloading")) percentage = 90;
    else if (progressText.includes("Complete")) percentage = 100;

    if (this.updateProgressBar) {
      this.updateProgressBar.style.width = percentage + "%";
    }
  }

  // ===== PORTFOLIO DATA MANAGEMENT =====
  async loadPortfolioData() {
    try {
      const overview = await window.IPCCommunication.Portfolio.getOverview();

      this.portfolioData = overview;
      const targetPercentage =
        (await window.IPCCommunication.Settings.getSetting(
          "target_percentage"
        )) || 65;

      this.updatePortfolioStats(overview, parseFloat(targetPercentage));
      this.updatePortfolioTable(overview, parseFloat(targetPercentage));
      this.updateActionButtons(overview.length > 0);
      this.updateHeaderStats(overview);
    } catch (error) {
      console.error("Error loading portfolio data:", error);
    }
  }

  // FIXED: Update header stats method
  updateHeaderStats(overview) {
    const stats = window.PortfolioCalculations.generatePortfolioStats(overview);

    // Update header values using calculated stats
    const headerTotalValue = document.getElementById("totalPortfolioValue");
    const headerActiveOptions = document.getElementById("totalOptions");
    const headerLastUpdate = document.getElementById("lastPriceUpdate");

    if (headerTotalValue) {
      headerTotalValue.textContent = this.helpers.formatCurrency(
        stats.totalValue
      );
    }
    if (headerActiveOptions) {
      headerActiveOptions.textContent = stats.totalQuantityFormatted;
    }
    if (headerLastUpdate) {
      headerLastUpdate.textContent = stats.latestUpdateFormatted;
    }
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
    console.log(`🔄 Sorting by column: ${column}`);

    // Determine which data array to sort based on active tab
    const activeTab = document.querySelector(".nav-tab.active");
    if (!activeTab) {
      console.warn("No active tab found");
      return;
    }

    const tabText = activeTab.textContent.trim().toLowerCase();
    let dataToSort, updateMethod;

    // Map tabs to their data and update methods
    if (tabText.includes("portfolio")) {
      dataToSort = this.portfolioData;
      updateMethod = (sortedData) => {
        this.portfolioData = sortedData;
        this.updatePortfolioTable(sortedData);
      };
    } else if (tabText.includes("evolution")) {
      dataToSort = this.evolutionData;
      updateMethod = (sortedData) => {
        this.evolutionData = sortedData;
        this.htmlGen.renderEvolutionTable(sortedData);
      };
    } else if (tabText.includes("sales")) {
      dataToSort = this.salesData;
      updateMethod = (sortedData) => {
        this.salesData = sortedData;
        this.htmlGen.renderSalesTable(sortedData);
      };
    } else if (tabText.includes("grant")) {
      dataToSort = this.grantData;
      updateMethod = (sortedData) => {
        this.grantData = sortedData;
        this.htmlGen.renderGrantTable(sortedData);
      };
    } else {
      console.warn(`Unknown tab: ${tabText}`);
      return;
    }

    // Check if we have data to sort
    if (!dataToSort || dataToSort.length === 0) {
      console.warn(`No data available for ${tabText} tab`);
      return;
    }

    // Use UIStateManager's sorting functionality
    window.UIStateManager.sortTable(column, dataToSort, updateMethod);

    console.log(`✅ ${tabText} table sorted by ${column}`);
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
  async showAddOptionsModal() {
    try {
      window.UIStateManager.Modals.showAddOptionsModal(this);
    } catch (error) {
      console.error("Error showing add options modal:", error);
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
    if (!this.currentSellEntry) return;

    const quantityToSell =
      parseInt(document.getElementById("quantityToSell").value) || 0;
    const salePrice =
      parseFloat(document.getElementById("salePrice").value) || 0;

    if (
      quantityToSell > 0 &&
      salePrice > 0 &&
      this.currentSellEntry.quantity > 0
    ) {
      const totalSaleValue = quantityToSell * salePrice;

      // Calculate proportional tax that will be reduced from remaining portfolio
      const totalTax =
        this.currentSellEntry.tax_amount ||
        this.currentSellEntry.tax_auto_calculated ||
        0;
      const taxAllocatedToSold =
        totalTax > 0
          ? (totalTax * quantityToSell) / this.currentSellEntry.quantity
          : 0;

      // Net proceeds = full sale value (tax was already paid when granted)
      const netProceeds = totalSaleValue;

      document.getElementById("totalSaleValue").textContent =
        this.helpers.formatCurrency(totalSaleValue);
      document.getElementById("proportionalTax").textContent =
        this.helpers.formatCurrency(taxAllocatedToSold);
      document.getElementById("netProceeds").textContent =
        this.helpers.formatCurrency(netProceeds);
    } else {
      document.getElementById("totalSaleValue").textContent = "€ 0.00";
      document.getElementById("proportionalTax").textContent = "€ 0.00";
      document.getElementById("netProceeds").textContent = "€ 0.00";
    }
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

  closeModals() {
    window.UIStateManager.Modals.closeAllModals(this);
  }

  // ===== ADD OPTIONS FUNCTIONALITY =====
  async onGrantDateChange() {
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
        const fundName = this.helpers.formatFundName(option.fund_name);
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
        this.calculateEstimatedTax();
      }
    } catch (error) {
      console.error("Error loading options for grant date:", error);
      exercisePriceSelect.innerHTML =
        '<option value="">Error loading options</option>';
      exercisePriceSelect.disabled = true;
      helpText.textContent = "Error loading options for this date";
      helpText.className = "form-help error";
    }
  }

  calculateEstimatedTax() {
    const quantity = parseInt(document.getElementById("quantity").value) || 0;
    const taxRate = parseFloat(this.taxRate?.value) / 100 || 0.3;
    const estimatedTax = quantity * 10 * taxRate;

    document.getElementById("estimatedTax").textContent =
      this.helpers.formatCurrency(estimatedTax);

    const actualTaxField = document.getElementById("actualTaxAmount");
    if (!actualTaxField.value) {
      actualTaxField.placeholder = this.helpers
        .formatCurrency(estimatedTax)
        .replace("€", "");
    }
  }

  updateTaxDisplay() {
    // Real-time feedback for tax input
    const actualTax = parseFloat(
      document.getElementById("actualTaxAmount").value
    );
    const estimatedTax = parseFloat(
      document.getElementById("estimatedTax").textContent.replace(/[€,]/g, "")
    );

    // Could add visual feedback here if needed
  }

  // FIXED: Enhanced add options with better error handling
  // REPLACE your existing addOptions() function in renderer.js with this complete version:

  async addOptions() {
    try {
      console.log("🔄 Starting addOptions process...");

      // Get form values safely
      const grantDateElement = document.getElementById("grantDate");
      const exercisePriceElement = document.getElementById("exercisePrice");
      const quantityElement = document.getElementById("quantity");
      const actualTaxAmountElement = document.getElementById("actualTaxAmount");

      if (!grantDateElement || !exercisePriceElement || !quantityElement) {
        throw new Error("Required form elements not found");
      }

      const grantDate = grantDateElement.value;
      const exercisePrice = parseFloat(exercisePriceElement.value);
      const quantity = parseInt(quantityElement.value);
      const actualTaxAmount = actualTaxAmountElement
        ? parseFloat(actualTaxAmountElement.value) || null
        : null;

      // Validation
      if (!grantDate || !exercisePrice || !quantity) {
        alert("Please fill in all required fields");
        return;
      }

      if (quantity <= 0 || !Number.isInteger(quantity)) {
        alert("Quantity must be a positive whole number");
        return;
      }

      console.log("📝 Adding options with data:", {
        grantDate,
        exercisePrice,
        quantity,
        actualTaxAmount,
      });

      // FIXED: Check for existing grants before adding
      try {
        const existingGrants = await ipcRenderer.invoke(
          "check-existing-grant",
          grantDate,
          exercisePrice
        );

        console.log("🔍 Existing grants check result:", existingGrants);

        if (existingGrants && !existingGrants.error) {
          // ✅ STORE FORM DATA BEFORE SHOWING MERGE MODAL
          this.currentFormData = {
            grantDate,
            exercisePrice,
            quantity,
            actualTaxAmount,
          };
          console.log(
            "📝 Storing form data for merge modal:",
            this.currentFormData
          );

          if (Array.isArray(existingGrants)) {
            // Multiple grants found
            console.log(
              `🔄 Found ${existingGrants.length} existing grants, showing selection modal...`
            );
            this.showMergeGrantsModal(
              existingGrants,
              quantity,
              actualTaxAmount
            );
            return;
          } else {
            // Single grant found
            console.log(
              "🔄 Single existing grant found, showing merge modal..."
            );
            this.showMergeGrantsModal(
              existingGrants,
              quantity,
              actualTaxAmount
            );
            return;
          }
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

      // No existing grant or merge modal unavailable, proceed with normal add
      console.log("➕ Proceeding with normal grant addition...");

      const result = await ipcRenderer.invoke(
        "add-portfolio-entry",
        grantDate,
        exercisePrice,
        quantity,
        actualTaxAmount
      );

      if (result.error) {
        console.error("❌ Database error:", result.error);
        alert("Error adding options: " + result.error);
        return;
      }

      console.log("✅ Database operation successful, updating UI...");

      // FIXED: Close modal FIRST to prevent UI blocking
      this.closeModals();
      console.log("✅ Modal closed");

      // FIXED: Force UI updates with proper error handling
      try {
        console.log("🔄 Reloading portfolio data...");
        await this.loadPortfolioData();
        console.log("✅ Portfolio data reloaded");

        console.log("🔄 Reloading evolution data...");
        await this.loadEvolutionData("all");
        console.log("✅ Evolution data reloaded");

        // FIXED: Force update action buttons
        await this.checkDataAvailability();
        console.log("✅ Action buttons updated");
      } catch (uiError) {
        console.error("❌ UI update error:", uiError);
        alert(
          "Options added successfully, but UI update failed. Please refresh the app."
        );
      }

      // Clear form values
      try {
        grantDateElement.value = "";
        exercisePriceElement.innerHTML =
          '<option value="">First enter grant date...</option>';
        exercisePriceElement.disabled = true;
        quantityElement.value = "";
        if (actualTaxAmountElement) actualTaxAmountElement.value = "";

        const estimatedTaxElement = document.getElementById("estimatedTax");
        if (estimatedTaxElement) estimatedTaxElement.textContent = "€ 0.00";

        const helpTextElement = document.getElementById("exercisePriceHelp");
        if (helpTextElement)
          helpTextElement.textContent =
            "Options will appear after entering grant date";

        console.log("✅ Form cleared");
      } catch (formError) {
        console.warn("⚠️ Form clearing error:", formError);
      }

      console.log(
        `🎉 Successfully added ${quantity} options at €${exercisePrice}${
          actualTaxAmount ? ` with manual tax €${actualTaxAmount}` : ""
        }`
      );

      // FIXED: Show success feedback
      const addButton = document.getElementById("confirmAddOptions");
      if (addButton) {
        const originalText = addButton.textContent;
        addButton.textContent = "✅ Added!";
        addButton.style.background = "#28a745";

        setTimeout(() => {
          addButton.textContent = originalText;
          addButton.style.background = "";
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Critical error in addOptions:", error);
      alert(
        "Error adding options: " + (error.message || "Unknown error occurred")
      );

      // FIXED: Ensure modal can be closed even if there's an error
      try {
        this.closeModals();
      } catch (modalError) {
        console.error("❌ Could not close modal:", modalError);
      }
    }
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
    try {
      const newTaxAmount = parseFloat(
        document.getElementById("newTaxAmount").value
      );

      if (isNaN(newTaxAmount) || newTaxAmount < 0) {
        alert("Please enter a valid tax amount");
        return;
      }

      const result = await ipcRenderer.invoke(
        "update-tax-amount",
        this.currentEditingTaxId,
        newTaxAmount
      );

      if (result.error) {
        alert("Error updating tax: " + result.error);
        return;
      }

      this.closeModals();
      await this.loadPortfolioData();
      console.log(`✅ Updated tax amount to €${newTaxAmount}`);
    } catch (error) {
      console.error("Error updating tax:", error);
      alert("Error updating tax amount");
    }
  }

  // ===== EVOLUTION TAB =====
  async loadEvolutionData(days = "all") {
    try {
      console.log("Loading evolution data for:", days);

      // Update active button using your ActionButtons manager
      window.UIStateManager.ActionButtons.updateEvolutionButtons(days);

      const evolutionData = await ipcRenderer.invoke(
        "get-portfolio-evolution",
        days === "all" ? null : parseInt(days)
      );

      if (evolutionData.error) {
        console.error("Error loading evolution data:", evolutionData.error);
        return;
      }

      // ADD THIS LINE - Store data for sorting:
      this.evolutionData = evolutionData;

      // Use HTML generator
      this.htmlGen.renderEvolutionTable(evolutionData);
    } catch (error) {
      console.error("Error loading evolution data:", error);
      // ADD THIS LINE - Initialize empty on error:
      this.evolutionData = [];
    }
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
    try {
      console.log(`📊 Loading chart data for period: ${period}`);

      // Update button states
      document.querySelectorAll("#chart-tab-header .btn").forEach((btn) => {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
      });

      const activeBtn = document.querySelector(
        `#chart-tab-header [data-period="${period}"]`
      );
      if (activeBtn) {
        activeBtn.classList.remove("btn-secondary");
        activeBtn.classList.add("btn-primary");
      }

      // Check for required chart utilities
      if (!window.ChartUtils) {
        console.error("❌ ChartUtils not available");
        return;
      }

      // Load portfolio evolution data
      const days = period === "all" ? null : parseInt(period);
      const evolutionData = await ipcRenderer.invoke(
        "get-portfolio-evolution",
        days
      );

      if (evolutionData && evolutionData.error) {
        console.error("❌ Evolution data error:", evolutionData.error);
        return;
      }

      if (
        !evolutionData ||
        !Array.isArray(evolutionData) ||
        evolutionData.length === 0
      ) {
        window.ChartUtils.displayNoDataMessage("portfolioOverviewChart");
        return;
      }

      // Load portfolio events for annotations
      const portfolioEvents = await ipcRenderer.invoke("get-portfolio-events");

      // Process data using ChartUtils
      const sortedEvolutionData =
        window.ChartUtils.procesEvolutionData(evolutionData);
      const portfolioValues = sortedEvolutionData.map(
        (e) => e.total_portfolio_value || 0
      );
      const yAxisConfig =
        window.ChartUtils.calculateYAxisRange(portfolioValues);

      // Process events and create annotations
      const eventsByDate = window.ChartUtils.processPortfolioEvents(
        sortedEvolutionData,
        portfolioEvents,
        period
      );
      const annotations =
        window.ChartUtils.createChartAnnotations(eventsByDate);

      // Create and render chart
      const chartConfig = window.ChartUtils.createChartConfig(
        sortedEvolutionData,
        annotations,
        yAxisConfig,
        period,
        eventsByDate
      );

      const chart = window.ChartUtils.createChart(
        "portfolioChart",
        chartConfig
      );

      if (chart) {
        console.log(
          `✅ Chart created successfully with ${sortedEvolutionData.length} data points`
        );

        // Add simple custom legend below the chart
        this.createSimpleChartLegend();
      }
    } catch (error) {
      console.error("❌ Error in loadChartData:", error);
    }
  }

  // ADD this function to renderer.js:
  createSimpleChartLegend() {
    const legendContainer = document.querySelector(".chart-legend");
    if (legendContainer) {
      legendContainer.innerHTML = `
      <div class="legend-item">
        <span class="legend-color" style="background-color: #007acc;"></span>
        <span>Portfolio Value</span>
      </div>
      <div class="legend-item">
        <span class="legend-line"></span>
        <span>Event</span>
      </div>
    `;
    }
  }

  // UPDATED: Switch tab method to handle renamed chart tab
  switchTab(tabName) {
    window.UIStateManager.switchTab(tabName);
  }

  // ===== SALES HISTORY TAB =====
  async loadSalesHistory() {
    try {
      const salesHistory = await ipcRenderer.invoke("get-sales-history");

      if (salesHistory.error) {
        console.error("Error loading sales history:", salesHistory.error);
        return;
      }

      // ADD THIS LINE - Store data for sorting:
      this.salesData = salesHistory;

      // Use HTML generator
      this.htmlGen.renderSalesTable(salesHistory);
    } catch (error) {
      console.error("Error loading sales history:", error);
      // ADD THIS LINE - Initialize empty on error:
      this.salesData = [];
    }
  }

  // ===== GRANT HISTORY TAB =====
  async loadGrantHistory() {
    try {
      const grantHistory = await ipcRenderer.invoke("get-grant-history");

      console.log("Grant history received:", grantHistory);

      if (grantHistory.error) {
        console.error("Error loading grant history:", grantHistory.error);
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
        this.initializeGrantFilters();
        return;
      }

      // ADD THIS LINE - Store data for sorting:
      this.grantData = grantHistory;

      // Use HTML generator
      this.htmlGen.renderGrantTable(grantHistory);
    } catch (error) {
      console.error("Error loading grant history:", error);
      // ADD THIS LINE - Initialize empty on error:
      this.grantData = [];
    }
  }
  // ===== GRANT HISTORY FILTERING =====
  // ===== MODERN GRANT FILTERING - HIDE ROWS =====
  // ===== MODERN GRANT FILTERING - FIXED MATCHING LOGIC =====
  filterGrantHistory() {
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
  }

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

  // ===== UPDATE FILTER BUTTON COUNTS =====
  // ===== UPDATE FILTER BUTTON COUNTS (FIXED LOGIC) =====
  updateGrantFilterCounts(activeFilters) {
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
    this.filterGrantHistory();
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
    const input = this.deleteDatabaseConfirmText;
    const confirmBtn = this.confirmDeleteDatabase;

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
    try {
      const result = await window.IPCCommunication.Database.exportDatabase();

      if (result.success) {
        alert(`Database exported successfully to:\n${result.filePath}`);
      } else {
        alert("Export cancelled or failed");
      }
    } catch (error) {
      console.error("Error exporting database:", error);
      alert("Error exporting database: " + error.message);
    }
  }

  async importDatabase(mergeMode = false) {
    try {
      const confirmMessage = mergeMode
        ? "Are you sure you want to merge the imported data with existing data?"
        : "Are you sure you want to replace all existing data with imported data?\n\nThis action cannot be undone!";

      if (!confirm(confirmMessage)) {
        return;
      }

      const result =
        await window.IPCCommunication.Database.importDatabase(mergeMode);

      if (result.success) {
        alert(
          `Database ${
            mergeMode ? "merged" : "imported"
          } successfully!\nImported ${result.importedEntries} entries.`
        );
        await this.loadPortfolioData();
        this.switchTab("portfolio");
      } else {
        alert("Import cancelled or failed");
      }
    } catch (error) {
      console.error("Error importing database:", error);
      alert("Error importing database: " + error.message);
    }
  }
  debugDeleteElements() {
    console.log("🔍 Element access test:");
    console.log("Input via this:", this.deleteDatabaseConfirmText);
    console.log(
      "Input via DOM:",
      document.getElementById("deleteDatabaseConfirmText")
    );
    console.log("Button via this:", this.confirmDeleteDatabase);
    console.log(
      "Button via DOM:",
      document.getElementById("confirmDeleteDatabase")
    );
  }

  // ===== SETTINGS MANAGEMENT =====
  async loadSettings() {
    try {
      const settings = await window.IPCCommunication.Settings.loadAllSettings();

      if (settings.target_percentage && this.targetPercentage) {
        this.targetPercentage.value = settings.target_percentage;
      }
      if (settings.tax_auto_rate && this.taxRate) {
        this.taxRate.value = settings.tax_auto_rate;
      }
      if (settings.currency_symbol && this.currencySymbol) {
        this.currencySymbol.value = settings.currency_symbol;
      }
      if (settings.auto_update_prices && this.autoUpdatePrices) {
        this.autoUpdatePrices.checked = settings.auto_update_prices === "true";
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  async saveSettings() {
    try {
      const settings = {
        target_percentage: this.targetPercentage?.value || "65",
        tax_auto_rate: this.taxRate?.value || "30",
        currency_symbol: this.currencySymbol?.value || "€",
        auto_update_prices:
          this.autoUpdatePrices?.checked?.toString() || "false",
      };

      await window.IPCCommunication.Settings.saveAllSettings(settings);

      // Show success feedback
      const originalText = this.saveSettingsBtn.textContent;
      this.saveSettingsBtn.textContent = "✅ Saved!";
      this.saveSettingsBtn.style.background = "#28a745";

      setTimeout(() => {
        this.saveSettingsBtn.textContent = originalText;
        this.saveSettingsBtn.style.background = "";
      }, 2000);

      // Refresh portfolio data to apply new target percentage
      await this.loadPortfolioData();
    } catch (error) {
      console.error("Error saving settings:", error);
      this.saveSettingsBtn.textContent = "❌ Error";
      setTimeout(() => {
        this.saveSettingsBtn.textContent = "💾 Save Settings";
      }, 2000);
    }
  }
  async debugDatabase() {
    try {
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
      console.error("Debug error:", error);
    }
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
