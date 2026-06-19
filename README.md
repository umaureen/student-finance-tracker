#  Student Finance Tracker

A comprehensive, accessible, and responsive web application designed to help students manage their finances effectively. Built with HTML, CSS, and JavaScript.


## Features

### Core Features
- **Dashboard**: Real-time financial statistics and spending analytics
- **Transaction Management**: Add, edit, delete, and search transactions
- **Advanced Search**: Powerful regex-based search with pattern highlighting
- **Budget Tracking**: Set monthly caps with progress monitoring
- **Multi-Currency**: Support for USD, EUR, GBP, CAD, RWF with custom exchange rates
- **Theme Toggle**: Light/dark mode with system preference detection
- **Data Persistence**: Local storage with import/export capabilities

### Advanced Features
- **Data Validation**: Comprehensive input validation with regex patterns
- **Smart Filtering**: Sort by date, amount, category, and description
- **Import/Export**: JSON data exchange with validation
- **Real-time Updates**: Live search and instant UI feedback
- **Theme System**: Persistent light/dark mode with smooth transitions

##  Theme

**Chosen Theme**: Student Finance Tracker

### Default Categories
- **Food**: Restaurant meals, groceries, cafeteria purchases
- **Books**: Textbooks, supplies, stationery
- **Transport**: Bus passes, Uber rides, gas, parking
- **Entertainment**: Movies, concerts, social activities
- **Fees**: Tuition, registration, gym membership
- **Other**: Miscellaneous expenses

### Supported Currencies
- **USD** ($) - US Dollar
- **EUR** (€) - Euro
- **GBP** (£) - British Pound
- **CAD** (C$) - Canadian Dollar
- **RWF** (Fr) - Rwandan Franc (formatted without decimals)

##  Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/umaureen/student-finance-tracker.git
   ```

3. **Load sample data (optional):**
   - Go to Settings → Import Data
   - Select the `seed.json` file
   - Click Import to load sample transactions


##  File Structure

```
FinanceTracker/
├── index.html              # Main application page
├── tests.html              # Test suite with validation demos
├── seed.json               # Sample data for testing
├── README.md               # This documentation
│
├── styles/
│   ├── main.css           # Core styles and components
│   └── responsive.css     # Mobile-first responsive design
│
├── scripts/
│   ├── main.js            # Application entry point and coordination
│   ├── storage.js         # localStorage management and data persistence
│   ├── state.js           # Application state management
│   ├── ui.js              # DOM manipulation and user interface
│   ├── validators.js      # Form validation and regex patterns
│   └── search.js          # Advanced search and regex functionality
│
└── assets/                # Images and icons (if needed)
```

### Module Responsibilities

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **main.js** | Application orchestration | Event handling, navigation, integration |
| **storage.js** | Data persistence | localStorage, import/export, validation |
| **state.js** | State management | Transaction CRUD, filtering, statistics |
| **ui.js** | User interface | DOM updates, rendering, accessibility |
| **validators.js** | Input validation | Regex patterns, form validation, sanitization |
| **search.js** | Search functionality | Regex compilation, pattern matching, highlighting |

##  Contact

- **Developer**: Umutesi Maureen
- **Email**: u.maureen@alustudent.com 
- **GitHub**: umaureen


