// Historical Price Manager - Frontend handlers for historical price functionality

const HistoricalPriceManager = {
  currentFetchData: null,
  bulkUpdateData: null,

  // Initialize event listeners
  init(app) {
    this.setupEventListeners(app);
    this.setupIPCListeners();
  },

  setupEventListeners(app) {
    // Settings button - Update Historical Prices
    const updateHistoricalBtn = document.getElementById('updateHistoricalPricesBtn');
    if (updateHistoricalBtn) {
      updateHistoricalBtn.addEventListener('click', () => {
        this.showBulkUpdateModal(app);
      });
    }

    // Historical fetch modal buttons
    const cancelHistoricalFetch = document.getElementById('cancelHistoricalFetch');
    const confirmHistoricalFetch = document.getElementById('confirmHistoricalFetch');
    
    if (cancelHistoricalFetch) {
      cancelHistoricalFetch.addEventListener('click', () => {
        this.cancelHistoricalFetch(app);
      });
    }

    if (confirmHistoricalFetch) {
      confirmHistoricalFetch.addEventListener('click', () => {
        this.confirmHistoricalFetch(app);
      });
    }

    // Bulk update modal buttons
    const cancelBulkUpdate = document.getElementById('cancelBulkUpdate');
    const closeBulkUpdate = document.getElementById('closeBulkUpdate');

    if (cancelBulkUpdate) {
      cancelBulkUpdate.addEventListener('click', () => {
        this.cancelBulkUpdate(app);
      });
    }

    if (closeBulkUpdate) {
      closeBulkUpdate.addEventListener('click', () => {
        this.closeBulkUpdate(app);
      });
    }
  },

  setupIPCListeners() {
    // Listen for historical fetch progress
    window.ipcRenderer.on('historical-fetch-progress', (event, progress) => {
      this.updateFetchProgress(progress);
    });

    // Listen for bulk update progress
    window.ipcRenderer.on('historical-batch-progress', (event, batchProgress) => {
      this.updateBulkProgress(batchProgress);
    });
  },

  // Show historical price fetch modal for a single option
  async showFetchModal(fundName, exercisePrice, grantDate) {
    console.log(`📊 Opening historical price fetch modal for: ${fundName}`);

    // Store current fetch data
    this.currentFetchData = {
      fundName,
      exercisePrice,
      grantDate
    };

    // Populate modal with option details
    document.getElementById('fetchOptionName').textContent = fundName;
    document.getElementById('fetchOptionDetails').textContent = 
      `Exercise Price: €${exercisePrice} | Grant Date: ${grantDate}`;

    // Reset modal state
    this.resetFetchModalState();

    // Update modal for manual fetching workflow
    document.querySelector('#historicalPriceFetchModal .modal-header h3').textContent = '📊 Fetching Historical Prices';
    document.getElementById('confirmHistoricalFetch').textContent = 'Please wait...';
    document.getElementById('confirmHistoricalFetch').disabled = true;
    
    // Hide cancel button during fetch - user should wait for completion
    document.getElementById('cancelHistoricalFetch').style.display = 'none';

    // Show modal
    window.ModalManager.showModal('historicalPriceFetchModal');

    // Start fetching historical prices automatically
    await this.startHistoricalFetch();
  },

  // Start fetching historical prices for current option
  async startHistoricalFetch() {
    try {
      console.log('🔄 Starting historical price fetch...');
      
      this.updateFetchProgress({ text: 'Connecting to price server...', percentage: 0 });

      const result = await window.ipcRenderer.invoke(
        'fetch-historical-prices',
        this.currentFetchData.fundName,
        this.currentFetchData.exercisePrice,
        this.currentFetchData.grantDate
      );

      if (result.success) {
        this.showFetchResults(result);
      } else {
        this.showFetchError(result.error);
      }

    } catch (error) {
      console.error('❌ Error fetching historical prices:', error);
      this.showFetchError(error.message);
    }
  },

  // Update fetch progress
  updateFetchProgress(progress) {
    const progressBar = document.getElementById('historicalFetchProgressBar');
    const statusText = document.getElementById('historicalFetchStatus');

    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }

    if (statusText) {
      statusText.textContent = progress.text;
    }
  },

  // Show fetch results
  showFetchResults(result) {
    console.log('✅ Historical prices fetched successfully:', result);

    // Hide progress, show results
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('fetchResults').style.display = 'block';

    // Populate results
    document.getElementById('totalPricePoints').textContent = result.priceCount.toLocaleString();
    const grantDatePriceElement = document.getElementById('grantDatePrice');
    grantDatePriceElement.textContent = `€${result.grantDatePrice?.toFixed(2) || '0.00'}`;
    
    // Add visual indicator for derived prices
    if (result.grantDatePriceDerived) {
      grantDatePriceElement.title = `${result.grantDatePriceSource}`;
      grantDatePriceElement.classList.add('derived-price');
      console.log(`📊 Grant date price derived: ${result.grantDatePriceSource}`);
    } else {
      grantDatePriceElement.title = 'Exact price from KBC';
      grantDatePriceElement.classList.remove('derived-price');
    }
    
    document.getElementById('currentPriceResult').textContent = `€${result.currentPrice?.toFixed(2) || '0.00'}`;
    document.getElementById('dateRange').textContent = 
      result.dateRange ? `${result.dateRange.from} to ${result.dateRange.to}` : '--';

    // Enable continue button (for manual use if needed)
    document.getElementById('confirmHistoricalFetch').disabled = false;

    // Store the grant date price for use in grant addition
    this.currentFetchData.grantDatePrice = result.grantDatePrice;
    
    // Enable the Continue button for user to manually proceed
    const continueButton = document.getElementById('confirmHistoricalFetch');
    continueButton.textContent = 'Continue with Grant';
    continueButton.disabled = false;
    continueButton.classList.remove('btn-disabled');
    continueButton.classList.add('btn-primary');
    
    console.log('✅ Historical price fetch completed - waiting for user to continue');
  },

  // Show fetch error
  showFetchError(errorMessage) {
    console.error('❌ Historical price fetch error:', errorMessage);

    // Hide progress, show error
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('fetchError').style.display = 'block';
    document.getElementById('fetchErrorMessage').textContent = errorMessage;

    // Show close button when there's an error
    const cancelBtn = document.getElementById('cancelHistoricalFetch');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.textContent = 'Close';
  },

  // Cancel historical fetch
  cancelHistoricalFetch(app = null) {
    const modal = document.getElementById('historicalPriceFetchModal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.currentFetchData = null;
  },

  // Confirm historical fetch and continue with grant addition
  async confirmHistoricalFetch(app) {
    console.log('✅ Confirming historical fetch, updating option display...');

    // Close only the historical price fetch modal
    const modal = document.getElementById('historicalPriceFetchModal');
    if (modal) {
      modal.classList.remove('active');
    }

    // Update the exercise price option with the fetched grant date price
    if (this.currentFetchData && this.currentFetchData.grantDatePrice) {
      const exercisePriceSelect = document.getElementById('exercisePrice');
      const grantDateField = document.getElementById('grantDate');
      
      if (exercisePriceSelect && exercisePriceSelect.selectedIndex > 0) {
        const selectedOption = exercisePriceSelect.options[exercisePriceSelect.selectedIndex];
        const exercisePrice = parseFloat(selectedOption.value);
        const grantDate = grantDateField?.value;
        
        // Update the option's current value data attribute
        selectedOption.dataset.currentValue = this.currentFetchData.grantDatePrice.toFixed(2);
        
        // Update the display text to show the historical price
        const fundName = selectedOption.dataset.fundName || 'Unknown Fund';
        selectedOption.textContent = `${fundName} - €${exercisePrice} (Grant Date Value: €${this.currentFetchData.grantDatePrice.toFixed(2)})`;
        
        // Update the current value display in the form
        if (app && app.updateCurrentValueDisplay) {
          app.updateCurrentValueDisplay(this.currentFetchData.grantDatePrice, `Historical price fetched from KBC (${grantDate})`);
        }
        
        console.log(`💰 Updated option display with grant date value: €${this.currentFetchData.grantDatePrice.toFixed(2)}`);
      }
    }

    // Clear current fetch data
    this.currentFetchData = null;
    
    console.log('✅ Historical price fetch completed, form is ready for grant addition');
  },

  // Show bulk historical price update modal
  async showBulkUpdateModal(app) {
    console.log('📊 Opening bulk historical price update modal...');

    // Reset modal state
    this.resetBulkModalState();

    // Show modal
    window.ModalManager.showModal('bulkHistoricalUpdateModal');

    // Start bulk update
    await this.startBulkUpdate(app);
  },

  // Start bulk historical price update
  async startBulkUpdate(app) {
    try {
      console.log('🔄 Starting bulk historical price update...');
      
      this.updateBulkProgress({ 
        optionIndex: 0, 
        totalOptions: 1, 
        optionName: 'Initializing...', 
        progress: { text: 'Starting bulk update...', percentage: 0 } 
      });

      const result = await window.ipcRenderer.invoke('update-portfolio-historical-prices');

      if (result.success) {
        this.showBulkResults(result, app);
      } else {
        this.showBulkError(result.error);
      }

    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      this.showBulkError(error.message);
    }
  },

  // Update bulk progress
  updateBulkProgress(batchProgress) {
    const { optionIndex, totalOptions, optionName, progress } = batchProgress;

    // Check if this is the rebuild phase
    if (optionIndex === 'rebuild' && totalOptions === 'phase') {
      // Special handling for rebuild phase - don't show confusing numbers
      document.getElementById('bulkProcessedCount').textContent = 'Timeline';
      document.getElementById('bulkTotalCount').textContent = 'Rebuild';
      document.getElementById('bulkCurrentOption').textContent = optionName;
      
      // Use the progress percentage from the rebuild process directly
      document.getElementById('bulkHistoricalProgressBar').style.width = `${progress.percentage}%`;
      document.getElementById('bulkHistoricalStatus').textContent = progress.text;
    } else {
      // Normal option processing phase
      document.getElementById('bulkProcessedCount').textContent = optionIndex;
      document.getElementById('bulkTotalCount').textContent = totalOptions;
      document.getElementById('bulkCurrentOption').textContent = optionName;

      // Update overall progress
      const overallProgress = Math.round((optionIndex / totalOptions) * 100);
      document.getElementById('bulkHistoricalProgressBar').style.width = `${overallProgress}%`;
      document.getElementById('bulkHistoricalStatus').textContent = 
        `${progress.text} (${optionIndex + 1}/${totalOptions})`;
    }
  },

  // Show bulk update results
  showBulkResults(result, app) {
    console.log('✅ Bulk historical price update completed:', result);

    // Hide progress, show results
    document.querySelector('#bulkHistoricalUpdateModal .progress-container').style.display = 'none';
    document.getElementById('bulkUpdateResults').style.display = 'block';

    // Populate results
    document.getElementById('bulkSuccessCount').textContent = result.updated;
    document.getElementById('bulkErrorCount').textContent = result.errors;
    document.getElementById('bulkTotalPricePoints').textContent = 'Calculated';

    // Don't show close button yet - still need to recalculate
    // Show recalculation progress immediately
    this.showRecalculationProgress();
    
    // Reload ALL data to reflect updated historical prices
    if (app) {
      setTimeout(async () => {
        console.log('🔄 Refreshing all UI data after historical price update...');
        
        // Add small delays between operations to show progress
        await this.updateRecalculationProgress('Loading portfolio data...', 25);
        await app.loadPortfolioData();
        
        await this.updateRecalculationProgress('Calculating evolution data...', 50);
        await app.loadEvolutionData('all');
        
        await this.updateRecalculationProgress('Updating data availability...', 75);
        await app.checkDataAvailability();
        
        await this.updateRecalculationProgress('Finalizing...', 100);
        
        console.log('✅ UI data refreshed');
        
        // Small delay to show completion before hiding progress
        setTimeout(() => {
          this.hideRecalculationProgress();
          document.getElementById('closeBulkUpdate').style.display = 'inline-block';
        }, 800);
        
      }, 1000);
    } else {
      // If no app context, just show close button
      document.getElementById('closeBulkUpdate').style.display = 'inline-block';
    }
  },

  // Show bulk update error
  showBulkError(errorMessage) {
    console.error('❌ Bulk update error:', errorMessage);

    // Hide progress, show error
    document.querySelector('#bulkHistoricalUpdateModal .progress-container').style.display = 'none';
    document.getElementById('bulkUpdateError').style.display = 'block';
    document.getElementById('bulkUpdateErrorMessage').textContent = errorMessage;

    // Show close button
    document.getElementById('closeBulkUpdate').style.display = 'inline-block';
    document.getElementById('closeBulkUpdate').textContent = 'Close';
  },

  // Cancel bulk update
  cancelBulkUpdate(app = null) {
    // Note: In a real implementation, you might want to send a cancellation signal
    console.log('❌ Bulk update cancelled by user');
    window.ModalManager.closeAllModals(app);
    this.bulkUpdateData = null;
  },

  // Close bulk update modal
  closeBulkUpdate(app) {
    window.ModalManager.closeAllModals(app);
    this.bulkUpdateData = null;

    // Close settings sidebar if open
    if (app) {
      window.ModalManager.closeSettings(app);
    }
  },

  // Reset fetch modal state
  resetFetchModalState() {
    // Reset progress
    document.getElementById('historicalFetchProgressBar').style.width = '0%';
    document.getElementById('historicalFetchStatus').textContent = 'Initializing...';

    // Hide results and errors
    document.getElementById('fetchResults').style.display = 'none';
    document.getElementById('fetchError').style.display = 'none';
    document.querySelector('#historicalPriceFetchModal .progress-container').style.display = 'block';

    // Reset buttons
    document.getElementById('cancelHistoricalFetch').style.display = 'none';
    document.getElementById('confirmHistoricalFetch').disabled = true;
    document.getElementById('confirmHistoricalFetch').textContent = 'Continue with Grant';
  },

  // Reset bulk modal state
  resetBulkModalState() {
    // Reset progress
    document.getElementById('bulkHistoricalProgressBar').style.width = '0%';
    document.getElementById('bulkHistoricalStatus').textContent = 'Initializing...';
    document.getElementById('bulkProcessedCount').textContent = '0';
    document.getElementById('bulkTotalCount').textContent = '0';
    document.getElementById('bulkCurrentOption').textContent = '--';

    // Hide results and errors
    document.getElementById('bulkUpdateResults').style.display = 'none';
    document.getElementById('bulkUpdateError').style.display = 'none';
    document.querySelector('#bulkHistoricalUpdateModal .progress-container').style.display = 'block';

    // Reset buttons
    document.getElementById('cancelBulkUpdate').style.display = 'none';
    document.getElementById('closeBulkUpdate').style.display = 'none';
  },

  // Get the fetched grant date price for use in grant addition
  getGrantDatePrice() {
    return this.currentFetchData?.grantDatePrice || null;
  },

  // Show recalculation progress after bulk update
  showRecalculationProgress() {
    console.log('📊 Showing recalculation progress...');
    
    // Hide results temporarily, show progress again
    document.getElementById('bulkUpdateResults').style.display = 'none';
    document.querySelector('#bulkHistoricalUpdateModal .progress-container').style.display = 'block';
    
    // Update progress indicators for recalculation phase
    document.getElementById('bulkHistoricalProgressBar').style.width = '0%';
    document.getElementById('bulkHistoricalStatus').textContent = 'Starting portfolio recalculation...';
    document.getElementById('bulkProcessedCount').textContent = 'Recalc';
    document.getElementById('bulkTotalCount').textContent = 'Phase';
    document.getElementById('bulkCurrentOption').textContent = 'Initializing...';
  },

  // Update recalculation progress with specific step
  async updateRecalculationProgress(stepText, percentage) {
    console.log(`📊 Recalculation step: ${stepText} (${percentage}%)`);
    
    // Update progress bar and text
    document.getElementById('bulkHistoricalProgressBar').style.width = `${percentage}%`;
    document.getElementById('bulkHistoricalStatus').textContent = stepText;
    document.getElementById('bulkCurrentOption').textContent = `Progress: ${percentage}%`;
    
    // Add a small delay to ensure the UI updates are visible
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  // Hide recalculation progress and show final results
  hideRecalculationProgress() {
    console.log('✅ Hiding recalculation progress...');
    
    // Hide progress, show final results
    document.querySelector('#bulkHistoricalUpdateModal .progress-container').style.display = 'none';
    document.getElementById('bulkUpdateResults').style.display = 'block';
    
    // Update status to indicate completion
    document.getElementById('bulkTotalPricePoints').textContent = 'Portfolio Recalculated';
  }
};

// Export for global use
window.HistoricalPriceManager = HistoricalPriceManager;