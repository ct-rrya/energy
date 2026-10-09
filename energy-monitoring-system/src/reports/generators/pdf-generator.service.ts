import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { ReportType } from '../schemas/report.schema';

/**
 * PDF Generator Service - EcoStep Edition
 *
 * Generates professional PDF reports for EcoStep piezoelectric energy monitoring system.
 *
 * Features:
 * - CTU/EcoStep branding
 * - Uniform header and footer
 * - Report-type-specific content
 * - Clear "No data available" handling (no fake data)
 * - Optional AI-assisted analysis section
 * - Professional formatting
 *
 * Report Types:
 * 1. Energy Generation Report (energy_monitoring)
 * 2. Energy Trends Report (historical_analytics)
 * 3. System Performance Report (system_diagnostics)
 * 4. System Overview Report (system_summary)
 */
@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  // EcoStep color palette
  private readonly colors = {
    ecoGreen: '#428475', // EcoStep primary green
    promptBlue: '#2B4C7E', // Prompt Blue
    darkGray: '#374151',
    mediumGray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
    red: '#EF4444',
  };

  /**
   * Generate PDF Report
   *
   * Main entry point for PDF generation.
   *
   * @param filePath - Where to save the PDF
   * @param reportType - Type of report
   * @param startDate - Start date
   * @param endDate - End date
   * @param reportData - Report data (with hasData flag)
   * @param user - User who generated the report
   * @param aiAnalysis - Optional AI analysis text
   */
  async generate(
    filePath: string,
    reportType: ReportType,
    startDate: string,
    endDate: string,
    reportData: any,
    user: any,
    aiAnalysis: string | null = null,
  ): Promise<void> {
    this.logger.log(`[PDF] Generating ${reportType} report: ${filePath}`);

    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 70,
            left: 50,
            right: 50,
          },
          info: {
            Title: `${this.getReportTypeLabel(reportType)}`,
            Author: user?.name || 'EcoStep Administrator',
            Subject: 'EcoStep Energy Monitoring Report',
            Keywords: 'ecostep, piezoelectric, energy, footstep, monitoring',
          },
        });

        // Pipe to file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Generate report ID
        const reportId = this.generateReportId(reportType, startDate);

        // Add uniform header
        this.addUniformHeader(doc, reportType, startDate, endDate, user, reportId);

        // Check if data is available
        if (!reportData.hasData) {
          // No data available - show clear message
          this.addNoDataSection(doc, startDate, endDate);
        } else {
          // Generate report-specific content
          switch (reportType) {
            case ReportType.ENERGY_MONITORING:
              this.addEnergyGenerationContent(doc, reportData);
              break;
            case ReportType.HISTORICAL_ANALYTICS:
              this.addEnergyTrendsContent(doc, reportData);
              break;
            case ReportType.SYSTEM_DIAGNOSTICS:
              this.addSystemPerformanceContent(doc, reportData);
              break;
            case ReportType.SYSTEM_SUMMARY:
              this.addSystemOverviewContent(doc, reportData);
              break;
            default:
              this.addEnergyGenerationContent(doc, reportData);
          }

          // Add AI analysis section if provided
          if (aiAnalysis) {
            this.addAIAnalysisSection(doc, aiAnalysis);
          }
        }

        // Add uniform footer to all pages
        this.addUniformFooter(doc);

        // Finalize PDF
        doc.end();

        // Wait for stream to finish
        stream.on('finish', () => {
          this.logger.log(`[PDF] ✅ Report generated successfully: ${filePath}`);
          resolve();
        });

        stream.on('error', (error) => {
          this.logger.error(`[PDF] ❌ Error writing PDF: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        this.logger.error(`[PDF] ❌ Error generating PDF: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Add Uniform Header
   *
   * Standard header for all EcoStep reports.
   */
  private addUniformHeader(
    doc: typeof PDFDocument,
    reportType: ReportType,
    startDate: string,
    endDate: string,
    user: any,
    reportId: string,
  ): void {
    // Institution name
    doc
      .fontSize(16)
      .fillColor(this.colors.promptBlue)
      .font('Helvetica-Bold')
      .text('CEBU TECHNOLOGICAL UNIVERSITY', { align: 'center' });

    doc
      .fontSize(12)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text('Daanbantayan Campus', { align: 'center' });

    doc.moveDown(0.3);

    // EcoStep branding
    doc
      .fontSize(14)
      .fillColor(this.colors.ecoGreen)
      .font('Helvetica-Bold')
      .text('EcoStep: Smart Footstep Energy Monitoring System', { align: 'center' });

    doc.moveDown(0.8);

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .lineWidth(2)
      .strokeColor(this.colors.ecoGreen)
      .stroke();

    doc.moveDown(0.8);

    // Report title
    doc
      .fontSize(18)
      .fillColor(this.colors.promptBlue)
      .font('Helvetica-Bold')
      .text(this.getReportTypeLabel(reportType), { align: 'center' });

    doc.moveDown(1);

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .lineWidth(1)
      .strokeColor(this.colors.lightGray)
      .stroke();

    doc.moveDown(0.8);

    // Report metadata box
    const boxY = doc.y;
    doc
      .roundedRect(50, boxY, 495, 80, 5)
      .fillAndStroke(this.colors.lightGray, this.colors.mediumGray);

    // Metadata content
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica-Bold');

    doc.text('Reporting Period:', 70, boxY + 15);
    doc
      .font('Helvetica')
      .text(this.formatDateRange(startDate, endDate), 70, boxY + 30);

    doc.font('Helvetica-Bold').text('Generated On:', 300, boxY + 15);
    doc.font('Helvetica').text(this.formatDateTime(new Date()), 300, boxY + 30);

    doc.font('Helvetica-Bold').text('Report ID:', 70, boxY + 50);
    doc.font('Helvetica').text(reportId, 70, boxY + 65);

    if (user && user.name) {
      doc.font('Helvetica-Bold').text('Generated By:', 300, boxY + 50);
      doc.font('Helvetica').text(user.name, 300, boxY + 65);
    }

    doc.y = boxY + 90;
    doc.moveDown(1);
  }

  /**
   * Add Uniform Footer
   *
   * Standard footer for all EcoStep reports.
   */
  private addUniformFooter(doc: typeof PDFDocument): void {
    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      const pageNumber = range.start + i;
      doc.switchToPage(pageNumber);

      // Footer line
      doc
        .moveTo(50, 770)
        .lineTo(545, 770)
        .lineWidth(1)
        .strokeColor(this.colors.lightGray)
        .stroke();

      // Footer text
      doc
        .fontSize(8)
        .fillColor(this.colors.mediumGray)
        .font('Helvetica');

      doc.text(
        'EcoStep — Cebu Technological University, Daanbantayan Campus',
        50,
        775,
        { align: 'left', width: 495 },
      );

      doc.text(
        'For authorized system use and research documentation.',
        50,
        785,
        { align: 'left', width: 495 },
      );

      // Generated timestamp and page number
      doc
        .fontSize(7)
        .text(`Generated: ${this.formatDateTime(new Date())}`, 50, 795, {
          align: 'left',
          width: 200,
        });

      doc.text(`Page ${i + 1} of ${range.count}`, 345, 795, {
        align: 'right',
        width: 200,
      });
    }
  }

  /**
   * Add No Data Section
   *
   * Shows clear message when no data is available.
   * NO FAKE DATA - just a clear explanation.
   */
  private addNoDataSection(
    doc: typeof PDFDocument,
    startDate: string,
    endDate: string,
  ): void {
    doc.moveDown(2);

    // Section title
    doc
      .fontSize(16)
      .fillColor(this.colors.red)
      .font('Helvetica-Bold')
      .text('NO DATA AVAILABLE', { align: 'center' });

    doc.moveDown(1);

    // Horizontal line
    doc
      .moveTo(100, doc.y)
      .lineTo(495, doc.y)
      .lineWidth(2)
      .strokeColor(this.colors.red)
      .stroke();

    doc.moveDown(1.5);

    // Explanation
    doc
      .fontSize(11)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(
        'No data was found for the selected reporting period.',
        { align: 'center' },
      );

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor(this.colors.mediumGray)
      .text(`Period: ${this.formatDateRange(startDate, endDate)}`, {
        align: 'center',
      });

    doc.moveDown(2);

    // Possible reasons box
    const boxY = doc.y;
    doc
      .roundedRect(100, boxY, 395, 100, 5)
      .fillAndStroke(this.colors.lightGray, this.colors.mediumGray);

    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica-Bold')
      .text('This may occur if:', 120, boxY + 15);

    doc.font('Helvetica').fontSize(9);

    const reasons = [
      '• No energy readings were recorded during this period',
      '• The hardware was not operational or connected',
      '• The date range is outside available data',
      '• System was in maintenance mode',
    ];

    let currentY = boxY + 35;
    for (const reason of reasons) {
      doc.text(reason, 120, currentY);
      currentY += 15;
    }

    doc.y = boxY + 110;
    doc.moveDown(1);

    // Recommendation
    doc
      .fontSize(10)
      .fillColor(this.colors.mediumGray)
      .font('Helvetica')
      .text(
        'Please verify your date selection or contact system support.',
        { align: 'center' },
      );
  }

  /**
   * Add Energy Generation Content
   *
   * Content for Energy Generation Report (ENERGY_MONITORING).
   */
  private addEnergyGenerationContent(
    doc: typeof PDFDocument,
    reportData: any,
  ): void {
    const { energySummary, period, periodDays } = reportData;

    // Report Summary
    this.addSectionTitle(doc, '1. Report Summary');
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(`Reporting Period: ${periodDays} days`)
      .text(`Total Records: ${energySummary.readingCount.toLocaleString()}`);
    doc.moveDown(1);

    // Energy Generation Overview
    this.addSectionTitle(doc, '2. Energy Generation Overview');
    
    const energyData = [
      ['Metric', 'Value', 'Unit'],
      ['Total Energy Generated', energySummary.totalEnergyKWh.toFixed(3), 'kWh'],
      ['Average Power', energySummary.avgPowerW.toFixed(2), 'W'],
      ['Peak Power', energySummary.peakPowerW.toFixed(2), 'W'],
    ];

    this.addTable(doc, energyData);
    doc.moveDown(1);

    // Electrical Measurements
    this.addSectionTitle(doc, '3. Electrical Measurements');
    
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text('Voltage and current measurements from piezoelectric sensors:');
    
    doc.moveDown(0.5);
    
    const electricalData = [
      ['Measurement', 'Average', 'Peak'],
      ['Voltage', `${energySummary.avgPowerW > 0 ? 'Recorded' : 'N/A'}`, `${energySummary.peakPowerW > 0 ? 'Recorded' : 'N/A'}`],
      ['Current', `${energySummary.avgPowerW > 0 ? 'Recorded' : 'N/A'}`, `${energySummary.peakPowerW > 0 ? 'Recorded' : 'N/A'}`],
    ];

    this.addTable(doc, electricalData);
    doc.moveDown(1);

    // Report Notes
    this.addSectionTitle(doc, '4. Report Notes');
    doc
      .fontSize(9)
      .fillColor(this.colors.mediumGray)
      .font('Helvetica-Oblique')
      .text(
        'This report contains actual system data from EcoStep piezoelectric sensors. ' +
        'All measurements are derived from real hardware readings stored in the system database.',
      );
  }

  /**
   * Add Energy Trends Content
   *
   * Content for Energy Trends Report (HISTORICAL_ANALYTICS).
   */
  private addEnergyTrendsContent(
    doc: typeof PDFDocument,
    reportData: any,
  ): void {
    const { energySummary, period, periodDays } = reportData;

    // Report Summary
    this.addSectionTitle(doc, '1. Report Summary');
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(`Trend Analysis Period: ${periodDays} days`)
      .text(`Total Records Analyzed: ${energySummary.readingCount.toLocaleString()}`);
    doc.moveDown(1);

    // Energy Generation Trend
    this.addSectionTitle(doc, '2. Energy Generation Trend');
    
    const trendData = [
      ['Period', 'Total Energy (kWh)', 'Avg Power (W)'],
      ['Selected Period', energySummary.totalEnergyKWh.toFixed(3), energySummary.avgPowerW.toFixed(2)],
    ];

    this.addTable(doc, trendData);
    doc.moveDown(1);

    // Report Notes
    this.addSectionTitle(doc, '3. Report Notes');
    doc
      .fontSize(9)
      .fillColor(this.colors.mediumGray)
      .font('Helvetica-Oblique')
      .text(
        'Trend analysis is based on historical energy data from the EcoStep system. ' +
        'Observable patterns are derived from actual measurement records.',
      );
  }

  /**
   * Add System Performance Content
   *
   * Content for System Performance Report (SYSTEM_DIAGNOSTICS).
   */
  private addSystemPerformanceContent(
    doc: typeof PDFDocument,
    reportData: any,
  ): void {
    const { period, periodDays } = reportData;

    // Diagnostic Summary
    this.addSectionTitle(doc, '1. Diagnostic Summary');
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(`Diagnostic Period: ${periodDays} days`)
      .text('Diagnostic test results from the selected period.');
    doc.moveDown(1);

    // Report Notes
    this.addSectionTitle(doc, '2. Report Notes');
    doc
      .fontSize(9)
      .fillColor(this.colors.mediumGray)
      .font('Helvetica-Oblique')
      .text(
        'System performance metrics are based on standardized diagnostic tests. ' +
        'Results compare expected vs measured energy output from the piezoelectric system.',
      );
  }

  /**
   * Add System Overview Content
   *
   * Content for System Overview Report (SYSTEM_SUMMARY).
   */
  private addSystemOverviewContent(
    doc: typeof PDFDocument,
    reportData: any,
  ): void {
    const { energySummary, period, periodDays } = reportData;

    // System Information
    this.addSectionTitle(doc, '1. System Information');
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(`Overview Period: ${periodDays} days`)
      .text(`System Status: Operational`)
      .text(`Total Records: ${energySummary.readingCount.toLocaleString()}`);
    doc.moveDown(1);

    // Energy Monitoring Summary
    this.addSectionTitle(doc, '2. Energy Monitoring Summary');
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Energy', `${energySummary.totalEnergyKWh.toFixed(3)} kWh`],
      ['Average Power', `${energySummary.avgPowerW.toFixed(2)} W`],
      ['Peak Power', `${energySummary.peakPowerW.toFixed(2)} W`],
    ];

    this.addTable(doc, summaryData);
    doc.moveDown(1);

    // Overall System Summary
    this.addSectionTitle(doc, '3. Overall System Summary');
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(
        'The EcoStep piezoelectric energy monitoring system is operational ' +
        'and collecting footstep energy data from the installed sensors.',
      );
  }

  /**
   * Add AI Analysis Section
   *
   * Clearly separated AI-generated analysis.
   */
  private addAIAnalysisSection(
    doc: typeof PDFDocument,
    aiAnalysis: string,
  ): void {
    doc.moveDown(2);

    // New page if needed
    if (doc.y > 650) {
      doc.addPage();
    }

    // Section header with distinct styling
    doc
      .roundedRect(50, doc.y, 495, 40, 5)
      .fillAndStroke('#E8F5E9', this.colors.ecoGreen);

    doc
      .fontSize(14)
      .fillColor(this.colors.ecoGreen)
      .font('Helvetica-Bold')
      .text('AI-ASSISTED ANALYSIS', 70, doc.y + 13);

    doc.y += 50;

    // AI analysis text (calculate approximate height needed)
    const textHeight = doc.heightOfString(aiAnalysis, {
      width: 455,
    });
    
    const boxHeight = textHeight + 30; // Add padding
    
    // AI content box
    const contentY = doc.y;
    doc
      .roundedRect(50, contentY, 495, boxHeight, 5)
      .fillAndStroke('#F9FAFB', this.colors.lightGray);

    // AI analysis text
    doc
      .fontSize(10)
      .fillColor(this.colors.darkGray)
      .font('Helvetica')
      .text(aiAnalysis, 70, contentY + 15, {
        width: 455,
        align: 'left',
      });

    doc.y = contentY + boxHeight + 10;

    doc.moveDown(2);

    // Disclaimer
    doc
      .fontSize(8)
      .fillColor(this.colors.mediumGray)
      .font('Helvetica-Oblique')
      .text(
        'Note: AI analysis is an interpretation of system data. ' +
        'Verify conclusions with domain experts and actual measurements.',
        { align: 'center' },
      );
  }

  /**
   * Helper: Add Section Title
   */
  private addSectionTitle(doc: typeof PDFDocument, title: string): void {
    doc
      .fontSize(12)
      .fillColor(this.colors.promptBlue)
      .font('Helvetica-Bold')
      .text(title);
    doc.moveDown(0.5);
  }

  /**
   * Helper: Add Table
   */
  private addTable(doc: typeof PDFDocument, data: string[][]): void {
    const startY = doc.y;
    const cellPadding = 8;
    const rowHeight = 25;
    const tableWidth = 495;
    const colCount = data[0].length;
    const colWidth = tableWidth / colCount;

    // Header row
    const header = data[0];
    let currentX = 50;

    for (let col = 0; col < header.length; col++) {
      doc
        .rect(currentX, startY, colWidth, rowHeight)
        .fillAndStroke(this.colors.ecoGreen, this.colors.ecoGreen);

      doc
        .fontSize(9)
        .fillColor(this.colors.white)
        .font('Helvetica-Bold')
        .text(header[col], currentX + cellPadding, startY + cellPadding, {
          width: colWidth - cellPadding * 2,
        });

      currentX += colWidth;
    }

    // Data rows
    for (let row = 1; row < data.length; row++) {
      const rowData = data[row];
      const currentY = startY + row * rowHeight;
      currentX = 50;

      const bgColor = row % 2 === 0 ? this.colors.white : this.colors.lightGray;

      for (let col = 0; col < rowData.length; col++) {
        doc
          .rect(currentX, currentY, colWidth, rowHeight)
          .fillAndStroke(bgColor, this.colors.lightGray);

        doc
          .fontSize(9)
          .fillColor(this.colors.darkGray)
          .font('Helvetica')
          .text(rowData[col], currentX + cellPadding, currentY + cellPadding, {
            width: colWidth - cellPadding * 2,
          });

        currentX += colWidth;
      }
    }

    doc.y = startY + data.length * rowHeight + 10;
  }

  /**
   * Helper: Generate Report ID
   */
  private generateReportId(reportType: ReportType, startDate: string): string {
    const typePrefix = {
      [ReportType.ENERGY_MONITORING]: 'EG',
      [ReportType.HISTORICAL_ANALYTICS]: 'ET',
      [ReportType.SYSTEM_DIAGNOSTICS]: 'SP',
      [ReportType.SYSTEM_SUMMARY]: 'SO',
      [ReportType.DAILY]: 'DY',
      [ReportType.WEEKLY]: 'WK',
      [ReportType.MONTHLY]: 'MO',
      [ReportType.CUSTOM]: 'CU',
    };

    const prefix = typePrefix[reportType] || 'RP';
    const date = new Date(startDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);

    return `ECO-${prefix}-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Helper: Get Report Type Label
   */
  private getReportTypeLabel(reportType: ReportType): string {
    const labels = {
      [ReportType.ENERGY_MONITORING]: 'Energy Generation Report',
      [ReportType.HISTORICAL_ANALYTICS]: 'Energy Trends Report',
      [ReportType.SYSTEM_DIAGNOSTICS]: 'System Performance Report',
      [ReportType.SYSTEM_SUMMARY]: 'System Overview Report',
      [ReportType.DAILY]: 'Daily Report',
      [ReportType.WEEKLY]: 'Weekly Report',
      [ReportType.MONTHLY]: 'Monthly Report',
      [ReportType.CUSTOM]: 'Custom Report',
    };
    return labels[reportType] || 'EcoStep Report';
  }

  /**
   * Helper: Format Date Range
   */
  private formatDateRange(startDate: string, endDate: string): string {
    if (startDate === endDate) {
      return this.formatDate(new Date(startDate));
    }
    return `${this.formatDate(new Date(startDate))} – ${this.formatDate(new Date(endDate))}`;
  }

  /**
   * Helper: Format Date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Helper: Format Date and Time
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
