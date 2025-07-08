#!/usr/bin/env node

/**
 * Chrome Setup for Portfolio Tracker v0.1.0
 * Ensures Chromium is available for web scraping and bundling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Setting up Chrome for Portfolio Tracker v0.1.0...');

try {
  console.log('📥 Downloading Chromium for bundling...');
  
  // First, ensure Puppeteer downloads Chromium to the correct location
  try {
    // Set environment to force Puppeteer to download to node_modules
    process.env.PUPPETEER_CACHE_DIR = path.join(process.cwd(), 'node_modules', 'puppeteer', '.cache');
    
    execSync('npx puppeteer browsers install chrome', { 
      stdio: 'inherit',
      timeout: 180000, // 3 minutes
      env: { ...process.env, PUPPETEER_CACHE_DIR: process.env.PUPPETEER_CACHE_DIR }
    });
    
    // Check if Chromium was downloaded to the expected location
    const chromiumPaths = [
      path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium'),
      path.join(process.cwd(), 'node_modules', 'puppeteer', '.cache'),
      path.join(require('os').homedir(), '.cache', 'puppeteer'),
      path.join(require('os').homedir(), 'AppData', 'Local', 'ms-playwright') // Windows
    ];
    
    let chromiumFound = false;
    for (const chromPath of chromiumPaths) {
      if (fs.existsSync(chromPath)) {
        console.log(`✅ Chromium found at: ${chromPath}`);
        chromiumFound = true;
        break;
      }
    }
    
    if (chromiumFound) {
      console.log('✅ Chromium setup completed successfully - will be bundled with app');
    } else {
      console.log('⚠️ Chromium location uncertain - checking alternative download method...');
      
      // Try alternative Puppeteer installation
      execSync('npm install puppeteer --force', { 
        stdio: 'inherit',
        timeout: 180000
      });
    }
    
  } catch (error) {
    console.log('⚠️ Chromium download failed, will use system Chrome as fallback');
    console.log('💡 App may require Chrome installation on target machines');
    console.log('Error details:', error.message);
  }
  
} catch (error) {
  console.log('⚠️ Chrome setup completed with warnings:', error.message);
}

console.log('🔧 Chrome setup finished, continuing with build...\n');
