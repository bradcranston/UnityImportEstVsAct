# PDF Tracker Report Parser for FileMaker

A JavaScript-based parser designed to extract job tracking data from PDF reports and integrate with FileMaker Pro through a webviewer.

## Features

- **PDF Upload**: Direct PDF file processing using PDF.js
- **Text Input**: Manual text paste for quick testing
- **Data Extraction**: Parses job numbers, quantities, descriptions, dates, times, stitch counts, and notes
- **Excel Export**: Export parsed data to XLSX format
- **FileMaker Integration**: Direct integration with FileMaker Pro scripts
- **Enhanced Parser**: Specialized parsing for your specific tracker report format

## Files Overview

- `index.html` - Main interface with upload/paste functionality
- `src/index.js` - Core parser logic and UI handling
- `src/enhanced-parser.js` - Specialized parser for tracker report format
- `src/style.css` - Interface styling
- `test-parser.html` - Standalone testing interface
- `FileMaker_Script_Examples.txt` - Sample FileMaker scripts

## Data Fields Extracted

1. **Job #** - 6-digit job identifier
2. **Qty** - Quantity of items
3. **Description** - Job description
4. **Start Date** - Job start date (MM/DD/YYYY)
5. **Estimated** - Estimated time (X Hrs MM:SS)
6. **Actual** - Actual time calculated from start/end times
7. **Number of Stitches** - Stitch count
8. **Notes** - Additional notes (customer info, special instructions)

## Usage

### Standalone Testing
1. Open `test-parser.html` in a browser
2. Click "Run Test" to see sample data parsing
3. Check browser console for debug output

### FileMaker Integration
1. Create a webviewer object in FileMaker
2. Set the web address to your `index.html` file
3. Implement the provided FileMaker scripts
4. Use the exposed JavaScript functions:

```javascript
// Parse data from FileMaker
window.parseTrackerData(textData)

// Get parsed results
window.getParsedData()

// Clear the parser
window.clearParserData()
```

### Web Interface
1. Upload a PDF file or paste text
2. Click "Parse Data"
3. Review the parsed results in the table
4. Export to Excel or send to FileMaker

## FileMaker Setup

### Table Structure (Suggested)
```
JobTracking:
- JobNumber (Text)
- Quantity (Number)
- Description (Text)
- StartDate (Date)
- Estimated (Text)
- Actual (Text)
- NumberOfStitches (Number)
- Notes (Text)
- TrackerReportText (Text)
- ParsedDataJSON (Text)
```

### Required Scripts
1. **ProcessParsedData** - Processes JSON data from parser
2. **LoadTrackerData** - Sends text to parser
3. **GetParsedData** - Retrieves parsed JSON
4. **ClearParser** - Clears parser interface

## Error Handling

The parser includes comprehensive error handling:
- Invalid PDF files
- Malformed text data
- Missing required fields
- Time calculation errors
- FileMaker communication issues

## Debugging

Enable debug mode in the enhanced parser:
```javascript
const parser = new EnhancedTrackerParser();
parser.debugMode = true;
```

Check browser console for detailed parsing information.

## Dependencies

- **PDF.js** - PDF file processing
- **SheetJS/XLSX** - Excel file generation
- Modern browser with ES6 support
- FileMaker Pro 16+ (for webviewer integration)

## Setup Instructions

1. `npm install` (if using the development environment)
2. Open `index.html` in a browser or FileMaker webviewer
3. Test with sample data using the provided text file
4. Implement FileMaker scripts from `FileMaker_Script_Examples.txt`

## Sample Data Format

The parser expects text in this format:
```
383267 Embroidered Women's Qu 1/2/2025
1/2/2025
1/2/2025
5,000
Number of Stitches
6:19:13 AM
6:25:20 AM
6:25:20 AM
```

## Support

For troubleshooting:
1. Check browser console for errors
2. Verify PDF.js and XLSX libraries load correctly
3. Test with sample data using `test-parser.html`
4. Ensure FileMaker scripts match the provided examples

## Original Kit Info

This was originally the JS Dev Kit for FileMaker Developers - adapted for PDF parsing functionality.