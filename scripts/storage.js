// Storage Manager - Handles localStorage operations and data persistence
export class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            TRANSACTIONS: 'finance-tracker:transactions',
            CATEGORIES: 'finance-tracker:categories', 
            SETTINGS: 'finance-tracker:settings',
            BUDGET_CAP: 'finance-tracker:budget-cap'
        };
        
        this.DEFAULT_CATEGORIES = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
        this.DEFAULT_SETTINGS = {
            baseCurrency: 'USD',
            exchangeRates: {
                EUR: 1.100,
                GBP: 1.250,
                CAD: 0.750,
                RWF: 0.001
            },
            theme: 'light'
        };
    }

    /**
     * Load transactions from localStorage
     * @returns {Promise<Array>} Array of transaction objects
     */
    async load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
            if (!data) {
                return [];
            }
            
            const transactions = JSON.parse(data);
            return this.validateTransactionData(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    /**
     * Save transactions to localStorage
     * @param {Array} transactions - Array of transaction objects
     * @returns {Promise<boolean>} Success status
     */
    async save(transactions) {
        try {
            if (!Array.isArray(transactions)) {
                throw new Error('Transactions must be an array');
            }
            
            const validatedTransactions = this.validateTransactionData(transactions);
            const jsonString = JSON.stringify(validatedTransactions);
            
            // Check storage quota (simplified check)
            if (jsonString.length > 5000000) { // ~5MB limit
                throw new Error('Data too large for localStorage');
            }
            
            localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, jsonString);
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    }

    /**
     * Load categories from localStorage
     * @returns {Array} Array of category names
     */
    loadCategories() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
            if (!data) {
                this.saveCategories(this.DEFAULT_CATEGORIES);
                return [...this.DEFAULT_CATEGORIES];
            }
            
            const categories = JSON.parse(data);
            return Array.isArray(categories) ? categories : [...this.DEFAULT_CATEGORIES];
        } catch (error) {
            console.error('Error loading categories:', error);
            return [...this.DEFAULT_CATEGORIES];
        }
    }

    /**
     * Save categories to localStorage
     * @param {Array} categories - Array of category names
     * @returns {boolean} Success status
     */
    saveCategories(categories) {
        try {
            if (!Array.isArray(categories)) {
                throw new Error('Categories must be an array');
            }
            
            const validCategories = categories.filter(cat => 
                typeof cat === 'string' && cat.trim().length > 0
            );
            
            localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(validCategories));
            return true;
        } catch (error) {
            console.error('Error saving categories:', error);
            return false;
        }
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    loadSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (!data) {
                this.saveSettings(this.DEFAULT_SETTINGS);
                return { ...this.DEFAULT_SETTINGS };
            }
            
            const settings = JSON.parse(data);
            return { ...this.DEFAULT_SETTINGS, ...settings };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { ...this.DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings to localStorage
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    saveSettings(settings) {
        try {
            if (typeof settings !== 'object' || settings === null) {
                throw new Error('Settings must be an object');
            }
            
            const validatedSettings = this.validateSettings(settings);
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(validatedSettings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Load budget cap from localStorage
     * @returns {number|null} Budget cap value
     */
    loadBudgetCap() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.BUDGET_CAP);
            if (!data) {
                return null;
            }
            
            const budgetCap = parseFloat(data);
            return isNaN(budgetCap) || budgetCap < 0 ? null : budgetCap;
        } catch (error) {
            console.error('Error loading budget cap:', error);
            return null;
        }
    }

    /**
     * Save budget cap to localStorage
     * @param {number} budgetCap - Budget cap value
     * @returns {boolean} Success status
     */
    saveBudgetCap(budgetCap) {
        try {
            const numericCap = parseFloat(budgetCap);
            if (isNaN(numericCap) || numericCap < 0) {
                throw new Error('Budget cap must be a positive number');
            }
            
            localStorage.setItem(this.STORAGE_KEYS.BUDGET_CAP, numericCap.toString());
            return true;
        } catch (error) {
            console.error('Error saving budget cap:', error);
            return false;
        }
    }

    /**
     * Clear all stored data
     */
    clear() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Restore defaults
            this.saveCategories(this.DEFAULT_CATEGORIES);
            this.saveSettings(this.DEFAULT_SETTINGS);
            
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            const breakdown = {};
            
            Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                breakdown[name] = size;
                totalSize += size;
            });
            
            // Estimate available space (localStorage typically 5-10MB)
            const estimatedLimit = 5 * 1024 * 1024; // 5MB
            const usagePercentage = (totalSize / estimatedLimit) * 100;
            
            return {
                totalSize,
                breakdown,
                usagePercentage: Math.min(usagePercentage, 100),
                estimatedLimit
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                totalSize: 0,
                breakdown: {},
                usagePercentage: 0,
                estimatedLimit: 0
            };
        }
    }

    /**
     * Export all data as JSON
     * @returns {Object} Complete data export
     */
    exportAll() {
        try {
            return {
                transactions: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS) || '[]'),
                categories: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CATEGORIES) || '[]'),
                settings: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS) || '{}'),
                budgetCap: this.loadBudgetCap(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Import all data from JSON
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    async importAll(data) {
        try {
            if (!this.validateImportData(data)) {
                throw new Error('Invalid import data structure');
            }
            
            // Create backup before import
            const backup = this.exportAll();
            
            try {
                // Import each data type
                if (data.transactions) {
                    await this.save(data.transactions);
                }
                
                if (data.categories) {
                    this.saveCategories(data.categories);
                }
                
                if (data.settings) {
                    this.saveSettings(data.settings);
                }
                
                if (typeof data.budgetCap === 'number') {
                    this.saveBudgetCap(data.budgetCap);
                }
                
                return true;
            } catch (importError) {
                // Restore backup on failure
                console.error('Import failed, restoring backup:', importError);
                await this.importAll(backup);
                throw importError;
            }
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Validate transaction data structure
     * @param {Array} transactions - Transactions to validate
     * @returns {Array} Validated transactions
     */
    validateTransactionData(transactions) {
        if (!Array.isArray(transactions)) {
            return [];
        }
        
        return transactions.filter(transaction => {
            return (
                transaction &&
                typeof transaction === 'object' &&
                typeof transaction.id === 'string' &&
                typeof transaction.description === 'string' &&
                typeof transaction.amount === 'number' &&
                typeof transaction.category === 'string' &&
                typeof transaction.date === 'string' &&
                transaction.id.length > 0 &&
                transaction.description.trim().length > 0 &&
                transaction.amount >= 0 &&
                transaction.category.length > 0 &&
                this.isValidDate(transaction.date)
            );
        }).map(transaction => ({
            ...transaction,
            description: this.sanitizeString(transaction.description),
            category: this.sanitizeString(transaction.category),
            amount: Math.round(transaction.amount * 100) / 100, // Round to 2 decimal places
            createdAt: transaction.createdAt || new Date().toISOString(),
            updatedAt: transaction.updatedAt || new Date().toISOString()
        }));
    }

    /**
     * Validate settings object
     * @param {Object} settings - Settings to validate
     * @returns {Object} Validated settings
     */
    validateSettings(settings) {
        const validated = { ...this.DEFAULT_SETTINGS };
        
        if (settings.baseCurrency && ['USD', 'EUR', 'GBP', 'CAD', 'RWF'].includes(settings.baseCurrency)) {
            validated.baseCurrency = settings.baseCurrency;
        }
        
        if (settings.exchangeRates && typeof settings.exchangeRates === 'object') {
            Object.entries(settings.exchangeRates).forEach(([currency, rate]) => {
                if (typeof rate === 'number' && rate > 0) {
                    validated.exchangeRates[currency] = Math.round(rate * 1000) / 1000; // Round to 3 decimal places
                }
            });
        }
        
        if (settings.theme && ['light', 'dark'].includes(settings.theme)) {
            validated.theme = settings.theme;
        }
        
        return validated;
    }

    /**
     * Validate import data structure
     * @param {Object} data - Data to validate
     * @returns {boolean} Is valid
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Check if it has at least one expected property
        const hasValidProperty = (
            Array.isArray(data.transactions) ||
            Array.isArray(data.categories) ||
            (data.settings && typeof data.settings === 'object') ||
            typeof data.budgetCap === 'number'
        );
        
        return hasValidProperty;
    }

    /**
     * Check if a date string is valid
     * @param {string} dateString - Date string to validate
     * @returns {boolean} Is valid date
     */
    isValidDate(dateString) {
        if (typeof dateString !== 'string') return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Sanitize string input
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        
        return str
            .trim()
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .substring(0, 500); // Limit length
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Is localStorage available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('localStorage not available:', error);
            return false;
        }
    }

    /**
     * Get localStorage quota information (browser-specific)
     * @returns {Object|null} Quota information or null if not available
     */
    async getQuotaInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usagePercentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
                };
            } catch (error) {
                console.error('Error getting quota info:', error);
            }
        }
        return null;
    }
}

