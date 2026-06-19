// State Manager - Handles application state and data operations
export class StateManager {
    constructor() {
        this.transactions = [];
        this.categories = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
        this.budgetCap = null;
        this.filters = {
            search: '',
            category: '',
            dateRange: null
        };
        this.sortConfig = {
            field: 'date',
            direction: 'desc'
        };
    }

    // Transaction operations
    
    /**
     * Set all transactions
     * @param {Array} transactions - Array of transaction objects
     */
    setTransactions(transactions) {
        if (!Array.isArray(transactions)) {
            throw new Error('Transactions must be an array');
        }
        this.transactions = transactions.map(t => ({ ...t })); // Deep copy
    }

    /**
     * Get all transactions
     * @returns {Array} Copy of transactions array
     */
    getTransactions() {
        return this.transactions.map(t => ({ ...t })); // Return deep copy
    }

    /**
     * Get a single transaction by ID
     * @param {string} id - Transaction ID
     * @returns {Object|null} Transaction object or null if not found
     */
    getTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        return transaction ? { ...transaction } : null;
    }

    /**
     * Add a new transaction
     * @param {Object} transaction - Transaction object
     * @returns {boolean} Success status
     */
    addTransaction(transaction) {
        try {
            this.validateTransaction(transaction);
            
            // Ensure unique ID
            if (this.transactions.some(t => t.id === transaction.id)) {
                throw new Error('Transaction ID already exists');
            }
            
            const newTransaction = {
                ...transaction,
                createdAt: transaction.createdAt || new Date().toISOString(),
                updatedAt: transaction.updatedAt || new Date().toISOString()
            };
            
            this.transactions.push(newTransaction);
            return true;
        } catch (error) {
            console.error('Error adding transaction:', error);
            return false;
        }
    }

    /**
     * Update an existing transaction
     * @param {string} id - Transaction ID
     * @param {Object} updates - Object with fields to update
     * @returns {boolean} Success status
     */
    updateTransaction(id, updates) {
        try {
            const index = this.transactions.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Transaction not found');
            }
            
            const currentTransaction = this.transactions[index];
            const updatedTransaction = {
                ...currentTransaction,
                ...updates,
                id: currentTransaction.id, // Prevent ID changes
                createdAt: currentTransaction.createdAt, // Preserve creation date
                updatedAt: new Date().toISOString()
            };
            
            this.validateTransaction(updatedTransaction);
            this.transactions[index] = updatedTransaction;
            return true;
        } catch (error) {
            console.error('Error updating transaction:', error);
            return false;
        }
    }

    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     * @returns {boolean} Success status
     */
    deleteTransaction(id) {
        try {
            const index = this.transactions.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Transaction not found');
            }
            
            this.transactions.splice(index, 1);
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
    }

    /**
     * Get transactions filtered by criteria
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered transactions
     */
    getFilteredTransactions(filters = {}) {
        let filtered = this.getTransactions();
        
        // Category filter
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === filters.category);
        }
        
        // Date range filter
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(t => new Date(t.date) >= fromDate);
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            filtered = filtered.filter(t => new Date(t.date) <= toDate);
        }
        
        // Amount range filter
        if (typeof filters.minAmount === 'number') {
            filtered = filtered.filter(t => t.amount >= filters.minAmount);
        }
        
        if (typeof filters.maxAmount === 'number') {
            filtered = filtered.filter(t => t.amount <= filters.maxAmount);
        }
        
        // Text search in description
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }

    /**
     * Get transactions sorted by field and direction
     * @param {string} field - Field to sort by
     * @param {string} direction - 'asc' or 'desc'
     * @returns {Array} Sorted transactions
     */
    getSortedTransactions(field = 'date', direction = 'desc') {
        const transactions = this.getTransactions();
        
        return transactions.sort((a, b) => {
            let aValue, bValue;
            
            switch (field) {
                case 'date':
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'description':
                    aValue = a.description.toLowerCase();
                    bValue = b.description.toLowerCase();
                    break;
                case 'category':
                    aValue = a.category.toLowerCase();
                    bValue = b.category.toLowerCase();
                    break;
                case 'createdAt':
                case 'updatedAt':
                    aValue = new Date(a[field]);
                    bValue = new Date(b[field]);
                    break;
                default:
                    return 0;
            }
            
            if (direction === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
    }

    // Category operations
    
    /**
     * Get all categories
     * @returns {Array} Array of category names
     */
    getCategories() {
        return [...this.categories]; // Return copy
    }

    /**
     * Set all categories
     * @param {Array} categories - Array of category names
     */
    setCategories(categories) {
        if (!Array.isArray(categories)) {
            throw new Error('Categories must be an array');
        }
        
        const validCategories = categories.filter(cat => 
            typeof cat === 'string' && cat.trim().length > 0
        );
        
        this.categories = [...new Set(validCategories)]; // Remove duplicates
    }

    /**
     * Add a new category
     * @param {string} categoryName - Category name
     * @returns {boolean} Success status
     */
    addCategory(categoryName) {
        try {
            if (typeof categoryName !== 'string' || categoryName.trim().length === 0) {
                throw new Error('Category name must be a non-empty string');
            }
            
            const trimmedName = categoryName.trim();
            
            if (this.categories.includes(trimmedName)) {
                throw new Error('Category already exists');
            }
            
            // Validate category name format
            if (!/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(trimmedName)) {
                throw new Error('Category name contains invalid characters');
            }
            
            this.categories.push(trimmedName);
            return true;
        } catch (error) {
            console.error('Error adding category:', error);
            return false;
        }
    }

    /**
     * Remove a category
     * @param {string} categoryName - Category name
     * @returns {boolean} Success status
     */
    removeCategory(categoryName) {
        try {
            const index = this.categories.indexOf(categoryName);
            if (index === -1) {
                throw new Error('Category not found');
            }
            
            // Check if category is in use
            const inUse = this.transactions.some(t => t.category === categoryName);
            if (inUse) {
                throw new Error('Cannot remove category that is in use');
            }
            
            this.categories.splice(index, 1);
            return true;
        } catch (error) {
            console.error('Error removing category:', error);
            return false;
        }
    }

    // Budget operations
    
    /**
     * Get budget cap
     * @returns {number|null} Budget cap or null if not set
     */
    getBudgetCap() {
        return this.budgetCap;
    }

    /**
     * Set budget cap
     * @param {number} cap - Budget cap amount
     */
    setBudgetCap(cap) {
        if (typeof cap === 'number' && cap >= 0) {
            this.budgetCap = cap;
        } else if (cap === null) {
            this.budgetCap = null;
        } else {
            throw new Error('Budget cap must be a non-negative number or null');
        }
    }

    // Statistics and analytics
    
    /**
     * Calculate spending statistics
     * @param {Object} options - Calculation options
     * @returns {Object} Statistics object
     */
    calculateStatistics(options = {}) {
        const transactions = options.transactions || this.getTransactions();
        const now = new Date();
        
        // Basic stats
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
        
        // Date-based stats
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        
        const todaySpending = this.getSpendingForPeriod(transactions, today, now);
        const weekSpending = this.getSpendingForPeriod(transactions, weekAgo, now);
        const monthSpending = this.getSpendingForPeriod(transactions, monthStart, now);
        const yearSpending = this.getSpendingForPeriod(transactions, yearStart, now);
        
        // Category analysis
        const categoryStats = this.getCategoryStatistics(transactions);
        
        // Monthly trends (last 12 months)
        const monthlyTrends = this.getMonthlyTrends(transactions);
        
        return {
            basic: {
                totalTransactions,
                totalAmount,
                averageAmount
            },
            periods: {
                today: todaySpending,
                week: weekSpending,
                month: monthSpending,
                year: yearSpending
            },
            categories: categoryStats,
            trends: monthlyTrends,
            budget: this.budgetCap ? {
                cap: this.budgetCap,
                spent: monthSpending,
                remaining: Math.max(0, this.budgetCap - monthSpending),
                percentage: (monthSpending / this.budgetCap) * 100
            } : null
        };
    }

    /**
     * Get spending for a specific period
     * @param {Array} transactions - Transactions to analyze
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} Total spending for period
     */
    getSpendingForPeriod(transactions, startDate, endDate) {
        return transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Get category statistics
     * @param {Array} transactions - Transactions to analyze
     * @returns {Object} Category statistics
     */
    getCategoryStatistics(transactions) {
        const categoryTotals = {};
        const categoryCounts = {};
        
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        });
        
        const sortedCategories = Object.entries(categoryTotals)
            .map(([category, amount]) => ({
                category,
                amount,
                count: categoryCounts[category],
                average: amount / categoryCounts[category]
            }))
            .sort((a, b) => b.amount - a.amount);
        
        return {
            totals: categoryTotals,
            counts: categoryCounts,
            sorted: sortedCategories,
            top: sortedCategories[0]?.category || null,
            topAmount: sortedCategories[0]?.amount || 0
        };
    }

    /**
     * Get monthly spending trends
     * @param {Array} transactions - Transactions to analyze
     * @returns {Array} Monthly trend data
     */
    getMonthlyTrends(transactions) {
        const now = new Date();
        const trends = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            
            const monthSpending = this.getSpendingForPeriod(transactions, date, nextMonth);
            const monthTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= date && transactionDate < nextMonth;
            });
            
            trends.push({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                monthName: date.toLocaleString('default', { month: 'long' }),
                spending: monthSpending,
                transactionCount: monthTransactions.length,
                average: monthTransactions.length > 0 ? monthSpending / monthTransactions.length : 0
            });
        }
        
        return trends;
    }

    // Utility methods
    
    /**
     * Validate transaction object
     * @param {Object} transaction - Transaction to validate
     * @throws {Error} If transaction is invalid
     */
    validateTransaction(transaction) {
        if (!transaction || typeof transaction !== 'object') {
            throw new Error('Transaction must be an object');
        }
        
        if (typeof transaction.id !== 'string' || transaction.id.trim().length === 0) {
            throw new Error('Transaction must have a valid ID');
        }
        
        if (typeof transaction.description !== 'string' || transaction.description.trim().length === 0) {
            throw new Error('Transaction must have a valid description');
        }
        
        if (typeof transaction.amount !== 'number' || transaction.amount < 0) {
            throw new Error('Transaction amount must be a non-negative number');
        }
        
        if (typeof transaction.category !== 'string' || transaction.category.trim().length === 0) {
            throw new Error('Transaction must have a valid category');
        }
        
        if (typeof transaction.date !== 'string' || !this.isValidDateString(transaction.date)) {
            throw new Error('Transaction must have a valid date');
        }
    }

    /**
     * Check if a date string is valid
     * @param {string} dateString - Date string to validate
     * @returns {boolean} Is valid date
     */
    isValidDateString(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.transactions = [];
        this.categories = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
        this.budgetCap = null;
        this.filters = {
            search: '',
            category: '',
            dateRange: null
        };
        this.sortConfig = {
            field: 'date',
            direction: 'desc'
        };
    }

    /**
     * Get application state summary
     * @returns {Object} State summary
     */
    getStateSummary() {
        return {
            transactionCount: this.transactions.length,
            categoryCount: this.categories.length,
            hasBudgetCap: this.budgetCap !== null,
            totalSpending: this.transactions.reduce((sum, t) => sum + t.amount, 0),
            dateRange: this.getDateRange(),
            lastUpdated: this.getLastUpdated()
        };
    }

    /**
     * Get date range of transactions
     * @returns {Object|null} Date range or null if no transactions
     */
    getDateRange() {
        if (this.transactions.length === 0) return null;
        
        const dates = this.transactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        return {
            earliest: minDate.toISOString().split('T')[0],
            latest: maxDate.toISOString().split('T')[0],
            daySpan: Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
        };
    }

    /**
     * Get last updated timestamp
     * @returns {string|null} ISO timestamp or null if no transactions
     */
    getLastUpdated() {
        if (this.transactions.length === 0) return null;
        
        const timestamps = this.transactions
            .map(t => new Date(t.updatedAt || t.createdAt))
            .filter(date => !isNaN(date.getTime()));
        
        if (timestamps.length === 0) return null;
        
        return new Date(Math.max(...timestamps)).toISOString();
    }
}

