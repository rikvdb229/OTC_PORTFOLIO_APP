// Simple Version Checker - Check GitHub releases for updates

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
      
      // Check if user has dismissed this check recently
      const lastDismissed = localStorage.getItem('versionCheckDismissed');
      const dismissedVersion = localStorage.getItem('dismissedVersion');
      
      if (lastDismissed) {
        const daysSinceDismiss = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 14) { // Don't check for 14 days after dismiss
          console.log('⏭️ Version check recently dismissed, skipping');
          return;
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

      // Don't show notification for the same dismissed version
      if (dismissedVersion === latestVersion) {
        console.log('⏭️ This version was already dismissed by user');
        return;
      }

      // Compare versions
      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        console.log('🆕 New version available!');
        this.showUpdateNotification(latestVersion, release);
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

  // Show update notification
  showUpdateNotification(version, releaseInfo) {
    // Create modal element if it doesn't exist
    let modal = document.getElementById('versionUpdateModal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'versionUpdateModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>🆕 New Version Available!</h3>
            <button class="close-btn" onclick="VersionChecker.closeNotification()" title="Close (will show again next time)">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Version ${version}</strong> is now available on GitHub.</p>
            <p>You're currently using version <strong>${this.currentVersion}</strong>.</p>
            <p>Download the latest version to get the newest features and bug fixes.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="VersionChecker.dismissNotification()">Maybe Later</button>
            <button class="btn btn-primary" onclick="VersionChecker.openGitHub()">📥 View Release</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    }
    
    // Store release info for later use
    this.currentReleaseInfo = releaseInfo;
    
    // Show modal
    modal.classList.add('active');
    
    // Auto-hide after 30 seconds if user doesn't interact
    setTimeout(() => {
      if (modal && modal.classList.contains('active')) {
        this.closeNotification(); // Just close, don't dismiss
      }
    }, 30000);
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
    
    this.closeNotification(); // Just close, don't dismiss
  },

  // Close notification (will show again next time)
  closeNotification() {
    const modal = document.getElementById('versionUpdateModal');
    if (modal) {
      modal.classList.remove('active');
      console.log('📝 Version check modal closed (will show again next time)');
    }
  },

  // Dismiss notification (won't show again for 7 days)
  dismissNotification() {
    const modal = document.getElementById('versionUpdateModal');
    if (modal) {
      modal.classList.remove('active');
    }
    
    // Remember that user dismissed this check for 7 days
    localStorage.setItem('versionCheckDismissed', Date.now().toString());
    
    // Remember the specific version that was dismissed
    if (this.currentReleaseInfo) {
      const dismissedVersion = this.currentReleaseInfo.tag_name.replace(/^v/, '');
      localStorage.setItem('dismissedVersion', dismissedVersion);
    }
    
    console.log('📝 Version check dismissed by user for 14 days');
  }
};

// Export to global scope
window.VersionChecker = VersionChecker;

console.log('✅ Version Checker loaded successfully');