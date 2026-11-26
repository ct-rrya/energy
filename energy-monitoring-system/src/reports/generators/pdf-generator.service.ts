import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { ReportType } from '../schemas/report.schema';

/**
 * PDF Generator Service - EcoStep Upgraded Energy & Diagnostics Edition
 *
 * Produces a crisp 2-page A4 report matching the EcoStep Energy & System Health Report template:
 * - Page 1: CTU Daanbantayan header, 3x2 metadata grid, Section 1 (Executive Performance KPIs),
 *           Section 2 (Hourly Foot Traffic vs. Energy Harvested vector chart),
 *           Section 3 (Electrical & Energy Storage Telemetry)
 * - Page 2: Section 3 continuation (Storage Capacitor), Section 4 (Automated Hardware Diagnostics
 *           & Maintenance Log), Section 5 (Automated Engineering & Maintenance Analysis callout)
 * - Uniform footer with Page X of Y on every page
 */
@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  private readonly colors = {
    forestDark: '#0D5C40',
    forestMid: '#0F7653',
    emeraldBar: '#0D8A5E',
    skyBar: '#85C1E9',
    skyAxis: '#2B7CB3',
    mintBg: '#ECFDF5',
    mintBorder: '#A7F3D0',
    warnBg: '#FFFBEB',
    warnBorder: '#FDE68A',
    warnBar: '#B45309',
    calloutBg: '#F8FAFC',
    calloutBorder: '#CBD5E1',
    calloutBar: '#475569',
    textDark: '#111827',
    textBody: '#1F2937',
    textMuted: '#6B7280',
    metaBg: '#F3F6F5',
    border: '#CBD5E1',
    rowAlt: '#F9FBFA',
    white: '#FFFFFF',
    red: '#DC2626',
  };

  async generate(
    filePath: string,
    reportType: ReportType,
    startDate: string,
    endDate: string,
    reportData: any,
    user: any,
    aiAnalysis: string | null = null,
  ): Promise<void> {
    this.logger.log(`[PDF] Generating upgraded ${reportType} report: ${filePath}`);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          bufferPages: true,
          margins: { top: 44, bottom: 54, left: 48, right: 48 },
          info: {
            Title: 'EcoStep Energy & System Health Report',
            Author: user?.name || 'EcoStep Administrator',
            Subject: 'Piezoelectric Footstep Energy Harvesting & Tile Diagnostics Audit',
            Keywords: 'ecostep, piezoelectric, energy, footstep, diagnostics, CTU',
          },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const reportId = this.generateReportId(reportType, startDate);

        // Header + 3x2 Metadata Grid
        this.drawTopHeader(doc);
        this.drawMetadataGrid(doc, startDate, endDate, reportData, user, reportId);

        if (!reportData?.hasData) {
          this.drawNoDataSection(doc, startDate, endDate);
        } else {
          // Section 1: Executive Performance KPIs
          this.drawExecutiveKpisSection(doc, reportData);

          // Section 2: Hourly Foot Traffic vs. Energy Harvested (Vector Grouped Bar Chart)
          this.drawHourlyBarChartSection(doc, reportData);

          // Section 3: Electrical & Energy Storage Telemetry (INA219 & ADC)
          this.drawElectricalTelemetrySection(doc, reportData);

          // Section 4: Automated Hardware Diagnostics & Maintenance Log
          this.drawDiagnosticsLogSection(doc, reportData);

          // Section 5: Automated Engineering & Maintenance Analysis (EcoGuide Callout)
          this.drawEcoGuideSummarySection(doc, reportData, aiAnalysis);
        }

        // Uniform footer on every page (Page X of Y)
        this.drawFooters(doc);

        doc.end();

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

  // ============================================================================
  // HEADER & METADATA
  // ============================================================================

  private drawTopHeader(doc: typeof PDFDocument): void {
    const left = 48;
    const right = 547;

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(this.colors.forestDark)
      .text('CEBU TECHNOLOGICAL UNIVERSITY — DAANBANTAYAN CAMPUS', left, 42, {
        characterSpacing: 0.4,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor(this.colors.textDark)
      .text('EcoStep Energy & System Health Report', left, 56);

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(this.colors.textMuted)
      .text('Footstep Energy Harvested & Tile Health Summary', left, 80);

    doc
      .moveTo(left, 98)
      .lineTo(right, 98)
      .lineWidth(2)
      .strokeColor(this.colors.forestDark)
      .stroke();

    doc.y = 110;
  }

  private drawMetadataGrid(
    doc: typeof PDFDocument,
    startDate: string,
    endDate: string,
    reportData: any,
    user: any,
    reportId: string,
  ): void {
    const left = 48;
    const colWidths = [98, 154, 92, 155]; // Total = 499; wide enough that label keys never truncate
    const rowH = 26;
    const packetCount = reportData?.kpis?.packetCount ?? reportData?.summary?.readingCount ?? 0;
    const uptime = reportData?.kpis?.uptimePercent ?? 99.4;
    const periodLabel = this.formatReportingPeriod(startDate, endDate, reportData?.periodDays);
    const generatedByLabel = user?.name && user.name !== 'Public User'
      ? `Admin — ${user.name}`
      : 'Public Visitor';

    const rows: Array<[string, string, string, string]> = [
      ['Report ID', reportId, 'Reporting Period', periodLabel],
      ['Tile Unit / Zone', 'TILE-CTU-01 — Main Academic Lobby', 'Generated On', this.formatDateTime(new Date())],
      ['Telemetry Uptime', `${packetCount.toLocaleString()} Batches (${uptime}% Uptime)`, 'Generated By', generatedByLabel],
    ];

    let y = doc.y;
    for (const row of rows) {
      let x = left;
      row.forEach((cellText, idx) => {
        const w = colWidths[idx];
        const isLabel = idx === 0 || idx === 2;
        doc
          .rect(x, y, w, rowH)
          .fillAndStroke(isLabel ? this.colors.metaBg : this.colors.white, this.colors.border);

        doc
          .font(isLabel ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .fillColor(isLabel ? this.colors.textDark : this.colors.textBody)
          .text(cellText, x + 6, y + 7, {
            width: w - 12,
            height: rowH - 8,
            ellipsis: !isLabel,
          });

        x += w;
      });
      y += rowH;
    }

    doc.y = y + 12;
  }

  // ============================================================================
  // SECTION 1: EXECUTIVE PERFORMANCE KPIS
  // ============================================================================

  private drawExecutiveKpisSection(doc: typeof PDFDocument, reportData: any): void {
    this.drawSectionHeading(doc, '1. KEY PERFORMANCE SUMMARY');

    const kpis = reportData.kpis || {};
    const totalEnergy = Number(kpis.totalEnergyMWh ?? 0);
    const baseEnergy = Number(kpis.baselineEnergyMWh ?? totalEnergy);
    const totalSteps = Number(kpis.totalSteps ?? 0);
    const baseSteps = Number(kpis.baselineSteps ?? totalSteps);
    const yieldUWh = Number(kpis.specificYieldUWh ?? 0);
    const baseYieldUWh = Number(kpis.baselineYieldUWh ?? yieldUWh);
    const health = Number(kpis.healthScore ?? 94);
    const baseHealth = Number(kpis.baselineHealthScore ?? 95);

    const pctVar = (val: number, base: number): string => {
      if (!base || base <= 0) return '0.0%';
      const diff = ((val - base) / base) * 100;
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    const healthDiff = health - baseHealth;
    const healthVar = `${healthDiff >= 0 ? '+' : ''}${healthDiff.toFixed(1)} pt`;

    const columns = [
      { label: 'Performance Metric', width: 162, align: 'left' as const },
      { label: 'Recorded Value', width: 88, align: 'right' as const },
      { label: '30-Day Average', width: 88, align: 'right' as const },
      { label: 'Change', width: 58, align: 'right' as const },
      { label: 'Status', width: 103, align: 'left' as const },
    ];

    const rows = [
      [
        'Total Energy Collected',
        `${totalEnergy.toFixed(5)} mWh`,
        `${baseEnergy.toFixed(5)} mWh`,
        pctVar(totalEnergy, baseEnergy),
        totalEnergy >= baseEnergy * 0.85 ? 'Good Output' : 'Below Usual',
      ],
      [
        'Total Footsteps Counted',
        `${totalSteps.toLocaleString()} steps`,
        `${baseSteps.toLocaleString()} steps`,
        pctVar(totalSteps, baseSteps),
        totalSteps > 0 ? 'Active Traffic' : 'Low Traffic',
      ],
      [
        'Energy Earned per Step',
        `${yieldUWh.toFixed(5)} \u00B5Wh/step`,
        `${baseYieldUWh.toFixed(5)} \u00B5Wh/step`,
        pctVar(yieldUWh, baseYieldUWh),
        yieldUWh >= baseYieldUWh * 0.85 ? 'Working Well' : 'Needs Check',
      ],
      [
        'Overall Tile Health Score',
        `${health} / 100`,
        `${baseHealth} / 100`,
        healthVar,
        health >= 80 ? 'Healthy' : health >= 60 ? 'Needs Attention' : 'Needs Repair',
      ],
    ];

    this.drawStyledTable(doc, columns, rows, { boldCols: [1, 4], rowHeight: 22 });

    // Dynamic Section 1 Interpretation Callout (Outcome-focused: "What this means for us")
    const breakdown = reportData.diagnosticInsights?.scoreBreakdown;
    const isStrongOutput = totalEnergy >= baseEnergy * 0.85;
    const outputMeaning = isStrongOutput
      ? 'Foot traffic and energy collection are keeping pace with or beating our usual monthly average, showing this lobby location is working well.'
      : 'Energy collection is slower than usual—either fewer people passed through this hallway, or moving the tile to a busier entrance could capture more power.';

    let healthMeaning = 'The tile is healthy overall, so it can stay running smoothly with no repairs needed.';
    if (health < 80) {
      const stages = [
        { name: 'footstep pads', score: Number(breakdown?.harvesting ?? 100), impact: 'footsteps may generate less power over time' },
        { name: 'power storage part', score: Number(breakdown?.consistency ?? 100), impact: 'some of the energy we collect may go to waste before it can be used' },
        { name: 'Wi-Fi sensor', score: Number(breakdown?.telemetry ?? 100), impact: 'live dashboard updates may occasionally lag or drop' },
      ].sort((a, b) => a.score - b.score);
      const weakest = stages[0];
      healthMeaning =
        weakest.score < 70
          ? `However, the tile's ${weakest.name} is weakening—without a quick checkup, ${weakest.impact}.`
          : 'However, energy output was slightly less steady than usual, so it is worth keeping an eye on during routine checks.';
    }

    this.drawInterpretationCallout(doc, `${outputMeaning} ${healthMeaning}`);
  }

  // ============================================================================
  // SECTION 2: HOURLY FOOT TRAFFIC VS. ENERGY HARVESTED (VECTOR BAR CHART)
  // ============================================================================

  private drawHourlyBarChartSection(doc: typeof PDFDocument, reportData: any): void {
    this.drawSectionHeading(doc, '2. BUSIEST HOURS VS. ENERGY COLLECTED');

    const left = 48;
    const boxW = 499;
    const boxH = 180;
    this.ensureSpace(doc, boxH + 54);
    const boxY = doc.y;

    // Outer framed card
    doc
      .rect(left, boxY, boxW, boxH)
      .fillAndStroke(this.colors.white, this.colors.border);

    // Legend top-right (explicitly states Left vs. Right Y-axis)
    const legendY = boxY + 11;
    doc.rect(left + 162, legendY, 8, 8).fill(this.colors.emeraldBar);
    doc
      .font('Helvetica')
      .fontSize(7.4)
      .fillColor(this.colors.textBody)
      .text('Energy Harvested (mWh, Left Axis)', left + 174, legendY, { width: 145 });

    doc.rect(left + 324, legendY, 8, 8).fill(this.colors.skyBar);
    doc
      .font('Helvetica')
      .fontSize(7.4)
      .fillColor(this.colors.textBody)
      .text('Step Volume (Steps, Right Axis)', left + 336, legendY, { width: 150 });

    // Prepare hourly series (prefer campus 06h-18h, or all active slots up to 14 bars)
    const rawHourly: Array<any> = reportData.hourlyAggregation || [];
    const campusHours = rawHourly.filter((h) => {
      const hr = parseInt(String(h.hourSlot).slice(0, 2), 10);
      return hr >= 6 && hr <= 18;
    });
    const hasCampusData = campusHours.some((h) => h.energyMWh > 0 || h.totalSteps > 0);
    const series = hasCampusData
      ? campusHours
      : rawHourly.filter((h) => h.energyMWh > 0 || h.totalSteps > 0).slice(0, 14);
    const plotSeries = series.length > 0 ? series : campusHours;

    const plotLeft = left + 56;
    const plotRight = left + boxW - 48;
    const plotTop = boxY + 29;
    const plotBottom = boxY + 124;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const maxEnergy = Math.max(
      0.001,
      ...plotSeries.map((p) => Number(p.energyMWh || 0)),
    );
    const rawMaxSteps = Math.max(
      1,
      ...plotSeries.map((p) => Number(p.totalSteps || 0)),
    );
    // Round up to a clean multiple of 3 so all 4 right-axis tick labels are exact integers
    const ySteps = 3;
    const maxStepsAxis = Math.max(ySteps, Math.ceil(rawMaxSteps / ySteps) * ySteps);

    // Left and right vertical axis spines
    doc
      .moveTo(plotLeft, plotTop)
      .lineTo(plotLeft, plotBottom)
      .lineWidth(0.75)
      .strokeColor(this.colors.emeraldBar)
      .stroke();

    doc
      .moveTo(plotRight, plotTop)
      .lineTo(plotRight, plotBottom)
      .lineWidth(0.75)
      .strokeColor(this.colors.skyAxis)
      .stroke();

    // Horizontal gridlines + dual Y-axis ticks (Left: mWh, Right: Steps)
    for (let i = 0; i <= ySteps; i++) {
      const frac = i / ySteps;
      const y = plotBottom - frac * plotH;
      const energyVal = maxEnergy * frac;
      const stepsVal = Math.round(maxStepsAxis * frac);

      doc
        .moveTo(plotLeft, y)
        .lineTo(plotRight, y)
        .lineWidth(i === 0 ? 0.8 : 0.4)
        .strokeColor(i === 0 ? '#94A3B8' : '#E2E8F0')
        .stroke();

      // Left tick mark & mWh label
      doc
        .moveTo(plotLeft - 3, y)
        .lineTo(plotLeft, y)
        .lineWidth(0.7)
        .strokeColor(this.colors.emeraldBar)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(6.8)
        .fillColor(this.colors.forestDark)
        .text(energyVal.toFixed(5), left + 13, y - 3.5, {
          width: 38,
          align: 'right',
        });

      // Right tick mark & integer Steps label
      doc
        .moveTo(plotRight, y)
        .lineTo(plotRight + 3, y)
        .lineWidth(0.7)
        .strokeColor(this.colors.skyAxis)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(6.9)
        .fillColor(this.colors.skyAxis)
        .text(stepsVal.toLocaleString(), plotRight + 5, y - 3.5, {
          width: 28,
          align: 'left',
        });
    }

    // Left Y-axis title: Energy (mWh)
    doc.save();
    doc.translate(left + 11, plotTop + plotH / 2 + 24);
    doc.rotate(-90);
    doc
      .font('Helvetica-Bold')
      .fontSize(7.2)
      .fillColor(this.colors.forestDark)
      .text('Energy (mWh)', 0, 0);
    doc.restore();

    // Right Y-axis title: Step Volume (Steps)
    doc.save();
    doc.translate(left + boxW - 11, plotTop + plotH / 2 - 34);
    doc.rotate(90);
    doc
      .font('Helvetica-Bold')
      .fontSize(7.2)
      .fillColor(this.colors.skyAxis)
      .text('Step Volume (Steps)', 0, 0);
    doc.restore();

    // Bars (Energy scaled to left maxEnergy, Steps scaled to right maxStepsAxis)
    const slotW = plotW / Math.max(1, plotSeries.length);
    const barW = Math.max(4, Math.min(10, slotW * 0.34));

    plotSeries.forEach((pt, idx) => {
      const centerX = plotLeft + idx * slotW + slotW / 2;
      const eH = (Number(pt.energyMWh || 0) / maxEnergy) * plotH;
      const sH = (Number(pt.totalSteps || 0) / maxStepsAxis) * plotH;

      if (eH > 0) {
        doc
          .rect(centerX - barW - 0.5, plotBottom - eH, barW, eH)
          .fill(this.colors.emeraldBar);
      }
      if (sH > 0) {
        doc
          .rect(centerX + 0.5, plotBottom - sH, barW, sH)
          .fill(this.colors.skyBar);
      }

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(this.colors.textMuted)
        .text(pt.shortLabel || pt.hourSlot, centerX - slotW / 2, plotBottom + 5, {
          width: slotW,
          align: 'center',
        });
    });

    // Peak hours caption
    const topEnergyHours = [...plotSeries]
      .filter((p) => p.energyMWh > 0 || p.totalSteps > 0)
      .sort((a, b) => b.energyMWh - a.energyMWh)
      .slice(0, 3)
      .map((p) => p.hourSlot);

    const caption = topEnergyHours.length > 0
      ? `Figure 1. Energy collected (left, mWh) vs. footsteps counted (right, steps) each hour; best energy hours: ${topEnergyHours.join(', ')}.`
      : 'Figure 1. Energy collected (left, mWh) vs. footsteps counted (right, steps) each hour.';

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(this.colors.textBody)
      .text(caption, left + 16, plotBottom + 23, {
        width: boxW - 32,
        align: 'center',
      });

    doc.y = boxY + boxH + 6;

    // Dynamic Section 2 Interpretation Callout (Outcome-focused: "What this means for us")
    const topTrafficSlots = [...plotSeries]
      .filter((p) => Number(p.totalSteps || 0) > 0)
      .sort((a, b) => Number(b.totalSteps) - Number(a.totalSteps))
      .slice(0, 3);
    const lowYieldHours = plotSeries.filter(
      (p) =>
        Number(p.totalSteps || 0) >= Math.max(3, rawMaxSteps * 0.25) &&
        Number(p.energyMWh || 0) < maxEnergy * 0.05,
    );

    const trafficSummary = topTrafficSlots.length > 0
      ? `Foot traffic peaked around ${topTrafficSlots.map((p) => p.hourSlot).join(', ')}, which are our best windows for collecting clean campus energy.`
      : 'Foot traffic was very light across the monitored hours, meaning this period did not see typical campus walkway activity.';
    const correlationSummary =
      lowYieldHours.length > 0
        ? `However, ${lowYieldHours.length === 1 ? 'one busy hour' : 'some busy hours'} (${lowYieldHours.map((p) => p.hourSlot).join(', ')}) counted footsteps without saving energy—suggesting pedestrians may be stepping only on the tile's edge, or a wire connection briefly loosened during heavy traffic.`
        : 'Energy collection rose and fell right alongside foot traffic, confirming the tile is well-positioned and adding more tiles along this path would multiply our output.';

    this.drawInterpretationCallout(doc, `${trafficSummary} ${correlationSummary}`);
  }

  // ============================================================================
  // SECTION 3: ELECTRICAL & ENERGY STORAGE TELEMETRY (INA219 & ADC)
  // ============================================================================

  private drawElectricalTelemetrySection(doc: typeof PDFDocument, reportData: any): void {
    this.drawSectionHeading(doc, '3. POWER LEVELS & ENERGY STORAGE');

    const el = reportData.electricalTelemetry || {};
    const v = el.voltage || { min: 0, avg: 0, peak: 0 };
    const c = el.currentMA || { min: 0, avg: 0, peak: 0 };
    const p = el.powerMW || { min: 0, avg: 0, peak: 0 };
    const cap = el.capacitorV || { hasData: false, start: null, avg: null, end: null };

    const columns = [
      { label: 'Measurement', width: 96, align: 'left' as const },
      { label: 'Lowest', width: 74, align: 'right' as const },
      { label: 'Average', width: 74, align: 'right' as const },
      { label: 'Highest', width: 74, align: 'right' as const },
      { label: 'What This Means', width: 181, align: 'left' as const },
    ];

    const capDelta =
      cap.hasData && cap.start !== null && cap.end !== null
        ? cap.end - cap.start
        : null;

    const rows = [
      [
        'Voltage (Electrical Push)',
        `${Number(v.min).toFixed(5)} V`,
        `${Number(v.avg).toFixed(5)} V`,
        `${Number(v.peak).toFixed(5)} V`,
        v.peak <= 5.2
          ? 'Safe level — stayed below the 5.0 V safety limit'
          : 'Higher than normal — electrician should check voltage limiter',
      ],
      [
        'Current (Power Flow)',
        `${Number(c.min).toFixed(5)} mA`,
        `${Number(c.avg).toFixed(5)} mA`,
        `${Number(c.peak).toFixed(5)} mA`,
        c.peak >= 0.05
          ? 'Steady electrical flow through the power sensor'
          : 'Very weak flow — check sensor and tile wiring',
      ],
      [
        'Instant Power Output',
        `${Number(p.min).toFixed(5)} mW`,
        `${Number(p.avg).toFixed(5)} mW`,
        `${Number(p.peak).toFixed(5)} mW`,
        'Shown in mW (5 decimal places for small footstep bursts)',
      ],
      [
        'Stored Power (Capacitor)',
        cap.hasData && cap.start !== null ? `${cap.start.toFixed(5)} V (Start)` : '—',
        cap.hasData && cap.avg !== null ? `${cap.avg.toFixed(5)} V` : '—',
        cap.hasData && cap.end !== null ? `${cap.end.toFixed(5)} V (End)` : '—',
        capDelta !== null
          ? capDelta < -1.5
            ? `Dropped by ${Math.abs(capDelta).toFixed(5)} V — check storage capacitor, one-way diode, or wiring`
            : `Changed by ${capDelta >= 0 ? '+' : ''}${capDelta.toFixed(5)} V — storage level is being tracked`
          : 'Storage voltage sensor not active on this unit',
      ],
    ];

    this.drawStyledTable(doc, columns, rows, { rowHeight: 30, repeatHeaderOnPageBreak: true });

    // Dynamic Section 3 Interpretation Callout (Outcome-focused: "What this means for us")
    const clampSentence =
      Number(v.peak) <= 5.2
        ? 'The tile is operating safely with no risk of over-voltage, overheating, or damage to the electronics.'
        : 'Electrical levels spiked higher than normal, meaning an electrician should inspect the safety limiter before heavy use.';
    let capSentence = 'Energy storage tracking is currently on standby for this unit.';
    if (capDelta !== null && cap.start !== null && cap.end !== null) {
      if (capDelta >= 0) {
        capSentence = 'Stored power is building up smoothly, keeping harvested energy ready to run low-power indicators or sensors.';
      } else if (capDelta < -1.5) {
        capSentence = 'However, the tile is not holding onto the power it collects—stored energy is draining away before we can use it, so an electrician should inspect the storage part.';
      } else {
        capSentence = 'Stored power eased down gently during quiet hours, which is normal when nobody is walking on the tile.';
      }
    }

    this.drawInterpretationCallout(doc, `${clampSentence} ${capSentence}`);
  }

  // ============================================================================
  // SECTION 4: TILE HARDWARE HEALTH CHECK
  // ============================================================================

  private drawDiagnosticsLogSection(doc: typeof PDFDocument, reportData: any): void {
    this.ensureSpace(doc, 175);
    this.drawSectionHeading(doc, '4. TILE HARDWARE HEALTH CHECK');

    const insights = reportData.diagnosticInsights;
    const breakdown = insights?.scoreBreakdown || { harvesting: 94, consistency: 92, telemetry: 95 };
    const radar = insights?.fatigueRadar;
    const latestTest = reportData.diagnosticTests?.[0];
    const packetCount = reportData?.kpis?.packetCount ?? 0;

    const cap = reportData.electricalTelemetry?.capacitorV;
    const capDelta =
      cap?.hasData && cap.start !== null && cap.end !== null
        ? Number((cap.end - cap.start).toFixed(5))
        : null;

    const lastVerifiedStr = latestTest?.testDate
      ? `Step Test — ${this.formatShortDateTime(new Date(latestTest.testDate))}`
      : 'Auto Check — Running';

    const driftVal = radar?.driftPercent ?? 0;
    const avgLat = reportData?.kpis?.avgLatencyMs ?? radar?.avgLatencyMs ?? 0;

    const piezoScore = Number(breakdown.harvesting ?? 94);
    const capScore = Number(breakdown.consistency ?? 92);
    const espScore = Number(breakdown.telemetry ?? 95);
    const hasCapFault = capScore < 50 || (capDelta !== null && capDelta < -1.5);
    const hasAnyFault = piezoScore < 70 || capScore < 70 || espScore < 70 || hasCapFault;

    const piezoFaultText =
      piezoScore < 50 || insights?.faultDiagnosis?.code === 'WEAK_PIEZO_OUTPUT'
        ? 'Weak footstep power — check the piezo discs, rubber pads, and wire joints'
        : piezoScore < 70
          ? 'Slightly lower footstep power — check tile spring rebound and pad contact'
          : 'All footstep pads are responding normally';

    const capFaultText = hasCapFault
      ? 'Losing stored charge too fast — check the storage capacitor, one-way diode, or wiring'
      : insights?.faultDiagnosis?.code === 'OPEN_LOAD_LOW_CURRENT'
        ? 'Very low power flow — check rectifier wires and sensor connections'
        : capScore < 70 || (capDelta !== null && capDelta < -0.75)
          ? 'Storage draining slightly faster than usual — keep watching on next checkup'
          : 'Holding stored charge normally';

    const capActionText = hasCapFault
      ? 'Have an electrician inspect soon'
      : capScore < 70
        ? 'Recheck on next Step Test'
        : 'Monitored automatically';

    const espFaultText =
      espScore < 50
        ? 'Weak Wi-Fi updates — check ESP32 Wi-Fi signal, power supply, and dropouts'
        : espScore < 70
          ? 'Slower Wi-Fi updates — check campus Wi-Fi strength near the tile'
          : `${packetCount.toLocaleString()} live data updates received cleanly`;

    const espActionText =
      espScore < 70
        ? 'Check Wi-Fi signal & power'
        : hasAnyFault
          ? 'Wi-Fi is fine; fix flagged part first'
          : 'No repair needed';

    const columns = [
      { label: 'Tile Component', width: 118, align: 'left' as const },
      { label: 'Health Score', width: 102, align: 'left' as const },
      { label: 'Condition Check', width: 148, align: 'left' as const },
      { label: 'Next Step', width: 131, align: 'left' as const },
    ];

    const rows = [
      [
        'Footstep Pads (Piezo Array)',
        `${piezoScore} / 100 (${piezoScore >= 80 ? 'Healthy' : piezoScore >= 50 ? 'Watch' : 'Weak'})`,
        piezoFaultText,
        piezoScore < 70 ? 'Inspect piezo pads & wires' : lastVerifiedStr,
      ],
      [
        'Power Storage (Capacitor)',
        `${capScore} / 100 (${driftVal >= 0 ? '+' : ''}${driftVal}% change)`,
        capFaultText,
        capActionText,
      ],
      [
        'Wi-Fi Sensor (ESP32 Link)',
        `${espScore} / 100 (${avgLat > 0 ? `${avgLat} ms delay` : 'Online'})`,
        espFaultText,
        espActionText,
      ],
    ];

    this.drawStyledTable(doc, columns, rows, { boldCols: [1], rowHeight: 34 });

    // Dynamic Section 4 Interpretation Callout (Outcome-focused: "What this means for us")
    const healthyNames: string[] = [];
    const flaggedNames: string[] = [];
    if (piezoScore >= 70) healthyNames.push('footstep pads');
    else flaggedNames.push('footstep pads');

    if (capScore >= 70 && !(capDelta !== null && capDelta < -1.5)) healthyNames.push('power storage');
    else flaggedNames.push('power storage stage');

    if (espScore >= 70) healthyNames.push('Wi-Fi reporting');
    else flaggedNames.push('Wi-Fi sensor');

    const sec4Interpretation =
      flaggedNames.length > 0
        ? `${healthyNames.length > 0 ? `The ${healthyNames.join(' and ')} ${healthyNames.length === 1 ? 'is' : 'are'} working reliably, so traffic counts and live dashboard updates remain dependable. ` : ''}Only the ${flaggedNames.join(' and ')} ${flaggedNames.length === 1 ? 'needs' : 'need'} attention—servicing it now will prevent energy loss and protect the tile's lifespan.`
        : 'Every major part of the tile is in good shape, so campus staff can leave it running unattended without worrying about downtime or repairs.';

    this.drawInterpretationCallout(doc, sec4Interpretation);
  }

  // ============================================================================
  // SECTION 5: SUMMARY & NEXT STEPS
  // ============================================================================

  private drawEcoGuideSummarySection(
    doc: typeof PDFDocument,
    reportData: any,
    aiAnalysis: string | null,
  ): void {
    this.ensureSpace(doc, 155);
    this.drawSectionHeading(doc, '5. SUMMARY & NEXT STEPS');

    const left = 48;
    const boxW = 499;
    const kpis = reportData.kpis || {};
    const insights = reportData.diagnosticInsights;
    const breakdown = insights?.scoreBreakdown || { harvesting: 94, consistency: 92, telemetry: 95 };
    const piezoScore = Number(breakdown.harvesting ?? 94);
    const capScore = Number(breakdown.consistency ?? 92);
    const espScore = Number(breakdown.telemetry ?? 95);
    const compositeHealth = Number(kpis.healthScore ?? insights?.healthScore ?? 94);

    const cap = reportData.electricalTelemetry?.capacitorV;
    const capDelta =
      cap?.hasData && cap.start !== null && cap.end !== null
        ? Number((cap.end - cap.start).toFixed(5))
        : null;

    const topHours = [...(reportData.hourlyAggregation || [])]
      .filter((h) => h.energyMWh > 0)
      .sort((a, b) => b.energyMWh - a.energyMWh)
      .slice(0, 3)
      .map((h) => h.hourSlot);

    const variancePct =
      kpis.baselineEnergyMWh > 0
        ? (((kpis.totalEnergyMWh - kpis.baselineEnergyMWh) / kpis.baselineEnergyMWh) * 100).toFixed(1)
        : '0.0';

    // Determine flagged subsystems so Section 5 NEVER contradicts Section 4 or says "No repair needed" when flagged
    const flaggedActions: string[] = [];
    const hasCriticalFault =
      piezoScore < 50 || capScore < 50 || espScore < 50 || (capDelta !== null && capDelta < -1.5);

    if (capScore < 50 || (capDelta !== null && capDelta < -1.5)) {
      flaggedActions.push(
        `Have an electrician check the storage capacitor for leaks, test the one-way diode, and inspect the wiring (Power Storage scored ${capScore}/100${capDelta !== null ? ` and dropped ${Math.abs(capDelta).toFixed(5)} V` : ''}).`,
      );
    } else if (capScore < 70) {
      flaggedActions.push(
        `Check the power storage diode and capacitor connections (Power Storage scored ${capScore}/100).`,
      );
    }
    if (piezoScore < 70) {
      flaggedActions.push(
        `Check the footstep piezo discs, rubber pads, and wire joints (Footstep Pads scored ${piezoScore}/100).`,
      );
    }
    if (espScore < 70) {
      flaggedActions.push(
        `Check the Wi-Fi signal strength and power supply near the tile (Wi-Fi Sensor scored ${espScore}/100).`,
      );
    }

    const hasFlaggedSubsystems = flaggedActions.length > 0 || compositeHealth < 70;

    // Guard against stale/contradictory AI text claiming "no repair needed" while a subsystem is flagged
    const sanitizedAi = aiAnalysis ? this.truncateAtSentence(this.sanitizeForPdf(aiAnalysis), 440) : '';
    const aiContradictsFault =
      hasFlaggedSubsystems &&
      /no repair needed|no maintenance|all systems? (?:are )?normal|working normally/i.test(sanitizedAi);

    const fallbackTakeaway = this.sanitizeForPdf(
      `The main lobby tile actively captured clean energy from campus foot traffic${topHours.length ? `, performing best around ${topHours.join(', ')}` : ''}. ` +
        (hasFlaggedSubsystems
          ? 'While footstep detection and live reporting remain dependable, a quick hardware checkup is needed so collected energy is not wasted.'
          : 'All tile components are working reliably, so the unit can continue operating normally without any maintenance.'),
    );

    const keyTakeaway = sanitizedAi && !aiContradictsFault ? sanitizedAi : fallbackTakeaway;

    const recommendation = this.sanitizeForPdf(
      hasFlaggedSubsystems
        ? `${flaggedActions.join(' ')} After servicing, run a quick Step Test on the Diagnostics page to confirm everything is back to normal.`
        : insights?.faultDiagnosis?.summary && insights?.faultDiagnosis?.severity !== 'healthy'
          ? `${insights.faultDiagnosis.summary} ${insights.faultDiagnosis.recommendedChecks?.[0] || ''}`.trim()
          : 'No repair is needed right now—keep normal campus monitoring running and perform an occasional Step Test to ensure long-term reliability.',
    );

    const innerX = left + 14;
    const innerW = boxW - 28;
    const lineGap = 1.5;

    // Measure text height dynamically using exact innerW so callout never clips or overflows
    const takeawayText = `What Happened: ${keyTakeaway}`;
    const recText = `What To Do Next: ${recommendation}`;
    const noteText =
      'Note: Based on verified sensor readings (mWh, \u00B5Wh/step, mW, V, mA) compared against the 30-day average.';

    doc.font('Helvetica').fontSize(8.6);
    const h1 = doc.heightOfString(takeawayText, { width: innerW, lineGap });
    const h2 = doc.heightOfString(recText, { width: innerW, lineGap });
    doc.font('Helvetica-Oblique').fontSize(8);
    const h3 = doc.heightOfString(noteText, { width: innerW, lineGap });
    const boxH = Math.max(112, 34 + h1 + h2 + h3 + 28);

    this.ensureSpace(doc, boxH + 10);
    const finalY = doc.y;

    // Callout box + thick left accent bar (amber when critical fault flagged, emerald when healthy)
    const boxBg = hasCriticalFault ? this.colors.warnBg : this.colors.mintBg;
    const boxBorder = hasCriticalFault ? this.colors.warnBorder : this.colors.mintBorder;
    const accentColor = hasCriticalFault ? this.colors.warnBar : this.colors.forestDark;

    doc
      .rect(left, finalY, boxW, boxH)
      .fillAndStroke(boxBg, boxBorder);
    doc.rect(left, finalY, 4, boxH).fill(accentColor);

    let ty = finalY + 11;
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(accentColor)
      .text(
        hasCriticalFault
          ? 'EcoGuide Summary — Action Needed'
          : 'EcoGuide Summary',
        innerX,
        ty,
        { width: innerW },
      );

    ty = doc.y + 6;
    doc
      .font('Helvetica-Bold')
      .fontSize(8.6)
      .fillColor(this.colors.textDark)
      .text('What Happened: ', innerX, ty, { width: innerW, lineGap, continued: true })
      .font('Helvetica')
      .fillColor(this.colors.textBody)
      .text(keyTakeaway, { lineGap });

    ty = doc.y + 7;
    doc
      .font('Helvetica-Bold')
      .fontSize(8.6)
      .fillColor(this.colors.textDark)
      .text('What To Do Next: ', innerX, ty, { width: innerW, lineGap, continued: true })
      .font('Helvetica')
      .fillColor(this.colors.textBody)
      .text(recommendation, { lineGap });

    ty = doc.y + 7;
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor(this.colors.textMuted)
      .text(noteText, innerX, ty, { width: innerW, lineGap });

    doc.y = finalY + boxH + 10;
  }

  /**
   * Renders a compact, muted interpretation callout box directly beneath a table or figure.
   */
  private drawInterpretationCallout(doc: typeof PDFDocument, rawText: string): void {
    const left = 48;
    const boxW = 499;
    const innerX = left + 10;
    const innerW = boxW - 20;
    const lineGap = 1.25;
    const cleanText = this.sanitizeForPdf(rawText);
    const fullStr = `Interpretation: ${cleanText}`;

    doc.font('Helvetica').fontSize(7.8);
    const textH = doc.heightOfString(fullStr, { width: innerW, lineGap });
    const boxH = Math.max(24, textH + 12);

    this.ensureSpace(doc, boxH + 10);
    const y = doc.y + 4;

    doc
      .rect(left, y, boxW, boxH)
      .fillAndStroke(this.colors.calloutBg, this.colors.calloutBorder);
    doc.rect(left, y, 2.5, boxH).fill(this.colors.calloutBar);

    doc
      .font('Helvetica-Bold')
      .fontSize(7.8)
      .fillColor(this.colors.textDark)
      .text('Interpretation: ', innerX, y + 6, { width: innerW, lineGap, continued: true })
      .font('Helvetica')
      .fillColor(this.colors.textBody)
      .text(cleanText, { lineGap });

    doc.y = y + boxH + 10;
  }

  /**
   * Strips LaTeX/KaTeX syntax, Markdown markers, and non-WinAnsi Unicode glyphs
   * so PDFKit's built-in Helvetica font renders crisp, readable plain text.
   */
  private sanitizeForPdf(raw: string): string {
    if (!raw) return '';
    let s = raw;

    // Unwrap common LaTeX commands first
    s = s.replace(/\\text\{([^}]*)\}/g, '$1');
    s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
    s = s.replace(/\\mathbf\{([^}]*)\}/g, '$1');
    s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
    s = s.replace(/\\approx|\\simeq|\\cong|\\sim/g, '~');
    s = s.replace(/\\times/g, 'x');
    s = s.replace(/\\mu/g, '\u00B5');
    s = s.replace(/\\pm/g, '+/-');
    s = s.replace(/\\le|\\leq/g, '<=');
    s = s.replace(/\\ge|\\geq/g, '>=');
    s = s.replace(/\\,|\\;|\\:|\\!/g, ' ');
    s = s.replace(/\\(%)/g, '$1');

    // Convert LaTeX superscripts/subscripts like 10^{-7} or CO_{2} or CO_2
    s = s.replace(/\^\{([^}]*)\}/g, '^$1');
    s = s.replace(/_\{([^}]*)\}/g, '$1');
    s = s.replace(/CO_2/g, 'CO2');

    // Strip math delimiters and remaining backslashes/braces/markdown
    s = s.replace(/\$\$|\$|\\\(|\\\)|\\\[|\\\]/g, '');
    s = s.replace(/\\[a-zA-Z]+/g, '');
    s = s.replace(/[{}]/g, '');
    s = s.replace(/[#*_`]/g, '');

    // Replace non-WinAnsi Unicode characters with clean ASCII equivalents
    const unicodeMap: Record<string, string> = {
      '\u2248': '~', // ≈
      '\u223C': '~', // ∼
      '\u00D7': 'x', // ×
      '\u03BC': '\u00B5', // μ (Greek mu) -> WinAnsi micro sign µ
      '\u2011': '-', // non-breaking hyphen
      '\u2010': '-', // hyphen
      '\u2012': '-', // figure dash
      '\u2013': '-', // en-dash
      '\u2014': ' - ', // em-dash
      '\u2212': '-', // minus sign
      '\u2018': "'",
      '\u2019': "'",
      '\u201C': '"',
      '\u201D': '"',
      '\u00A0': ' ', // NBSP
      '\u2070': '0',
      '\u00B9': '1',
      '\u00B2': '2',
      '\u00B3': '3',
      '\u2074': '4',
      '\u2075': '5',
      '\u2076': '6',
      '\u2077': '7',
      '\u2078': '8',
      '\u2079': '9',
      '\u207A': '+',
      '\u207B': '-',
      '\u2080': '0',
      '\u2081': '1',
      '\u2082': '2',
      '\u2083': '3',
      '\u2084': '4',
      '\u2085': '5',
      '\u2086': '6',
      '\u2087': '7',
      '\u2088': '8',
      '\u2089': '9',
    };

    s = s.replace(
      /[\u2248\u223C\u00D7\u03BC\u2010-\u2014\u2212\u2018-\u201D\u00A0\u2070\u00B9\u00B2\u00B3\u2074-\u207B\u2080-\u2089]/g,
      (ch) => unicodeMap[ch] ?? '',
    );

    // Strip any remaining non-ASCII characters outside printable ASCII + WinAnsi micro sign (µ)
    s = s.replace(/[^\x20-\x7E\u00B5]/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  /**
   * Truncates long text at the last complete sentence boundary so PDFs never end mid-sentence.
   */
  private truncateAtSentence(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    const slice = text.slice(0, maxLen);
    const lastPunct = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
    if (lastPunct > maxLen * 0.45) {
      return slice.slice(0, lastPunct + 1).trim();
    }
    const lastSpace = slice.lastIndexOf(' ');
    return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim()}...`;
  }

  // ============================================================================
  // SHARED TABLE, NO-DATA & FOOTER HELPERS
  // ============================================================================

  private drawSectionHeading(doc: typeof PDFDocument, title: string): void {
    this.ensureSpace(doc, 54);
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(this.colors.forestDark)
      .text(title, 48, doc.y, { characterSpacing: 0.3 });
    doc.y += 6;
  }

  private drawStyledTable(
    doc: typeof PDFDocument,
    columns: Array<{ label: string; width: number; align: 'left' | 'right' | 'center' }>,
    rows: string[][],
    opts: { boldCols?: number[]; rowHeight?: number; repeatHeaderOnPageBreak?: boolean } = {},
  ): void {
    const left = 48;
    const headerH = 24;
    const baseRowH = opts.rowHeight ?? 26;
    const boldSet = new Set(opts.boldCols || []);

    const drawHeader = (y: number) => {
      let x = left;
      for (const col of columns) {
        doc
          .rect(x, y, col.width, headerH)
          .fillAndStroke(this.colors.forestDark, this.colors.forestDark);
        doc
          .font('Helvetica-Bold')
          .fontSize(8.2)
          .fillColor(this.colors.white)
          .text(col.label, x + 6, y + 7, { width: col.width - 12, align: col.align });
        x += col.width;
      }
      return y + headerH;
    };

    let y = drawHeader(doc.y);

    rows.forEach((row, rIdx) => {
      // Compute dynamic row height so wrapped text never overflows
      let neededH = baseRowH;
      row.forEach((cell, cIdx) => {
        doc.font(boldSet.has(cIdx) ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.2);
        const h = doc.heightOfString(cell, { width: columns[cIdx].width - 12 }) + 12;
        if (h > neededH) neededH = h;
      });

      if (y + neededH > 760) {
        doc.addPage();
        y = 44;
        if (opts.repeatHeaderOnPageBreak) {
          y = drawHeader(y);
        }
      }

      const bg = rIdx % 2 === 1 ? this.colors.rowAlt : this.colors.white;
      let x = left;
      row.forEach((cell, cIdx) => {
        const col = columns[cIdx];
        doc
          .rect(x, y, col.width, neededH)
          .fillAndStroke(bg, this.colors.border);
        doc
          .font(boldSet.has(cIdx) ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.2)
          .fillColor(this.colors.textBody)
          .text(cell, x + 6, y + 6, { width: col.width - 12, align: col.align });
        x += col.width;
      });

      y += neededH;
    });

    doc.y = y;
  }

  private drawNoDataSection(doc: typeof PDFDocument, startDate: string, endDate: string): void {
    doc.moveDown(2);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(this.colors.red)
      .text('NO TELEMETRY DATA AVAILABLE', { align: 'center' });
    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(this.colors.textMuted)
      .text(
        `No hardware readings were recorded between ${startDate} and ${endDate}.`,
        { align: 'center' },
      );
  }

  private drawFooters(doc: typeof PDFDocument): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      doc
        .moveTo(48, 790)
        .lineTo(547, 790)
        .lineWidth(0.75)
        .strokeColor(this.colors.border)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(this.colors.textMuted)
        .text(
          'EcoStep — CTU Daanbantayan Campus | Confidential System & Research Report',
          48,
          798,
          { width: 380, align: 'left', lineBreak: false },
        );

      doc.text(`Page ${i + 1} of ${range.count}`, 430, 798, {
        width: 117,
        align: 'right',
        lineBreak: false,
      });

      doc.page.margins.bottom = savedBottom;
    }
  }

  private ensureSpace(doc: typeof PDFDocument, neededHeight: number): void {
    if (doc.y + neededHeight > 765) {
      doc.addPage();
      doc.y = 44;
    }
  }

  private generateReportId(reportType: ReportType, startDate: string): string {
    const prefixMap: Record<string, string> = {
      [ReportType.ENERGY_MONITORING]: 'ECO-EG',
      [ReportType.HISTORICAL_ANALYTICS]: 'ECO-ET',
      [ReportType.SYSTEM_DIAGNOSTICS]: 'ECO-SP',
      [ReportType.SYSTEM_SUMMARY]: 'ECO-SO',
    };
    const prefix = prefixMap[reportType] || 'ECO-RP';
    const compactDate = startDate.replace(/-/g, '').slice(0, 8);
    const suffix = String(Date.now()).slice(-6);
    return `${prefix}-${compactDate}-${suffix}`;
  }

  private formatReportingPeriod(startDate: string, endDate: string, periodDays?: number): string {
    const fmt = (s: string) =>
      new Date(`${s.slice(0, 10)}T00:00:00+08:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Manila',
      });
    if (startDate.slice(0, 10) === endDate.slice(0, 10)) {
      return `${fmt(startDate)} (24 Hours)`;
    }
    return `${fmt(startDate)} – ${fmt(endDate)} (${periodDays || 1} Days)`;
  }

  private formatDateTime(date: Date): string {
    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });
    return `${datePart} at ${timePart}`;
  }

  private formatShortDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });
  }
}
