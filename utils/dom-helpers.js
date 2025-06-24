/**
 * ===== DOM HELPERS UTILITY =====
 * Safe DOM element selection and manipulation functions
 *
 * STEP 2.1: Create this file as utils/dom-helpers.js
 */
/**
 * Initialize all DOM elements for the application
 * MIGRATED FROM: renderer.js initializeElements()
 * @param {Object} app - Application instance
 */
function initializeApplicationElements(app) {
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
    // ===== ADD THESE MISSING SETTINGS FORM ELEMENTS =====
    saveSettingsBtn: "#saveSettingsBtn", // ← ADD THIS
    targetPercentage: "#targetPercentage", // ← ADD THIS
    taxRate: "#taxRate", // ← ADD THIS
    currencySymbol: "#currencySymbol", // ← ADD THIS
    autoUpdatePrices: "#autoUpdatePrices", // ← ADD THIS
    // ===== END MISSING ELEMENTS =====

    // Portfolio stats elements
    totalPortfolioValue: "#totalPortfolioValue",
    totalUnrealizedGains: "#totalUnrealizedGains",
    totalRealizedGains: "#totalRealizedGains",
    totalInvestment: "#totalInvestment",
    targetStatus: "#targetStatus",
    targetProgress: "#targetProgress",

    // Table elements
    portfolioTableBody: "#portfolioTableBody",
    evolutionTableBody: "#evolutionTableBody",
    salesTableBody: "#salesTableBody",
    grantsTableBody: "#grantsTableBody",

    // Navigation
    portfolioTab: "#portfolioTab",
    evolutionTab: "#evolutionTab",
    salesTab: "#salesTab",
    grantsTab: "#grantsTab",
    chartTab: "#chartTab",

    // Action buttons
    addGrantsBtn: "#addGrantsBtn",
    exportDatabaseBtn: "#exportDatabaseBtn",
    importDatabaseBtn: "#importDatabaseBtn",
    importMergeBtn: "#importMergeBtn",
    deleteDatabaseBtn: "#deleteDatabaseBtn",

    // Modals - Add Grants
    addGrantsModal: "#addGrantsModal",
    canceladdGrants: "#canceladdGrants",
    confirmaddGrants: "#confirmaddGrants",
    grantDate: "#grantDate",
    exercisePrice: "#exercisePrice",
    quantity: "#quantity",
    actualTaxAmount: "#actualTaxAmount",
    estimatedTax: "#estimatedTax",
    exercisePriceHelp: "#exercisePriceHelp",

    // Modals - Delete confirmation
    deleteConfirmModal: "#deleteConfirmModal",
    cancelDelete: "#cancelDelete",
    confirmDelete: "#confirmDelete",
    deleteEntryDetails: "#deleteEntryDetails",

    // Modals - Sell
    sellModal: "#sellModal",
    cancelSell: "#cancelSell",
    confirmSell: "#confirmSell",
    sellQuantity: "#sellQuantity",
    sellPrice: "#sellPrice",
    sellOptionDetails: "#sellOptionDetails",

    // Modals - Edit Sale
    editSaleModal: "#editSaleModal",
    cancelEditSale: "#cancelEditSale",
    confirmEditSale: "#confirmEditSale",
    editSaleQuantity: "#editSaleQuantity",
    editSalePrice: "#editSalePrice",
    editSaleDate: "#editSaleDate",
    editSaleDetails: "#editSaleDetails",

    // Modals - Edit Tax
    editTaxModal: "#editTaxModal",
    cancelEditTax: "#cancelEditTax",
    confirmEditTax: "#confirmEditTax",
    editTaxAmount: "#editTaxAmount",
    editTaxDetails: "#editTaxDetails",

    // Modals - Settings
    autoUpdateToggle: "#autoUpdateToggle",
    autoUpdateStatus: "#autoUpdateStatus",
    autoUpdateInterval: "#autoUpdateInterval",

    // Modals - Delete Database
    deleteDatabaseModal: "#deleteDatabaseModal",
    cancelDeleteDatabase: "#cancelDeleteDatabase",
    confirmDeleteDatabase: "#confirmDeleteDatabase",
    deleteDatabaseConfirmText: "#deleteDatabaseConfirmText",

    // Evolution filters
    evolutionDaysFilter: "#evolutionDaysFilter",

    // Progress and notifications
    updateProgress: "#updateProgress",
    priceUpdateNotification: "#priceUpdateNotification",
    closeNotificationBtn: "#closeNotificationBtn",

    // Charts
    chartContainer: "#chartContainer",

    // Grant filters
    fundFilter: "#fundFilter",
    statusFilter: "#statusFilter",
    filterSummary: "#filterSummary",

    // Merge grants modal
    mergeGrantsModal: "#mergeGrantsModal",
    cancelMergeGrants: "#cancelMergeGrants",
    proceedSeparateGrant: "#proceedSeparateGrant",
    proceedMergeGrant: "#proceedMergeGrant",
    singleGrantMerge: "#singleGrantMerge",
    existingQuantity: "#existingQuantity",
    newQuantitySingle: "#newQuantitySingle",
    multipleGrantsMerge: "#multipleGrantsMerge",
    existingGrantsList: "#existingGrantsList",
    mergeDetails: "#mergeDetails",
    mergeModalTitle: "#mergeModalTitle",
  };

  // Use your existing initializeElements function
  const initResults = initializeElements(elementMap, app);

  // Handle NodeList elements separately (arrays of elements)
  app.navTabs = safeQuerySelectorAll(".nav-tab");
  app.tabContents = safeQuerySelectorAll(".tab-content");

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
  if (!app.mergeGrantsModal) {
    console.log("🔍 Debugging merge modal...");
    const mergeModal = safeQuerySelector("#mergeGrantsModal");
    if (mergeModal) {
      console.log("✅ Merge modal found with selector, assigning...");
      app.mergeGrantsModal = mergeModal;
    } else {
      console.warn("⚠️ Merge modal not found - may be added dynamically");
    }
  }

  return initResults;
}
/**
 * Safe element selection with error handling
 * @param {string} selector - CSS selector or element ID
 * @param {boolean} required - Whether element is required (log error if missing)
 * @returns {Element|null} The found element or null
 */
function safeQuerySelector(selector, required = false) {
  try {
    const element = document.querySelector(selector);
    if (!element && required) {
      console.error(`❌ Required element not found: ${selector}`);
    }
    return element;
  } catch (error) {
    console.error(`❌ Error selecting element "${selector}":`, error);
    return null;
  }
}

/**
 * Safe element selection by ID with error handling
 * @param {string} id - Element ID
 * @param {boolean} required - Whether element is required
 * @returns {Element|null} The found element or null
 */
function safeGetElementById(id, required = false) {
  try {
    const element = document.getElementById(id);
    if (!element && required) {
      console.error(`❌ Required element not found: #${id}`);
    }
    return element;
  } catch (error) {
    console.error(`❌ Error getting element by ID "${id}":`, error);
    return null;
  }
}

/**
 * Safe multiple element selection
 * @param {string} selector - CSS selector
 * @returns {NodeList} Found elements (empty NodeList if none found)
 */
function safeQuerySelectorAll(selector) {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    console.error(`❌ Error selecting elements "${selector}":`, error);
    return document.querySelectorAll("never-matches"); // Empty NodeList
  }
}

/**
 * Initialize DOM elements for a component with error handling
 * @param {Object} elementMap - Map of property names to selectors
 * @param {Object} target - Object to attach elements to (usually 'this')
 * @returns {Object} Summary of successful/failed selections
 */
function initializeElements(elementMap, target) {
  const results = {
    success: [],
    failed: [],
    total: 0,
  };

  for (const [property, selector] of Object.entries(elementMap)) {
    results.total++;

    let element;
    if (selector.startsWith("#")) {
      // ID selector
      element = safeGetElementById(selector.slice(1));
    } else {
      // CSS selector
      element = safeQuerySelector(selector);
    }

    if (element) {
      target[property] = element;
      results.success.push(property);
    } else {
      target[property] = null;
      results.failed.push(property);
      console.warn(`⚠️ Element not found for ${property}: ${selector}`);
    }
  }

  console.log(
    `🔍 DOM Initialization: ${results.success.length}/${results.total} elements found`
  );
  if (results.failed.length > 0) {
    console.warn(`⚠️ Missing elements:`, results.failed);
  }

  return results;
}

/**
 * Check if element exists and is visible
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if element exists and is visible
 */
function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

/**
 * Add event listener with error handling
 * @param {Element} element - DOM element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler function
 * @param {boolean|Object} options - Event listener options
 */
function safeAddEventListener(element, event, handler, options = false) {
  if (!element) {
    console.error(`❌ Cannot add ${event} listener: element is null`);
    return false;
  }

  try {
    element.addEventListener(event, handler, options);
    return true;
  } catch (error) {
    console.error(`❌ Error adding ${event} listener:`, error);
    return false;
  }
}

/**
 * Set element content safely
 * @param {Element} element - DOM element
 * @param {string} content - Content to set
 * @param {boolean} isHTML - Whether content is HTML (default: false for text)
 */
function safeSetContent(element, content, isHTML = false) {
  if (!element) {
    console.warn(`⚠️ Cannot set content: element is null`);
    return false;
  }

  try {
    if (isHTML) {
      element.innerHTML = content;
    } else {
      element.textContent = content;
    }
    return true;
  } catch (error) {
    console.error(`❌ Error setting content:`, error);
    return false;
  }
}

/**
 * Toggle element visibility safely
 * @param {Element} element - DOM element
 * @param {boolean} show - Whether to show (true) or hide (false)
 * @param {string} displayType - Display type when showing (default: 'block')
 */
function safeToggleVisibility(element, show, displayType = "block") {
  if (!element) {
    console.warn(`⚠️ Cannot toggle visibility: element is null`);
    return false;
  }

  try {
    element.style.display = show ? displayType : "none";
    return true;
  } catch (error) {
    console.error(`❌ Error toggling visibility:`, error);
    return false;
  }
}

/**
 * Get form data from a form element safely
 * @param {Element} formElement - Form DOM element
 * @returns {Object} Form data as key-value pairs
 */
function safeGetFormData(formElement) {
  if (!formElement) {
    console.error(`❌ Cannot get form data: form element is null`);
    return {};
  }

  try {
    const formData = new FormData(formElement);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  } catch (error) {
    console.error(`❌ Error getting form data:`, error);
    return {};
  }
}
/**
 * Get element with fallback options (useful for elements that might have different IDs)
 * @param {Array} selectors - Array of selector strings to try
 * @returns {Element|null} First found element or null
 */
function safeGetElementWithFallbacks(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    } catch (error) {
      console.warn(`Error trying selector "${selector}":`, error);
    }
  }
  return null;
}
function debugDeleteElements() {
  console.log("🔍 DEBUG: Delete database elements");
  console.log("Modal:", app.deleteDatabaseModal);
  console.log("Input:", app.deleteDatabaseConfirmText);
  console.log("Confirm button:", app.confirmDeleteDatabase);
  console.log("Cancel button:", app.cancelDeleteDatabase);

  if (app.deleteDatabaseConfirmText) {
    console.log("Input value:", app.deleteDatabaseConfirmText.value);
    console.log(
      "Input classes:",
      app.deleteDatabaseConfirmText.classList.toString()
    );
  }

  if (app.confirmDeleteDatabase) {
    console.log("Button disabled:", app.confirmDeleteDatabase.disabled);
    console.log("Button text:", app.confirmDeleteDatabase.textContent);
  }
}

// Export to global scope for use in renderer.js
window.DOMHelpers = {
  initializeApplicationElements,
  safeQuerySelector,
  safeGetElementById,
  safeQuerySelectorAll,
  safeGetElementWithFallbacks, // ADD THIS
  initializeElements,
  isElementVisible,
  safeAddEventListener,
  safeSetContent,
  safeToggleVisibility,
  safeGetFormData,
  attachApplicationEventListeners,
};
/**
 * Attach all event listeners for the application
 * MIGRATED FROM: renderer.js attachEventListeners()
 * @param {Object} app - Application instance
 */
function attachApplicationEventListeners(app) {
  console.log("🎯 Setting up event listeners with organized handlers...");

  // Use the event handler coordinator to set up all listeners
  window.EventHandlers.EventHandlerCoordinator.initializeAll(app);

  // Initialize delete database functionality using migrated method
  window.UIStateManager.Database.initializeDeleteDatabase(app);

  console.log("✅ All event listeners attached successfully");
}

// Debug logging
console.log("✅ DOM Helpers loaded:", Object.keys(window.DOMHelpers));
