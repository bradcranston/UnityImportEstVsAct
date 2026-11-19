// Simplified Tracker Report Parser for FileMaker Integration
class TrackerReportCSVParser {
  constructor() {
    this.statusText = document.getElementById('status-text');
    this.progressFill = document.getElementById('progress-fill');
    this.progressPercent = document.getElementById('progress-percent');
    this.resultInfo = document.getElementById('result-info');
    this.progressBar = document.querySelector('.progress-bar');
    this.exposeToFileMaker();
    this.updateStatus('Ready to parse data...');
  }

  updateStatus(message) {
    this.statusText.textContent = message;
  }

  updateProgress(percent, message = null) {
    this.progressFill.style.width = percent + '%';
    this.progressPercent.textContent = Math.round(percent) + '%';
    if (message) {
      this.updateStatus(message);
    }
  }

  showResult(type, message) {
    this.resultInfo.className = type;
    this.resultInfo.textContent = message;
    this.resultInfo.style.display = 'block';
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        this.resultInfo.style.display = 'none';
      }, 5000);
    }
  }

  async parseTrackerDataToCSV(textData) {
    try {
      this.updateStatus('Starting parse...');
      this.updateProgress(10);
      this.progressBar.classList.add('progress-active');
      
      // Use enhanced parser if available
      const parser = new window.EnhancedTrackerParser();
      this.updateProgress(30, 'Parsing job data...');
      
      const parsedJobs = parser.parseSpecificFormat(textData);
      this.updateProgress(70, 'Converting to CSV...');
      
      if (parsedJobs.length === 0) {
        throw new Error('No jobs found in the provided text');
      }

      // Convert to CSV format
      const csvData = this.convertToCSV(parsedJobs);
      this.updateProgress(100, 'Parse complete!');
      
      this.progressBar.classList.remove('progress-active');
      this.showResult('success', `Successfully parsed ${parsedJobs.length} jobs`);
      
      // Reset progress after a short delay
      setTimeout(() => {
        this.updateProgress(0, 'Ready to parse data...');
      }, 2000);
      
      return {
        success: true,
        jobCount: parsedJobs.length,
        csvData: csvData,
        jobsData: parsedJobs
      };
      
    } catch (error) {
      this.progressBar.classList.remove('progress-active');
      this.updateProgress(0, 'Parse failed');
      this.showResult('error', 'Parse failed: ' + error.message);
      
      return {
        success: false,
        error: error.message,
        csvData: null,
        jobsData: null
      };
    }
  }

  convertToCSV(jobs) {
    // CSV Headers
    const headers = [
      'Job Number',
      'Quantity', 
      'Description',
      'Start Date',
      'Estimated',
      'Actual',
      'Number of Stitches',
      'Notes'
    ];
    
    // Create CSV content
    let csv = headers.join(',') + '\\n';
    
    jobs.forEach(job => {
      const row = [
        this.escapeCSV(job.jobNumber || ''),
        this.escapeCSV(job.qty || '1'),
        this.escapeCSV(job.description || ''),
        this.escapeCSV(job.startDate || ''),
        this.escapeCSV(job.estimated || '0 Hrs 00:00'),
        this.escapeCSV(job.actual || '0 Hrs 00:00'),
        this.escapeCSV(job.numberOfStitches || ''),
        this.escapeCSV(job.notes || '')
      ];
      csv += row.join(',') + '\\n';
    });
    
    return csv;
  }

  escapeCSV(value) {
    if (value == null) return '';
    const strValue = String(value);
    
    // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (strValue.includes(',') || strValue.includes('\"') || strValue.includes('\\n')) {
      return '\"' + strValue.replace(/\"/g, '\"\"') + '\"';
    }
    return strValue;
  }

  // Main function that FileMaker will call
  exposeToFileMaker() {
    // Primary function for FileMaker to call
    window.parseTrackerReportToCSV = async (textData) => {
      try {
        const result = await this.parseTrackerDataToCSV(textData);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error.message,
          csvData: null,
          jobsData: null
        });
      }
    }.bind(this);

    // Utility function to get just the CSV data
    window.getCSVData = async (textData) => {
      try {
        const result = await this.parseTrackerDataToCSV(textData);
        return result.csvData || '';
      } catch (error) {
        return '';
      }
    }.bind(this);

    // Utility function to get just the JSON job data
    window.getJobsJSON = async (textData) => {
      try {
        const result = await this.parseTrackerDataToCSV(textData);
        return JSON.stringify(result.jobsData || []);
      } catch (error) {
        return '[]';
      }
    }.bind(this);

    // Test function with sample data
    window.testParser = async () => {
      const sampleData = `383267 Embroidered Women's Qu 1/2/2025
1
1/2/2025
1/2/2025
5,000
Number of Stitches
6:19:13 AM
6:25:20 AM
6:25:20 AM`;
      
      return await this.parseTrackerDataToCSV(sampleData);
    }.bind(this);

    // Function for FileMaker to parse raw PDF text format
    window.parseRawTrackerData = async (textData) => {
      try {
        this.updateStatus('Parsing raw tracker data...');
        this.updateProgress(10);
        this.progressBar.classList.add('progress-active');
        
        // Use enhanced parser
        const parser = new window.EnhancedTrackerParser();
        this.updateProgress(30, 'Parsing job data...');
        
        const parsedJobs = parser.parseSpecificFormat(textData);
        this.updateProgress(70, 'Formatting results...');
        
        if (parsedJobs.length === 0) {
          throw new Error('No jobs found in the provided text');
        }

        // Format as tab-delimited data (easier for FileMaker to parse)
        const tabDelimited = this.convertToTabDelimited(parsedJobs);
        this.updateProgress(100, 'Parse complete!');
        
        this.progressBar.classList.remove('progress-active');
        this.showResult('success', `Successfully parsed ${parsedJobs.length} jobs`);
        
        // Reset progress after a short delay
        setTimeout(() => {
          this.updateProgress(0, 'Ready to parse data...');
        }, 2000);
        
        return JSON.stringify({
          success: true,
          jobCount: parsedJobs.length,
          tabDelimitedData: tabDelimited,
          jobsData: parsedJobs
        });
        
      } catch (error) {
        this.progressBar.classList.remove('progress-active');
        this.updateProgress(0, 'Parse failed');
        this.showResult('error', 'Parse failed: ' + error.message);
        
        return JSON.stringify({
          success: false,
          error: error.message,
          tabDelimitedData: null,
          jobsData: null
        });
      }
    }.bind(this);
  }

  convertToTabDelimited(jobs) {
    // Tab-delimited format for FileMaker
    const headers = [
      'Job Number',
      'Quantity', 
      'Description',
      'Start Date',
      'Estimated',
      'Actual',
      'Number of Stitches',
      'Notes'
    ];
    
    // Create tab-delimited content
    let output = headers.join('\t') + '\n';
    
    jobs.forEach(job => {
      const row = [
        job.jobNumber || '',
        job.qty || '1',
        job.description || '',
        job.startDate || '',
        job.estimated || '0 Hrs 00:00',
        job.actual || '0 Hrs 00:00',
        job.numberOfStitches || '',
        job.notes || ''
      ];
      output += row.join('\t') + '\n';
    });
    
    return output;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TrackerReportCSVParser();
});

console.log('Tracker Report CSV Parser ready for FileMaker integration.');