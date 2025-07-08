/**
 * ===== UNDO/REDO MANAGER - Portfolio Tracker =====
 * Session-based undo/redo functionality using existing import/export system
 * 
 * FEATURES:
 * - Memory-based state snapshots
 * - Integration with existing database operations
 * - Descriptive operation labels
 * - Configurable stack limits
 * - Memory management
 */

class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 20; // Configurable limit
    this.currentSnapshot = null;
    this.isOperationInProgress = false;
    
    console.log("🔄 UndoRedoManager initialized");
  }

  /**
   * Initialize the undo/redo system
   * @param {Object} app - Application instance
   */
  async initialize(app) {
    this.app = app;
    
    // Take initial snapshot
    await this.takeInitialSnapshot();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Update button states
    this.updateButtonStates();
    
    console.log("✅ UndoRedoManager ready with initial snapshot");
  }

  /**
   * Take initial database snapshot
   */
  async takeInitialSnapshot() {
    try {
      const snapshot = await window.IPCCommunication.Database.exportDatabaseData();
      if (snapshot.success) {
        this.currentSnapshot = snapshot.data;
        console.log("📸 Initial snapshot captured");
      }
    } catch (_error) {      console.error("❌ Failed to take initial snapshot:", error);
    }
  }

  /**
   * Take a snapshot before an operation
   * @param {string} operationName - Description of the operation
   * @returns {Promise<boolean>} Success status
   */
  async takeSnapshot(operationName) {
    if (this.isOperationInProgress) {
      console.log("⏳ Operation in progress, skipping snapshot");
      return false;
    }

    try {
      console.log(`📸 Taking snapshot for: ${operationName}`);
      
      const exportResult = await window.IPCCommunication.Database.exportDatabaseData();
      
      if (!exportResult.success) {
        console.error("❌ Failed to export database for snapshot");
        return false;
      }

      // Store current state in undo stack
      const undoEntry = {
        snapshot: this.currentSnapshot,
        operation: operationName,
        timestamp: new Date().toISOString(),
        id: this.generateSnapshotId()
      };

      this.undoStack.push(undoEntry);
      
      // Update current snapshot
      this.currentSnapshot = exportResult.data;
      
      // Clear redo stack (new operation invalidates redo)
      this.redoStack = [];
      
      // Manage stack size
      this.enforceStackLimit();
      
      // Update UI
      this.updateButtonStates();
      
      console.log(`✅ Snapshot taken: ${operationName} (${this.undoStack.length} in stack)`);
      return true;
      
    } catch (_error) {      console.error("❌ Error taking snapshot:", error);
      return false;
    }
  }

  /**
   * Perform undo operation
   */
/**
 * FIXED UNDO FUNCTION - Replace your existing undo() method with this
 */
async undo() {
  if (this.undoStack.length === 0) {
    console.log("⚠️ Nothing to undo");
    this.showNotification("Nothing to undo", "warning");
    return;
  }

  if (this.isOperationInProgress) {
    console.log("⏳ Operation in progress, cannot undo");
    return;
  }

  try {
    this.isOperationInProgress = true;
    
    const undoEntry = this.undoStack.pop();
    console.log(`⬅️ Undoing: ${undoEntry.operation}`);
    console.log("🔍 Undo entry snapshot size:", JSON.stringify(undoEntry.snapshot).length);
    
    // CRITICAL FIX: Store current state BEFORE doing the undo
    console.log("📸 Taking snapshot of CURRENT state for redo...");
    const currentStateExport = await window.IPCCommunication.Database.exportDatabaseData();
    
    if (!currentStateExport.success) {
      throw new Error("Failed to capture current state for redo");
    }
    
    // Store current state in redo stack
    const redoEntry = {
      snapshot: currentStateExport.data,
      operation: `Redo: ${undoEntry.operation}`,
      timestamp: new Date().toISOString(),
      id: this.generateSnapshotId()
    };
    this.redoStack.push(redoEntry);
    
    console.log("📤 About to import undo snapshot...");
    console.log("📊 Undo snapshot metadata:", undoEntry.snapshot?.metadata);
    console.log("📊 Portfolio entries count:", undoEntry.snapshot?.portfolioEntries?.length);
    
    // Restore previous state
    const importResult = await window.IPCCommunication.Database.importDatabaseFromData(
      undoEntry.snapshot, 
      false // replace mode
    );
    
    console.log("📥 Import result:", importResult);
    console.log("📊 Import result details:", {
      success: importResult.success,
      importedEntries: importResult.importedEntries,
      error: importResult.error
    });
    
    if (importResult.success) {
      this.currentSnapshot = undoEntry.snapshot;
      
      console.log("🔄 Starting app data reload...");
      // Reload app data
      await this.reloadAppData();
      
      // Show success notification
      this.showNotification(`Undid: ${undoEntry.operation}`, "success");
      
      console.log(`✅ Undo completed: ${undoEntry.operation}`);
    } else {
      // Restore undo entry if import failed
      this.undoStack.push(undoEntry);
      this.redoStack.pop();
      
      console.error("❌ Undo failed - import error:", importResult.error);
      this.showNotification("Undo failed: " + (importResult.error || "Unknown error"), "error");
    }
    
  } catch (_error) {    console.error("❌ Error during undo:", error);
    this.showNotification("Undo error occurred: " + error.message, "error");
  } finally {
    this.isOperationInProgress = false;
    this.updateButtonStates();
  }
}


  /**
   * Perform redo operation
   */
async redo() {
  if (this.redoStack.length === 0) {
    console.log("⚠️ Nothing to redo");
    this.showNotification("Nothing to redo", "warning");
    return;
  }

  if (this.isOperationInProgress) {
    console.log("⏳ Operation in progress, cannot redo");
    return;
  }

  try {
    this.isOperationInProgress = true;
    
    const redoEntry = this.redoStack.pop();
    console.log(`➡️ Redoing: ${redoEntry.operation}`);
    console.log("🔍 Redo entry snapshot size:", JSON.stringify(redoEntry.snapshot).length);
    
    // CRITICAL FIX: Store current state BEFORE doing the redo
    console.log("📸 Taking snapshot of CURRENT state for undo...");
    const currentStateExport = await window.IPCCommunication.Database.exportDatabaseData();
    
    if (!currentStateExport.success) {
      throw new Error("Failed to capture current state for undo");
    }
    
    // Store current state in undo stack
    const undoEntry = {
      snapshot: currentStateExport.data,
      operation: redoEntry.operation.replace("Redo: ", ""),
      timestamp: new Date().toISOString(),
      id: this.generateSnapshotId()
    };
    this.undoStack.push(undoEntry);
    
    console.log("📤 About to import redo snapshot...");
    console.log("📊 Redo snapshot metadata:", redoEntry.snapshot?.metadata);
    console.log("📊 Portfolio entries count:", redoEntry.snapshot?.portfolioEntries?.length);
    
    // Restore redo state
    const importResult = await window.IPCCommunication.Database.importDatabaseFromData(
      redoEntry.snapshot, 
      false // replace mode
    );
    
    console.log("📥 Import result:", importResult);
    console.log("📊 Import result details:", {
      success: importResult.success,
      importedEntries: importResult.importedEntries,
      error: importResult.error
    });
    
    if (importResult.success) {
      this.currentSnapshot = redoEntry.snapshot;
      
      console.log("🔄 Starting app data reload...");
      // Reload app data
      await this.reloadAppData();
      
      // Show success notification
      this.showNotification(`Redid: ${redoEntry.operation}`, "success");
      
      console.log(`✅ Redo completed: ${redoEntry.operation}`);
    } else {
      // Restore redo entry if import failed
      this.redoStack.push(redoEntry);
      this.undoStack.pop();
      
      console.error("❌ Redo failed - import error:", importResult.error);
      this.showNotification("Redo failed: " + (importResult.error || "Unknown error"), "error");
    }
    
  } catch (_error) {    console.error("❌ Error during redo:", error);
    this.showNotification("Redo error occurred: " + error.message, "error");
  } finally {
    this.isOperationInProgress = false;
    this.updateButtonStates();
  }
}

  /**
   * Reload application data after undo/redo
   */
  async reloadAppData() {
    try {
      // Always reload portfolio data first
      if (this.app && this.app.loadPortfolioData) {
        await this.app.loadPortfolioData();
      }
      
      // Get the currently active tab
      const currentTab = this.getCurrentActiveTab();
      console.log(`🔄 Reloading data for active tab: ${currentTab}`);
      
      // Reload data specific to the current tab
      await this.reloadCurrentTabData(currentTab);
      
      console.log("🔄 App data reloaded after undo/redo");
    } catch (_error) {      console.error("❌ Error reloading app data:", error);
    }
  }

  /**
   * Get the currently active tab
   */
  getCurrentActiveTab() {
    // Try to get from app.activeTab first
    if (this.app && this.app.activeTab) {
      return this.app.activeTab;
    }
    
    // Fallback to checking DOM
    const activeTab = document.querySelector(".nav-tab.active");
    return activeTab ? activeTab.getAttribute("data-tab") : "portfolio";
  }

  /**
   * Reload data for the currently active tab
   */
  async reloadCurrentTabData(tabName) {
    try {
      console.log(`🔄 Attempting to reload ${tabName} tab data...`);
      
      switch (tabName) {
        case "portfolio":
          // Portfolio data already loaded above
          console.log("📊 Portfolio data already loaded");
          break;
          
        case "evolution":
          if (this.app && this.app.loadEvolutionData) {
            console.log("📈 Calling loadEvolutionData...");
            await this.app.loadEvolutionData();
            console.log("✅ Evolution data reloaded");
          } else {
            console.warn("⚠️ loadEvolutionData method not found");
          }
          break;
          
        case "chart":
          if (this.app && this.app.loadChartData) {
            console.log("📊 Calling loadChartData...");
            await this.app.loadChartData();
            console.log("✅ Chart data reloaded");
          } else {
            console.warn("⚠️ loadChartData method not found");
          }
          break;
          
        case "sales-history":
          if (this.app && this.app.loadSalesHistory) {
            console.log("💰 Calling loadSalesHistory...");
            await this.app.loadSalesHistory();
            console.log("✅ Sales history data reloaded");
          } else {
            console.warn("⚠️ loadSalesHistory method not found");
            console.log("🔍 Available app methods:", Object.getOwnPropertyNames(this.app).filter(name => name.includes('load')));
          }
          break;
          
        case "grant-history":
          if (this.app && this.app.loadGrantHistory) {
            console.log("📋 Calling loadGrantHistory...");
            await this.app.loadGrantHistory();
            console.log("✅ Grant history data reloaded");
          } else {
            console.warn("⚠️ loadGrantHistory method not found");
            console.log("🔍 Available app methods:", Object.getOwnPropertyNames(this.app).filter(name => name.includes('load')));
          }
          break;
          
        default:
          console.log(`ℹ️ No specific reload needed for tab: ${tabName}`);
      }
    } catch (_error) {      console.error(`❌ Error reloading ${tabName} tab data:`, error);
    }
  }

  /**
   * Update undo/redo button states
   */
  updateButtonStates() {
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    
    if (undoBtn) {
      const canUndo = this.undoStack.length > 0 && !this.isOperationInProgress;
      undoBtn.disabled = !canUndo;
      undoBtn.title = canUndo 
        ? `Undo: ${this.undoStack[this.undoStack.length - 1]?.operation}` 
        : "Nothing to undo";
    }
    
    if (redoBtn) {
      const canRedo = this.redoStack.length > 0 && !this.isOperationInProgress;
      redoBtn.disabled = !canRedo;
      redoBtn.title = canRedo 
        ? `Redo: ${this.redoStack[this.redoStack.length - 1]?.operation}` 
        : "Nothing to redo";
    }
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "Z")) {
        e.preventDefault();
        this.redo();
      }
    });
    
    console.log("⌨️ Keyboard shortcuts set up (Ctrl+Z, Ctrl+Y)");
  }

  /**
   * Enforce maximum stack size
   */
  enforceStackLimit() {
    while (this.undoStack.length > this.maxStackSize) {
      const removed = this.undoStack.shift();
      console.log(`🗑️ Removed old snapshot: ${removed.operation}`);
    }
    
    while (this.redoStack.length > this.maxStackSize) {
      this.redoStack.shift();
    }
  }

  /**
   * Generate unique snapshot ID
   */
  generateSnapshotId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = "info") {
    if (window.UIStateManager && window.UIStateManager.showNotification) {
      window.UIStateManager.showNotification(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Clear all undo/redo history
   */
  clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateButtonStates();
    console.log("🗑️ Undo/redo history cleared");
  }

  /**
   * Fix corrupted redo stack (temporary fix for existing sessions)
   */
  fixRedoStack() {
    console.log("🔧 Clearing corrupted redo stack...");
    this.redoStack = [];
    this.updateButtonStates();
    console.log("✅ Redo stack cleared - new operations will work correctly");
  }

  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      lastOperation: this.undoStack.length > 0 
        ? this.undoStack[this.undoStack.length - 1].operation 
        : null,
      operationInProgress: this.isOperationInProgress
    };
  }
}

// Export to global scope
window.UndoRedoManager = new UndoRedoManager();

console.log("✅ UndoRedoManager class loaded");