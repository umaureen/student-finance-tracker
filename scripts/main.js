// Main application entry point
import { StorageManager } from './storage.js';
import { StateManager } from './state.js';
import { UIManager } from './ui.js';
import { ValidationManager } from './validators.js';
import { SearchManager } from './search.js';

class FinanceTracker {
    constructor() {
        this.storage = new StorageManager();
        this.state = new StateManager();
        this.ui = new UIManager();
        this.validator = new ValidationManager();
        this.search = new SearchManager();
        
        this.currentEditId = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Load data from storage
            await this.loadData();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load settings
            this.loadSettings();
            
            // Update dashboard
            this.updateDashboard();
            
            // Set default date to today
            this.setDefaultDate();
            
            this.isInitialized = true;
            console.log('Finance Tracker initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Finance Tracker:', error);
            this.showMessage('Failed to initialize application', 'error');
        }
    }

    async loadData() {
        try {
            const data = await this.storage.load();
            this.state.setTransactions(data);
        } catch (error) {
            console.error('Error loading data:', error);
            this.state.setTransactions([]);
        }
    }

    initializeUI() {
        // Show dashboard by default
        this.ui.showSection('dashboard');
        
        // Initialize categories in form
        this.updateCategoryOptions();
        
        // Initialize settings UI
        this.initializeSettings();
        
        // Update records display
        this.updateRecordsDisplay();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener('click', () => {
                const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
                mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
                mainNav.classList.toggle('active');
            });
            
            // Close mobile menu when a nav link is clicked
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    mainNav.classList.remove('active');
                });
            });
        }

        // Transaction form
        const form = document.getElementById('transaction-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        const caseInsensitive = document.getElementById('case-insensitive');
        if (caseInsensitive) {
            caseInsensitive.addEventListener('change', () => this.handleSearch());
        }

        // Sorting
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.updateRecordsDisplay());
        }

        // Budget
        const setBudgetBtn = document.getElementById('set-budget-btn');
        if (setBudgetBtn) {
            setBudgetBtn.addEventListener('click', () => this.setBudget());
        }

        // Settings
        this.setupSettingsEventListeners();

        // Modals
        this.setupModalEventListeners();

        // Keyboard navigation
        this.setupKeyboardNavigation();
    }

    setupSettingsEventListeners() {
        // Currency change
        const baseCurrency = document.getElementById('base-currency');
        if (baseCurrency) {
            baseCurrency.addEventListener('change', () => this.updateCurrency());
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Exchange rates
        ['eur-rate', 'gbp-rate', 'cad-rate', 'rwf-rate'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.saveExchangeRates());
            }
        });

        // Category management
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.addCategory());
        }

        // Data management
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }

        const clearDataBtn = document.getElementById('clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }
    }

    setupModalEventListeners() {
        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Delete confirmation
        const confirmDelete = document.getElementById('confirm-delete');
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDelete());
        }

        const cancelDelete = document.getElementById('cancel-delete');
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.closeModals());
        }

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    setupKeyboardNavigation() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById('main-content');
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Form navigation improvements and shortcuts
        document.addEventListener('keydown', (e) => {
            // Theme toggle shortcut
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Enhanced form navigation can be added here
            if (e.key === 'Tab') {
                // Custom tab handling if needed
            }
        });
    }

    navigateToSection(section) {
        this.ui.showSection(section);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update dashboard when navigating to it
        if (section === 'dashboard') {
            this.updateDashboard();
        }
        
        // Reset edit mode when leaving add-transaction section
        if (section !== 'add-transaction' && this.currentEditId) {
            this.cancelEdit();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            description: formData.get('description').trim(),
            amount: formData.get('amount').trim(),
            category: formData.get('category'),
            date: formData.get('date')
        };

        // Validate form
        const validation = this.validator.validateTransaction(transaction);
        if (!validation.isValid) {
            this.displayValidationErrors(validation.errors);
            return;
        }

        // Clear any previous errors
        this.clearValidationErrors();

        try {
            if (this.currentEditId) {
                // Update existing transaction
                await this.updateTransaction(this.currentEditId, transaction);
                this.showMessage('Transaction updated successfully!', 'success');
                this.cancelEdit();
            } else {
                // Add new transaction
                await this.addTransaction(transaction);
                this.showMessage('Transaction added successfully!', 'success');
                e.target.reset();
                this.setDefaultDate();
            }

            // Update UI
            this.updateRecordsDisplay();
            this.updateDashboard();

        } catch (error) {
            console.error('Error saving transaction:', error);
            this.showMessage('Failed to save transaction. Please try again.', 'error');
        }
    }

    async addTransaction(transactionData) {
        const transaction = {
            id: this.generateId(),
            ...transactionData,
            amount: parseFloat(transactionData.amount),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.state.addTransaction(transaction);
        await this.storage.save(this.state.getTransactions());
    }

    async updateTransaction(id, transactionData) {
        const updatedTransaction = {
            ...transactionData,
            amount: parseFloat(transactionData.amount),
            updatedAt: new Date().toISOString()
        };

        this.state.updateTransaction(id, updatedTransaction);
        await this.storage.save(this.state.getTransactions());
    }

    async deleteTransaction(id) {
        this.state.deleteTransaction(id);
        await this.storage.save(this.state.getTransactions());
        
        this.updateRecordsDisplay();
        this.updateDashboard();
        this.showMessage('Transaction deleted successfully!', 'success');
    }

    editTransaction(id) {
        const transaction = this.state.getTransaction(id);
        if (!transaction) return;

        // Switch to add-transaction section
        this.navigateToSection('add-transaction');

        // Populate form
        document.getElementById('description').value = transaction.description;
        document.getElementById('amount').value = transaction.amount.toString();
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;

        // Update form state
        this.currentEditId = id;
        document.getElementById('add-title').textContent = 'Edit Transaction';
        document.querySelector('#transaction-form button[type="submit"]').textContent = 'Update Transaction';
        document.getElementById('cancel-edit').style.display = 'inline-block';

        // Set up cancel button
        document.getElementById('cancel-edit').onclick = () => this.cancelEdit();
    }

    cancelEdit() {
        this.currentEditId = null;
        document.getElementById('add-title').textContent = 'Add Transaction';
        document.querySelector('#transaction-form button[type="submit"]').textContent = 'Add Transaction';
        document.getElementById('cancel-edit').style.display = 'none';
        document.getElementById('transaction-form').reset();
        this.setDefaultDate();
        this.clearValidationErrors();
    }

    handleSearch() {
        const query = document.getElementById('search-input').value;
        const caseInsensitive = document.getElementById('case-insensitive').checked;
        const errorElement = document.getElementById('search-error');

        try {
            errorElement.textContent = '';
            errorElement.classList.remove('show');

            const filteredTransactions = this.search.searchTransactions(
                this.state.getTransactions(),
                query,
                caseInsensitive
            );

            this.updateRecordsDisplay(filteredTransactions);
        } catch (error) {
            errorElement.textContent = `Invalid regex pattern: ${error.message}`;
            errorElement.classList.add('show');
            this.updateRecordsDisplay();
        }
    }

    updateRecordsDisplay(transactions = null) {
        const allTransactions = transactions || this.state.getTransactions();
        const sortBy = document.getElementById('sort-select').value;
        
        // Sort transactions
        const sortedTransactions = this.sortTransactions(allTransactions, sortBy);
        
        // Update table and cards
        this.ui.renderRecordsTable(sortedTransactions, (id) => this.editTransaction(id), (id) => this.showDeleteModal(id));
        this.ui.renderRecordsCards(sortedTransactions, (id) => this.editTransaction(id), (id) => this.showDeleteModal(id));

        // Show/hide empty state
        const noRecords = document.getElementById('no-records');
        if (sortedTransactions.length === 0) {
            noRecords.style.display = 'block';
        } else {
            noRecords.style.display = 'none';
        }
    }

    sortTransactions(transactions, sortBy) {
        const [field, direction] = sortBy.split('-');
        
        return [...transactions].sort((a, b) => {
            let aVal, bVal;
            
            switch (field) {
                case 'date':
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
                    break;
                case 'description':
                    aVal = a.description.toLowerCase();
                    bVal = b.description.toLowerCase();
                    break;
                case 'amount':
                    aVal = a.amount;
                    bVal = b.amount;
                    break;
                default:
                    return 0;
            }
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    updateDashboard() {
        const transactions = this.state.getTransactions();
        const stats = this.calculateStats(transactions);
        
        // Update stats
        document.getElementById('total-transactions').textContent = stats.totalTransactions;
        document.getElementById('total-amount').textContent = this.formatCurrency(stats.totalAmount);
        document.getElementById('top-category').textContent = stats.topCategory || 'None';
        document.getElementById('week-spending').textContent = this.formatCurrency(stats.weekSpending);
        
        // Update budget progress
        this.updateBudgetProgress(stats.monthlySpending);
        
        // Update category chart
        this.updateCategoryChart(stats.categoryData);
    }

    calculateStats(transactions) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        // Last 7 days spending
        const weekSpending = transactions
            .filter(t => new Date(t.date) >= sevenDaysAgo)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Monthly spending
        const monthlySpending = transactions
            .filter(t => new Date(t.date) >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Category analysis
        const categoryTotals = {};
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, null);
        
        const categoryData = Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
        
        return {
            totalTransactions,
            totalAmount,
            weekSpending,
            monthlySpending,
            topCategory,
            categoryData
        };
    }

    updateBudgetProgress(currentSpending) {
        const budgetCap = this.state.getBudgetCap();
        const progressFill = document.getElementById('progress-fill');
        const budgetStatus = document.getElementById('budget-status');
        const alertMessage = document.getElementById('alert-message');
        
        if (!budgetCap || budgetCap <= 0) {
            progressFill.style.width = '0%';
            budgetStatus.textContent = 'No budget set';
            return;
        }
        
        const percentage = Math.min((currentSpending / budgetCap) * 100, 100);
        const remaining = budgetCap - currentSpending;
        
        progressFill.style.width = `${percentage}%`;
        
        if (currentSpending > budgetCap) {
            progressFill.classList.add('over-budget');
            budgetStatus.textContent = `Over budget by ${this.formatCurrency(Math.abs(remaining))}`;
            this.showMessage(` You've exceeded your monthly budget by ${this.formatCurrency(Math.abs(remaining))}!`, 'alert');
        } else {
            progressFill.classList.remove('over-budget');
            budgetStatus.textContent = `${this.formatCurrency(remaining)} remaining (${percentage.toFixed(1)}% used)`;
            
            // Alert when approaching budget
            if (percentage > 90) {
                this.showMessage(` You're close to your budget limit. ${this.formatCurrency(remaining)} remaining.`, 'alert');
            }
        }
    }

    updateCategoryChart(categoryData) {
        const chartContainer = document.getElementById('category-chart');
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
                <div class="chart-label">${category}</div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${this.formatCurrency(amount)}</div>
            `;
            
            chartContainer.appendChild(barElement);
        });
    }

    setBudget() {
        const budgetInput = document.getElementById('budget-cap');
        const budget = parseFloat(budgetInput.value);
        
        if (isNaN(budget) || budget < 0) {
            this.showMessage('Please enter a valid budget amount', 'error');
            return;
        }
        
        this.state.setBudgetCap(budget);
        this.storage.saveBudgetCap(budget);
        this.updateDashboard();
        this.showMessage('Budget cap updated successfully!', 'success');
    }

    // Settings methods
    initializeSettings() {
        // Load categories
        this.updateCategoryList();
        
        // Load currency settings
        const settings = this.storage.loadSettings();
        if (settings.baseCurrency) {
            document.getElementById('base-currency').value = settings.baseCurrency;
        }
        if (settings.exchangeRates) {
            document.getElementById('eur-rate').value = settings.exchangeRates.EUR || 1.100;
            document.getElementById('gbp-rate').value = settings.exchangeRates.GBP || 1.250;
            document.getElementById('cad-rate').value = settings.exchangeRates.CAD || 0.750;
            document.getElementById('rwf-rate').value = settings.exchangeRates.RWF || 0.001;
        }
        
        // Initialize theme
        this.initializeTheme();
        
        this.updateCurrency();
    }

    updateCurrency() {
        const baseCurrency = document.getElementById('base-currency').value;
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', RWF: 'FR' };
        const symbol = symbols[baseCurrency] || '$';
        
        document.getElementById('currency-symbol').textContent = symbol;
        
        // Save setting
        const settings = this.storage.loadSettings();
        settings.baseCurrency = baseCurrency;
        this.storage.saveSettings(settings);
    }

    saveExchangeRates() {
        const rates = {
            EUR: parseFloat(document.getElementById('eur-rate').value) || 1.100,
            GBP: parseFloat(document.getElementById('gbp-rate').value) || 1.250,
            CAD: parseFloat(document.getElementById('cad-rate').value) || 0.750,
            RWF: parseFloat(document.getElementById('rwf-rate').value) || 0.001
        };
        
        const settings = this.storage.loadSettings();
        settings.exchangeRates = rates;
        this.storage.saveSettings(settings);
    }

    updateCategoryOptions() {
        const categories = this.state.getCategories();
        const categorySelect = document.getElementById('category');
        
        // Clear existing options except the first one
        while (categorySelect.children.length > 1) {
            categorySelect.removeChild(categorySelect.lastChild);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    updateCategoryList() {
        const categories = this.state.getCategories();
        const categoryList = document.getElementById('category-list');
        
        categoryList.innerHTML = '';
        categories.forEach(category => {
            const tag = document.createElement('div');
            tag.className = 'category-tag';
            tag.innerHTML = `
                ${category}
                <button class="category-remove" aria-label="Remove ${category} category" onclick="app.removeCategory('${category}')">×</button>
            `;
            categoryList.appendChild(tag);
        });
    }

    addCategory() {
        const input = document.getElementById('new-category');
        const categoryName = input.value.trim();
        
        if (!categoryName) {
            this.showMessage('Please enter a category name', 'error');
            return;
        }
        
        const validation = this.validator.validateCategory(categoryName);
        if (!validation.isValid) {
            this.showMessage(validation.errors.category, 'error');
            return;
        }
        
        if (this.state.getCategories().includes(categoryName)) {
            this.showMessage('Category already exists', 'error');
            return;
        }
        
        this.state.addCategory(categoryName);
        this.storage.saveCategories(this.state.getCategories());
        this.updateCategoryList();
        this.updateCategoryOptions();
        input.value = '';
        this.showMessage('Category added successfully!', 'success');
    }

    removeCategory(categoryName) {
        if (this.state.getCategories().length <= 1) {
            this.showMessage('Cannot remove the last category', 'error');
            return;
        }
        
        // Check if category is in use
        const transactions = this.state.getTransactions();
        const inUse = transactions.some(t => t.category === categoryName);
        
        if (inUse) {
            this.showMessage('Cannot remove category that is in use', 'error');
            return;
        }
        
        this.state.removeCategory(categoryName);
        this.storage.saveCategories(this.state.getCategories());
        this.updateCategoryList();
        this.updateCategoryOptions();
        this.showMessage('Category removed successfully!', 'success');
    }

    // Data import/export
    exportData() {
        const data = {
            transactions: this.state.getTransactions(),
            categories: this.state.getCategories(),
            settings: this.storage.loadSettings(),
            budgetCap: this.state.getBudgetCap(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Data exported successfully!', 'success');
    }

    async importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showMessage('Please select a file to import', 'error');
            return;
        }
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate import data
            const validation = this.validator.validateImportData(data);
            if (!validation.isValid) {
                this.showMessage(`Invalid import data: ${validation.errors.join(', ')}`, 'error');
                return;
            }
            
            // Import data
            if (data.transactions) {
                this.state.setTransactions(data.transactions);
                await this.storage.save(data.transactions);
            }
            
            if (data.categories) {
                this.state.setCategories(data.categories);
                this.storage.saveCategories(data.categories);
            }
            
            if (data.settings) {
                this.storage.saveSettings(data.settings);
            }
            
            if (data.budgetCap) {
                this.state.setBudgetCap(data.budgetCap);
                this.storage.saveBudgetCap(data.budgetCap);
            }
            
            // Refresh UI
            this.initializeSettings();
            this.updateCategoryOptions();
            this.updateRecordsDisplay();
            this.updateDashboard();
            
            fileInput.value = '';
            this.showMessage('Data imported successfully!', 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            this.showMessage('Failed to import data. Please check the file format.', 'error');
        }
    }

    clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            return;
        }
        
        this.state.clearAll();
        this.storage.clear();
        this.updateRecordsDisplay();
        this.updateDashboard();
        this.showMessage('All data cleared successfully!', 'success');
    }

    // Modal methods
    showDeleteModal(id) {
        this.deleteTargetId = id;
        document.getElementById('delete-modal').classList.add('show');
        document.getElementById('delete-modal').setAttribute('aria-hidden', 'false');
        
        // Focus the first button
        setTimeout(() => {
            document.getElementById('confirm-delete').focus();
        }, 100);
    }

    confirmDelete() {
        if (this.deleteTargetId) {
            this.deleteTransaction(this.deleteTargetId);
            this.deleteTargetId = null;
        }
        this.closeModals();
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        });
        this.deleteTargetId = null;
    }

    // Utility methods
    generateId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatCurrency(amount) {
        const baseCurrency = document.getElementById('base-currency')?.value || 'USD';
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', RWF: 'FR' };
        const symbol = symbols[baseCurrency] || '$';
        
        // Format RWF differently (no decimals for whole francs)
        if (baseCurrency === 'RWF') {
            return symbol + Math.round(amount).toLocaleString();
        }
        
        return symbol + amount.toFixed(2);
    }

    // Theme management methods
    initializeTheme() {
        const settings = this.storage.loadSettings();
        const theme = settings.theme || 'light';
        this.setTheme(theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Save theme preference
        const settings = this.storage.loadSettings();
        settings.theme = newTheme;
        this.storage.saveSettings(settings);
        
        this.showMessage(`Switched to ${newTheme} mode`, 'success');
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        const themeText = themeToggle?.querySelector('.theme-text');
        
        if (themeIcon && themeText) {
            if (theme === 'dark') {
                themeIcon.textContent = '';
                themeText.textContent = 'Light Mode';
                themeToggle.setAttribute('aria-label', 'Switch to light theme');
            } else {
                themeIcon.textContent = '';
                themeText.textContent = 'Dark Mode';
                themeToggle.setAttribute('aria-label', 'Switch to dark theme');
            }
        }
        
        // Announce theme change to screen readers
        this.announceToScreenReader(`Switched to ${theme} theme`);
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    loadSettings() {
        const settings = this.storage.loadSettings();
        if (settings.budgetCap) {
            this.state.setBudgetCap(settings.budgetCap);
            document.getElementById('budget-cap').value = settings.budgetCap;
        }
    }

    displayValidationErrors(errors) {
        // Clear all previous errors
        this.clearValidationErrors();
        
        // Display new errors
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        });
    }

    clearValidationErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
            error.classList.remove('show');
        });
    }

    showMessage(message, type = 'success') {
        const elementId = type === 'error' || type === 'alert' ? 'alert-message' : 'status-message';
        const element = document.getElementById(elementId);
        
        if (element) {
            element.textContent = message;
            element.classList.add('show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                element.classList.remove('show');
            }, 5000);
        }
    }

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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new FinanceTracker();
    await window.app.init();
});

// Make removeCategory available globally for onclick handlers
window.removeCategory = (category) => {
    if (window.app) {
        window.app.removeCategory(category);
    }
};

