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

    // Show modal
    window.ModalManager.showModal('historicalPriceFetchModal');

    // Start fetching historical prices
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
    document.getElementById('grantDatePrice').textContent = `€${result.grantDatePrice?.toFixed(2) || '0.00'}`;
    document.getElementById('currentPriceResult').textContent = `€${result.currentPrice?.toFixed(2) || '0.00'}`;
    document.getElementById('dateRange').textContent = 
      result.dateRange ? `${result.dateRange.from} to ${result.dateRange.to}` : '--';

    // Enable continue button
    document.getElementById('confirmHistoricalFetch').disabled = false;

    // Store the grant date price for use in grant addition
    this.currentFetchData.grantDatePrice = result.grantDatePrice;
  },

  // Show fetch error
  showFetchError(errorMessage) {
    console.error('❌ Historical price fetch error:', errorMessage);

    // Hide progress, show error
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('fetchError').style.display = 'block';
    document.getElementById('fetchErrorMessage').textContent = errorMessage;

    // Show cancel button, enable it as "Close"
    const cancelBtn = document.getElementById('cancelHistoricalFetch');
    cancelBtn.style.display = 'inline-block';
    cancelBtn.textContent = 'Close';
  },

  // Cancel historical fetch
  cancelHistoricalFetch(app = null) {
    window.ModalManager.closeAllModals(app);
    this.currentFetchData = null;
  },

  // Confirm historical fetch and continue with grant addition
  async confirmHistoricalFetch(app) {
    console.log('✅ Confirming historical fetch, continuing with grant...');

    // Close modal
    window.ModalManager.closeAllModals(app);

    // Use the fetched grant date price in the grant addition form
    if (this.currentFetchData.grantDatePrice) {
      // Update the current value field in the add grants form with the historical price
      const currentValueField = document.getElementById('currentValue');
      if (currentValueField) {
        currentValueField.value = this.currentFetchData.grantDatePrice.toFixed(2);
        console.log(`💰 Updated current value to historical price: €${this.currentFetchData.grantDatePrice}`);
      }
    }

    // Clear current fetch data
    this.currentFetchData = null;

    // Continue with grant addition using the pending grant data
    if (app.pendingGrantData) {
      await window.IPCCommunication.Grants.continueGrantAdditionAfterHistoricalFetch(app);
    } else {
      console.warn('⚠️ No pending grant data found, cannot continue with grant addition');
    }
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

    // Update option progress
    document.getElementById('bulkProcessedCount').textContent = optionIndex;
    document.getElementById('bulkTotalCount').textContent = totalOptions;
    document.getElementById('bulkCurrentOption').textContent = optionName;

    // Update overall progress
    const overallProgress = Math.round((optionIndex / totalOptions) * 100);
    document.getElementById('bulkHistoricalProgressBar').style.width = `${overallProgress}%`;
    document.getElementById('bulkHistoricalStatus').textContent = 
      `${progress.text} (${optionIndex + 1}/${totalOptions})`;
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

    // Show close button
    document.getElementById('closeBulkUpdate').style.display = 'inline-block';

    // Reload ALL data to reflect updated historical prices
    if (app) {
      setTimeout(async () => {
        console.log('🔄 Refreshing all UI data after historical price update...');
        await app.loadPortfolioData();
        await app.loadEvolutionData('all');
        await app.checkDataAvailability();
        console.log('✅ UI data refreshed');
      }, 1000);
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
  }
};

// Export for global use
window.HistoricalPriceManager = HistoricalPriceManager;