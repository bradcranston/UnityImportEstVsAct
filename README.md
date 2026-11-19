# JS Dev Kit for FileMaker Developers

*Develop, Render, and Deploy JavaScript for a FileMaker App*

# Unity Import Estimated vs Actual Parser

This project parses Unity embroidery tracker reports (exported as PDF text) and converts them to structured data for FileMaker import.

## Features
- Parses complex PDF-extracted text with stacked estimated/actual times
- Handles multi-page reports with page breaks
- Exports to CSV or tab-delimited format
- FileMaker-ready JavaScript functions

## Available Functions for FileMaker

### `parseRawTrackerData(textData)`
Parses raw PDF text with stacked format (estimated/actual at bottom of pages).

**Usage in FileMaker:**
```javascript
// Copy PDF text into variable
Set Variable [ $pdfText ; Value: YourTextField ]

// Call JavaScript function in web viewer
Set Variable [ $result ; Value: GetLayoutObjectAttribute ( "webviewer" ; "source" ; 
  "parseRawTrackerData(" & Quote ( $pdfText ) & ")" ) ]

// Parse JSON result
Set Variable [ $success ; Value: JSONGetElement ( $result ; "success" ) ]
Set Variable [ $jobCount ; Value: JSONGetElement ( $result ; "jobCount" ) ]
Set Variable [ $tabData ; Value: JSONGetElement ( $result ; "tabDelimitedData" ) ]
```

**Returns:** JSON with:
- `success`: boolean
- `jobCount`: number of jobs parsed
- `tabDelimitedData`: tab-delimited string ready for import
- `jobsData`: array of job objects

### `parseTrackerReportToCSV(textData)`
Original parser function for simpler formats.

**Returns:** JSON with CSV data

## Data Format

The parser handles this PDF format:
```
Job# Qty Description Dates...
383267 Embroidered Women's... 1/2/2025
5,000
Number of Stitches
...

Page 1 of 79
Estimated    Actual
0 Hrs 05:00  0 Hrs 06:04
0 Hrs 03:00  0 Hrs 03:13
```

## Output Fields
- Job Number
- Quantity
- Description  
- Start Date
- Estimated (hours)
- Actual (hours)
- Number of Stitches
- Notes

# This Kit
## What it does
This environment allows a FileMaker developer to start coding their widget and see the results right away in a FileMaker file. Once done developing, the can be inlined and pushed to the FileMaker file for use offline.
<br/>
It's a template file, so you can use to start other projects.
## Consists of
- A repository template on Github
- A basic html / JS set up.
- package.json file for install
- A FileMaker file to show the widget rendered
- Scripts to build and upload the inlined code to FileMaker
## TO GET STARTED Using this file
1. `npm install`
2. `npm start`
3. Open the jsDev.fmp12 file.
4. Allow it to work in Dev mode.

At this point you should see the web viewer on the layout load up with the HTML and JavaScript here. Edit the JavaScript or the HTML and you'll see the render in the web viewer update.

## Use this kit
Now you're ready to use this kit to create awesome JS widgets.
