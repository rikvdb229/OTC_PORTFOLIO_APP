/**
 * ===== IPC COMMUNICATION EXTENSION - UNDO/REDO =====
 * Extensions to existing IPC communication for undo/redo functionality
 * Add these to your existing utils/ipc-communication.js file
 */

// Add this to your existing Database object in utils/ipc-communication.js
const DatabaseUndoRedoExtension = {
  /**
   * Export database for undo/redo snapshots
   * Returns data directly instead of saving to file
   */
  async exportDatabaseData() {
    try {
      console.log("📤 Exporting database for snapshot...");
      const result = await ipcRenderer.invoke("export-database-data");
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error("❌ Error exporting database data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Import database from data object (not file)
   * @param {Object} data - Database data object
   * @param {boolean} mergeMode - Whether to merge or replace
   */
  async importDatabaseFromData(data, mergeMode = false) {
    try {
      console.log("📥 Importing database from data object...");
      const result = await ipcRenderer.invoke("import-database-data", data, mergeMode);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return {
        success: true,
        importedEntries: result.importedEntries || 0
      };
    } catch (error) {
      console.error("❌ Error importing database data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Add this to your existing window.IPCCommunication.Database object
// Extend the existing Database object with undo/redo methods
Object.assign(window.IPCCommunication.Database, DatabaseUndoRedoExtension);

/**
 * ===== ENHANCED OPERATION WRAPPERS =====
 * Wrap existing operations to include undo/redo snapshots
 */

// Store original functions
const OriginalOperations = {
  addGrants: window.IPCCommunication.Grants.addGrants,
  confirmSale: window.IPCCommunication.Sales.confirmSale,
  updateTax: window.IPCCommunication.Portfolio.updateTax,
  confirmEditSale: window.IPCCommunication.Sales.confirmEditSale,
  confirmDelete: window.IPCCommunication.Portfolio.confirmDelete
};

// Enhanced Grants operations with undo support
window.IPCCommunication.Grants.addGrants = async function(app) {
  // Take snapshot before operation
  const snapshotTaken = await window.UndoRedoManager.takeSnapshot("Add grants");
  
  if (!snapshotTaken) {
    console.warn("⚠️ Could not take snapshot, proceeding anyway");
  }
  
  // Perform original operation
  return await OriginalOperations.addGrants.call(this, app);
};

// Enhanced Sales operations with undo support
window.IPCCommunication.Sales.confirmSale = async function(app) {
  // Get sale details for description
  const quantityElement = document.getElementById("quantityToSell");
  const quantity = quantityElement ? quantityElement.value : "unknown";
  
  const snapshotTaken = await window.UndoRedoManager.takeSnapshot(`Sell ${quantity} options`);
  
  if (!snapshotTaken) {
    console.warn("⚠️ Could not take snapshot, proceeding anyway");
  }
  
  return await OriginalOperations.confirmSale.call(this, app);
};

window.IPCCommunication.Sales.confirmEditSale = async function(app) {
  const snapshotTaken = await window.UndoRedoManager.takeSnapshot("Edit sale");
  
  if (!snapshotTaken) {
    console.warn("⚠️ Could not take snapshot, proceeding anyway");
  }
  
  return await OriginalOperations.confirmEditSale.call(this, app);
};

// Enhanced Portfolio operations with undo support
window.IPCCommunication.Portfolio.updateTax = async function(app) {
  const snapshotTaken = await window.UndoRedoManager.takeSnapshot("Edit tax amount");
  
  if (!snapshotTaken) {
    console.warn("⚠️ Could not take snapshot, proceeding anyway");
  }
  
  return await OriginalOperations.updateTax.call(this, app);
};

window.IPCCommunication.Portfolio.confirmDelete = async function(app) {
  const snapshotTaken = await window.UndoRedoManager.takeSnapshot("Delete portfolio entry");
  
  if (!snapshotTaken) {
    console.warn("⚠️ Could not take snapshot, proceeding anyway");
  }
  
  return await OriginalOperations.confirmDelete.call(this, app);
};

console.log("✅ IPC Communication extended with undo/redo support");