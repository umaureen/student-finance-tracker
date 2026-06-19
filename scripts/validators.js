// Validation Manager - Handles form validation and regex patterns
export class ValidationManager {
    constructor() {
        // Define validation regex patterns
        this.patterns = {
            // Description: no leading/trailing spaces, collapse multiple spaces
            description: /^\S(?:.*\S)?$/,
            
            // Amount: positive numbers with optional 2 decimal places
            amount: /^(0*[1-9]\d*(\.\d{1,2})?|0+\.([1-9]\d?|0[1-9]))$/,
            
            // Date: YYYY-MM-DD format
            date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
            
            // Category: letters, spaces, hyphens only
            category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
            
            // Advanced patterns for search functionality
            duplicateWords: /\b(\w+)\s+\1\b/gi,
            emailPattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phonePattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            
            // Financial patterns
            currency: /\$\d+\.?\d*/g,
            percentage: /\d+\.?\d*%/g,
            
            // Password strength (for potential future use)
            strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        };
        
        // Error messages
        this.errorMessages = {
            description: {
                required: 'Description is required',
                invalid: 'Description cannot start or end with spaces and cannot be empty',
                tooLong: 'Description must be less than 200 characters'
            },
            amount: {
                required: 'Amount is required',
                invalid: 'Amount must be a valid positive number with up to 2 decimal places',
                tooSmall: 'Amount must be greater than 0',
                tooLarge: 'Amount must be less than 1,000,000'
            },
            date: {
                required: 'Date is required',
                invalid: 'Date must be in YYYY-MM-DD format',
                future: 'Date cannot be in the future',
                tooOld: 'Date cannot be more than 10 years ago'
            },
            category: {
                required: 'Category is required',
                invalid: 'Category can only contain letters, spaces, and hyphens'
            }
        };
    }

    /**
     * Validate a complete transaction object
     * @param {Object} transaction - Transaction to validate
     * @returns {Object} Validation result with isValid boolean and errors object
     */
    validateTransaction(transaction) {
        const errors = {};
        let isValid = true;

        // Validate description
        const descriptionResult = this.validateDescription(transaction.description);
        if (!descriptionResult.isValid) {
            errors.description = descriptionResult.error;
            isValid = false;
        }

        // Validate amount
        const amountResult = this.validateAmount(transaction.amount);
        if (!amountResult.isValid) {
            errors.amount = amountResult.error;
            isValid = false;
        }

        // Validate date
        const dateResult = this.validateDate(transaction.date);
        if (!dateResult.isValid) {
            errors.date = dateResult.error;
            isValid = false;
        }

        // Validate category
        const categoryResult = this.validateCategory(transaction.category);
        if (!categoryResult.isValid) {
            errors.category = categoryResult.error;
            isValid = false;
        }

        return { isValid, errors };
    }

    /**
     * Validate description field
     * @param {string} description - Description to validate
     * @returns {Object} Validation result
     */
    validateDescription(description) {
        if (!description || typeof description !== 'string') {
            return { isValid: false, error: this.errorMessages.description.required };
        }

        const trimmedDescription = description.trim();
        
        if (trimmedDescription.length === 0) {
            return { isValid: false, error: this.errorMessages.description.required };
        }

        if (trimmedDescription.length > 200) {
            return { isValid: false, error: this.errorMessages.description.tooLong };
        }

        // Check for leading/trailing spaces or multiple consecutive spaces
        if (!this.patterns.description.test(description)) {
            return { isValid: false, error: this.errorMessages.description.invalid };
        }

        // Advanced validation: check for duplicate words
        const duplicateMatches = description.match(this.patterns.duplicateWords);
        if (duplicateMatches) {
            return { 
                isValid: false, 
                error: `Duplicate words found: "${duplicateMatches[0]}"` 
            };
        }

        return { isValid: true };
    }

    /**
     * Validate amount field
     * @param {string|number} amount - Amount to validate
     * @returns {Object} Validation result
     */
    validateAmount(amount) {
        if (amount === null || amount === undefined || amount === '') {
            return { isValid: false, error: this.errorMessages.amount.required };
        }

        const amountString = typeof amount === 'number' ? amount.toString() : amount;
        
        if (typeof amountString !== 'string') {
            return { isValid: false, error: this.errorMessages.amount.invalid };
        }

        // Test against regex pattern
        if (!this.patterns.amount.test(amountString)) {
            return { isValid: false, error: this.errorMessages.amount.invalid };
        }

        const numericAmount = parseFloat(amountString);
        
        if (isNaN(numericAmount)) {
            return { isValid: false, error: this.errorMessages.amount.invalid };
        }

        if (numericAmount <= 0) {
            return { isValid: false, error: this.errorMessages.amount.tooSmall };
        }

        if (numericAmount >= 1000000) {
            return { isValid: false, error: this.errorMessages.amount.tooLarge };
        }

        return { isValid: true, cleanValue: numericAmount };
    }

    /**
     * Validate date field
     * @param {string} date - Date to validate
     * @returns {Object} Validation result
     */
    validateDate(date) {
        if (!date || typeof date !== 'string') {
            return { isValid: false, error: this.errorMessages.date.required };
        }

        // Test format with regex
        if (!this.patterns.date.test(date)) {
            return { isValid: false, error: this.errorMessages.date.invalid };
        }

        // Additional date validation
        const dateObj = new Date(date);
        const today = new Date();
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(today.getFullYear() - 10);

        // Check if it's a valid date
        if (isNaN(dateObj.getTime())) {
            return { isValid: false, error: this.errorMessages.date.invalid };
        }

        // Check if date is in the future
        if (dateObj > today) {
            return { isValid: false, error: this.errorMessages.date.future };
        }

        // Check if date is too old
        if (dateObj < tenYearsAgo) {
            return { isValid: false, error: this.errorMessages.date.tooOld };
        }

        return { isValid: true };
    }

    /**
     * Validate category field
     * @param {string} category - Category to validate
     * @returns {Object} Validation result
     */
    validateCategory(category) {
        if (!category || typeof category !== 'string') {
            return { isValid: false, error: this.errorMessages.category.required };
        }

        const trimmedCategory = category.trim();
        
        if (trimmedCategory.length === 0) {
            return { isValid: false, error: this.errorMessages.category.required };
        }

        if (!this.patterns.category.test(trimmedCategory)) {
            return { isValid: false, error: this.errorMessages.category.invalid };
        }

        return { isValid: true };
    }

    /**
     * Validate import data structure
     * @param {Object} data - Data to validate
     * @returns {Object} Validation result
     */
    validateImportData(data) {
        const errors = [];
        let isValid = true;

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ['Invalid data format'] };
        }

        // Validate transactions array if present
        if (data.transactions) {
            if (!Array.isArray(data.transactions)) {
                errors.push('Transactions must be an array');
                isValid = false;
            } else {
                // Validate each transaction
                data.transactions.forEach((transaction, index) => {
                    const transactionValidation = this.validateTransaction(transaction);
                    if (!transactionValidation.isValid) {
                        const transactionErrors = Object.values(transactionValidation.errors);
                        errors.push(`Transaction ${index + 1}: ${transactionErrors.join(', ')}`);
                        isValid = false;
                    }
                });
            }
        }

        // Validate categories array if present
        if (data.categories) {
            if (!Array.isArray(data.categories)) {
                errors.push('Categories must be an array');
                isValid = false;
            } else {
                data.categories.forEach((category, index) => {
                    const categoryValidation = this.validateCategory(category);
                    if (!categoryValidation.isValid) {
                        errors.push(`Category ${index + 1}: ${categoryValidation.error}`);
                        isValid = false;
                    }
                });
            }
        }

        // Validate budget cap if present
        if (data.budgetCap !== undefined && data.budgetCap !== null) {
            if (typeof data.budgetCap !== 'number' || data.budgetCap < 0) {
                errors.push('Budget cap must be a non-negative number');
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    /**
     * Validate search pattern and compile regex
     * @param {string} pattern - Regex pattern to validate
     * @param {string} flags - Regex flags
     * @returns {Object} Validation result with compiled regex
     */
    validateSearchPattern(pattern, flags = 'i') {
        if (!pattern || typeof pattern !== 'string') {
            return { isValid: true, regex: null }; // Empty pattern is valid
        }

        try {
            const regex = new RegExp(pattern, flags);
            return { isValid: true, regex };
        } catch (error) {
            return { 
                isValid: false, 
                error: `Invalid regex pattern: ${error.message}`,
                regex: null 
            };
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {Object} Validation result
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { isValid: false, error: 'Email is required' };
        }

        if (!this.patterns.emailPattern.test(email)) {
            return { isValid: false, error: 'Invalid email format' };
        }

        return { isValid: true };
    }

    /**
     * Check password strength
     * @param {string} password - Password to check
     * @returns {Object} Strength assessment
     */
    validatePasswordStrength(password) {
        if (!password || typeof password !== 'string') {
            return { 
                isValid: false, 
                strength: 'none',
                error: 'Password is required' 
            };
        }

        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            digit: /\d/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        
        let strength = 'weak';
        if (passedChecks >= 5) strength = 'strong';
        else if (passedChecks >= 3) strength = 'medium';

        const isValid = this.patterns.strongPassword.test(password);

        return {
            isValid,
            strength,
            checks,
            score: passedChecks,
            maxScore: 5
        };
    }

    /**
     * Search for specific patterns in text
     * @param {string} text - Text to search
     * @param {string} patternName - Name of predefined pattern
     * @returns {Array} Array of matches
     */
    findPatterns(text, patternName) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const pattern = this.patterns[patternName];
        if (!pattern) {
            return [];
        }

        return Array.from(text.matchAll(pattern)) || [];
    }

    /**
     * Clean and sanitize user input
     * @param {string} input - Input to clean
     * @param {Object} options - Cleaning options
     * @returns {string} Cleaned input
     */
    sanitizeInput(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        let cleaned = input;

        // Trim whitespace
        if (options.trim !== false) {
            cleaned = cleaned.trim();
        }

        // Collapse multiple spaces
        if (options.collapseSpaces !== false) {
            cleaned = cleaned.replace(/\s+/g, ' ');
        }

        // Remove HTML tags
        if (options.stripHtml) {
            cleaned = cleaned.replace(/<[^>]*>/g, '');
        }

        // Limit length
        if (options.maxLength && typeof options.maxLength === 'number') {
            cleaned = cleaned.substring(0, options.maxLength);
        }

        // Convert to lowercase
        if (options.toLowerCase) {
            cleaned = cleaned.toLowerCase();
        }

        // Remove special characters (keep only alphanumeric, spaces, hyphens)
        if (options.alphanumericOnly) {
            cleaned = cleaned.replace(/[^a-zA-Z0-9\s-]/g, '');
        }

        return cleaned;
    }

    /**
     * Real-time validation for form fields
     * @param {HTMLElement} field - Form field element
     * @param {string} validationType - Type of validation to perform
     * @returns {Object} Validation result
     */
    validateField(field, validationType) {
        if (!field || !field.value) {
            return { isValid: false, error: 'Field is required' };
        }

        const value = field.value;

        switch (validationType) {
            case 'description':
                return this.validateDescription(value);
            case 'amount':
                return this.validateAmount(value);
            case 'date':
                return this.validateDate(value);
            case 'category':
                return this.validateCategory(value);
            default:
                return { isValid: true };
        }
    }

    /**
     * Get all available validation patterns
     * @returns {Object} Object with pattern names and descriptions
     */
    getAvailablePatterns() {
        return {
            description: 'Validates description text (no leading/trailing spaces)',
            amount: 'Validates monetary amounts (positive numbers with up to 2 decimals)',
            date: 'Validates date in YYYY-MM-DD format',
            category: 'Validates category names (letters, spaces, hyphens only)',
            duplicateWords: 'Finds duplicate consecutive words',
            emailPattern: 'Finds email addresses',
            phonePattern: 'Finds phone numbers',
            currency: 'Finds currency amounts',
            percentage: 'Finds percentage values',
            strongPassword: 'Validates strong passwords (8+ chars, mixed case, numbers, symbols)'
        };
    }

    /**
     * Generate test data for validation testing
     * @returns {Object} Test cases for different validation scenarios
     */
    getTestCases() {
        return {
            description: {
                valid: [
                    'Coffee at Starbucks',
                    'Lunch with friends',
                    'Gas for car',
                    'Single word'
                ],
                invalid: [
                    ' Leading space',
                    'Trailing space ',
                    '  Multiple  spaces  ',
                    '',
                    'duplicate duplicate words',
                    'a'.repeat(201) // Too long
                ]
            },
            amount: {
                valid: [
                    '10.50',
                    '100',
                    '0.01',
                    '999999.99'
                ],
                invalid: [
                    '0',
                    '-10',
                    '10.123',
                    'abc',
                    '1000000',
                    ''
                ]
            },
            date: {
                valid: [
                    '2024-01-15',
                    '2023-12-31',
                    new Date().toISOString().split('T')[0] // Today
                ],
                invalid: [
                    '2025-12-31', // Future
                    '2010-01-01', // Too old
                    '2024-13-01', // Invalid month
                    '2024-01-32', // Invalid day
                    'invalid-date'
                ]
            },
            category: {
                valid: [
                    'Food',
                    'Books and Supplies',
                    'Health-Care',
                    'Entertainment'
                ],
                invalid: [
                    'Food123',
                    'Food & Drinks',
                    'Food@Home',
                    '123',
                    ''
                ]
            }
        };
    }
}

