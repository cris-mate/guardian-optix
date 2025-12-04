const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');

const generateCSV = (data, columns) => {
  return stringify(data, { header: true, columns });
};

const generatePDF = (reportData, templateName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text(templateName, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-GB')}`);
    doc.moveDown();

    // Content - adapt based on report category
    if (reportData.shifts) {
      doc.fontSize(14).text('Shift Summary');
      doc.fontSize(10)
        .text(`Total Shifts: ${reportData.shifts.totalShifts}`)
        .text(`Completed: ${reportData.shifts.completedShifts}`)
        .text(`Completion Rate: ${reportData.shifts.completionRate.toFixed(1)}%`);
    }

    doc.end();
  });
};

module.exports = { generateCSV, generatePDF };