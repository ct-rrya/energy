import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportType } from '../schemas/report.schema';

/**
 * Excel Generator Service - EcoStep Upgraded Telemetry & Diagnostics Workbook (.xlsx)
 *
 * Generates a 3-sheet Excel workbook with live formulas referencing raw hardware packets:
 * 1. Executive & Hourly Summary  — 5 KPI cards + Hourly Traffic & Energy Aggregation (SUMIF/COUNTIF/AVERAGEIF)
 * 2. Raw ESP32 Telemetry         — Full packet log (PKT-0001..N) with Cumulative Steps, Yield/Step, and Packet Status formulas
 * 3. Diagnostics Audit Log       — Hardware step tests & passive fatigue radar audit log
 */
@Injectable()
export class ExcelGeneratorService {
  private readonly logger = new Logger(ExcelGeneratorService.name);

  private readonly colors = {
    forestDark: 'FF0D5C40',
    forestMid: 'FF0F7653',
    mintLight: 'FFE8F7F0',
    slateHeader: 'FFF3F6F5',
    zebra: 'FFF9FBFA',
    border: 'FFCBD5E1',
    textDark: 'FF111827',
    textMuted: 'FF4B5563',
    white: 'FFFFFFFF',
    passBg: 'FFDCFCE7',
    passText: 'FF166534',
    warnBg: 'FFFEF3C7',
    warnText: 'FF92400E',
  };

  async generate(
    filePath: string,
    reportType: ReportType,
    startDate: string,
    endDate: string,
    reportData: any,
    user: any,
    _aiAnalysis: string | null = null,
  ): Promise<void> {
    this.logger.log(`Generating upgraded Excel workbook: ${filePath}`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = user?.name || 'EcoStep Administrator';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;

    const dateLabel = this.formatDateRangeLabel(startDate, endDate);

    if (!reportData?.hasData) {
      const sheet = workbook.addWorksheet('Executive & Hourly Summary');
      sheet.getCell('A1').value = 'ECOSTEP: SMART FOOTSTEP ENERGY MONITORING — NO DATA AVAILABLE';
      sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFDC2626' } };
      sheet.getCell('A3').value = `No hardware telemetry readings were recorded for ${dateLabel}.`;
      await workbook.xlsx.writeFile(filePath);
      return;
    }

    const rawPackets: any[] = reportData.rawPackets || [];
    const lastRawRow = 4 + Math.max(1, rawPackets.length);

    // Sheet 1: Executive & Hourly Summary (with live formulas referencing Sheet 2)
    this.buildExecutiveSummarySheet(workbook, dateLabel, reportData, lastRawRow);

    // Sheet 2: Raw ESP32 Telemetry (exact 14-column packet log)
    this.buildRawTelemetrySheet(workbook, dateLabel, rawPackets);

    // Sheet 3: Diagnostics Audit Log (exact 13-column diagnostics history)
    this.buildDiagnosticsAuditSheet(workbook, reportData);

    await workbook.xlsx.writeFile(filePath);
    this.logger.log(`Upgraded Excel workbook generated successfully: ${filePath} (${reportType})`);
  }

  // ============================================================================
  // SHEET 1: EXECUTIVE & HOURLY SUMMARY
  // ============================================================================

  private buildExecutiveSummarySheet(
    workbook: ExcelJS.Workbook,
    dateLabel: string,
    reportData: any,
    lastRawRow: number,
  ): void {
    const sheet = workbook.addWorksheet('Executive & Hourly Summary', {
      views: [{ state: 'frozen', ySplit: 8 }],
    });

    sheet.columns = [
      { width: 14 }, // A: Hour Slot
      { width: 15 }, // B: Batch Records
      { width: 15 }, // C: Total Steps
      { width: 23 }, // D: Harvested Energy (mWh)
      { width: 16 }, // E: Avg Power (mW)
      { width: 17 }, // F: Peak Voltage (V)
      { width: 18 }, // G: Avg Capacitor (V)
      { width: 18 }, // H: Yield / Step (µWh)
      { width: 18 }, // I: KPI Spacer / Health
    ];

    // Title Banner (Row 1)
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ECOSTEP: SMART FOOTSTEP ENERGY MONITORING — EXECUTIVE & DIAGNOSTICS EXPORT';
    titleCell.font = { size: 13, bold: true, color: { argb: this.colors.white } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.forestDark } };
    sheet.getRow(1).height = 28;

    // Subtitle Banner (Row 2)
    sheet.mergeCells('A2:I2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Cebu Technological University – Daanbantayan Campus | Reporting Period: ${dateLabel} | Tile ID: TILE-CTU-01 (32-Disc PZT Array)`;
    subCell.font = { size: 9.5, italic: true, color: { argb: this.colors.textMuted } };
    subCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.mintLight } };
    sheet.getRow(2).height = 20;

    // KPI Cards (Rows 4-5)
    const rawRef = `'Raw ESP32 Telemetry'`;
    const kpiDefs: Array<{
      mergeHeader: string;
      mergeVal: string;
      headerCell: string;
      valCell: string;
      label: string;
      value: any;
      numFmt?: string;
    }> = [
      {
        mergeHeader: 'A4:B4',
        mergeVal: 'A5:B5',
        headerCell: 'A4',
        valCell: 'A5',
        label: 'TOTAL ENERGY HARVESTED',
        value: { formula: `SUM(${rawRef}!J5:J${lastRawRow})`, result: reportData.kpis?.totalEnergyMWh ?? 0 },
        numFmt: '0.00000 "mWh"',
      },
      {
        mergeHeader: 'C4:D4',
        mergeVal: 'C5:D5',
        headerCell: 'C4',
        valCell: 'C5',
        label: 'TOTAL FOOTSTEPS DETECTED',
        value: { formula: `SUM(${rawRef}!D5:D${lastRawRow})`, result: reportData.kpis?.totalSteps ?? 0 },
        numFmt: '#,##0 "steps"',
      },
      {
        mergeHeader: 'E4:F4',
        mergeVal: 'E5:F5',
        headerCell: 'E4',
        valCell: 'E5',
        label: 'AVG SPECIFIC YIELD / STEP',
        value: { formula: `IF(C5>0,(A5/C5)*1000,0)`, result: reportData.kpis?.specificYieldUWh ?? 0 },
        numFmt: '0.00000 "µWh/step"',
      },
      {
        mergeHeader: 'G4:H4',
        mergeVal: 'G5:H5',
        headerCell: 'G4',
        valCell: 'G5',
        label: 'PEAK INSTANTANEOUS POWER',
        value: { formula: `MAX(${rawRef}!H5:H${lastRawRow})`, result: reportData.electricalTelemetry?.powerMW?.peak ?? 0 },
        numFmt: '0.00000 "mW"',
      },
      {
        mergeHeader: 'I4:I4',
        mergeVal: 'I5:I5',
        headerCell: 'I4',
        valCell: 'I5',
        label: 'LATEST TILE HEALTH SCORE',
        value: `${reportData.kpis?.healthScore ?? 94} / 100`,
      },
    ];

    sheet.getRow(4).height = 19;
    sheet.getRow(5).height = 26;
    for (const kpi of kpiDefs) {
      if (kpi.mergeHeader !== 'I4:I4') {
        sheet.mergeCells(kpi.mergeHeader);
        sheet.mergeCells(kpi.mergeVal);
      }
      const hc = sheet.getCell(kpi.headerCell);
      hc.value = kpi.label;
      hc.font = { size: 8.5, bold: true, color: { argb: this.colors.forestDark } };
      hc.alignment = { horizontal: 'center', vertical: 'middle' };
      hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.slateHeader } };

      const vc = sheet.getCell(kpi.valCell);
      vc.value = kpi.value;
      vc.font = { size: 12.5, bold: true, color: { argb: this.colors.textDark } };
      vc.alignment = { horizontal: 'center', vertical: 'middle' };
      if (kpi.numFmt) vc.numFmt = kpi.numFmt;
      vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.white } };

      this.applyThinBorder(hc);
      this.applyThinBorder(vc);
    }

    // Hourly Section Header (Row 7)
    sheet.mergeCells('A7:H7');
    const secCell = sheet.getCell('A7');
    secCell.value = 'HOURLY TRAFFIC & ENERGY AGGREGATION (06:00 – 18:00 CAMPUS HOURS & ACTIVE SLOTS)';
    secCell.font = { size: 10.5, bold: true, color: { argb: this.colors.white } };
    secCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.forestMid } };
    sheet.getRow(7).height = 23;

    // Hourly Column Headers (Row 8)
    const hourlyHeaders = [
      'Hour Slot',
      'Batch Records',
      'Total Steps',
      'Harvested Energy (mWh)',
      'Avg Power (mW)',
      'Peak Voltage (V)',
      'Avg Capacitor (V)',
      'Yield / Step (µWh)',
    ];
    const headerRow = sheet.getRow(8);
    headerRow.height = 22;
    hourlyHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { size: 9.5, bold: true, color: { argb: this.colors.textDark } };
      cell.alignment = { horizontal: i === 0 ? 'center' : 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.slateHeader } };
      this.applyThinBorder(cell);
    });

    // Hourly Rows with live Excel formulas referencing Raw ESP32 Telemetry
    const hourlyRows: any[] = reportData.hourlyAggregation || [];
    const startDataRow = 9;
    hourlyRows.forEach((slot, idx) => {
      const r = startDataRow + idx;
      const row = sheet.getRow(r);
      row.height = 20;

      row.getCell(1).value = slot.hourSlot;
      row.getCell(2).value = {
        formula: `COUNTIF(${rawRef}!$C$5:$C$${lastRawRow},A${r})`,
        result: slot.batchCount,
      };
      row.getCell(3).value = {
        formula: `SUMIF(${rawRef}!$C$5:$C$${lastRawRow},A${r},${rawRef}!$D$5:$D$${lastRawRow})`,
        result: slot.totalSteps,
      };
      row.getCell(4).value = {
        formula: `SUMIF(${rawRef}!$C$5:$C$${lastRawRow},A${r},${rawRef}!$J$5:$J$${lastRawRow})`,
        result: slot.energyMWh,
      };
      row.getCell(5).value = {
        formula: `IF(B${r}>0,AVERAGEIF(${rawRef}!$C$5:$C$${lastRawRow},A${r},${rawRef}!$H$5:$H$${lastRawRow}),0)`,
        result: slot.avgPowerMW,
      };
      row.getCell(6).value = slot.peakVoltageV;
      row.getCell(7).value = slot.avgCapacitorV !== null ? slot.avgCapacitorV : '—';
      row.getCell(8).value = {
        formula: `IF(C${r}>0,(D${r}/C${r})*1000,0)`,
        result: slot.yieldUWh,
      };

      row.getCell(2).numFmt = '#,##0';
      row.getCell(3).numFmt = '#,##0';
      row.getCell(4).numFmt = '0.00000';
      row.getCell(5).numFmt = '0.00000';
      row.getCell(6).numFmt = '0.00000';
      if (slot.avgCapacitorV !== null) row.getCell(7).numFmt = '0.00000';
      row.getCell(8).numFmt = '0.00000';

      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        cell.alignment = { horizontal: c === 1 ? 'center' : 'right', vertical: 'middle' };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.zebra } };
        }
        this.applyThinBorder(cell);
      }
    });

    // TOTAL / AVG Row
    const endDataRow = startDataRow + Math.max(0, hourlyRows.length - 1);
    const totalRowIdx = endDataRow + 1;
    const totalRow = sheet.getRow(totalRowIdx);
    totalRow.height = 22;

    totalRow.getCell(1).value = 'TOTAL / AVG';
    totalRow.getCell(2).value = { formula: `SUM(B${startDataRow}:B${endDataRow})` };
    totalRow.getCell(3).value = { formula: `SUM(C${startDataRow}:C${endDataRow})` };
    totalRow.getCell(4).value = { formula: `SUM(D${startDataRow}:D${endDataRow})` };
    totalRow.getCell(5).value = { formula: `IF(B${totalRowIdx}>0,AVERAGEIF(B${startDataRow}:B${endDataRow},">0",E${startDataRow}:E${endDataRow}),0)` };
    totalRow.getCell(6).value = { formula: `MAX(F${startDataRow}:F${endDataRow})` };
    totalRow.getCell(7).value = '—';
    totalRow.getCell(8).value = { formula: `IF(C${totalRowIdx}>0,(D${totalRowIdx}/C${totalRowIdx})*1000,0)` };

    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(3).numFmt = '#,##0';
    totalRow.getCell(4).numFmt = '0.00000';
    totalRow.getCell(5).numFmt = '0.00000';
    totalRow.getCell(6).numFmt = '0.00000';
    totalRow.getCell(8).numFmt = '0.00000';

    for (let c = 1; c <= 8; c++) {
      const cell = totalRow.getCell(c);
      cell.font = { bold: true, color: { argb: this.colors.forestDark } };
      cell.alignment = { horizontal: c === 1 ? 'center' : 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.mintLight } };
      this.applyThinBorder(cell);
    }
  }

  // ============================================================================
  // SHEET 2: RAW ESP32 TELEMETRY (14-COLUMN PACKET LOG)
  // ============================================================================

  private buildRawTelemetrySheet(
    workbook: ExcelJS.Workbook,
    dateLabel: string,
    rawPackets: any[],
  ): void {
    const sheet = workbook.addWorksheet('Raw ESP32 Telemetry', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    sheet.columns = [
      { width: 12 }, // A: Record ID
      { width: 21 }, // B: Timestamp
      { width: 11 }, // C: Hour Slot
      { width: 14 }, // D: Steps in Batch
      { width: 16 }, // E: Cumulative Steps
      { width: 15 }, // F: Peak Voltage (V)
      { width: 16 }, // G: Peak Current (mA)
      { width: 15 }, // H: Avg Power (mW)
      { width: 19 }, // I: Capacitor Voltage (V)
      { width: 18 }, // J: Batch Energy (mWh)
      { width: 17 }, // K: Yield / Step (µWh)
      { width: 18 }, // L: Upload Latency (ms)
      { width: 15 }, // M: Wi-Fi RSSI (dBm)
      { width: 14 }, // N: Packet Status
    ];

    sheet.mergeCells('A1:N1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `RAW ESP32 TELEMETRY BATCH LOG (${rawPackets.length.toLocaleString()} SENSOR PACKETS — ${dateLabel.toUpperCase()})`;
    titleCell.font = { size: 12.5, bold: true, color: { argb: this.colors.white } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.forestDark } };
    sheet.getRow(1).height = 26;

    sheet.mergeCells('A2:N2');
    const subCell = sheet.getCell('A2');
    subCell.value = 'Direct hardware telemetry from ESP32-WROOM-32 + INA219 sensor node. All summary metrics are dynamically calculated via Excel formulas.';
    subCell.font = { size: 9.5, italic: true, color: { argb: this.colors.textMuted } };
    subCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.mintLight } };
    sheet.getRow(2).height = 19;

    const headers = [
      'Record ID',
      'Timestamp',
      'Hour Slot',
      'Steps in Batch',
      'Cumulative Steps',
      'Peak Voltage (V)',
      'Peak Current (mA)',
      'Avg Power (mW)',
      'Capacitor Voltage (V)',
      'Batch Energy (mWh)',
      'Yield / Step (µWh)',
      'Upload Latency (ms)',
      'Wi-Fi RSSI (dBm)',
      'Packet Status',
    ];

    const headerRow = sheet.getRow(4);
    headerRow.height = 22;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { size: 9, bold: true, color: { argb: this.colors.white } };
      cell.alignment = { horizontal: i <= 2 || i === 13 ? 'center' : 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.forestMid } };
      this.applyThinBorder(cell);
    });

    rawPackets.forEach((pkt, idx) => {
      const r = 5 + idx;
      const row = sheet.getRow(r);
      row.height = 19;

      row.getCell(1).value = pkt.recordId;
      row.getCell(2).value = pkt.timestamp;
      row.getCell(3).value = pkt.hourSlot;
      row.getCell(4).value = pkt.steps;
      row.getCell(5).value = { formula: `SUM($D$5:D${r})`, result: pkt.cumulativeSteps };
      row.getCell(6).value = pkt.voltageV;
      row.getCell(7).value = pkt.currentMA;
      row.getCell(8).value = pkt.powerMW;
      row.getCell(9).value = pkt.capacitorV !== null ? pkt.capacitorV : '—';
      row.getCell(10).value = pkt.energyMWh;
      row.getCell(11).value = { formula: `IF(D${r}>0,(J${r}/D${r})*1000,0)`, result: pkt.yieldUWh };
      row.getCell(12).value = pkt.latencyMs !== null ? pkt.latencyMs : '—';
      row.getCell(13).value = pkt.rssiDbm !== null ? pkt.rssiDbm : '—';
      row.getCell(14).value =
        pkt.latencyMs !== null
          ? { formula: `IF(L${r}<=1000,"OK",IF(L${r}<=3000,"GOOD","DELAYED"))`, result: pkt.status }
          : pkt.status;

      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '0.00000';
      row.getCell(7).numFmt = '0.00000';
      row.getCell(8).numFmt = '0.00000';
      if (pkt.capacitorV !== null) row.getCell(9).numFmt = '0.00000';
      row.getCell(10).numFmt = '0.00000';
      row.getCell(11).numFmt = '0.00000';
      if (pkt.latencyMs !== null) row.getCell(12).numFmt = '#,##0';

      for (let c = 1; c <= 14; c++) {
        const cell = row.getCell(c);
        cell.alignment = { horizontal: c <= 3 || c === 14 ? 'center' : 'right', vertical: 'middle' };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.zebra } };
        }
        this.applyThinBorder(cell);
      }
    });

    const lastRow = 4 + Math.max(1, rawPackets.length);
    const totalIdx = lastRow + 1;
    const peakIdx = lastRow + 2;

    // TOTAL / AVERAGE Row
    const totalRow = sheet.getRow(totalIdx);
    totalRow.height = 21;
    totalRow.getCell(1).value = 'TOTAL / AVERAGE';
    totalRow.getCell(4).value = { formula: `SUM(D5:D${lastRow})` };
    totalRow.getCell(5).value = { formula: `MAX(E5:E${lastRow})` };
    totalRow.getCell(6).value = { formula: `AVERAGE(F5:F${lastRow})` };
    totalRow.getCell(7).value = { formula: `AVERAGE(G5:G${lastRow})` };
    totalRow.getCell(8).value = { formula: `AVERAGE(H5:H${lastRow})` };
    totalRow.getCell(10).value = { formula: `SUM(J5:J${lastRow})` };
    totalRow.getCell(11).value = { formula: `IF(D${totalIdx}>0,(J${totalIdx}/D${totalIdx})*1000,0)` };
    totalRow.getCell(6).numFmt = '0.00000';
    totalRow.getCell(7).numFmt = '0.00000';
    totalRow.getCell(8).numFmt = '0.00000';
    totalRow.getCell(10).numFmt = '0.00000';
    totalRow.getCell(11).numFmt = '0.00000';

    // PEAK / MAX Row
    const peakRow = sheet.getRow(peakIdx);
    peakRow.height = 21;
    peakRow.getCell(1).value = 'PEAK / MAX';
    peakRow.getCell(4).value = { formula: `MAX(D5:D${lastRow})` };
    peakRow.getCell(6).value = { formula: `MAX(F5:F${lastRow})` };
    peakRow.getCell(7).value = { formula: `MAX(G5:G${lastRow})` };
    peakRow.getCell(8).value = { formula: `MAX(H5:H${lastRow})` };
    peakRow.getCell(10).value = { formula: `MAX(J5:J${lastRow})` };
    peakRow.getCell(11).value = { formula: `MAX(K5:K${lastRow})` };
    peakRow.getCell(6).numFmt = '0.00000';
    peakRow.getCell(7).numFmt = '0.00000';
    peakRow.getCell(8).numFmt = '0.00000';
    peakRow.getCell(10).numFmt = '0.00000';
    peakRow.getCell(11).numFmt = '0.00000';

    [totalRow, peakRow].forEach((r) => {
      for (let c = 1; c <= 14; c++) {
        const cell = r.getCell(c);
        cell.font = { bold: true, color: { argb: this.colors.forestDark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.mintLight } };
        cell.alignment = { horizontal: c <= 3 || c === 14 ? 'center' : 'right', vertical: 'middle' };
        this.applyThinBorder(cell);
      }
    });
  }

  // ============================================================================
  // SHEET 3: DIAGNOSTICS AUDIT LOG (13-COLUMN LOG)
  // ============================================================================

  private buildDiagnosticsAuditSheet(workbook: ExcelJS.Workbook, reportData: any): void {
    const sheet = workbook.addWorksheet('Diagnostics Audit Log', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    sheet.columns = [
      { width: 12 }, // A: Test ID
      { width: 19 }, // B: Date & Time
      { width: 16 }, // C: Mode
      { width: 16 }, // D: Step Mean (µWh)
      { width: 15 }, // E: Deviation (%)
      { width: 20 }, // F: Expected Baseline (µWh)
      { width: 16 }, // G: Performance (%)
      { width: 16 }, // H: Harvesting Score
      { width: 16 }, // I: Consistency Score
      { width: 20 }, // J: Composite Health (0-100)
      { width: 34 }, // K: Fault-Signature Diagnosis
      { width: 28 }, // L: Technician / Action Logged
      { width: 11 }, // M: Status
    ];

    sheet.mergeCells('A1:M1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'HARDWARE DIAGNOSTICS & FAULT-SIGNATURE AUDIT LOG (STEP BENCH & WEAR RADAR)';
    titleCell.font = { size: 12.5, bold: true, color: { argb: this.colors.white } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.forestDark } };
    sheet.getRow(1).height = 26;

    sheet.mergeCells('A2:M2');
    const subCell = sheet.getCell('A2');
    subCell.value = 'Tracks step test repeatability, 30-day baseline comparison, passive 7-day drift, and automated fault-signature classifications.';
    subCell.font = { size: 9.5, italic: true, color: { argb: this.colors.textMuted } };
    subCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.mintLight } };
    sheet.getRow(2).height = 19;

    const headers = [
      'Test ID',
      'Date & Time',
      'Mode',
      'Step Mean (µWh)',
      'Deviation (%)',
      'Expected Baseline (µWh)',
      'Performance (%)',
      'Harvesting Score',
      'Consistency Score',
      'Composite Health (0-100)',
      'Fault-Signature Diagnosis',
      'Technician / Action Logged',
      'Status',
    ];

    const headerRow = sheet.getRow(4);
    headerRow.height = 22;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { size: 9, bold: true, color: { argb: this.colors.white } };
      cell.alignment = { horizontal: i === 10 || i === 11 ? 'left' : 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.forestMid } };
      this.applyThinBorder(cell);
    });

    const insights = reportData.diagnosticInsights;
    const tests: any[] = reportData.diagnosticTests || [];
    const breakdown = insights?.scoreBreakdown || { harvesting: 94, consistency: 92, telemetry: 95 };
    const composite = insights?.healthScore ?? 94;

    const rowsToWrite: Array<any[]> = [];

    // Include real historical diagnostic tests
    tests.forEach((t, idx) => {
      const actualUWh = Number(((t.actualEnergy ?? 0) * 1000).toFixed(3));
      const expectedUWh = Number(((t.expectedEnergy ?? 0) * 1000).toFixed(3));
      const perf = Number((t.performancePercentage ?? 100).toFixed(1));
      const dev = Number((perf - 100).toFixed(1));
      const isPass = t.result === 'Within Range';

      rowsToWrite.push([
        `DIAG-${101 + idx}`,
        this.formatManilaShort(new Date(t.testDate)),
        'Step Bench Test',
        actualUWh,
        dev,
        expectedUWh,
        perf,
        breakdown.harvesting,
        breakdown.consistency,
        composite,
        isPass ? 'Healthy — Within 30-day baseline range' : `Attention — ${t.result}`,
        t.notes || `Verified by ${t.performedBy || 'Admin'}`,
        isPass ? 'PASS' : 'WARN',
      ]);
    });

    // Always append current Passive Radar snapshot row
    if (insights) {
      const radar = insights.fatigueRadar;
      const isHealthy = insights.faultDiagnosis?.severity === 'healthy';
      rowsToWrite.push([
        `DIAG-${101 + rowsToWrite.length}`,
        this.formatManilaShort(new Date(insights.generatedAt || Date.now())),
        'Passive Radar',
        Number(((radar?.recent7dMWhPerStep ?? 0) * 1000).toFixed(3)),
        radar?.driftPercent ?? 0,
        Number(((radar?.baseline30dMWhPerStep ?? 0) * 1000).toFixed(3)),
        Number((100 + (radar?.driftPercent ?? 0)).toFixed(1)),
        breakdown.harvesting,
        breakdown.consistency,
        composite,
        insights.faultDiagnosis?.title || 'All checks normal',
        'Auto-logged by background diagnostics',
        isHealthy ? 'PASS' : 'WARN',
      ]);
    }

    rowsToWrite.forEach((vals, idx) => {
      const r = 5 + idx;
      const row = sheet.getRow(r);
      row.height = 21;
      vals.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.alignment = {
          horizontal: cIdx === 10 || cIdx === 11 ? 'left' : cIdx <= 2 || cIdx === 12 ? 'center' : 'right',
          vertical: 'middle',
        };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.zebra } };
        }
        if (cIdx === 12) {
          const isPass = v === 'PASS';
          cell.font = { bold: true, color: { argb: isPass ? this.colors.passText : this.colors.warnText } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isPass ? this.colors.passBg : this.colors.warnBg },
          };
        }
        this.applyThinBorder(cell);
      });
    });
  }

  private applyThinBorder(cell: ExcelJS.Cell): void {
    cell.border = {
      top: { style: 'thin', color: { argb: this.colors.border } },
      left: { style: 'thin', color: { argb: this.colors.border } },
      bottom: { style: 'thin', color: { argb: this.colors.border } },
      right: { style: 'thin', color: { argb: this.colors.border } },
    };
  }

  private formatDateRangeLabel(startDate: string, endDate: string): string {
    const fmt = (s: string) =>
      new Date(`${s.slice(0, 10)}T00:00:00+08:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Manila',
      });
    if (startDate.slice(0, 10) === endDate.slice(0, 10)) {
      return fmt(startDate);
    }
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }

  private formatManilaShort(date: Date): string {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
    const hr = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}-${get('month')}-${get('day')} ${hr}:${get('minute')}`;
  }
}
