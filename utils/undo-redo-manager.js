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
      const snapshot = await window.IPCCommunication.Database.exportDatabase();
      if (snapshot.success) {
        this.currentSnapshot = snapshot.data;
        console.log("📸 Initial snapshot captured");
      }
    } catch (error) {
      console.error("❌ Failed to take initial snapshot:", error);
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
      
      const exportResult = await window.IPCCommunication.Database.exportDatabase();
      
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
      
    } catch (error) {
      console.error("❌ Error taking snapshot:", error);
      return false;
    }
  }

  /**
   * Perform undo operation
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
      
      // Store current state in redo stack
      const redoEntry = {
        snapshot: this.currentSnapshot,
        operation: `Redo: ${undoEntry.operation}`,
        timestamp: new Date().toISOString(),
        id: this.generateSnapshotId()
      };
      this.redoStack.push(redoEntry);
      
      // Restore previous state
      const importResult = await window.IPCCommunication.Database.importDatabaseFromData(
        undoEntry.snapshot, 
        false // replace mode
      );
      
      if (importResult.success) {
        this.currentSnapshot = undoEntry.snapshot;
        
        // Reload app data
        await this.reloadAppData();
        
        // Show success notification
        this.showNotification(`Undid: ${undoEntry.operation}`, "success");
        
        console.log(`✅ Undo completed: ${undoEntry.operation}`);
      } else {
        // Restore undo entry if import failed
        this.undoStack.push(undoEntry);
        this.redoStack.pop();
        
        console.error("❌ Undo failed:", importResult.error);
        this.showNotification("Undo failed", "error");
      }
      
    } catch (error) {
      console.error("❌ Error during undo:", error);
      this.showNotification("Undo error occurred", "error");
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
      
      // Store current state in undo stack
      const undoEntry = {
        snapshot: this.currentSnapshot,
        operation: redoEntry.operation.replace("Redo: ", ""),
        timestamp: new Date().toISOString(),
        id: this.generateSnapshotId()
      };
      this.undoStack.push(undoEntry);
      
      // Restore redo state
      const importResult = await window.IPCCommunication.Database.importDatabaseFromData(
        redoEntry.snapshot, 
        false // replace mode
      );
      
      if (importResult.success) {
        this.currentSnapshot = redoEntry.snapshot;
        
        // Reload app data
        await this.reloadAppData();
        
        // Show success notification
        this.showNotification(`Redid: ${redoEntry.operation}`, "success");
        
        console.log(`✅ Redo completed: ${redoEntry.operation}`);
      } else {
        // Restore redo entry if import failed
        this.redoStack.push(redoEntry);
        this.undoStack.pop();
        
        console.error("❌ Redo failed:", importResult.error);
        this.showNotification("Redo failed", "error");
      }
      
    } catch (error) {
      console.error("❌ Error during redo:", error);
      this.showNotification("Redo error occurred", "error");
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
      if (this.app && this.app.loadPortfolioData) {
        await this.app.loadPortfolioData();
      }
      
      // Reload other data if methods exist
      if (this.app && this.app.loadEvolutionData) {
        await this.app.loadEvolutionData();
      }
      
      console.log("🔄 App data reloaded after undo/redo");
    } catch (error) {
      console.error("❌ Error reloading app data:", error);
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