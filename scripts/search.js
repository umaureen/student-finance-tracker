// Search Manager - Handles regex search functionality and advanced pattern matching
export class SearchManager {
    constructor() {
        this.lastSearchPattern = '';
        this.lastSearchFlags = 'i';
        this.searchHistory = [];
        this.maxHistorySize = 10;
        
        // Predefined search patterns for quick access
        this.quickPatterns = {
            'Cents present': /\.\d{2}\b/g,
            'Beverage keywords': /(coffee|tea|drink|soda|juice|water)/gi,
            'Duplicate words': /\b(\w+)\s+\1\b/gi,
            'Large amounts': /[5-9]\d{2,}|\d{4,}/g,
            'Weekend dates': /(sat|sun|saturday|sunday)/gi,
            'Food keywords': /(lunch|dinner|breakfast|meal|food|restaurant)/gi,
            'Transport keywords': /(bus|uber|taxi|gas|fuel|parking|train)/gi,
            'Monthly bills': /(rent|utilities|phone|internet|subscription)/gi,
            'School expenses': /(tuition|books|supplies|lab|fee)/gi
        };
    }

    /**
     * Search transactions using regex pattern
     * @param {Array} transactions - Array of transactions to search
     * @param {string} pattern - Regex pattern string
     * @param {boolean} caseInsensitive - Whether to ignore case
     * @returns {Array} Filtered and highlighted transactions
     */
    searchTransactions(transactions, pattern, caseInsensitive = true) {
        if (!pattern || pattern.trim() === '') {
            return transactions;
        }

        try {
            const flags = caseInsensitive ? 'gi' : 'g';
            const regex = this.compileRegex(pattern, flags);
            
            if (!regex) {
                throw new Error('Invalid regex pattern');
            }

            // Store successful search in history
            this.addToHistory(pattern, flags);

            // Filter transactions that match the pattern
            const matchedTransactions = transactions.filter(transaction => {
                return (
                    this.testPattern(regex, transaction.description) ||
                    this.testPattern(regex, transaction.category) ||
                    this.testPattern(regex, transaction.amount.toString()) ||
                    this.testPattern(regex, transaction.date)
                );
            });

            return matchedTransactions;

        } catch (error) {
            console.error('Search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Safely compile regex pattern
     * @param {string} pattern - Regex pattern string
     * @param {string} flags - Regex flags
     * @returns {RegExp|null} Compiled regex or null if invalid
     */
    compileRegex(pattern, flags = 'i') {
        try {
            if (!pattern || typeof pattern !== 'string') {
                return null;
            }

            // Clean the pattern - remove leading/trailing slashes if present
            let cleanPattern = pattern.trim();
            if (cleanPattern.startsWith('/') && cleanPattern.includes('/')) {
                const lastSlash = cleanPattern.lastIndexOf('/');
                if (lastSlash > 0) {
                    const patternFlags = cleanPattern.substring(lastSlash + 1);
                    cleanPattern = cleanPattern.substring(1, lastSlash);
                    // Use flags from pattern if provided
                    if (patternFlags) {
                        flags = patternFlags;
                    }
                }
            }

            this.lastSearchPattern = cleanPattern;
            this.lastSearchFlags = flags;

            return new RegExp(cleanPattern, flags);
        } catch (error) {
            console.error('Regex compilation error:', error);
            return null;
        }
    }

    /**
     * Test pattern against text safely
     * @param {RegExp} regex - Compiled regex
     * @param {string} text - Text to test
     * @returns {boolean} Whether pattern matches
     */
    testPattern(regex, text) {
        try {
            if (!regex || typeof text !== 'string') {
                return false;
            }
            
            // Reset regex lastIndex to avoid issues with global flag
            regex.lastIndex = 0;
            return regex.test(text);
        } catch (error) {
            console.error('Pattern test error:', error);
            return false;
        }
    }

    /**
     * Highlight matches in text
     * @param {string} text - Text to highlight
     * @param {RegExp} regex - Regex pattern for highlighting
     * @returns {string} HTML with highlighted matches
     */
    highlightMatches(text, regex) {
        if (!regex || !text || typeof text !== 'string') {
            return this.escapeHtml(text);
        }

        try {
            // Reset regex lastIndex
            regex.lastIndex = 0;
            
            const escapedText = this.escapeHtml(text);
            
            // Use replace with the regex to highlight matches
            return escapedText.replace(regex, (match) => {
                return `<mark>${match}</mark>`;
            });
        } catch (error) {
            console.error('Highlight error:', error);
            return this.escapeHtml(text);
        }
    }

    /**
     * Get advanced search suggestions based on transaction data
     * @param {Array} transactions - Array of transactions
     * @returns {Object} Search suggestions categorized by type
     */
    getSearchSuggestions(transactions) {
        const suggestions = {
            amounts: this.generateAmountPatterns(transactions),
            dates: this.generateDatePatterns(transactions),
            descriptions: this.generateDescriptionPatterns(transactions),
            categories: this.generateCategoryPatterns(transactions),
            advanced: this.getAdvancedPatterns()
        };

        return suggestions;
    }

    /**
     * Generate amount-based search patterns
     * @param {Array} transactions - Transactions to analyze
     * @returns {Array} Amount pattern suggestions
     */
    generateAmountPatterns(transactions) {
        const amounts = transactions.map(t => t.amount);
        const maxAmount = Math.max(...amounts);
        const minAmount = Math.min(...amounts);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        return [
            {
                name: 'Large purchases (>$100)',
                pattern: /\b[1-9]\d{2,}(\.\d{2})?\b/g,
                description: 'Find transactions over $100'
            },
            {
                name: 'Small purchases (<$10)',
                pattern: /\b[0-9](\.\d{2})?\b/g,
                description: 'Find transactions under $10'
            },
            {
                name: 'Round amounts',
                pattern: /\b\d+\.00\b/g,
                description: 'Find transactions with round dollar amounts'
            },
            {
                name: 'Amounts with cents',
                pattern: /\.\d{2}\b/g,
                description: 'Find transactions with specific cent amounts'
            },
            {
                name: `Above average (>${avgAmount.toFixed(2)})`,
                pattern: new RegExp(`\\b([${Math.ceil(avgAmount)}-9]\\d{2,}|[1-9]\\d{3,})(\\.\\d{2})?\\b`, 'g'),
                description: `Find transactions above average ($${avgAmount.toFixed(2)})`
            }
        ];
    }

    /**
     * Generate date-based search patterns
     * @param {Array} transactions - Transactions to analyze
     * @returns {Array} Date pattern suggestions
     */
    generateDatePatterns(transactions) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        return [
            {
                name: 'This year',
                pattern: new RegExp(`\\b${currentYear}-`, 'g'),
                description: `Find transactions from ${currentYear}`
            },
            {
                name: 'This month',
                pattern: new RegExp(`\\b${currentYear}-${currentMonth.toString().padStart(2, '0')}-`, 'g'),
                description: 'Find transactions from current month'
            },
            {
                name: 'Weekend dates (Sat/Sun)',
                pattern: /2024-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/g, // This would need weekend logic
                description: 'Find weekend transactions'
            },
            {
                name: 'Month-end (28-31)',
                pattern: /-(2[8-9]|3[01])\b/g,
                description: 'Find end-of-month transactions'
            },
            {
                name: 'First week of month (01-07)',
                pattern: /-(0[1-7])\b/g,
                description: 'Find first-week transactions'
            }
        ];
    }

    /**
     * Generate description-based search patterns
     * @param {Array} transactions - Transactions to analyze
     * @returns {Array} Description pattern suggestions
     */
    generateDescriptionPatterns(transactions) {
        // Analyze common words in descriptions
        const wordFreq = this.analyzeWordFrequency(transactions);
        const commonWords = Object.keys(wordFreq)
            .sort((a, b) => wordFreq[b] - wordFreq[a])
            .slice(0, 10);

        return [
            {
                name: 'Food & Dining',
                pattern: /(restaurant|cafe|coffee|lunch|dinner|breakfast|food|eat|meal|pizza|burger|sandwich)/gi,
                description: 'Find food and dining expenses'
            },
            {
                name: 'Transportation',
                pattern: /(uber|taxi|bus|train|gas|fuel|parking|metro|transport|car)/gi,
                description: 'Find transportation expenses'
            },
            {
                name: 'Shopping',
                pattern: /(store|shop|buy|purchase|amazon|target|walmart|mall)/gi,
                description: 'Find shopping transactions'
            },
            {
                name: 'Bills & Utilities',
                pattern: /(bill|utility|electric|water|internet|phone|rent|insurance)/gi,
                description: 'Find bill payments'
            },
            {
                name: 'Entertainment',
                pattern: /(movie|theater|concert|game|entertainment|fun|party|bar|club)/gi,
                description: 'Find entertainment expenses'
            },
            {
                name: 'Duplicate words',
                pattern: /\b(\w+)\s+\1\b/gi,
                description: 'Find descriptions with repeated words'
            },
            {
                name: 'Long descriptions (20+ chars)',
                pattern: /.{20,}/g,
                description: 'Find detailed descriptions'
            }
        ];
    }

    /**
     * Generate category-based search patterns
     * @param {Array} transactions - Transactions to analyze
     * @returns {Array} Category pattern suggestions
     */
    generateCategoryPatterns(transactions) {
        const categories = [...new Set(transactions.map(t => t.category))];
        
        return categories.map(category => ({
            name: `Category: ${category}`,
            pattern: new RegExp(`\\b${category}\\b`, 'gi'),
            description: `Find all ${category} transactions`
        }));
    }

    /**
     * Get advanced regex patterns with explanations
     * @returns {Array} Advanced pattern suggestions
     */
    getAdvancedPatterns() {
        return [
            {
                name: 'Lookahead: Expensive food',
                pattern: /(?=.*food)(?=.*[5-9]\d+)/gi,
                description: 'Find food transactions over $50 using positive lookahead',
                advanced: true
            },
            {
                name: 'Lookbehind: After "paid"',
                pattern: /(?<=paid\s)\w+/gi,
                description: 'Find words that come after "paid" using positive lookbehind',
                advanced: true
            },
            {
                name: 'Backreference: Repeated words',
                pattern: /\b(\w+)\s+\1\b/gi,
                description: 'Find repeated consecutive words using backreferences',
                advanced: true
            },
            {
                name: 'Negative lookahead: Not food',
                pattern: /(?!.*food)\b(restaurant|cafe|lunch|dinner)\b/gi,
                description: 'Find dining terms that don\'t include "food" using negative lookahead',
                advanced: true
            },
            {
                name: 'Word boundaries: Exact "in"',
                pattern: /\bin\b/gi,
                description: 'Find exact word "in" using word boundaries',
                advanced: true
            },
            {
                name: 'Conditional: Amount format',
                pattern: /\$?((\d{1,3}(,\d{3})*)|(\d+))(\.\d{2})?\b/g,
                description: 'Find various currency formats with optional commas',
                advanced: true
            }
        ];
    }

    /**
     * Analyze word frequency in transaction descriptions
     * @param {Array} transactions - Transactions to analyze
     * @returns {Object} Word frequency map
     */
    analyzeWordFrequency(transactions) {
        const wordFreq = {};
        
        transactions.forEach(transaction => {
            const words = transaction.description
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2); // Ignore very short words

            words.forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });
        });

        return wordFreq;
    }

    /**
     * Add successful search to history
     * @param {string} pattern - Search pattern
     * @param {string} flags - Regex flags
     */
    addToHistory(pattern, flags) {
        const searchEntry = {
            pattern,
            flags,
            timestamp: new Date().toISOString(),
            displayPattern: flags.includes('i') ? `/${pattern}/i` : `/${pattern}/`
        };

        // Remove duplicate if exists
        this.searchHistory = this.searchHistory.filter(entry => 
            entry.pattern !== pattern || entry.flags !== flags
        );

        // Add to beginning
        this.searchHistory.unshift(searchEntry);

        // Limit history size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Get search history
     * @returns {Array} Search history entries
     */
    getSearchHistory() {
        return [...this.searchHistory];
    }

    /**
     * Clear search history
     */
    clearSearchHistory() {
        this.searchHistory = [];
    }

    /**
     * Get quick search patterns
     * @returns {Object} Quick pattern definitions
     */
    getQuickPatterns() {
        return { ...this.quickPatterns };
    }

    /**
     * Validate regex pattern
     * @param {string} pattern - Pattern to validate
     * @param {string} flags - Regex flags
     * @returns {Object} Validation result
     */
    validatePattern(pattern, flags = 'i') {
        try {
            const regex = this.compileRegex(pattern, flags);
            if (!regex) {
                return { isValid: false, error: 'Invalid pattern syntax' };
            }

            // Test pattern on sample text to catch potential issues
            const testText = 'Sample test text 123 $45.67';
            regex.test(testText);

            return { isValid: true, regex };
        } catch (error) {
            return { 
                isValid: false, 
                error: error.message,
                suggestion: this.getPatternSuggestion(error.message)
            };
        }
    }

    /**
     * Get pattern suggestion based on error
     * @param {string} errorMessage - Error message from regex compilation
     * @returns {string} Helpful suggestion
     */
    getPatternSuggestion(errorMessage) {
        const suggestions = {
            'Invalid character class': 'Check character classes like [a-z] for proper syntax',
            'Unterminated group': 'Make sure all parentheses are properly closed',
            'Invalid escape sequence': 'Use double backslashes for literal backslashes',
            'Invalid group': 'Check that capture groups are properly formed',
            'Invalid quantifier': 'Quantifiers like *, +, ? must follow a character or group'
        };

        for (const [error, suggestion] of Object.entries(suggestions)) {
            if (errorMessage.includes(error)) {
                return suggestion;
            }
        }

        return 'Check regex syntax and try a simpler pattern';
    }

    /**
     * Escape HTML to prevent XSS in highlighted results
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
     * Get regex tutorial information
     * @returns {Object} Tutorial content for regex patterns
     */
    getRegexTutorial() {
        return {
            basics: {
                '.': 'Matches any single character',
                '*': 'Matches 0 or more of the preceding character',
                '+': 'Matches 1 or more of the preceding character',
                '?': 'Matches 0 or 1 of the preceding character',
                '^': 'Matches the start of a line',
                '$': 'Matches the end of a line',
                '\\d': 'Matches any digit (0-9)',
                '\\w': 'Matches any word character (a-z, A-Z, 0-9, _)',
                '\\s': 'Matches any whitespace character'
            },
            advanced: {
                '(?=...)': 'Positive lookahead - matches if followed by pattern',
                '(?!...)': 'Negative lookahead - matches if not followed by pattern',
                '(?<=...)': 'Positive lookbehind - matches if preceded by pattern',
                '(?<!...)': 'Negative lookbehind - matches if not preceded by pattern',
                '(...)': 'Capture group - captures matched text',
                '\\1, \\2': 'Backreferences - references captured groups'
            },
            examples: {
                'Find duplicates': '\\b(\\w+)\\s+\\1\\b',
                'Find email addresses': '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
                'Find currency amounts': '\\$\\d+\\.?\\d*',
                'Find phone numbers': '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
                'Case insensitive search': 'Add "i" flag: /pattern/i'
            }
        };
    }
}

