// UI Manager - Handles DOM manipulation and user interface updates
export class UIManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.searchDebounceTimer = null;
        this.messageTimeout = null;
    }

    /**
     * Show a specific section and hide others
     * @param {string} sectionId - ID of section to show
     */
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Update page title
            this.updatePageTitle(sectionId);
            
            // Announce section change for screen readers
            this.announceNavigation(sectionId);
        }
    }

    /**
     * Update page title based on current section
     * @param {string} sectionId - Current section ID
     */
    updatePageTitle(sectionId) {
        const titles = {
            dashboard: 'Dashboard - Student Finance Tracker',
            records: 'Transaction Records - Student Finance Tracker',
            'add-transaction': 'Add Transaction - Student Finance Tracker',
            settings: 'Settings - Student Finance Tracker',
            about: 'About - Student Finance Tracker'
        };
        
        document.title = titles[sectionId] || 'Student Finance Tracker';
    }

    /**
     * Announce navigation change for screen readers
     * @param {string} sectionId - Current section ID
     */
    announceNavigation(sectionId) {
        const announcements = {
            dashboard: 'Viewing financial dashboard',
            records: 'Viewing transaction records',
            'add-transaction': 'Transaction form',
            settings: 'Application settings',
            about: 'About page'
        };
        
        this.announceToScreenReader(announcements[sectionId] || 'Navigation changed');
    }

    /**
     * Render transactions table
     * @param {Array} transactions - Array of transaction objects
     * @param {Function} onEdit - Edit callback function
     * @param {Function} onDelete - Delete callback function
     */
    renderRecordsTable(transactions, onEdit, onDelete) {
        const tbody = document.getElementById('records-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (transactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center text-muted">
                    No transactions found
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <time datetime="${transaction.date}">
                        ${this.formatDate(transaction.date)}
                    </time>
                </td>
                <td>
                    <span class="transaction-description">
                        ${this.escapeHtml(transaction.description)}
                    </span>
                </td>
                <td>
                    <span class="category-badge">
                        ${this.escapeHtml(transaction.category)}
                    </span>
                </td>
                <td class="amount-cell">
                    <span class="amount">
                        ${this.formatCurrency(transaction.amount)}
                    </span>
                </td>
                <td class="actions-cell">
                    <button 
                        class="action-btn btn-secondary"
                        onclick="event.stopPropagation()"
                        aria-label="Edit transaction: ${this.escapeHtml(transaction.description)}"
                        title="Edit transaction"
                    >
                        Edit
                    </button>
                    <button 
                        class="action-btn btn-danger"
                        onclick="event.stopPropagation()"
                        aria-label="Delete transaction: ${this.escapeHtml(transaction.description)}"
                        title="Delete transaction"
                    >
                        Delete
                    </button>
                </td>
            `;
            
            // Add event listeners
            const editBtn = row.querySelector('.btn-secondary');
            const deleteBtn = row.querySelector('.btn-danger');
            
            editBtn.addEventListener('click', () => onEdit(transaction.id));
            deleteBtn.addEventListener('click', () => onDelete(transaction.id));
            
            tbody.appendChild(row);
        });
    }

    /**
     * Render transactions as cards (mobile view)
     * @param {Array} transactions - Array of transaction objects
     * @param {Function} onEdit - Edit callback function
     * @param {Function} onDelete - Delete callback function
     */
    renderRecordsCards(transactions, onEdit, onDelete) {
        const container = document.getElementById('records-cards');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No transactions found</p>
                </div>
            `;
            return;
        }
        
        transactions.forEach(transaction => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="record-card-header">
                    <h3 class="record-card-description">
                        ${this.escapeHtml(transaction.description)}
                    </h3>
                    <div class="record-card-amount">
                        ${this.formatCurrency(transaction.amount)}
                    </div>
                </div>
                <div class="record-card-meta">
                    <span class="record-card-category">
                        ${this.escapeHtml(transaction.category)}
                    </span>
                    <time datetime="${transaction.date}">
                        ${this.formatDate(transaction.date)}
                    </time>
                </div>
                <div class="record-card-actions">
                    <button 
                        class="action-btn btn-secondary"
                        aria-label="Edit transaction: ${this.escapeHtml(transaction.description)}"
                    >
                        Edit
                    </button>
                    <button 
                        class="action-btn btn-danger"
                        aria-label="Delete transaction: ${this.escapeHtml(transaction.description)}"
                    >
                        Delete
                    </button>
                </div>
            `;
            
            // Add event listeners
            const editBtn = card.querySelector('.btn-secondary');
            const deleteBtn = card.querySelector('.btn-danger');
            
            editBtn.addEventListener('click', () => onEdit(transaction.id));
            deleteBtn.addEventListener('click', () => onDelete(transaction.id));
            
            container.appendChild(card);
        });
    }

    /**
     * Highlight search matches in text
     * @param {string} text - Text to highlight
     * @param {RegExp} regex - Regular expression for matching
     * @returns {string} HTML with highlighted matches
     */
    highlightMatches(text, regex) {
        if (!regex || !text) return this.escapeHtml(text);
        
        try {
            const escapedText = this.escapeHtml(text);
            return escapedText.replace(regex, (match) => `<mark>${match}</mark>`);
        } catch (error) {
            return this.escapeHtml(text);
        }
    }

    /**
     * Update search results with highlighting
     * @param {Array} transactions - Filtered transactions
     * @param {RegExp} searchRegex - Search regular expression
     * @param {Function} onEdit - Edit callback
     * @param {Function} onDelete - Delete callback
     */
    renderSearchResults(transactions, searchRegex, onEdit, onDelete) {
        const tbody = document.getElementById('records-tbody');
        const cardsContainer = document.getElementById('records-cards');
        
        if (!tbody || !cardsContainer) return;
        
        // Clear both containers
        tbody.innerHTML = '';
        cardsContainer.innerHTML = '';
        
        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No transactions match your search
                    </td>
                </tr>
            `;
            cardsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No transactions match your search</p>
                </div>
            `;
            return;
        }
        
        // Render table with highlighting
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <time datetime="${transaction.date}">
                        ${this.formatDate(transaction.date)}
                    </time>
                </td>
                <td>
                    ${this.highlightMatches(transaction.description, searchRegex)}
                </td>
                <td>
                    ${this.highlightMatches(transaction.category, searchRegex)}
                </td>
                <td class="amount-cell">
                    ${this.formatCurrency(transaction.amount)}
                </td>
                <td class="actions-cell">
                    <button class="action-btn btn-secondary">Edit</button>
                    <button class="action-btn btn-danger">Delete</button>
                </td>
            `;
            
            // Add event listeners
            const editBtn = row.querySelector('.btn-secondary');
            const deleteBtn = row.querySelector('.btn-danger');
            
            editBtn.addEventListener('click', () => onEdit(transaction.id));
            deleteBtn.addEventListener('click', () => onDelete(transaction.id));
            
            tbody.appendChild(row);
        });
        
        // Render cards with highlighting
        transactions.forEach(transaction => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="record-card-header">
                    <h3 class="record-card-description">
                        ${this.highlightMatches(transaction.description, searchRegex)}
                    </h3>
                    <div class="record-card-amount">
                        ${this.formatCurrency(transaction.amount)}
                    </div>
                </div>
                <div class="record-card-meta">
                    <span class="record-card-category">
                        ${this.highlightMatches(transaction.category, searchRegex)}
                    </span>
                    <time datetime="${transaction.date}">
                        ${this.formatDate(transaction.date)}
                    </time>
                </div>
                <div class="record-card-actions">
                    <button class="action-btn btn-secondary">Edit</button>
                    <button class="action-btn btn-danger">Delete</button>
                </div>
            `;
            
            // Add event listeners
            const editBtn = card.querySelector('.btn-secondary');
            const deleteBtn = card.querySelector('.btn-danger');
            
            editBtn.addEventListener('click', () => onEdit(transaction.id));
            deleteBtn.addEventListener('click', () => onDelete(transaction.id));
            
            cardsContainer.appendChild(card);
        });
    }

    /**
     * Show a status message
     * @param {string} message - Message text
     * @param {string} type - Message type ('success', 'error', 'info')
     * @param {number} duration - Display duration in milliseconds
     */
    showMessage(message, type = 'success', duration = 5000) {
        const isError = type === 'error' || type === 'alert';
        const elementId = isError ? 'alert-message' : 'status-message';
        const element = document.getElementById(elementId);
        
        if (!element) return;
        
        // Clear previous timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Set message
        element.textContent = message;
        element.classList.add('show');
        
        // Auto-hide after duration
        this.messageTimeout = setTimeout(() => {
            element.classList.remove('show');
        }, duration);
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    /**
     * Clear all status messages
     */
    clearMessages() {
        document.querySelectorAll('.status-message, .alert-message').forEach(msg => {
            msg.classList.remove('show');
        });
        
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
    }

    /**
     * Show form validation errors
     * @param {Object} errors - Object with field names as keys and error messages as values
     */
    showValidationErrors(errors) {
        // Clear existing errors
        this.clearValidationErrors();
        
        // Show new errors
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        });
        
        // Focus first field with error
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
            const field = document.getElementById(firstErrorField);
            if (field) {
                field.focus();
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * Clear form validation errors
     */
    clearValidationErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
            error.classList.remove('show');
        });
    }

    /**
     * Update dashboard statistics
     * @param {Object} stats - Statistics object
     */
    updateDashboard(stats) {
        // Update basic stats
        this.updateElement('total-transactions', stats.basic.totalTransactions);
        this.updateElement('total-amount', this.formatCurrency(stats.basic.totalAmount));
        this.updateElement('top-category', stats.categories.top || 'None');
        this.updateElement('week-spending', this.formatCurrency(stats.periods.week));
        
        // Update budget progress
        if (stats.budget) {
            this.updateBudgetProgress(stats.budget);
        }
        
        // Update category chart
        this.updateCategoryChart(stats.categories.sorted);
    }

    /**
     * Update budget progress display
     * @param {Object} budget - Budget object with cap, spent, remaining, percentage
     */
    updateBudgetProgress(budget) {
        const progressFill = document.getElementById('progress-fill');
        const budgetStatus = document.getElementById('budget-status');
        
        if (!progressFill || !budgetStatus) return;
        
        const percentage = Math.min(budget.percentage, 100);
        const isOverBudget = budget.spent > budget.cap;
        
        // Update progress bar
        progressFill.style.width = `${percentage}%`;
        progressFill.classList.toggle('over-budget', isOverBudget);
        
        // Update status text
        if (isOverBudget) {
            const overage = budget.spent - budget.cap;
            budgetStatus.textContent = `Over budget by ${this.formatCurrency(overage)}`;
            this.announceToScreenReader(`Warning: Over budget by ${this.formatCurrency(overage)}`, 'assertive');
        } else {
            budgetStatus.textContent = `${this.formatCurrency(budget.remaining)} remaining (${percentage.toFixed(1)}% used)`;
            
            if (percentage > 90) {
                this.announceToScreenReader(`Warning: ${this.formatCurrency(budget.remaining)} remaining in budget`, 'polite');
            }
        }
    }

    /**
     * Update category chart
     * @param {Array} categoryData - Sorted category data
     */
    updateCategoryChart(categoryData) {
        const chartContainer = document.getElementById('category-chart');
        if (!chartContainer) return;
        
        chartContainer.innerHTML = '';
        
        if (categoryData.length === 0) {
            chartContainer.innerHTML = '<p class="text-muted">No spending data available</p>';
            return;
        }
        
        const maxAmount = Math.max(...categoryData.map(c => c.amount));
        
        categoryData.forEach(({ category, amount }) => {
            const percentage = (amount / maxAmount) * 100;
            
            const barElement = document.createElement('div');
            barElement.className = 'chart-bar';
            barElement.innerHTML = `
                <div class="chart-label">${this.escapeHtml(category)}</div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${percentage}%" 
                         role="img" 
                         aria-label="${category} spending: ${this.formatCurrency(amount)}">
                    </div>
                </div>
                <div class="chart-value">${this.formatCurrency(amount)}</div>
            `;
            
            chartContainer.appendChild(barElement);
        });
    }

    /**
     * Create and show a loading spinner
     * @param {string} containerId - Container element ID
     * @param {string} message - Loading message
     */
    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner" role="status" aria-label="${message}"></div>
            <p>${message}</p>
        `;
        
        container.appendChild(spinner);
    }

    /**
     * Remove loading spinner
     * @param {string} containerId - Container element ID
     */
    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const spinner = container.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    /**
     * Create a modal dialog
     * @param {Object} options - Modal options
     */
    showModal(options) {
        const {
            title,
            content,
            buttons = [],
            onClose = null,
            closeOnOutsideClick = true
        } = options;
        
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'dynamic-modal-title');
        modal.setAttribute('aria-hidden', 'false');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="dynamic-modal-title">${this.escapeHtml(title)}</h3>
                    <button class="modal-close" aria-label="Close dialog">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-actions">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class || 'btn-secondary'}" data-action="${btn.action}">
                            ${this.escapeHtml(btn.text)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal(modal, onClose));
        
        // Handle button clicks
        modal.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const buttonConfig = buttons.find(b => b.action === action);
                if (buttonConfig && buttonConfig.onClick) {
                    buttonConfig.onClick();
                }
                this.closeModal(modal, onClose);
            });
        });
        
        // Close on outside click
        if (closeOnOutsideClick) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal, onClose);
                }
            });
        }
        
        // Add to DOM and show
        document.body.appendChild(modal);
        modal.classList.add('show');
        
        // Focus first focusable element
        setTimeout(() => {
            const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
        
        return modal;
    }

    /**
     * Close a modal dialog
     * @param {HTMLElement} modal - Modal element
     * @param {Function} onClose - Close callback
     */
    closeModal(modal, onClose = null) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
        
        if (onClose) {
            onClose();
        }
    }

    // Utility methods
    
    /**
     * Safely update element text content
     * @param {string} elementId - Element ID
     * @param {string} content - Content to set
     */
    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Format currency amount
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        const baseCurrency = document.getElementById('base-currency')?.value || 'USD';
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', RWF: 'FR' };
        const symbol = symbols[baseCurrency] || '$';
        
        // Format RWF differently (no decimals for whole francs)
        if (baseCurrency === 'RWF') {
            return `${symbol}${Math.round(amount).toLocaleString()}`;
        }
        
        return `${symbol}${amount.toFixed(2)}`;
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} unsafe - Unsafe string
     * @returns {string} HTML-safe string
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Get current viewport information
     * @returns {Object} Viewport info
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: window.innerWidth < 768,
            isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
            isDesktop: window.innerWidth >= 1024
        };
    }

    /**
     * Scroll element into view smoothly
     * @param {string|HTMLElement} target - Element ID or element
     */
    scrollToElement(target) {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

