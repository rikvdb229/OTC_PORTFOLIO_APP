const NotificationManager = {
  /**
   * Show notification
   * @param {string} notificationId - ID of notification element
   * @param {string} message - Message to display
   * @param {string} type - Type of notification (info, warning, error, success)
   */
  showNotification(notificationId, message, type = "info") {
    console.log(`🔔 Showing ${type} notification: ${message}`);

    const notification = window.DOMHelpers.safeGetElementById(notificationId);
    if (!notification) {
      console.error(`❌ Notification element not found: ${notificationId}`);
      return false;
    }

    // Update message if message element exists
    const messageElement = notification.querySelector(".notification-text");
    if (messageElement && message) {
      window.DOMHelpers.safeSetContent(messageElement, message);
    }

    // Remove existing type classes
    notification.classList.remove("info", "warning", "error", "success");

    // Add new type class
    notification.classList.add(type);
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    return true;
  },

  /**
   * Hide notification
   * @param {string} notificationId - ID of notification element
   */
  hideNotification(notificationId) {
    console.log(`🔔 Hiding notification: ${notificationId}`);

    const notification = window.DOMHelpers.safeGetElementById(notificationId);
    if (notification) {
      notification.style.display = "none";
    }
  },

  /**
   * Show price update notification
   * @param {Object} app - Application instance
   */
  showPriceUpdateNotification(app) {
    // This method is now deprecated in favor of direct showNotification calls
    // with specific messages and types, but kept for backward compatibility
    const success = this.showNotification(
      "priceUpdateNotification",
      "Prices outdated",
      "warning"
    );

    if (success) {
      const notification = document.getElementById("priceUpdateNotification");
      if (notification && !notification.title) {
        notification.title =
          "Prices not current. KBC updates weekdays excluding bank holidays after 09:00. Click 'Update Prices' to get latest data.";
      }
    }
  },

  /**
   * Hide price update notification
   * @param {Object} app - Application instance
   */
  hidePriceUpdateNotification(app) {
    this.hideNotification("priceUpdateNotification");
  },
};
window.NotificationManager = NotificationManager;
