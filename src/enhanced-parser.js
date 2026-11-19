// Enhanced parser specifically for your tracker report format
class EnhancedTrackerParser {
  constructor() {
    this.parsedData = [];
    this.debugMode = false;
  }

  parseSpecificFormat(text) {
    // Detect which format we're dealing with
    if (this.isSimpleColumnFormat(text)) {
      return this.parseColumnFormat(text);
    } else {
      return this.parseStackedFormat(text);
    }
  }

  isSimpleColumnFormat(text) {
    // Check if text contains item numbers in format: 382974/2.1/3
    // and times in separate columns
    return /\d{6}\/[\d.]+\/\d+/.test(text) && text.includes('Item #');
  }

  parseColumnFormat(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    this.debug('Parsing column format with', lines.length, 'lines');
    
    const jobs = [];
    const itemNumbers = [];
    const allTimes = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect item number section (format: 382974/2.1/3)
      if (line.match(/^\d{6}\/[\d.]+\/\d+$/)) {
        itemNumbers.push(line);
        this.debug('Found item:', line);
        continue;
      }
      
      // Detect time entries (format: 0h 05:00 or 17h 30:00 or 1d 5h 15:43)
      // More flexible regex to handle various time formats
      if (line.match(/^\d+[hd]\s+\d+:\d+$/)) {
        allTimes.push(line);
        this.debug('Found time:', line);
        continue;
      }
    }
    
    this.debug(`Found ${itemNumbers.length} items and ${allTimes.length} times`);
    
    // If we didn't find any items or times, return empty
    if (itemNumbers.length === 0 || allTimes.length === 0) {
      this.debug('ERROR: No items or times found!');
      return jobs;
    }
    
    // The times are in two blocks: first half is estimated, second half is actual
    const halfPoint = Math.floor(allTimes.length / 2);
    const estimatedTimes = allTimes.slice(0, halfPoint);
    const actualTimes = allTimes.slice(halfPoint);
    
    this.debug(`Split into ${estimatedTimes.length} estimated and ${actualTimes.length} actual times`);
    
    // Match items to times
    const minLength = Math.min(itemNumbers.length, estimatedTimes.length, actualTimes.length);
    this.debug(`Matching ${minLength} items with times`);
    
    for (let i = 0; i < minLength; i++) {
      const itemParts = itemNumbers[i].split('/');
      jobs.push({
        jobNumber: itemParts[0],
        description: `Item ${itemNumbers[i]}`,
        qty: itemParts[1] || '1',
        startDate: '',
        estimated: this.normalizeTime(estimatedTimes[i]),
        actual: this.normalizeTime(actualTimes[i]),
        numberOfStitches: '',
        notes: ''
      });
    }
    
    this.debug('Parsed', jobs.length, 'jobs from column format');
    return jobs;
  }

  normalizeTime(timeStr) {
    // Convert formats like "0h 05:00" or "1d 5h 15:43" to "0 Hrs 05:00"
    if (!timeStr) return '0 Hrs 00:00';
    
    // Handle day format: "1d 5h 15:43"
    const dayMatch = timeStr.match(/(\d+)d\s+(\d+)h\s+(\d+):(\d+)/);
    if (dayMatch) {
      const totalHours = parseInt(dayMatch[1]) * 24 + parseInt(dayMatch[2]);
      return `${totalHours} Hrs ${dayMatch[3]}:${dayMatch[4]}`;
    }
    
    // Handle hour format: "0h 05:00"
    const hourMatch = timeStr.match(/(\d+)h\s+(\d+):(\d+)/);
    if (hourMatch) {
      return `${hourMatch[1]} Hrs ${hourMatch[2]}:${hourMatch[3]}`;
    }
    
    return timeStr;
  }

  parseStackedFormat(text) {
    this.debug('Parsing stacked format');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Split the text into pages based on "Page X of Y" markers
    const pages = this.splitIntoPages(text);
    this.debug('Found', pages.length, 'pages');
    
    const allJobs = [];
    
    // Process each page separately
    for (let pageNum = 0; pageNum < pages.length; pageNum++) {
      this.debug(`\n=== Processing Page ${pageNum + 1} ===`);
      const pageText = pages[pageNum];
      const pageLines = pageText.split('\n').map(line => line.trim()).filter(line => line);
      
      // Find where the job data ends and time data begins
      const timeDataStartIndex = this.findTimeDataStart(pageLines);
      this.debug('Time data starts at line:', timeDataStartIndex);
      
      // Parse jobs from top section
      const jobLines = timeDataStartIndex > 0 ? pageLines.slice(0, timeDataStartIndex) : pageLines;
      const jobs = this.parseJobsFromLines(jobLines);
      this.debug('Found', jobs.length, 'jobs in page', pageNum + 1);
      
      // Parse time data from bottom section
      const timeLines = timeDataStartIndex > 0 ? pageLines.slice(timeDataStartIndex) : [];
      const timePairs = this.parseTimePairs(timeLines);
      this.debug('Found', timePairs.length, 'time pairs in page', pageNum + 1);
      
      // Match time pairs to jobs by position
      this.matchTimesByPosition(jobs, timePairs);
      
      // Add jobs to final result
      allJobs.push(...jobs);
    }

    this.debug('\nTotal jobs parsed:', allJobs.length);
    return allJobs;
  }

  splitIntoPages(text) {
    const pages = [];
    const pageMarkers = text.split(/Page \d+ of \d+/);
    
    // If no page markers found, treat entire text as one page
    if (pageMarkers.length <= 1) {
      return [text];
    }
    
    // Skip first element if it's just the header
    for (let i = 1; i < pageMarkers.length; i++) {
      if (pageMarkers[i].trim()) {
        pages.push(pageMarkers[i].trim());
      }
    }
    
    return pages.length > 0 ? pages : [text];
  }

  findTimeDataStart(lines) {
    // Look for "Estimated" header which marks the start of the time data section
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('Estimated') && lines[i].includes('Actual')) {
        return i;
      }
      if (lines[i] === 'Estimated' && i + 1 < lines.length && lines[i + 1] === 'Actual') {
        return i;
      }
    }
    return -1;
  }

  parseJobsFromLines(lines) {
    const jobs = [];
    let currentJob = null;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Look for job number pattern (6 digits followed by description)
      const jobMatch = line.match(/^(\d{6})\s+(.+)$/);
      
      if (jobMatch) {
        // Save previous job
        if (currentJob && this.isValidJob(currentJob)) {
          jobs.push(currentJob);
        }

        // Start new job
        currentJob = {
          jobNumber: jobMatch[1],
          description: this.cleanDescription(jobMatch[2]),
          qty: 1,
          startDate: '',
          estimated: '0 Hrs 00:00',
          actual: '0 Hrs 00:00',
          numberOfStitches: '',
          notes: ''
        };

        this.debug('Found job:', currentJob.jobNumber, currentJob.description);

        // Look ahead for related data
        let lookAhead = 1;
        while (i + lookAhead < lines.length && lookAhead < 15) {
          const nextLine = lines[i + lookAhead];
          
          // Extract date
          if (!currentJob.startDate && /\d{1,2}\/\d{1,2}\/\d{4}/.test(nextLine)) {
            const dateMatch = nextLine.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch) {
              currentJob.startDate = dateMatch[1];
              this.debug('Found date:', currentJob.startDate);
            }
          }

          // Extract quantity
          if (/^\d{1,3}$/.test(nextLine) && parseInt(nextLine) < 1000) {
            currentJob.qty = parseInt(nextLine);
            this.debug('Found quantity:', currentJob.qty);
          }

          // Extract number of stitches
          if (nextLine.includes('Number of Stitches')) {
            const prevLine = lines[i + lookAhead - 1];
            const stitchMatch = prevLine.match(/(\d{1,3}(?:,\d{3})*)/);
            if (stitchMatch) {
              currentJob.numberOfStitches = stitchMatch[1].replace(/,/g, '');
              this.debug('Found stitches:', currentJob.numberOfStitches);
            }
          }

          // Look for notes
          if (this.isNoteLine(nextLine)) {
            currentJob.notes = nextLine;
            this.debug('Found note:', currentJob.notes);
          }

          lookAhead++;
          
          // Stop looking ahead if we hit another job number
          if (/^\d{6}\s+/.test(nextLine)) {
            break;
          }
        }
        
        // Skip processed lines
        i += Math.min(lookAhead - 1, 5);
      }
      
      i++;
    }

    // Add the last job
    if (currentJob && this.isValidJob(currentJob)) {
      jobs.push(currentJob);
    }

    return jobs;
  }

  parseTimePairs(lines) {
    const timePairs = [];
    
    for (const line of lines) {
      // Skip "Location Total:" lines - these are summaries, not individual jobs
      if (line.includes('Location Total:')) {
        continue;
      }
      
      // Look for stacked time format: "X Hrs XX:XX Y Hrs YY:YY"
      const timePattern = /(\d+)\s+Hrs\s+(\d{2}):(\d{2})\s+(\d+)\s+Hrs\s+(\d{2}):(\d{2})/;
      const match = line.match(timePattern);
      
      if (match) {
        const estimated = `${match[1]} Hrs ${match[2]}:${match[3]}`;
        const actual = `${match[4]} Hrs ${match[5]}:${match[6]}`;
        
        timePairs.push({ estimated, actual });
        this.debug('Found time pair:', estimated, '->', actual);
      }
    }
    
    return timePairs;
  }

  matchTimesByPosition(jobs, timePairs) {
    // Match times to jobs by position (order they appear)
    for (let i = 0; i < jobs.length && i < timePairs.length; i++) {
      jobs[i].estimated = timePairs[i].estimated;
      jobs[i].actual = timePairs[i].actual;
      this.debug(`Matched job ${jobs[i].jobNumber} with times: ${timePairs[i].estimated} / ${timePairs[i].actual}`);
    }
    
    // Warn if mismatch
    if (jobs.length !== timePairs.length) {
      this.debug(`WARNING: Job count (${jobs.length}) doesn't match time pair count (${timePairs.length})`);
    }
  }

  cleanDescription(desc) {
    // Remove dates and times from description
    return desc
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '')
      .replace(/\d{1,2}:\d{2}:\d{2}\s+[AP]M/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  isValidJob(job) {
    return job.jobNumber && job.jobNumber.length === 6 && job.description;
  }

  isNoteLine(line) {
    const notePatterns = [
      /ran on.*machine/i,
      /also did/i,
      /sewout/i,
      /customer/i,
      /provided/i,
      /supplied/i
    ];
    
    return notePatterns.some(pattern => pattern.test(line)) && !line.match(/^\d{6}/);
  }

  debug(...args) {
    if (this.debugMode) {
      console.log('[TrackerParser]', ...args);
    }
  }
}

// Test the enhanced parser with your sample data
function testEnhancedParser() {
  const parser = new EnhancedTrackerParser();
  parser.debugMode = true;
  
  const sampleText = `1/20/26
Estimated vs. Actual
1/1/2025 - 12/31/2025
Job#
Qty
Description
Start End
Pause
Marquis, Shannon
1
383267 Embroidered Women's Qu 1/2/2025
1/2/2025
1/2/2025
5,000
Number of Stitches
6:19:13 AM
6:25:20 AM
6:25:20 AM
1
383282 Online Store Order No. 00 1/3/2025
1/3/2025
1/3/2025
3,000
Number of Stitches
6:04:34 AM
6:07:50 AM
6:07:50 AM
Page 1 of 79
Estimated
Actual
0 Hrs 05:00 0 Hrs 06:04
0 Hrs 03:00 0 Hrs 03:13`;

  const results = parser.parseSpecificFormat(sampleText);
  console.log('Test results:', results);
  return results;
}

// Export for use
window.EnhancedTrackerParser = EnhancedTrackerParser;
window.testEnhancedParser = testEnhancedParser;