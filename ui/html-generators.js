// ui/html-generators.js
// All HTML generation functions extracted from renderer.js

class HTMLGenerators {
  constructor(portfolioApp) {
    this.app = portfolioApp; // Reference to main app for helper methods
  }

  // ===== PORTFOLIO TABLE GENERATION =====

  async renderPortfolioTable(overview, targetPercentage = 65) {
    const tableBody = document.getElementById("portfolioTableBody");

    if (!tableBody) {
      console.error("Portfolio table body not found");
      return;
    }

    if (overview.length === 0) {
      await this.renderPortfolioEmptyState(tableBody); // Add await here
      return;
    }

    // Generate table rows
    tableBody.innerHTML = overview
      .map((entry) => this.generatePortfolioRow(entry, targetPercentage))
      .join("");
  }

  generatePortfolioRow(entry, targetPercentage) {
    return `
    <tr class="${this.app.helpers.getRowStatusClass(entry.selling_status)}">
      <td>${new Date(entry.grant_date).toLocaleDateString()}</td>
      <td class="fund-name" title="${entry.fund_name || "Unknown Fund"}">
        ${this.app.helpers.formatFundName(entry.fund_name)}
      </td>
      <td>${entry.quantity_remaining.toLocaleString()}</td>
      <td class="currency">${this.app.helpers.formatCurrency(
        entry.amount_granted
      )}</td>
      <td class="currency">
        ${
          entry.tax_amount
            ? this.app.helpers.formatCurrency(entry.tax_amount)
            : `${this.app.helpers.formatCurrency(
                entry.tax_auto_calculated || 0
              )} (Auto)`
        }
      </td>
      <td class="currency">${
        entry.current_value
          ? this.app.helpers.formatCurrency(entry.current_value)
          : "N/A"
      }</td>
      <td class="currency">${this.app.helpers.formatCurrency(
        entry.current_total_value || 0
      )}</td>
      <td class="currency ${
        entry.profit_loss_vs_target >= 0 ? "positive" : "negative"
      }" 
          title="P&L against ${targetPercentage}% target">
        ${this.app.helpers.formatCurrency(entry.profit_loss_vs_target || 0)}
      </td>
      <td class="${this.app.helpers.getReturnPercentageClass(
        entry.current_return_percentage,
        targetPercentage
      )}" 
          title="Return vs ${targetPercentage}% target">
        ${
          entry.current_return_percentage
            ? entry.current_return_percentage.toFixed(1) + "%"
            : "N/A"
        }
      </td>
      <td class="${this.getNormalizedPriceClassForRow(entry)}" 
          title="Position of current price within historical range">
        ${this.calculateNormalizedPriceForRow(entry)}
      </td>
      <td class="status-column">
        ${this.app.helpers.getSellingStatusBadge(
          entry.selling_status,
          entry.can_sell_after,
          entry.expires_on
        )}
      </td>
      <td>
        ${this.generatePortfolioActions(entry)}
      </td>
    </tr>
  `;
  }

  generatePortfolioActions(entry) {
    const sellDisabled = (entry.selling_status !== "SELLABLE" && entry.selling_status !== "EXPIRING_SOON") ? "disabled" : "";
    const sellTooltip = this.app.helpers.getSellButtonTooltip(
      entry.selling_status,
      entry.can_sell_after,
      entry.expires_on
    );

    return `
    <div class="table-actions">
      <button class="btn action-btn sell-btn" 
              onclick="portfolioApp.showSellModal(${entry.id})" 
              ${sellDisabled}
              title="${sellTooltip}">
        💰 Sell
      </button>
<button class="btn action-btn info-btn" 
        onclick="portfolioApp.showOptionInfo.call(portfolioApp, ${entry.id})"
        title="View detailed information about this option">
  📊 Info
</button>
      <button class="btn action-btn edit-btn" 
              onclick="portfolioApp.editTax(${entry.id}, ${
                entry.tax_auto_calculated
              }, ${entry.tax_amount || 0})"
              title="Edit the tax amount for this grant">
        ✏️ Edit
      </button>
      <button class="btn action-btn delete-btn" 
              onclick="portfolioApp.showDeleteConfirmModal(${entry.id}, '${
                entry.grant_date
              }', ${entry.quantity_remaining}, ${entry.exercise_price}, ${
                entry.current_total_value || 0
              })"
              title="Permanently delete this portfolio entry">
        🗑️ Delete
      </button>
    </div>
  `;
  }

  async renderPortfolioEmptyState(tableBody) {
    const hasData = await this.checkIfPriceDataExists();

    if (!hasData) {
      tableBody.innerHTML = `
        <tr class="no-data">
          <td colspan="12">
            <div class="no-grants-message">
              <div class="no-grants-content">
                <h3>📊 Welcome to Portfolio tracker</h3>
                <p><strong>To get started, you need to update prices first!</strong></p><br>
                <p>Your portfolio is empty because no price data has been downloaded yet.</p>
                <br>
                  <strong>Step 1:</strong> Click "📊 Update Prices" in the top right to download the latest option data from KBC<br>
                  <strong>Step 2:</strong> Once prices are updated, you can add your option grants<br>
                  <strong>Step 3:</strong> Track your portfolio performance and evolution
              </div>
            </div>
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = `
        <tr class="no-data">
          <td colspan="12">
            <div class="no-grants-message">
              <div class="no-grants-content">
                <h3>🎯 Ready to Add Your First Grant!</h3>
                <p>Price data is available. Now you can add your option grants.</p>
                <p>Use the "➕ Add Grants" button above to start building your portfolio.</p>
              </div>
            </div>
          </td>
        </tr>
      `;
    }
  }

  // ===== EVOLUTION TABLE GENERATION =====

  renderEvolutionTable(evolutionData) {
    const tableBody = document.getElementById("evolutionTableBody");

    if (!tableBody) {
      console.error("Evolution table body not found");
      return;
    }

    if (evolutionData.length === 0) {
      tableBody.innerHTML = `
  <tr class="no-data">
    <td colspan="6">
      <div class="no-data-message">
        <p>No evolution data available.</p>
        <p>Data will appear after price updates and option additions.</p>
      </div>
    </td>
  </tr>
`;
      return;
    }

    tableBody.innerHTML = evolutionData
      .map((entry, index) => {
        // Handle line breaks in notes
        let notesHtml = entry.notes || "—";
        if (notesHtml !== "—") {
          notesHtml = notesHtml
            .replace(/\\n/g, "<br>")
            .replace(/\n/g, "<br>")
            .replace(/\r\n/g, "<br>")
            .replace(/\r/g, "<br>");
        }

        // FIXED: Use the correct field names from database calculation
        const percentageChange = entry.change_percent || 0; // Changed from percentage_change
        const daysGap = entry.days_between || 0; // Changed from days_gap

        // Generate unique ID for this entry
        const entryId = `${entry.snapshot_date.replace(/[^0-9]/g, "")}-${index}`;

        return `
    <tr>
      <td>${new Date(entry.snapshot_date).toLocaleDateString()}</td>
      <td class="currency">${this.app.helpers.formatCurrency(
        entry.total_portfolio_value
      )}</td>
      <td class="currency ${
        (entry.change_from_previous || 0) >= 0 ? "positive" : "negative"
      }">
        ${
          entry.change_from_previous !== null &&
          entry.change_from_previous !== 0
            ? `${
                entry.change_from_previous > 0 ? "+" : ""
              }${this.app.helpers.formatCurrency(entry.change_from_previous)}`
            : "—"
        }
      </td>
      <td class="${percentageChange >= 0 ? "positive" : "negative"}">
        ${
          percentageChange !== 0
            ? `${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`
            : "—"
        }
      </td>
      <td class="text-center">
        ${daysGap > 0 ? `${daysGap} days` : "—"}
      </td>
      ${this.generateNotesCell(notesHtml, entryId)}
    </tr>
  `;
      })
      .join("");
  }

  // Add this new method to HTMLGenerators class
  // In your HTMLGenerators generateNotesCell method, update the onclick calls:
  generateNotesCell(notesHtml, entryId) {
    // If notes are short (under 100 characters), show normally
    if (!notesHtml || notesHtml === "—" || notesHtml.length <= 100) {
      return `<td class="notes-cell">${notesHtml}</td>`;
    }

    // For long notes, create collapsible version
    const shortVersion = notesHtml.substring(0, 80) + "...";
    const uniqueId = `notes-${entryId}`;

    return `
    <td class="notes-cell collapsible-notes">
  <div class="notes-short" id="short-${uniqueId}">
    ${shortVersion}
    <button class="expand-btn" onclick="window.portfolioApp.toggleNotes('${uniqueId}', true)" title="Expand notes">
      ⋯
    </button>
  </div>
  <div class="notes-full" id="full-${uniqueId}" style="display: none;">
    ${notesHtml}
    <button class="collapse-btn" onclick="window.portfolioApp.toggleNotes('${uniqueId}', false)" title="Collapse notes">
      ×
    </button>
  </div>
</td>
  `;
  }

  // ===== SALES HISTORY TABLE GENERATION =====

  renderSalesTable(salesHistory) {
    const tableBody = document.getElementById("salesTableBody");

    if (!tableBody) {
      console.error("Sales table body not found");
      return;
    }

    // Update summary cards - CHANGED: Calculate total sold value instead of realized gain
    const totalSoldValue = salesHistory.reduce(
      (sum, sale) => sum + (sale.total_sale_value || 0),
      0
    );
    const totalOptionsSold = salesHistory.reduce(
      (sum, sale) => sum + sale.quantity_sold,
      0
    );
    const averageSalePrice =
      salesHistory.length > 0
        ? salesHistory.reduce((sum, sale) => sum + sale.sale_price, 0) /
          salesHistory.length
        : 0;

    // Update summary cards safely - CHANGED: Update totalSoldValue element instead of totalRealizedGain
    const totalSoldValueEl = document.getElementById("totalSoldValue");
    const totalOptionsSoldEl = document.getElementById("totalOptionsSold");
    const averageSalePriceEl = document.getElementById("averageSalePrice");

    if (totalSoldValueEl) {
      totalSoldValueEl.textContent =
        this.app.helpers.formatCurrency(totalSoldValue);
    }
    if (totalOptionsSoldEl) {
      totalOptionsSoldEl.textContent = totalOptionsSold.toLocaleString();
    }
    if (averageSalePriceEl) {
      averageSalePriceEl.textContent =
        this.app.helpers.formatCurrency(averageSalePrice);
    }

    // Handle empty state
    if (salesHistory.length === 0) {
      tableBody.innerHTML = `
    <tr class="no-data">
      <td colspan="9">
        <div class="no-data-message">
          <p>No sales recorded yet.</p>
          <p>Sales will appear here after you sell options.</p>
        </div>
      </td>
    </tr>
  `;
      return;
    }

    // Generate table rows matching the new header structure
    tableBody.innerHTML = salesHistory
      .map((sale) => this.generateSalesRow(sale))
      .join("");
  }
  // Add this new method to generate individual sales rows
  generateSalesRow(sale) {
    return `
  <tr>
    <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
    <td>${new Date(sale.grant_date).toLocaleDateString()}</td>
    <td class="fund-name" title="${sale.fund_name || "Unknown Fund"}">
      ${this.app.helpers.formatFundName(sale.fund_name)}
    </td>
    <td>${sale.quantity_sold.toLocaleString()}</td>
    <td class="currency">${this.app.helpers.formatCurrency(
      sale.sale_price
    )}</td>
    <td class="currency">${this.app.helpers.formatCurrency(
      sale.total_sale_value
    )}</td>
    <td class="currency ${
      sale.profit_loss_vs_target >= 0 ? "positive" : "negative"
    }">
      ${this.app.helpers.formatCurrency(sale.profit_loss_vs_target || 0)}
    </td>
    <td>${sale.notes || "—"}</td>
    <td class="table-actions">
      <button class="btn action-btn edit-btn" 
              onclick="portfolioApp.editSale(${sale.id})"
              title="Edit this sale record">
        ✏️ Edit
      </button>
    </td>
  </tr>
`;
  }

  // Add this new method to generate action buttons for sales
  generateSalesActions(sale) {
    return `
    <button class="btn action-btn edit-btn" 
            title="Edit the sale details for this transaction" 
            onclick="window.portfolioApp.editSale(${sale.id})"
            style="margin-right: 4px;">
      ✏️ Edit
    </button>
  `;
  }

  // ===== GRANT HISTORY TABLE GENERATION =====

  renderGrantTable(grantHistory) {
    const tableBody = document.getElementById("grantTableBody");

    if (!tableBody) {
      console.error("Grant table body not found");
      return;
    }

    // Update summary cards
    const totalGrants = grantHistory.length;
    const totalOptionsGranted = grantHistory.reduce(
      (sum, grant) => sum + grant.quantity,
      0
    );

    // Still Active = Active + Partially Sold (not just Active)
    const stillActiveGrants = grantHistory.filter(
      (grant) => grant.status === "ACTIVE" || grant.status === "PARTIALLY_SOLD"
    ).length;

    // Update summary cards with ACTUAL totals (not filtered)
    document.getElementById("totalGrants").textContent = totalGrants;
    document.getElementById("totalOptionsGranted").textContent =
      totalOptionsGranted.toLocaleString();
    document.getElementById("activeGrants").textContent = stillActiveGrants;

    if (grantHistory.length === 0) {
      tableBody.innerHTML = `
    <tr class="no-data">
      <td colspan="5">
        <div class="no-data-message">
          <p>No grants found in database.</p>
        </div>
      </td>
    </tr>
  `;
      return;
    }

    tableBody.innerHTML = grantHistory
      .map(
        (grant) => `
    <tr>
      <td>${new Date(grant.grant_date).toLocaleDateString()}</td>
      <td class="fund-name" title="${grant.fund_name || "Unknown Fund"}">
        ${this.app.helpers.formatFundName(grant.fund_name)}
      </td>
      <td>${grant.quantity.toLocaleString()}</td>
      <td>${grant.quantity_remaining.toLocaleString()}</td>
      <td class="status-cell">
        ${this.getStatusBadge(grant.status)}
      </td>
    </tr>
  `
      )
      .join("");
  }

  // Helper method for grant status badges
  getStatusBadge(status) {
    const badges = {
      ACTIVE: '<span class="status-badge active">Active</span>',
      PARTIALLY_SOLD:
        '<span class="status-badge partial">Partially Sold</span>',
      FULLY_SOLD: '<span class="status-badge sold">Sold</span>',
    };
    return (
      badges[status] || `<span class="status-badge unknown">${status}</span>`
    );
  }

  // Helper method
  async checkIfPriceDataExists() {
    try {
      const prices = await ipcRenderer.invoke("get-available-exercise-prices");
      return prices && prices.length > 0 && !prices.error;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Calculate normalized price percentage for table row
   * Uses pre-calculated value from backend
   * @param {Object} entry - Portfolio entry
   * @returns {string} Formatted normalized price percentage
   */
  calculateNormalizedPriceForRow(entry) {
    if (entry.normalized_price_percentage === null || entry.normalized_price_percentage === undefined) {
      return "N/A";
    }
    
    // Format using existing formatter
    return window.FormatHelpers.formatPercentage(entry.normalized_price_percentage, 1);
  }

  /**
   * Get CSS class for normalized price percentage in table row
   * @param {Object} entry - Portfolio entry
   * @returns {string} CSS class name for coloring
   */
  getNormalizedPriceClassForRow(entry) {
    if (entry.normalized_price_percentage === null || entry.normalized_price_percentage === undefined) {
      return ""; // Neutral for N/A
    }
    
    const percentage = entry.normalized_price_percentage;
    
    // Use same thresholds as in modal: 66% = high (green), 33% = low (red)
    if (percentage >= 66) {
      return "positive"; // Green for high position (top third)
    } else if (percentage <= 33) {
      return "negative"; // Red for low position (bottom third) 
    } else {
      return ""; // Neutral for middle third
    }
  }
}

module.exports = HTMLGenerators;
