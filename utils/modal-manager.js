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
      if (app) {
        app.currentEditingSaleData = null;
      }

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
      const grantSourceSelect = document.getElementById('grantSource');
      const grantFormFields = document.getElementById('grantFormFields');

      if (grantSourceSelect) grantSourceSelect.value = '';
      if (grantFormFields) grantFormFields.style.display = 'none';

      window.UIStateManager.Forms.clearaddGrantsForm(app);
      window.UIStateManager.Validation.setupValidationListeners(app);
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
  // ===== FIX: Update showEditSaleModal in modal-manager.js =====
  // Replace your existing showEditSaleModal method with this corrected version:

  /**
   * Enhanced showEditSaleModal with dynamic price lookup - FIXED SCOPE ISSUE
   */
  async showEditSaleModal(app, saleId) {
    try {
      console.log(`✏️ Opening edit sale modal for sale ID: ${saleId}`);

      // Get sale data with portfolio validation info
      const saleData = await window.ipcRenderer.invoke(
        "get-sale-with-portfolio-data",
        saleId
      );

      if (saleData && saleData.error) {
        console.error("❌ Error loading sale data:", saleData.error);
        alert("Error loading sale data: " + saleData.error);
        return false;
      }

      if (!saleData) {
        console.error("❌ No sale data returned");
        alert("Error: Sale not found");
        return false;
      }

      // Store current editing sale ID
      app.currentEditingSaleId = saleId;

      // *** FIX: Create a reference to saleData that will be available in the callback ***
      const saleDataForCallback = saleData;

      // Show modal with setup callback
      this.showModal("editSaleModal", () => {
        // *** FIX: Use the correctly scoped variable ***

        // Populate modal with existing data
        this.populateEditSaleModal(app, saleDataForCallback);

        // Set up date restrictions
        window.UIStateManager.Validation.setupEditSaleDateRestrictions(
          saleDataForCallback
        );

        // Set up dynamic price lookup for edit modal
        this.setupEditSaleDynamicPriceUpdate(app, saleDataForCallback);

        // Set up validation listeners
        window.UIStateManager.Validation.setupEditSaleValidationListeners(app);

        // Run initial validation
        window.UIStateManager.Validation.validateEditSaleForm(app);

        console.log("✅ Edit sale modal opened with dynamic price lookup");
      });

      return true;
    } catch (error) {
      console.error("❌ Error in showEditSaleModal:", error);
      alert("Error opening edit sale modal: " + error.message);
      return false;
    }
  },
  /**
   * Set up dynamic price lookup for edit sale modal
   * @param {Object} app - Application instance
   * @param {Object} saleData - Original sale data with portfolio info
   */
  setupEditSaleDynamicPriceUpdate(app, saleData) {
    const saleDateInput = document.getElementById("editSaleDate");
    const salePriceInput = document.getElementById("editSalePrice");

    if (!saleDateInput || !salePriceInput || !saleData) {
      console.warn("⚠️ Missing elements for edit sale dynamic price update");
      return;
    }

    console.log("🔗 Setting up dynamic price lookup for edit sale");

    // Function to update price based on date
    const updatePriceForDate = async (selectedDate) => {
      try {
        console.log(`🔍 EDIT SALE: Looking up price for ${selectedDate}`);

        // Show loading state (visual feedback only)
        const originalValue = salePriceInput.value;
        const originalPlaceholder = salePriceInput.placeholder;

        salePriceInput.style.opacity = "0.6";
        salePriceInput.placeholder = "Loading historical price...";

        // Call backend to get closest price
        const priceData = await window.ipcRenderer.invoke(
          "get-price-for-date",
          selectedDate,
          saleData.exercise_price,
          saleData.grant_date
        );

        // Restore visual state
        salePriceInput.style.opacity = "1";
        salePriceInput.placeholder = originalPlaceholder;

        if (priceData && !priceData.error && priceData.current_value) {
          // Update price (but only if user hasn't manually changed it significantly)
          const currentValue = parseFloat(salePriceInput.value) || 0;
          const originalSalePrice = parseFloat(saleData.sale_price) || 0;
          const suggestedPrice = priceData.current_value;

          // Update if current value is close to original (user hasn't manually edited)
          // OR if the field is empty
          if (
            !salePriceInput.value ||
            Math.abs(currentValue - originalSalePrice) < 0.02
          ) {
            salePriceInput.value = suggestedPrice.toFixed(2);
            console.log(
              `✅ EDIT SALE: Updated price to €${suggestedPrice} (${priceData.match_type})`
            );
          } else {
            console.log(
              `⚠️ EDIT SALE: Preserving user's manual price €${currentValue}`
            );
          }

          // Update help text to show price source
          const salePriceHelp = document.querySelector(
            "#editSalePrice + .form-help"
          );
          if (salePriceHelp) {
            let sourceText;
            if (priceData.match_type === "exact") {
              sourceText = `✅ Historical price for ${selectedDate}: €${suggestedPrice.toFixed(2)}`;
            } else {
              const daysDiff = Math.round(priceData.day_difference || 0);
              sourceText = `📅 Closest price from ${priceData.price_date} (${daysDiff} days ${priceData.match_type}): €${suggestedPrice.toFixed(2)}`;
            }

            // Show if we updated the price or preserved user's input
            if (
              !salePriceInput.value ||
              Math.abs(currentValue - originalSalePrice) < 0.02
            ) {
              salePriceHelp.innerHTML = `${sourceText} - <strong>adjust if needed</strong>`;
            } else {
              salePriceHelp.innerHTML = `${sourceText}<br><small>💡 Keeping your manual price of €${currentValue.toFixed(2)}</small>`;
            }
          }
        } else {
          // No historical data available
          const salePriceHelp = document.querySelector(
            "#editSalePrice + .form-help"
          );
          if (salePriceHelp) {
            // Check date type for better messaging
            const selectedDateObj = new Date(selectedDate);
            const isWeekend =
              selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;

            let helpText;
            if (isWeekend) {
              helpText = `📅 Weekend date - no market data available`;
            } else {
              helpText = `⚠️ No historical price data for ${selectedDate}`;
            }

            salePriceHelp.innerHTML = helpText;
          }

          console.log("⚠️ EDIT SALE: No historical price found");
        }

        // Trigger validation and calculation updates
        window.UIStateManager.Validation.validateEditSaleForm(app);
        if (app.editSaleInputHandler) {
          app.editSaleInputHandler();
        }
      } catch (error) {
        console.error("❌ EDIT SALE: Error fetching price for date:", error);

        // Restore visual state
        salePriceInput.style.opacity = "1";
        salePriceInput.placeholder = originalPlaceholder || "Enter sale price";

        const salePriceHelp = document.querySelector(
          "#editSalePrice + .form-help"
        );
        if (salePriceHelp) {
          salePriceHelp.innerHTML = `❌ Error loading historical price data`;
        }
      }
    };

    // Set up date change listener with debouncing
    let priceUpdateTimeout;
    saleDateInput.addEventListener("change", (e) => {
      if (e.target.value) {
        console.log(`📅 EDIT SALE: Date changed to ${e.target.value}`);

        // Clear previous timeout
        clearTimeout(priceUpdateTimeout);

        // Add small delay to prevent rapid API calls
        priceUpdateTimeout = setTimeout(() => {
          updatePriceForDate(e.target.value);
        }, 300);
      }
    });

    // Set initial price suggestion for current date (if needed)
    if (saleDateInput.value && saleDateInput.value !== saleData.sale_date) {
      // Only suggest if the date has been changed from original
      updatePriceForDate(saleDateInput.value);
    }

    console.log("✅ Dynamic price lookup configured for edit sale modal");
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
          const originalSalePrice = saleData.sale_price || 0;

          // Calculate new values based on the new sale price
          const quantitySold = saleData.quantity_sold;
          const newTotalSaleValue = newSalePrice * quantitySold;

          // Calculate new profit/loss vs target
          // Formula: (New Sale Value - Tax Deducted) - Target Value
          const taxDeducted = saleData.tax_deducted || 0;
          const targetPercentage = app.targetPercentage?.value || 65;
          const targetValue = quantitySold * 10 * (targetPercentage / 100);
          const newProfitLossVsTarget =
            newTotalSaleValue - taxDeducted - targetValue;

          console.log("📊 Edit sale calculation details:", {
            originalSalePrice: originalSalePrice,
            newSalePrice: newSalePrice,
            quantitySold: quantitySold,
            newTotalSaleValue: newTotalSaleValue,
            taxDeducted: taxDeducted,
            targetValue: targetValue,
            newProfitLossVsTarget: newProfitLossVsTarget,
            storedProfitLoss: saleData.profit_loss_vs_target, // For comparison
          });

          // Update display elements
          const totalElement = document.getElementById("editTotalSaleValue");
          if (totalElement) {
            totalElement.textContent =
              window.FormatHelpers.formatCurrencyValue(newTotalSaleValue);
          }

          const plElement = document.getElementById("editProfitLossVsTarget");
          if (plElement) {
            plElement.textContent = window.FormatHelpers.formatCurrencyValue(
              newProfitLossVsTarget
            );
            const plClass = window.FormatHelpers.getProfitLossClass(
              newProfitLossVsTarget
            );
            plElement.className = `currency ${plClass}`;
          }

          console.log(
            "✅ Edit sale calculations updated with stored tax values"
          );
        } catch (error) {
          console.error("❌ Error updating edit sale calculations:", error);
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
            <div class="info-stat">
              <h4>Normalized Price %</h4>
              <div class="stat-value ${this.getNormalizedPriceClass(priceHistory, entry.current_value)}">
                ${this.calculateNormalizedPricePercentage(priceHistory, entry.current_value)}
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
                  beginAtZero: false,
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
updateProgress(app, progressData) {
  console.log(`📊 Progress update:`, progressData);

  if (!progressData) return;

  // Handle both old string format and new object format
  let progressText, percentage;
  
  if (typeof progressData === 'string') {
    // Legacy string format - fallback
    progressText = progressData;
    percentage = 50; // Default percentage for legacy
  } else {
    // New object format with exact percentage control
    progressText = progressData.text;
    percentage = progressData.percentage;
  }

  // SAFE: Get elements fresh from DOM if not in app object
  const progressTextEl = app.updateProgressText || document.getElementById("updateProgressText");
  const statusOutput = app.updateStatusOutput || document.getElementById("updateStatusOutput");
  const progressBar = app.updateProgressBar || document.getElementById("updateProgressBar");

  // Update progress text
  if (progressTextEl) {
    progressTextEl.textContent = progressText;
  }

  // Update status output
  if (statusOutput) {
    statusOutput.textContent = progressText;
  }

  // Update progress bar with exact percentage from scraper
  if (progressBar) {
    progressBar.style.width = percentage + "%";
    console.log(`📊 Progress bar updated to ${percentage}%`);
  }
},
  // Add to ModalManager section in ui-state-management.js
  /**
   * Enhanced showSellModal with dynamic price lookup
   * Replace your existing showSellModal method with this:
   */
  async showSellModal(app, entryId) {
    try {
      console.log(`💰 Opening sell modal for entry ID: ${entryId}`);

      // Get entry data
      const entry = app.portfolioData.find((e) => e.id === entryId);
      if (!entry) {
        console.error(`❌ Portfolio entry not found for ID: ${entryId}`);
        alert("Portfolio entry not found");
        return;
      }

      // Check if entry is sellable
      if (entry.selling_status !== "SELLABLE" && entry.selling_status !== "EXPIRING_SOON") {
        const statusMessage = window.FormatHelpers.getSellButtonTooltip(
          entry.selling_status,
          entry.can_sell_after,
          entry.expires_on
        );
        alert(`Cannot sell these options: ${statusMessage}`);
        return;
      }

      // Store entry for validation
      app.currentSellEntry = entry;

      // Show modal with setup callback
      this.showModal("sellOptionsModal", () => {
        // Populate the sellOptionDetails div
        const detailsContainer = document.getElementById("sellOptionDetails");
        if (detailsContainer) {
          detailsContainer.innerHTML = `
          <div class="option-summary">
            <h4>📊 Option Details</h4>
            <div class="detail-row">
              <span>Grant Date:</span>
              <span>${window.FormatHelpers.formatDate(entry.grant_date)}</span>
            </div>
            <div class="detail-row">
              <span>Fund:</span>
              <span>${app.helpers.formatFundName(entry.fund_name)}</span>
            </div>
            <div class="detail-row">
              <span>Exercise Price:</span>
              <span>${app.helpers.formatCurrency(entry.exercise_price)}</span>
            </div>
            <div class="detail-row">
              <span>Available to Sell:</span>
              <span><strong>${entry.quantity_remaining.toLocaleString()} options</strong></span>
            </div>
            <div class="detail-row">
              <span>Current Value per Option:</span>
              <span>${app.helpers.formatCurrency(entry.current_value || 0)}</span>
            </div>
          </div>
        `;
        }

        // Update the max quantity help text
        const maxQuantityHelp = document.getElementById("maxQuantityHelp");
        if (maxQuantityHelp) {
          maxQuantityHelp.textContent = `Maximum available: ${entry.quantity_remaining.toLocaleString()} options`;
        }

        // Set quantity input max value
        const quantityInput = document.getElementById("quantityToSell");
        if (quantityInput) {
          quantityInput.max = entry.quantity_remaining;
          quantityInput.placeholder = `1 to ${entry.quantity_remaining.toLocaleString()}`;
        }

        // Set up date restrictions
        window.UIStateManager.Validation.setupSellDateRestrictions(app);

        // *** NEW: Set up dynamic price lookup ***
        this.setupDynamicPriceUpdate(app);

        // Set up validation listeners
        window.UIStateManager.Validation.setupSellValidationListeners(app);

        // Run initial validation
        window.UIStateManager.Validation.validateSellGrantsForm(app);

        console.log("✅ Sell modal opened with dynamic price lookup");
      });

      return true;
    } catch (error) {
      console.error("❌ Error in showSellModal:", error);
      alert("Error opening sell modal: " + error.message);
      return false;
    }
  },
  /**
   * Set up dynamic price lookup based on sale date
   * @param {Object} app - Application instance
   */
  setupDynamicPriceUpdate(app) {
    const saleDateInput = document.getElementById("saleDate");
    const salePriceInput = document.getElementById("salePrice");

    if (!saleDateInput || !salePriceInput || !app.currentSellEntry) {
      console.warn("⚠️ Missing elements for dynamic price update");
      return;
    }

    console.log("🔗 Setting up dynamic price lookup");

    // Function to update price based on date
    const updatePriceForDate = async (selectedDate) => {
      try {
        console.log(`🔍 Looking up price for ${selectedDate}`);

        // Show loading state
        const originalValue = salePriceInput.value;
        salePriceInput.value = ""; // Clear value
        salePriceInput.placeholder = "Loading price..."; // Show loading message
        salePriceInput.style.opacity = "0.6"; // Visual feedback
        salePriceInput.disabled = true; // Prevent interaction
        salePriceInput.disabled = true;

        // Call backend to get closest price
        const priceData = await window.ipcRenderer.invoke(
          "get-price-for-date",
          selectedDate,
          app.currentSellEntry.exercise_price,
          app.currentSellEntry.grant_date
        );

        // Re-enable input
        salePriceInput.disabled = false;

        if (priceData && !priceData.error && priceData.current_value) {
          salePriceInput.value = priceData.current_value.toFixed(2);

          // Update help text to show price source
          const salePriceHelp = document.querySelector(
            "#salePrice + .form-help"
          );
          if (salePriceHelp) {
            let sourceText;
            if (priceData.match_type === "exact") {
              sourceText = `✅ Exact price for ${selectedDate}`;
            } else {
              const daysDiff = Math.round(priceData.day_difference || 0);
              sourceText = `📅 Price from ${priceData.price_date} (${daysDiff} days ${priceData.match_type})`;
            }
            salePriceHelp.innerHTML = `${sourceText} - <strong>adjust if needed</strong>`;
          }

          console.log(
            `✅ Price updated to €${priceData.current_value} (${priceData.match_type})`
          );
        } else {
          // Fallback to current value
          const fallbackPrice = app.currentSellEntry.current_value || 0;
          salePriceInput.value = fallbackPrice.toFixed(2);

          const salePriceHelp = document.querySelector(
            "#salePrice + .form-help"
          );
          if (salePriceHelp) {
            salePriceHelp.innerHTML = `⚠️ No historical price data - using current value of €${fallbackPrice.toFixed(2)}`;
          }

          console.log("⚠️ No historical price found, using current value");
        }

        // Trigger validation and calculation updates
        window.UIStateManager.Validation.validateSellGrantsForm(app);
        if (typeof app.calculateSaleProceeds === "function") {
          app.calculateSaleProceeds();
        }
      } catch (error) {
        console.error("❌ Error fetching price for date:", error);

        // Re-enable input and set fallback
        salePriceInput.disabled = false;
        const fallbackPrice = app.currentSellEntry.current_value || 0;
        salePriceInput.value = fallbackPrice.toFixed(2);

        const salePriceHelp = document.querySelector("#salePrice + .form-help");
        if (salePriceHelp) {
          salePriceHelp.innerHTML = `❌ Error loading price data - using current value`;
        }
      }
    };

    // Set up date change listener with debouncing
    let priceUpdateTimeout;
    saleDateInput.addEventListener("change", (e) => {
      if (e.target.value) {
        // Clear previous timeout
        clearTimeout(priceUpdateTimeout);

        // Add small delay to prevent rapid API calls
        priceUpdateTimeout = setTimeout(() => {
          updatePriceForDate(e.target.value);
        }, 300);
      }
    });

    // Set initial price for default date
    if (saleDateInput.value) {
      updatePriceForDate(saleDateInput.value);
    } else {
      // Set fallback price if no date is set
      const fallbackPrice = app.currentSellEntry.current_value || 0;
      salePriceInput.value = fallbackPrice.toFixed(2);
      salePriceInput.placeholder = `Current: €${fallbackPrice.toFixed(2)}`;
    }

    console.log("✅ Dynamic price lookup configured");
  },

  configureForDelete() {
    console.log("⚙️ Configuring modal for delete");

    const title = document.getElementById("databaseModalTitle");
    const deleteSection = document.getElementById("deleteDatabaseSection");
    const confirmButton = document.getElementById("confirmDatabaseAction");
    const actionText = document.getElementById("databaseActionText");

    if (title) title.textContent = "🗑️ Delete Database";
    if (deleteSection) deleteSection.style.display = "block";
    if (confirmButton) {
      confirmButton.disabled = true; // Start disabled for delete
      confirmButton.className = "btn btn-danger";
    }
    if (actionText) actionText.textContent = "🗑️ Delete Database";
  },
  /**
   * Set up event listeners for delete operation
   * @param {Object} app - Application instance
   */
  setupDeleteListeners(app) {
    console.log("🔧 Setting up delete listeners");

    const confirmText = document.getElementById("databaseConfirmText");
    const confirmButton = document.getElementById("confirmDatabaseAction");
    const cancelButton = document.getElementById("cancelDatabaseAction");

    // Set up text validation
    if (confirmText) {
      const validationHandler = (e) => {
        const requiredText = "delete database";
        const userInput = e.target.value.toLowerCase().trim();
        const isValid = userInput === requiredText;

        // Update input styling
        confirmText.classList.remove("valid", "invalid");
        if (userInput.length > 0) {
          confirmText.classList.add(isValid ? "valid" : "invalid");
        }

        // Update button state
        if (confirmButton) {
          confirmButton.disabled = !isValid;
        }

        console.log(`🔍 Validation: "${userInput}" = ${isValid}`);
      };

      confirmText.addEventListener("input", validationHandler);
    }

    // Set up confirm button
    if (confirmButton) {
      const deleteHandler = async () => {
        await this.executeDelete(app);
        confirmButton.removeEventListener("click", deleteHandler);
      };
      confirmButton.addEventListener("click", deleteHandler);
    }

    // Set up cancel button
    if (cancelButton) {
      const cancelHandler = () => {
        this.hideModal("databaseManagementModal");
        cancelButton.removeEventListener("click", cancelHandler);
      };
      cancelButton.addEventListener("click", cancelHandler);
    }
  },
  /**
   * Execute delete operation
   * @param {Object} app - Application instance
   */
  async executeDelete(app) {
    console.log("🗑️ Executing delete operation");

    try {
      // Update button state
      const confirmButton = document.getElementById("confirmDatabaseAction");
      if (confirmButton) {
        confirmButton.textContent = "Deleting...";
        confirmButton.disabled = true;
      }

      // Execute delete
      const result = await window.IPCCommunication.Database.deleteDatabase();

      if (result && result.success) {
        console.log("✅ Database deleted successfully");

        // Hide modal
        this.hideModal("databaseManagementModal");

        // Close settings modal
        if (app) {
          this.closeSettings(app);
        }

        // Show success notification
        window.UIStateManager.showSuccess(
          "Database deleted successfully",
          3000
        );

        // Handle post-delete cleanup
        await this.handlePostDeleteCleanup(app);
      } else {
        const errorMsg =
          result?.error || result?.message || "Unknown error occurred";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error deleting database:", error);
      window.UIStateManager.showError(
        "Error deleting database: " + error.message
      );

      // Reset button state
      const confirmButton = document.getElementById("confirmDatabaseAction");
      if (confirmButton) {
        confirmButton.textContent = "🗑️ Delete Database";
        confirmButton.disabled = false;
      }
    }
  },

  /**
   * Handle cleanup after database deletion
   * @param {Object} app - Application instance
   */
  /**
   * Handle cleanup after database deletion
   * @param {Object} app - Application instance
   */
  /**
   * Handle cleanup after database deletion - SIMPLIFIED VERSION
   * @param {Object} app - Application instance
   */
  async handlePostDeleteCleanup(app) {
    console.log("🧹 Handling post-delete cleanup");

    try {
      // Clear portfolio data
      if (app) {
        app.portfolioData = [];
        app.salesData = [];
        app.evolutionData = [];
        app.grantData = [];

        // Clear UI
        if (app.portfolioTableBody) {
          app.portfolioTableBody.innerHTML =
            '<tr><td colspan="100%" class="text-center">No portfolio data available</td></tr>';
        }

        // Reset stats
        window.UIStateManager.Stats.updateHeaderStats(app, {
          totalValue: 0,
          totalCost: 0,
          totalReturn: 0,
          returnPercentage: 0,
          entriesCount: 0,
        });

        // CRITICAL: This will update all button states including "Update Prices" button
        await app.checkDataAvailability();

        // Switch to portfolio tab
        window.UIStateManager.Tabs.switchTab(app, "portfolio");

        console.log("✅ UI cleanup completed");
      }
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError);
    }
  },
  hideModal(modalId) {
    console.log(`📱 Hiding modal: ${modalId}`);

    const modal = window.DOMHelpers.safeGetElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
      return true;
    }
    return false;
  },

  showDeleteDatabaseModal(app) {
    console.log("🗑️ Showing delete database modal");

    this.resetDatabaseModal();
    this.configureForDelete();
    this.showModal("databaseManagementModal");
    this.setupDeleteListeners(app);
  },
  /**
   * Show import database modal with improved flow
   * @param {Object} app - Application instance
   */
  showImportDatabaseModal(app) {
    console.log("📥 Showing import database modal with improved flow");

    this.resetDatabaseModal();
    this.configureForImport();
    this.showModal("databaseManagementModal");
    this.setupImportListeners(app);
  },

  /**
   * Configure modal for import operation - UPDATED
   */
  configureForImport() {
    console.log("⚙️ Configuring modal for import with file-first flow");

    const title = document.getElementById("databaseModalTitle");
    const importSection = document.getElementById("importDatabaseSection");
    const confirmButton = document.getElementById("confirmDatabaseAction");
    const actionText = document.getElementById("databaseActionText");

    if (title) title.textContent = "📥 Import Database";
    if (importSection) importSection.style.display = "block";
    if (confirmButton) {
      confirmButton.disabled = true; // Start disabled until file is selected
      confirmButton.className = "btn btn-primary";
    }
    if (actionText) actionText.textContent = "📥 Import Database";
  },

  /**
   * Reset database modal to initial state - UPDATED
   */
  resetDatabaseModal() {
    console.log("🔄 Resetting unified database modal");

    const importSection = document.getElementById("importDatabaseSection");
    const deleteSection = document.getElementById("deleteDatabaseSection");
    const confirmText = document.getElementById("databaseConfirmText");
    const confirmButton = document.getElementById("confirmDatabaseAction");

    // Reset sections
    if (importSection) importSection.style.display = "none";
    if (deleteSection) deleteSection.style.display = "none";

    // Reset import flow steps
    const selectedFileInfo = document.getElementById("selectedFileInfo");
    const importOptionsStep = document.getElementById("importOptionsStep");
    const importSummaryStep = document.getElementById("importSummaryStep");

    if (selectedFileInfo) selectedFileInfo.style.display = "none";
    if (importOptionsStep) importOptionsStep.style.display = "none";
    if (importSummaryStep) importSummaryStep.style.display = "none";

    // Reset confirmation input
    if (confirmText) {
      confirmText.value = "";
      confirmText.classList.remove("valid", "invalid");
    }

    // Reset button
    if (confirmButton) {
      confirmButton.disabled = true;
      confirmButton.className = "btn btn-primary";
      confirmButton.innerHTML =
        '<span id="databaseActionText">📥 Import Database</span>';
    }

    // Reset radio buttons to default (merge)
    const mergeRadio = document.querySelector(
      'input[name="importMode"][value="merge"]'
    );
    if (mergeRadio) {
      mergeRadio.checked = true;
    }

    // Reset stored file path
    this.selectedImportFile = null;
  },

  /**
   * Set up event listeners for import operation - UPDATED
   * @param {Object} app - Application instance
   */
  /**
   * Set up event listeners for import operation - DELEGATED TO EVENT HANDLERS
   * @param {Object} app - Application instance
   */
  /**
   * Set up event listeners for import operation - FIXED
   * @param {Object} app - Application instance
   */
  setupImportListeners(app) {
    console.log("🔧 Setting up import listeners using app properties (FIXED)");

    // File selection button
    if (app.selectImportFile) {
      app.selectImportFile.onclick = async (event) => {
        console.log("📁 File selection button clicked!");
        event.preventDefault();

        try {
          await this.handleFileSelection(app);
        } catch (error) {
          console.error("❌ Error in file selection:", error);
          alert("Error selecting file: " + error.message);
        }
      };
      console.log(
        "✅ File selection listener attached to app.selectImportFile"
      );
    } else {
      console.error("❌ app.selectImportFile not found!");
    }

    // Cancel button
    if (app.cancelDatabaseAction) {
      app.cancelDatabaseAction.onclick = (event) => {
        console.log("❌ Cancel button clicked!");
        event.preventDefault();
        this.hideModal("databaseManagementModal");
      };
      console.log("✅ Cancel listener attached to app.cancelDatabaseAction");
    } else {
      console.error("❌ app.cancelDatabaseAction not found!");
    }

    // Confirm button
    if (app.confirmDatabaseAction) {
      app.confirmDatabaseAction.onclick = async (event) => {
        console.log("📥 Confirm button clicked!");
        event.preventDefault();

        try {
          await this.executeImport(app);
        } catch (error) {
          console.error("❌ Error in import execution:", error);
        }
      };
      console.log("✅ Confirm listener attached to app.confirmDatabaseAction");
    } else {
      console.error("❌ app.confirmDatabaseAction not found!");
    }

    // Radio buttons for import mode
    const importModeRadios = document.querySelectorAll(
      'input[name="importMode"]'
    );
    importModeRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        console.log("🔄 Import mode changed:", radio.value);
        this.updateImportSummary();
      });
    });

    console.log(
      `✅ All import listeners set up successfully (${importModeRadios.length} radio buttons)`
    );
  },

  /**
   * Handle file selection for import
   * @param {Object} app - Application instance
   */
  async handleFileSelection(app) {
    console.log("📁 Opening file selection dialog");

    try {
      // Call IPC to open file dialog
      const result = await window.IPCCommunication.Database.selectImportFile();

      if (result.success && result.filePath) {
        this.selectedImportFile = result.filePath;
        this.showSelectedFile(result.filePath, result.fileInfo);
        this.showImportOptions();
        this.updateImportSummary();

        console.log("✅ File selected:", result.filePath);
      } else {
        console.log("📁 File selection cancelled");
      }
    } catch (error) {
      console.error("❌ Error selecting file:", error);
      window.UIStateManager.showError("Error selecting file: " + error.message);
    }
  },

  /**
   * Show selected file information
   * @param {string} filePath - Selected file path
   * @param {Object} fileInfo - File information
   */
  showSelectedFile(filePath, fileInfo) {
    const selectedFileInfo = document.getElementById("selectedFileInfo");
    const selectedFileName = document.getElementById("selectedFileName");
    const selectedFileDetails = document.getElementById("selectedFileDetails");

    if (selectedFileInfo && selectedFileName && selectedFileDetails) {
      const fileName = filePath.split(/[\\/]/).pop(); // Get filename from path
      const fileSize = fileInfo?.size
        ? this.formatFileSize(fileInfo.size)
        : "Unknown size";
      const fileDate = fileInfo?.modified
        ? new Date(fileInfo.modified).toLocaleDateString()
        : "Unknown date";

      selectedFileName.textContent = fileName;
      selectedFileDetails.textContent = `${fileSize} • Modified: ${fileDate}`;
      selectedFileInfo.style.display = "block";

      console.log("✅ File info displayed");
    }
  },

  /**
   * Show import options step
   */
  showImportOptions() {
    const importOptionsStep = document.getElementById("importOptionsStep");
    if (importOptionsStep) {
      importOptionsStep.style.display = "block";
      console.log("✅ Import options step shown");
    }
  },

  /**
   * Update import summary
   */
  updateImportSummary() {
    if (!this.selectedImportFile) return;

    const importSummaryStep = document.getElementById("importSummaryStep");
    const summaryFileName = document.getElementById("summaryFileName");
    const summaryMode = document.getElementById("summaryMode");
    const summaryWarning = document.getElementById("summaryWarning");
    const confirmButton = document.getElementById("confirmDatabaseAction");

    if (importSummaryStep && summaryFileName && summaryMode) {
      const selectedMode = document.querySelector(
        'input[name="importMode"]:checked'
      )?.value;
      const fileName = this.selectedImportFile.split(/[\\/]/).pop();

      summaryFileName.textContent = fileName;
      summaryMode.textContent =
        selectedMode === "merge"
          ? "Merge with existing data"
          : "Replace all existing data";

      // Show warning for replace mode
      if (summaryWarning) {
        summaryWarning.style.display =
          selectedMode === "replace" ? "block" : "none";
      }

      // Enable confirm button
      if (confirmButton) {
        confirmButton.disabled = false;
      }

      importSummaryStep.style.display = "block";
      console.log("✅ Import summary updated");
    }
  },

  /**
   * Execute import operation - UPDATED to use selected file
   * @param {Object} app - Application instance
   */
  async executeImport(app) {
    console.log("📥 Executing import operation with selected file");

    try {
      if (!this.selectedImportFile) {
        throw new Error("No file selected for import");
      }

      // Get selected import mode
      const mergeMode =
        document.querySelector('input[name="importMode"]:checked')?.value ===
        "merge";

      console.log(`Import mode: ${mergeMode ? "merge" : "replace"}`);
      console.log(`Import file: ${this.selectedImportFile}`);

      // Hide modal first
      this.hideModal("databaseManagementModal");

      // Close settings modal
      if (app) {
        this.closeSettings(app);
      }

      // Execute import with selected file
      const result =
        await window.IPCCommunication.Database.importDatabaseFromFile(
          this.selectedImportFile,
          mergeMode
        );

      if (result.success) {
        const successMessage = `Database ${mergeMode ? "merged" : "imported"} successfully! Imported ${result.importedEntries} entries.`;

        // Use notification manager
        window.UIStateManager.showSuccess(successMessage, 5000);
        console.log("✅ Database import completed successfully");

        // 🆕 CRITICAL: Reset undo/redo state after import
        if (window.UndoRedoManager) {
          const importType = mergeMode ? "Database Merge" : "Database Import";
          await window.UndoRedoManager.resetAfterImport(importType);
          console.log("✅ Undo/redo state reset after import");
        } else {
          console.warn(
            "⚠️ UndoRedoManager not found - undo/redo state not reset"
          );
        }

        // Reload data and switch to portfolio tab
        if (app && app.loadPortfolioData) {
          await app.loadPortfolioData();
        }

        // Update button states after import
        if (app && app.checkDataAvailability) {
          await app.checkDataAvailability();
        }

        // Check price update status after import
        if (app) {
          await window.IPCCommunication.Price.checkPriceUpdateStatus(app);
        }

        if (app) {
          window.UIStateManager.Tabs.switchTab(app, "portfolio");
        }
      } else {
        window.UIStateManager.showError("Import cancelled or failed");
        console.log("❌ Database import cancelled or failed");
      }
    } catch (error) {
      console.error("❌ Error importing database:", error);
      window.UIStateManager.showError(
        "Error importing database: " + error.message
      );
    }
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Calculate normalized price percentage
   * @param {Array} priceHistory - Array of price history data
   * @param {number} currentValue - Current option value
   * @returns {string} Formatted normalized price percentage
   */
  calculateNormalizedPricePercentage(priceHistory, currentValue) {
    if (!priceHistory || priceHistory.length === 0) {
      return "N/A";
    }

    if (!currentValue || currentValue === 0) {
      return "N/A";
    }

    // Extract price values from history
    const priceValues = priceHistory.map(p => p.current_value).filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (priceValues.length === 0) {
      return "N/A";
    }

    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);

    // Handle edge cases
    if (min === max) {
      return "N/A"; // If all prices are the same, position is meaningless
    }

    // Calculate normalized percentage (0-100)
    const normalizedPct = ((currentValue - min) / (max - min)) * 100;
    
    // Use existing formatter
    return window.FormatHelpers.formatPercentage(normalizedPct, 1);
  },

  /**
   * Get CSS class for normalized price percentage
   * @param {Array} priceHistory - Array of price history data
   * @param {number} currentValue - Current option value
   * @returns {string} CSS class name
   */
  getNormalizedPriceClass(priceHistory, currentValue) {
    if (!priceHistory || priceHistory.length === 0 || !currentValue) {
      return "";
    }

    const priceValues = priceHistory.map(p => p.current_value).filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (priceValues.length === 0) {
      return "";
    }

    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);

    if (min === max) {
      return ""; // Neutral if all prices are the same
    }

    const normalizedPct = ((currentValue - min) / (max - min)) * 100;
    
    // Use existing color scheme
    if (normalizedPct >= 66) {
      return "positive"; // Green for high position (top third)
    } else if (normalizedPct <= 33) {
      return "negative"; // Red for low position (bottom third) 
    } else {
      return ""; // Neutral for middle third
    }
  },
};
window.ModalManager = ModalManager;
