// Enhanced Version Checker with Toast Notification
// Fixes: 1) Toast instead of modal 2) Version-aware dismiss logic

const VersionChecker = {
  // GitHub repository info
  REPO_OWNER: 'rikvdb229',
  REPO_NAME: 'OTC_PORTFOLIO_APP',
  
  // Current app version (will be loaded from APP_CONFIG or IPC)
  currentVersion: '0.3.4', // Fallback version
  
  // Initialize version checker
  async init() {
    // Get current version from the app config
    await this.getCurrentVersion();
    
    // Check for updates after a delay (don't check immediately on startup)
    setTimeout(() => {
      this.checkForUpdate();
    }, 10000); // Wait 10 seconds after app startup
  },

  // Get current app version
  async getCurrentVersion() {
    try {
      // Try to get version via IPC if available
      if (window.ipcRenderer) {
        const versionInfo = await window.ipcRenderer.invoke('get-app-version');
        if (versionInfo?.version) {
          this.currentVersion = versionInfo.version;
          console.log(`📋 Current app version from IPC: ${this.currentVersion}`);
          return this.currentVersion;
        }
      }
      
      console.log(`📋 Using fallback app version: ${this.currentVersion}`);
      return this.currentVersion;
    } catch (error) {
      console.error('❌ Error getting current version:', error);
      console.log(`📋 Using fallback app version: ${this.currentVersion}`);
      return this.currentVersion;
    }
  },

  // Check for updates from GitHub
  async checkForUpdate() {
    try {
      console.log('🔍 Checking for updates from GitHub...');
      
      // Get dismiss data from localStorage
      const dismissData = this.getDismissData();
      
      // Check if we should skip based on dismiss logic
      if (dismissData) {
        const { dismissedVersion, dismissedAt, appVersionAtDismiss } = dismissData;
        
        // If user updated the app, reset dismiss data
        if (appVersionAtDismiss && appVersionAtDismiss !== this.currentVersion) {
          console.log('🔄 App was updated, clearing dismiss data');
          this.clearDismissData();
        } else {
          // Check if still within dismiss period (14 days)
          const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
          if (daysSinceDismiss < 14) {
            console.log(`⏭️ Version check dismissed ${Math.floor(daysSinceDismiss)} days ago, skipping`);
            return;
          }
        }
      }

      // Fetch latest release from GitHub API
      const response = await fetch(`https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/releases/latest`);
      
      if (!response.ok) {
        console.warn('⚠️ Could not check for updates:', response.statusText);
        return;
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
      
      console.log(`📦 Latest GitHub version: ${latestVersion}`);
      console.log(`📋 Current app version: ${this.currentVersion}`);

      // Don't show notification for the same dismissed version (unless app was updated)
      if (dismissData?.dismissedVersion === latestVersion && 
          dismissData?.appVersionAtDismiss === this.currentVersion) {
        console.log('⏭️ This version was already dismissed for current app version');
        return;
      }

      // Compare versions
      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        console.log('🆕 New version available!');
        this.showUpdateToast(latestVersion, release);
      } else {
        console.log('✅ App is up to date');
      }

    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      // Silently fail - don't bother the user with network errors
    }
  },

  // Simple version comparison (semantic versioning)
  isNewerVersion(latest, current) {
    try {
      const latestParts = latest.split('.').map(Number);
      const currentParts = current.split('.').map(Number);
      
      // Pad arrays to same length
      while (latestParts.length < currentParts.length) latestParts.push(0);
      while (currentParts.length < latestParts.length) currentParts.push(0);
      
      for (let i = 0; i < latestParts.length; i++) {
        if (latestParts[i] > currentParts[i]) return true;
        if (latestParts[i] < currentParts[i]) return false;
      }
      
      return false; // Versions are equal
    } catch (error) {
      console.error('❌ Error comparing versions:', error);
      return false;
    }
  },

  // Show update toast notification
  showUpdateToast(version, releaseInfo) {
    // Remove any existing toast
    const existingToast = document.getElementById('versionUpdateToast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'versionUpdateToast';
    toast.className = 'version-toast';
    toast.innerHTML = `
      <div class="version-toast-content">
        <div class="version-toast-header">
          <span class="version-toast-icon">🆕</span>
          <span class="version-toast-title">Update Available!</span>
          <button class="version-toast-close" onclick="VersionChecker.closeToast()" title="Close">&times;</button>
        </div>
        <div class="version-toast-body">
          <p>Version <strong>${version}</strong> is now available</p>
          <p class="version-toast-current">Current: v${this.currentVersion}</p>
        </div>
        <div class="version-toast-actions">
          <button class="btn-toast-secondary" onclick="VersionChecker.dismissToast()">
            Dismiss (14 days)
          </button>
          <button class="btn-toast-primary" onclick="VersionChecker.openGitHub()">
            View Release
          </button>
        </div>
      </div>
    `;
    
    // Add CSS if not already present
    this.injectStyles();
    
    // Add to body
    document.body.appendChild(toast);
    
    // Store release info for later use
    this.currentReleaseInfo = releaseInfo;
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Toast persists until user interaction - no auto-hide
  },

  // Inject CSS styles for toast
  injectStyles() {
    if (document.getElementById('version-toast-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'version-toast-styles';
    styles.textContent = `
      .version-toast {
        position: fixed;
        bottom: 20px;
        right: -400px;
        width: 360px;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transition: right 0.3s ease-in-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .version-toast.show {
        right: 20px;
      }
      
      .version-toast-content {
        padding: 0;
      }
      
      .version-toast-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
        border-radius: 8px 8px 0 0;
      }
      
      .version-toast-icon {
        font-size: 20px;
        margin-right: 10px;
      }
      
      .version-toast-title {
        flex: 1;
        font-weight: 600;
        color: #212529;
        font-size: 14px;
      }
      
      .version-toast-close {
        background: none;
        border: none;
        color: #6c757d;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
        line-height: 1;
      }
      
      .version-toast-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #000000;
      }
      
      .version-toast-body {
        padding: 16px;
        color: #212529;
      }
      
      .version-toast-body p {
        margin: 0 0 8px 0;
        font-size: 13px;
        line-height: 1.4;
        color: #212529;
      }
      
      .version-toast-body p:last-child {
        margin-bottom: 0;
      }
      
      .version-toast-current {
        color: #6c757d;
        font-size: 12px !important;
      }
      
      .version-toast-actions {
        display: flex;
        gap: 8px;
        padding: 0 16px 16px;
      }
      
      .btn-toast-primary, .btn-toast-secondary {
        flex: 1;
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      
      .btn-toast-primary {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      
      .btn-toast-primary:hover {
        background: #0056b3;
        border-color: #0056b3;
      }
      
      .btn-toast-secondary {
        background: white;
        color: #6c757d;
        border-color: #dee2e6;
      }
      
      .btn-toast-secondary:hover {
        background: #f8f9fa;
        color: #495057;
        border-color: #adb5bd;
      }
      
      /* Keep light theme even in dark mode for better visibility */
      
      /* Animation */
      @keyframes slideIn {
        from {
          right: -400px;
          opacity: 0;
        }
        to {
          right: 20px;
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(styles);
  },

  // Open GitHub releases page
  openGitHub() {
    const url = `https://github.com/${this.REPO_OWNER}/${this.REPO_NAME}/releases/latest`;
    
    // Try to open in external browser
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('open-external', url);
    } else if (window.open) {
      window.open(url, '_blank');
    }
    
    this.closeToast();
  },

  // Close toast (will show again next time)
  closeToast() {
    const toast = document.getElementById('versionUpdateToast');
    if (toast) {
      // Animate out
      toast.classList.remove('show');
      
      // Remove after animation
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
      
      console.log('📝 Version toast closed (will show again next time)');
    }
  },

  // Dismiss toast (won't show again for 14 days)
  dismissToast() {
    // Save dismiss data with current app version
    const dismissData = {
      dismissedVersion: this.currentReleaseInfo?.tag_name?.replace(/^v/, '') || null,
      dismissedAt: Date.now(),
      appVersionAtDismiss: this.currentVersion
    };
    
    localStorage.setItem('versionCheckDismiss', JSON.stringify(dismissData));
    
    console.log('📝 Version check dismissed for 14 days (or until app update)');
    
    this.closeToast();
  },

  // Get dismiss data from localStorage
  getDismissData() {
    try {
      const data = localStorage.getItem('versionCheckDismiss');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading dismiss data:', error);
    }
    return null;
  },

  // Clear dismiss data
  clearDismissData() {
    localStorage.removeItem('versionCheckDismiss');
    console.log('🧹 Cleared version check dismiss data');
  }
};

// Export to global scope
window.VersionChecker = VersionChecker;

console.log('✅ Version Checker with Toast Notification loaded successfully');