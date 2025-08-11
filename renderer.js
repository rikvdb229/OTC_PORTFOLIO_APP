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
    window.DOMHelpers.initializeApplicationElements(this);
    window.DOMHelpers.attachApplicationEventListeners(this); // <-- NEW LINE
    
    // Safety check for IPCCommunication
    if (window.IPCCommunication && window.IPCCommunication.setupIpcListeners) {
      window.IPCCommunication.setupIpcListeners(this);
    } else {
      console.error('IPCCommunication.setupIpcListeners not found - IPC communication may not work properly');
    }
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
    // ADDED: Initialize historical price management
    window.HistoricalPriceManager.init(this);
    // ADDED: Initialize footer with version info
    this.initializeFooter();

    // Initialize the app
    this.loadPortfolioData();
    window.AppConfig.SettingsManager.loadSettings(this);

    // Move checkDataAvailability after a small delay to ensure DOM is ready
    setTimeout(() => {
      this.checkDataAvailability();
    }, 50);

    window.IPCCommunication.Price.checkPriceUpdateStatus(this);
    this.checkAutoUpdate();
    // Initialize undo/redo system
    setTimeout(async () => {
      await window.UndoRedoManager.initialize(this);
    }, 100);
  }

  // ADD HERE: New method to initialize footer (add this method to your class)
 async initializeFooter() {
      await window.AppConfig.APP_CONFIG.loadFromMain();
    window.UIStateManager.Footer.initializeFooter(this);
  }
  /**
   * Toggle notes expansion/collapse in evolution table
   * @param {string} noteId - Unique ID for the note entry
   * @param {boolean} expand - Whether to expand (true) or collapse (false)
   */
  toggleNotes(noteId, expand) {
    window.UIStateManager.Tabs.toggleNotes(this, noteId, expand);
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
  showDeleteConfirmModal(entryId) {
    window.UIStateManager.Modals.showDeleteConfirmModal(this, entryId);
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
    await this.helpers.updatePrices(this);
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
    window.StatsManager.updatePortfolioStats(this, overview, targetPercentage);
  }

  // Enhanced updatePortfolioTable method in renderer.js
  // Enhanced updatePortfolioTable method with improved styling
  updatePortfolioTable(overview, targetPercentage = 65) {
    this.htmlGen.renderPortfolioTable(overview, targetPercentage);
  }
  // FIXED: Check if price data exists
  async checkIfPriceDataExists() {
    return await window.IPCCommunication.Portfolio.checkIfPriceDataExists();
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

      // FIXED: Use the correct reference to ActionButtonManager
      window.ActionButtonManager.updateActionButtons(this, hasData);
    } catch (error) {
      console.error("Error checking data availability:", error);
      window.ActionButtonManager.updateActionButtons(this, false);
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
    window.UIStateManager.Modals.selectGrant(this, grantId);
  }
  async showSellModal(entryId) {
    await window.UIStateManager.Modals.showSellModal(this, entryId);
  }

  calculateSaleProceeds() {
    this.helpers.calculateSaleProceeds(this);
  }

  async confirmSale() {
    await this.helpers.confirmSale(this);
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
    window.UIStateManager.Modals.showDeleteDatabaseModal(this);
  }

  // ===== Add GrantS FUNCTIONALITY =====
  async handleGrantDateSelection() {
    await window.UIStateManager.Forms.handleGrantDateSelection(this);
  }

  calculateEstimatedTax() {
    window.UIStateManager.Forms.calculateEstimatedTax(this);
    
    // Also update the total grant value display if the current value group is visible
    const currentValueGroup = document.getElementById('currentValueGroup');
    if (currentValueGroup && currentValueGroup.style.display !== 'none') {
      const currentValuePerOptionElement = document.getElementById('currentValuePerOption');
      if (currentValuePerOptionElement && currentValuePerOptionElement.textContent !== '€0.00') {
        const pricePerOption = parseFloat(currentValuePerOptionElement.textContent.replace('€', ''));
        if (!isNaN(pricePerOption)) {
          this.updateCurrentValueDisplay(pricePerOption);
        }
      }
    }
  }

  // Handle exercise price selection - calculate tax AND fetch historical prices
  async handleExercisePriceSelection() {
    console.log("🔍 handleExercisePriceSelection called");
    
    // First calculate the estimated tax
    this.calculateEstimatedTax();
    
    // Then check if we should fetch historical prices
    const exercisePriceElement = document.getElementById("exercisePrice");
    const grantDateElement = document.getElementById("grantDate");
    
    console.log("📋 Form elements found:", {
      exercisePrice: !!exercisePriceElement,
      exercisePriceValue: exercisePriceElement?.value,
      grantDate: !!grantDateElement,
      grantDateValue: grantDateElement?.value
    });
    
    if (exercisePriceElement && exercisePriceElement.value && grantDateElement && grantDateElement.value) {
      const exercisePrice = parseFloat(exercisePriceElement.value);
      const grantDate = grantDateElement.value;
      const selectedOption = exercisePriceElement.options[exercisePriceElement.selectedIndex];
      const fundName = selectedOption.dataset.fundName || 'Unknown Fund';
      
      if (exercisePrice && grantDate) {
        console.log(`🔍 Exercise price selected: €${exercisePrice} for grant date: ${grantDate}`);
        
        // Show the current value group
        document.getElementById('currentValueGroup').style.display = 'block';
        
        // Check if historical prices already exist
        try {
          console.log(`🔍 Checking historical prices for: grantDate=${grantDate}, exercisePrice=${exercisePrice}`);
          const shouldFetch = await window.IPCCommunication.Grants.shouldFetchHistoricalPrices(grantDate, exercisePrice);
          console.log(`🔍 shouldFetch result: ${shouldFetch}`);
          
          if (shouldFetch) {
            console.log('📊 No historical prices found, automatically fetching...');
            
            // Show default value while fetching
            this.updateCurrentValueDisplay(10.00, 'Fetching historical prices from KBC...');
            
            // Automatically start historical price fetching (no user confirmation needed)
            console.log(`🔗 Auto-starting historical price fetch for:`, {fundName, exercisePrice, grantDate});
            await window.HistoricalPriceManager.showFetchModal(
              fundName,
              exercisePrice,
              grantDate
            );
          } else {
            console.log('✅ Historical prices already exist, updating current value...');
            
            // Get the historical price for the grant date and update the display
            await this.updateCurrentValueFromHistoricalPrices(grantDate, exercisePrice, selectedOption);
          }
        } catch (error) {
          console.error('❌ Error handling exercise price selection:', error);
          // Show fallback value on error
          this.updateCurrentValueDisplay(10.00, 'Using default value (€10 per option)');
        }
      }
    }
  }

  // Update the current value display with price and help text
  updateCurrentValueDisplay(pricePerOption, helpText = null) {
    const quantityElement = document.getElementById('quantity');
    const quantity = parseInt(quantityElement?.value) || 0;
    const totalValue = quantity * pricePerOption;
    
    // Update the display elements
    document.getElementById('currentValuePerOption').textContent = `€${pricePerOption.toFixed(2)}`;
    document.getElementById('totalGrantValue').textContent = `€${totalValue.toFixed(2)}`;
    
    // Update help text if provided
    if (helpText) {
      document.getElementById('currentValueHelp').textContent = helpText;
    }
    
    console.log(`💰 Updated value display: €${pricePerOption.toFixed(2)} per option, total: €${totalValue.toFixed(2)}`);
  }

  // Update the current value display from historical prices
  async updateCurrentValueFromHistoricalPrices(grantDate, exercisePrice, optionElement) {
    try {
      const historicalPrices = await window.ipcRenderer.invoke(
        'get-historical-prices-for-option',
        grantDate,
        exercisePrice
      );
      
      if (historicalPrices && historicalPrices.length > 0) {
        // Find the price for the grant date
        const grantDatePrice = historicalPrices.find(p => p.price_date === grantDate);
        
        if (grantDatePrice) {
          const priceValue = parseFloat(grantDatePrice.current_value);
          
          // Update the option element's current value data
          optionElement.dataset.currentValue = priceValue.toFixed(2);
          
          // Update the display text to show the historical price
          const fundName = this.helpers?.formatFundName(optionElement.dataset.fundName) || optionElement.dataset.fundName;
          optionElement.textContent = `${fundName} - €${exercisePrice} (Grant Date Value: €${priceValue.toFixed(2)})`;
          
          // Update the current value display
          this.updateCurrentValueDisplay(priceValue, `Historical price from grant date (${grantDate})`);
          
          console.log(`✅ Updated current value to grant date price: €${priceValue.toFixed(2)}`);
        } else {
          console.warn(`⚠️ No price found for exact grant date ${grantDate}, using fallback`);
          this.updateCurrentValueDisplay(10.00, 'No exact grant date price found, using default €10');
        }
      } else {
        console.warn(`⚠️ No historical prices found, using default value`);
        this.updateCurrentValueDisplay(10.00, 'No historical prices available, using default €10');
      }
    } catch (error) {
      console.error('❌ Error updating current value from historical prices:', error);
      this.updateCurrentValueDisplay(10.00, 'Error loading prices, using default €10');
    }
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
    await this.helpers.confirmEditSale(this);
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
  // ===== INITIALIZE GRANT FILTERS =====
  initializeGrantFilters() {
    window.UIStateManager.Tables.initializeGrantFilters(this);
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
    await window.UIStateManager.Database.executeDeleteDatabase(this);
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

  // Initialize version checker
  if (window.VersionChecker) {
    window.VersionChecker.init();
    console.log("🔍 Version Checker initialized");
  }

  // Add this line to ensure button state is checked after DOM is ready
  setTimeout(() => {
    window.portfolioApp.checkDataAvailability();
  }, 100);
});
