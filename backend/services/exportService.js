/**
 * Export Service
 *
 * Generates PDF and Excel exports for Guardian Optix reports.
 * Supports operational, attendance, incident, and compliance reports.
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// ============================================
// Constants
// ============================================

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');
const COMPANY_NAME = 'Guardian Optix';
const REPORT_COLORS = {
  primary: '#1b1b60',
  secondary: '#4A5568',
  success: '#38A169',
  warning: '#D69E2E',
  danger: '#E53E3E',
  header: '#2D3748',
  border: '#E2E8F0',
};

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// ============================================
// PDF Generation Helpers
// ============================================

/**
 * Create a new PDF document with standard header
 */
const createPDFDocument = (title, options = {}) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    ...options,
  });

  // Add header
  doc
    .fontSize(20)
    .fillColor(REPORT_COLORS.primary)
    .text(COMPANY_NAME, { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(16)
    .fillColor(REPORT_COLORS.header)
    .text(title, { align: 'center' })
    .moveDown(0.3);

  doc
    .fontSize(10)
    .fillColor(REPORT_COLORS.secondary)
    .text(`Generated: ${new Date().toLocaleString('en-GB')}`, { align: 'center' })
    .moveDown(1.5);

  return doc;
};

/**
 * Add a section header to PDF
 */
const addPDFSection = (doc, title) => {
  doc
    .moveDown(0.5)
    .fontSize(14)
    .fillColor(REPORT_COLORS.primary)
    .text(title)
    .moveDown(0.3);

  // Add underline
  doc
    .strokeColor(REPORT_COLORS.border)
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.5);
};

/**
 * Add a simple table to PDF
 */
const addPDFTable = (doc, headers, rows, options = {}) => {
  const { columnWidths = [], startX = 50 } = options;
  const defaultWidth = (495 - (headers.length - 1) * 10) / headers.length;

  let y = doc.y;

  // Header row
  doc.fontSize(10).fillColor(REPORT_COLORS.header);
  let x = startX;
  headers.forEach((header, i) => {
    const width = columnWidths[i] || defaultWidth;
    doc.text(header, x, y, { width, align: 'left' });
    x += width + 10;
  });

  y = doc.y + 5;

  // Draw header line
  doc
    .strokeColor(REPORT_COLORS.border)
    .lineWidth(0.5)
    .moveTo(startX, y)
    .lineTo(545, y)
    .stroke();

  y += 5;

  // Data rows
  doc.fillColor(REPORT_COLORS.secondary);
  rows.forEach((row, rowIndex) => {
    x = startX;

    // Check for page break
    if (y > 750) {
      doc.addPage();
      y = 50;
    }

    row.forEach((cell, i) => {
      const width = columnWidths[i] || defaultWidth;
      doc.text(String(cell || '-'), x, y, { width, align: 'left' });
      x += width + 10;
    });

    y = doc.y + 3;
  });

  doc.y = y + 10;
};

/**
 * Add key-value pairs to PDF
 */
const addPDFKeyValue = (doc, data) => {
  doc.fontSize(10);
  Object.entries(data).forEach(([key, value]) => {
    doc
      .fillColor(REPORT_COLORS.header)
      .text(`${key}: `, { continued: true })
      .fillColor(REPORT_COLORS.secondary)
      .text(String(value));
  });
  doc.moveDown(0.5);
};

// ============================================
// Excel Generation Helpers
// ============================================

/**
 * Create a new Excel workbook with standard styling
 */
const createExcelWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_NAME;
  workbook.created = new Date();
  return workbook;
};

/**
 * Add a styled worksheet header
 */
const addExcelHeader = (worksheet, title, columnCount) => {
  // Merge cells for title
  worksheet.mergeCells(1, 1, 1, columnCount);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${COMPANY_NAME} - ${title}`;
  titleCell.font = { bold: true, size: 16, color: { argb: '1b1b60' } };
  titleCell.alignment = { horizontal: 'center' };

  // Generated date
  worksheet.mergeCells(2, 1, 2, columnCount);
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generated: ${new Date().toLocaleString('en-GB')}`;
  dateCell.font = { size: 10, color: { argb: '718096' } };
  dateCell.alignment = { horizontal: 'center' };

  // Empty row
  worksheet.getRow(3).height = 10;
};

/**
 * Style header row in Excel
 */
const styleExcelHeaders = (worksheet, rowNumber) => {
  const headerRow = worksheet.getRow(rowNumber);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1b1b60' },
  };
  headerRow.alignment = { horizontal: 'center' };
  headerRow.height = 25;
};

/**
 * Auto-size columns based on content
 */
const autoSizeColumns = (worksheet) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? String(cell.value).length : 10;
      maxLength = Math.max(maxLength, cellLength);
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });
};

// ============================================
// Report Generators
// ============================================

/**
 * Generate Operational Report PDF
 */
const generateOperationalPDF = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const doc = createPDFDocument('Operational Report');
  const writeStream = fs.createWriteStream(filepath);
  doc.pipe(writeStream);

  // Summary Section
  addPDFSection(doc, 'Summary');
  addPDFKeyValue(doc, {
    'Report Period': `${data.period?.start || 'N/A'} to ${data.period?.end || 'N/A'}`,
    'Total Shifts': data.shifts?.totalShifts || 0,
    'Completed Shifts': data.shifts?.completedShifts || 0,
    'Completion Rate': `${data.shifts?.completionRate || 0}%`,
    'Total Hours': data.shifts?.totalHours || 0,
    'Overtime Hours': data.shifts?.overtimeHours || 0,
  });

  // Attendance Section
  addPDFSection(doc, 'Attendance Metrics');
  addPDFKeyValue(doc, {
    'Late Arrivals': data.attendance?.lateArrivals || 0,
    'No-Shows': data.attendance?.noShows || 0,
    'Attendance Rate': `${data.attendance?.rate || 0}%`,
  });

  // Site Activity Table
  if (data.siteActivity && data.siteActivity.length > 0) {
    addPDFSection(doc, 'Site Activity');
    addPDFTable(
      doc,
      ['Site', 'Shifts', 'Hours', 'Incidents', 'Compliance'],
      data.siteActivity.map((site) => [
        site.siteName,
        site.totalShifts,
        site.guardHours,
        site.totalIncidents,
        `${site.complianceScore}%`,
      ]),
      { columnWidths: [150, 60, 60, 70, 80] }
    );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filepath));
    writeStream.on('error', reject);
  });
};

/**
 * Generate Operational Report Excel
 */
const generateOperationalExcel = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const workbook = createExcelWorkbook();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  addExcelHeader(summarySheet, 'Operational Report', 2);

  summarySheet.getCell('A4').value = 'Metric';
  summarySheet.getCell('B4').value = 'Value';
  styleExcelHeaders(summarySheet, 4);

  const summaryData = [
    ['Report Period', `${data.period?.start || 'N/A'} to ${data.period?.end || 'N/A'}`],
    ['Total Shifts', data.shifts?.totalShifts || 0],
    ['Completed Shifts', data.shifts?.completedShifts || 0],
    ['Completion Rate', `${data.shifts?.completionRate || 0}%`],
    ['Total Hours', data.shifts?.totalHours || 0],
    ['Overtime Hours', data.shifts?.overtimeHours || 0],
    ['Late Arrivals', data.attendance?.lateArrivals || 0],
    ['No-Shows', data.attendance?.noShows || 0],
    ['Attendance Rate', `${data.attendance?.rate || 0}%`],
  ];

  summaryData.forEach((row, i) => {
    summarySheet.getCell(`A${5 + i}`).value = row[0];
    summarySheet.getCell(`B${5 + i}`).value = row[1];
  });

  autoSizeColumns(summarySheet);

  // Site Activity Sheet
  if (data.siteActivity && data.siteActivity.length > 0) {
    const siteSheet = workbook.addWorksheet('Site Activity');
    addExcelHeader(siteSheet, 'Site Activity', 5);

    siteSheet.getRow(4).values = ['Site', 'Total Shifts', 'Guard Hours', 'Incidents', 'Compliance Score'];
    styleExcelHeaders(siteSheet, 4);

    data.siteActivity.forEach((site, i) => {
      siteSheet.getRow(5 + i).values = [
        site.siteName,
        site.totalShifts,
        site.guardHours,
        site.totalIncidents,
        `${site.complianceScore}%`,
      ];
    });

    autoSizeColumns(siteSheet);
  }

  await workbook.xlsx.writeFile(filepath);
  return filepath;
};

/**
 * Generate Attendance Report PDF
 */
const generateAttendancePDF = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const doc = createPDFDocument('Attendance Report');
  const writeStream = fs.createWriteStream(filepath);
  doc.pipe(writeStream);

  // Summary
  addPDFSection(doc, 'Attendance Summary');
  addPDFKeyValue(doc, {
    'Report Period': `${data.period?.start || 'N/A'} to ${data.period?.end || 'N/A'}`,
    'Total Officers': data.summary?.totalOfficers || 0,
    'Average Attendance Rate': `${data.summary?.avgAttendanceRate || 0}%`,
    'Total Late Arrivals': data.summary?.totalLateArrivals || 0,
    'Total No-Shows': data.summary?.totalNoShows || 0,
    'Total Hours Worked': data.summary?.totalHoursWorked || 0,
    'Total Overtime': data.summary?.totalOvertime || 0,
  });

  // Officer Attendance Table
  if (data.officers && data.officers.length > 0) {
    addPDFSection(doc, 'Officer Attendance Details');
    addPDFTable(
      doc,
      ['Officer', 'Shifts', 'Hours', 'Late', 'No-Shows', 'Rate'],
      data.officers.map((officer) => [
        officer.name,
        officer.shiftsWorked,
        officer.hoursWorked.toFixed(1),
        officer.lateArrivals,
        officer.noShows,
        `${officer.attendanceRate}%`,
      ]),
      { columnWidths: [120, 50, 50, 50, 60, 50] }
    );
  }

  // Late Arrivals Detail
  if (data.lateArrivals && data.lateArrivals.length > 0) {
    addPDFSection(doc, 'Late Arrival Details');
    addPDFTable(
      doc,
      ['Date', 'Officer', 'Site', 'Scheduled', 'Actual', 'Minutes Late'],
      data.lateArrivals.slice(0, 20).map((late) => [
        late.date,
        late.officerName,
        late.siteName,
        late.scheduledStart,
        late.actualClockIn,
        late.minutesLate,
      ]),
      { columnWidths: [70, 90, 100, 60, 60, 70] }
    );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filepath));
    writeStream.on('error', reject);
  });
};

/**
 * Generate Attendance Report Excel
 */
const generateAttendanceExcel = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const workbook = createExcelWorkbook();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  addExcelHeader(summarySheet, 'Attendance Report', 2);

  summarySheet.getCell('A4').value = 'Metric';
  summarySheet.getCell('B4').value = 'Value';
  styleExcelHeaders(summarySheet, 4);

  const summaryData = [
    ['Report Period', `${data.period?.start || 'N/A'} to ${data.period?.end || 'N/A'}`],
    ['Total Officers', data.summary?.totalOfficers || 0],
    ['Average Attendance Rate', `${data.summary?.avgAttendanceRate || 0}%`],
    ['Total Late Arrivals', data.summary?.totalLateArrivals || 0],
    ['Total No-Shows', data.summary?.totalNoShows || 0],
    ['Total Hours Worked', data.summary?.totalHoursWorked || 0],
    ['Total Overtime Hours', data.summary?.totalOvertime || 0],
  ];

  summaryData.forEach((row, i) => {
    summarySheet.getCell(`A${5 + i}`).value = row[0];
    summarySheet.getCell(`B${5 + i}`).value = row[1];
  });

  autoSizeColumns(summarySheet);

  // Officer Details Sheet
  if (data.officers && data.officers.length > 0) {
    const officerSheet = workbook.addWorksheet('Officer Details');
    addExcelHeader(officerSheet, 'Officer Attendance', 7);

    officerSheet.getRow(4).values = [
      'Officer Name',
      'Badge Number',
      'Shifts Worked',
      'Hours Worked',
      'Late Arrivals',
      'No-Shows',
      'Attendance Rate',
    ];
    styleExcelHeaders(officerSheet, 4);

    data.officers.forEach((officer, i) => {
      officerSheet.getRow(5 + i).values = [
        officer.name,
        officer.badgeNumber || 'N/A',
        officer.shiftsWorked,
        officer.hoursWorked,
        officer.lateArrivals,
        officer.noShows,
        `${officer.attendanceRate}%`,
      ];
    });

    autoSizeColumns(officerSheet);
  }

  // Late Arrivals Sheet
  if (data.lateArrivals && data.lateArrivals.length > 0) {
    const lateSheet = workbook.addWorksheet('Late Arrivals');
    addExcelHeader(lateSheet, 'Late Arrival Details', 6);

    lateSheet.getRow(4).values = ['Date', 'Officer', 'Site', 'Scheduled', 'Actual', 'Minutes Late'];
    styleExcelHeaders(lateSheet, 4);

    data.lateArrivals.forEach((late, i) => {
      lateSheet.getRow(5 + i).values = [
        late.date,
        late.officerName,
        late.siteName,
        late.scheduledStart,
        late.actualClockIn,
        late.minutesLate,
      ];
    });

    autoSizeColumns(lateSheet);
  }

  await workbook.xlsx.writeFile(filepath);
  return filepath;
};

/**
 * Generate Incident Report PDF
 */
const generateIncidentPDF = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const doc = createPDFDocument('Incident Report');
  const writeStream = fs.createWriteStream(filepath);
  doc.pipe(writeStream);

  // Summary
  addPDFSection(doc, 'Incident Summary');
  addPDFKeyValue(doc, {
    'Report Period': `${data.period?.start || 'N/A'} to ${data.period?.end || 'N/A'}`,
    'Total Incidents': data.summary?.totalIncidents || 0,
    'Open Incidents': data.summary?.openIncidents || 0,
    'Resolved Incidents': data.summary?.resolvedIncidents || 0,
    'Critical Incidents': data.summary?.criticalIncidents || 0,
    'Average Response Time': `${data.summary?.avgResponseTime || 0} minutes`,
  });

  // By Severity
  if (data.bySeverity) {
    addPDFSection(doc, 'Incidents by Severity');
    addPDFTable(
      doc,
      ['Severity', 'Count', 'Percentage'],
      Object.entries(data.bySeverity).map(([severity, count]) => [
        severity.toUpperCase(),
        count,
        `${data.summary?.totalIncidents ? Math.round((count / data.summary.totalIncidents) * 100) : 0}%`,
      ]),
      { columnWidths: [150, 100, 100] }
    );
  }

  // Incident List
  if (data.incidents && data.incidents.length > 0) {
    addPDFSection(doc, 'Recent Incidents');
    addPDFTable(
      doc,
      ['Date', 'Type', 'Severity', 'Location', 'Status'],
      data.incidents.slice(0, 25).map((incident) => [
        new Date(incident.createdAt).toLocaleDateString('en-GB'),
        incident.incidentType,
        incident.severity,
        incident.location,
        incident.status,
      ]),
      { columnWidths: [70, 100, 70, 120, 70] }
    );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filepath));
    writeStream.on('error', reject);
  });
};

/**
 * Generate Incident Report Excel
 */
const generateIncidentExcel = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const workbook = createExcelWorkbook();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  addExcelHeader(summarySheet, 'Incident Report', 2);

  summarySheet.getCell('A4').value = 'Metric';
  summarySheet.getCell('B4').value = 'Value';
  styleExcelHeaders(summarySheet, 4);

  const summaryData = [
    ['Report Period', `${data.period?.start || 'N/A'} to ${data.period?.end || 'N/A'}`],
    ['Total Incidents', data.summary?.totalIncidents || 0],
    ['Open Incidents', data.summary?.openIncidents || 0],
    ['Resolved Incidents', data.summary?.resolvedIncidents || 0],
    ['Critical Incidents', data.summary?.criticalIncidents || 0],
    ['Average Response Time (min)', data.summary?.avgResponseTime || 0],
  ];

  summaryData.forEach((row, i) => {
    summarySheet.getCell(`A${5 + i}`).value = row[0];
    summarySheet.getCell(`B${5 + i}`).value = row[1];
  });

  autoSizeColumns(summarySheet);

  // Incidents Sheet
  if (data.incidents && data.incidents.length > 0) {
    const incidentSheet = workbook.addWorksheet('All Incidents');
    addExcelHeader(incidentSheet, 'Incident Details', 7);

    incidentSheet.getRow(4).values = ['Date', 'Type', 'Severity', 'Location', 'Reported By', 'Status', 'Description'];
    styleExcelHeaders(incidentSheet, 4);

    data.incidents.forEach((incident, i) => {
      incidentSheet.getRow(5 + i).values = [
        new Date(incident.createdAt).toLocaleDateString('en-GB'),
        incident.incidentType,
        incident.severity,
        incident.location,
        incident.reportedByName || 'Unknown',
        incident.status,
        incident.description?.substring(0, 100) || '',
      ];
    });

    autoSizeColumns(incidentSheet);
  }

  await workbook.xlsx.writeFile(filepath);
  return filepath;
};

/**
 * Generate Timesheet Export Excel
 */
const generateTimesheetExcel = async (data, filename) => {
  const filepath = path.join(EXPORTS_DIR, filename);
  const workbook = createExcelWorkbook();

  const sheet = workbook.addWorksheet('Timesheets');
  addExcelHeader(sheet, 'Timesheet Export', 9);

  sheet.getRow(4).values = [
    'Date',
    'Officer Name',
    'Badge Number',
    'Clock In',
    'Clock Out',
    'Regular Hours',
    'Overtime Hours',
    'Break Minutes',
    'Status',
  ];
  styleExcelHeaders(sheet, 4);

  data.timesheets?.forEach((entry, i) => {
    sheet.getRow(5 + i).values = [
      entry.date,
      entry.officerName,
      entry.badgeNumber || 'N/A',
      entry.clockInTime || '-',
      entry.clockOutTime || '-',
      entry.regularHours?.toFixed(2) || 0,
      entry.overtimeHours?.toFixed(2) || 0,
      entry.breakMinutes || 0,
      entry.status || 'pending',
    ];
  });

  autoSizeColumns(sheet);
  await workbook.xlsx.writeFile(filepath);
  return filepath;
};

// ============================================
// Main Export Function
// ============================================

/**
 * Generate report in specified format
 * @param {string} reportType - Type of report (operational, attendance, incident, timesheet)
 * @param {string} format - Export format (pdf, xlsx)
 * @param {Object} data - Report data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - File path and metadata
 */
const generateExport = async (reportType, format, data, options = {}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${reportType}-report-${timestamp}.${format}`;

  let filepath;

  switch (reportType) {
    case 'operational':
      filepath = format === 'pdf'
        ? await generateOperationalPDF(data, filename)
        : await generateOperationalExcel(data, filename);
      break;

    case 'attendance':
      filepath = format === 'pdf'
        ? await generateAttendancePDF(data, filename)
        : await generateAttendanceExcel(data, filename);
      break;

    case 'incident':
    case 'incidents':
      filepath = format === 'pdf'
        ? await generateIncidentPDF(data, filename)
        : await generateIncidentExcel(data, filename);
      break;

    case 'timesheet':
      if (format === 'pdf') {
        throw new Error('Timesheet export only available in Excel format');
      }
      filepath = await generateTimesheetExcel(data, filename);
      break;

    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }

  // Get file stats
  const stats = fs.statSync(filepath);

  return {
    success: true,
    filepath,
    filename,
    format,
    reportType,
    size: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Clean up old export files (older than 24 hours)
 */
const cleanupOldExports = async () => {
  const files = fs.readdirSync(EXPORTS_DIR);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  files.forEach((file) => {
    const filepath = path.join(EXPORTS_DIR, file);
    const stats = fs.statSync(filepath);
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filepath);
    }
  });
};

/**
 * Get export file path
 */
const getExportPath = (filename) => {
  return path.join(EXPORTS_DIR, filename);
};

module.exports = {
  generateExport,
  generateOperationalPDF,
  generateOperationalExcel,
  generateAttendancePDF,
  generateAttendanceExcel,
  generateIncidentPDF,
  generateIncidentExcel,
  generateTimesheetExcel,
  cleanupOldExports,
  getExportPath,
  EXPORTS_DIR,
};