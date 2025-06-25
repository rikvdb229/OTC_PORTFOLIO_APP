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

    // SAFE: Get elements fresh from DOM if not in app object
    const progressTextEl =
      app.updateProgressText || document.getElementById("updateProgressText");
    const statusOutput =
      app.updateStatusOutput || document.getElementById("updateStatusOutput");
    const progressBar =
      app.updateProgressBar || document.getElementById("updateProgressBar");

    // Update progress text
    if (progressTextEl) {
      progressTextEl.textContent = progressText;
    }

    // Update status output
    if (statusOutput) {
      statusOutput.textContent = progressText;
    }

    // IMPROVED: Calculate progress percentage based on actual scraper stages
    let percentage = 10; // Default progress

    // Map actual scraper progress to percentages
    if (
      progressText.includes("Starting") ||
      progressText.includes("Launching")
    ) {
      percentage = 15;
    } else if (progressText.includes("Loading KBC page")) {
      percentage = 25;
    } else if (
      progressText.includes("cookie") ||
      progressText.includes("Handling")
    ) {
      percentage = 35;
    } else if (
      progressText.includes("Setting date") ||
      progressText.includes("Submitting")
    ) {
      percentage = 45;
    } else if (
      progressText.includes("Looking for") ||
      progressText.includes("export")
    ) {
      percentage = 65;
    } else if (progressText.includes("Download started")) {
      percentage = 75;
    } else if (progressText.includes("Verifying")) {
      percentage = 85;
    } else if (
      progressText.includes("complete") ||
      progressText.includes("success")
    ) {
      percentage = 100;
    } else if (
      progressText.includes("Processing") ||
      progressText.includes("Loading data")
    ) {
      percentage = 55;
    } else if (
      progressText.includes("Connecting") ||
      progressText.includes("browser")
    ) {
      percentage = 20;
    } else if (
      progressText.includes("Found") ||
      progressText.includes("Downloading")
    ) {
      percentage = 80;
    }

    // Update progress bar
    if (progressBar) {
      progressBar.style.width = percentage + "%";
      console.log(`📊 Progress bar updated to ${percentage}%`);
    }
  },
  // Add to ModalManager section in ui-state-management.js
  async showSellModal(app, entryId) {
    const entry = app.portfolioData.find((e) => e.id === entryId);
    if (!entry) {
      alert("Portfolio entry not found");
      return;
    }

    app.currentSellEntry = entry;

    // Enhanced sell modal with fund information
    document.getElementById("sellOptionDetails").innerHTML = `
    <div class="option-details">
      <h4>📊 ${app.helpers.formatFundName(entry.fund_name)} Option</h4>
      <p><strong>Underlying Fund:</strong> <span class="fund-highlight">${
        entry.fund_name || "Unknown Fund"
      }</span></p>
      <p><strong>Grant Date:</strong> ${new Date(
        entry.grant_date
      ).toLocaleDateString()}</p>
      <p><strong>Exercise Price:</strong> ${app.helpers.formatCurrency(
        entry.exercise_price
      )}</p>
      <p><strong>Current Value:</strong> ${app.helpers.formatCurrency(
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
    app.calculateSaleProceeds();

    window.UIStateManager.Modals.showModal("sellOptionsModal");
  },
  showDeleteDatabaseModal(app) {
    console.log("🗑️ Showing delete database modal");

    // Show modal using existing modal system
    if (app.deleteDatabaseModal) {
      app.deleteDatabaseModal.classList.add("active");
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
  },
};
window.ModalManager = ModalManager;
