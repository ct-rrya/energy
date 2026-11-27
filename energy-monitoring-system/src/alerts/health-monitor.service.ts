import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Alert,
  AlertDocument,
  AlertSeverity,
  AlertType,
} from './schemas/alert.schema';
import { AlertsService } from './alerts.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/schemas/user.schema';

export interface HealthCheckRunSummary {
  checkedAt: string;
  skippedReason?: string;
  triggered: Array<{
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    emailedCount: number;
  }>;
  suppressedByCooldown: AlertType[];
  snapshot?: {
    healthScore: number;
    harvesting: number;
    consistency: number;
    telemetry: number;
    driftPercent: number;
    hoursSinceLastReading: number | null;
  };
}

export interface HealthMonitorStatus {
  enabled: boolean;
  pausedByMaintenance: boolean;
  emailConfigured: boolean;
  activeAdminEmailCount: number;
  cooldownHours: number;
  checkIntervalMinutes: number;
  lastCheckedAt: string | null;
  lastRunSummary: HealthCheckRunSummary | null;
  thresholds: {
    offlineHoursWeekdays: number;
    outputDropPercent: number;
    minHealthScore: number;
  };
}

const ALERT_COOLDOWN_HOURS = 12;
const OFFLINE_THRESHOLD_HOURS = 24;
const OUTPUT_DROP_THRESHOLD_PERCENT = -40; // >40% below 30-day baseline
const MIN_HEALTH_SCORE = 70;

@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);
  private lastCheckedAt: string | null = null;
  private lastRunSummary: HealthCheckRunSummary | null = null;

  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly alertsService: AlertsService,
    @Inject(forwardRef(() => DiagnosticsService))
    private readonly diagnosticsService: DiagnosticsService,
    private readonly maintenanceService: MaintenanceService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Automatic scheduled tile health check — runs every 30 minutes.
   * Automatically skips when Maintenance Mode is ON.
   */
  @Cron('*/30 * * * *')
  async scheduledHealthCheck(): Promise<void> {
    try {
      await this.runHealthCheck({ source: 'cron' });
    } catch (err: any) {
      this.logger.error(
        `Scheduled health check failed: ${err?.message || err}`,
        err?.stack,
      );
    }
  }

  /**
   * Returns current monitor configuration and last run summary for Settings UI.
   */
  async getMonitorStatus(): Promise<HealthMonitorStatus> {
    const [pausedByMaintenance, adminEmails] = await Promise.all([
      this.maintenanceService.isEnabled(),
      this.getActiveAdminEmails(),
    ]);

    return {
      enabled: true,
      pausedByMaintenance,
      emailConfigured: this.emailService.isEmailConfigured(),
      activeAdminEmailCount: adminEmails.length,
      cooldownHours: ALERT_COOLDOWN_HOURS,
      checkIntervalMinutes: 30,
      lastCheckedAt: this.lastCheckedAt,
      lastRunSummary: this.lastRunSummary,
      thresholds: {
        offlineHoursWeekdays: OFFLINE_THRESHOLD_HOURS,
        outputDropPercent: Math.abs(OUTPUT_DROP_THRESHOLD_PERCENT),
        minHealthScore: MIN_HEALTH_SCORE,
      },
    };
  }

  /**
   * Evaluates the 3 automated anomaly/health rules:
   * 1. Tile Offline / Silent > 24h during school days (Mon-Fri, PHT)
   * 2. Sharp Output Drop (> 40% below 30-day baseline)
   * 3. Tile Wear / Low Health Score (overall or any part < 70/100)
   */
  async runHealthCheck(options?: {
    source?: 'cron' | 'manual';
    now?: Date;
  }): Promise<HealthCheckRunSummary> {
    const now = options?.now ?? new Date();
    const checkedAt = now.toISOString();
    this.lastCheckedAt = checkedAt;

    // Auto-pause while Maintenance Mode is active
    const inMaintenance = await this.maintenanceService.isEnabled();
    if (inMaintenance) {
      const summary: HealthCheckRunSummary = {
        checkedAt,
        skippedReason: 'Paused while Maintenance Mode is active',
        triggered: [],
        suppressedByCooldown: [],
      };
      this.lastRunSummary = summary;
      return summary;
    }

    const insights = await this.diagnosticsService.getDiagnosticInsights();
    const { healthScore, scoreBreakdown, fatigueRadar, faultDiagnosis } = insights;

    const lastReadingAt = fatigueRadar?.lastReadingAt
      ? new Date(fatigueRadar.lastReadingAt)
      : null;
    const hoursSinceLastReading =
      lastReadingAt && !Number.isNaN(lastReadingAt.getTime())
        ? Number(((now.getTime() - lastReadingAt.getTime()) / (1000 * 60 * 60)).toFixed(1))
        : null;

    const candidates: Array<{
      type: AlertType;
      severity: AlertSeverity;
      title: string;
      description: string;
      recommendedAction: string;
      metrics: Array<{ label: string; value: string }>;
      metadata: Record<string, any>;
    }> = [];

    // Rule 1: Tile Offline / Silent > 24h during Mon-Fri school days (PHT)
    const isWeekdayPht = this.isWeekdayInManila(now);
    if (
      isWeekdayPht &&
      hoursSinceLastReading !== null &&
      hoursSinceLastReading >= OFFLINE_THRESHOLD_HOURS
    ) {
      const isCritical = hoursSinceLastReading >= 48;
      candidates.push({
        type: AlertType.SENSOR_OFFLINE,
        severity: isCritical ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: `Floor Tile Silent for ${Math.round(hoursSinceLastReading)} Hours`,
        description: `No footstep or telemetry readings have been received from the floor tile for ${hoursSinceLastReading} hours during a school day. Check tile power, Wi-Fi connection, or ESP32 status.`,
        recommendedAction:
          'Verify the ESP32 control box has power and reconnect it to campus Wi-Fi via Settings → Connect Tile Wi-Fi if needed.',
        metrics: [
          { label: 'Hours Since Last Update', value: `${hoursSinceLastReading} hrs` },
          { label: 'Last Reading (PHT)', value: lastReadingAt!.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) },
          { label: 'Readings (Last 24h)', value: String(fatigueRadar?.readingsLast24h ?? 0) },
        ],
        metadata: {
          hoursSinceLastReading,
          lastReadingAt: lastReadingAt!.toISOString(),
          threshold: OFFLINE_THRESHOLD_HOURS,
        },
      });
    }

    // Rule 2: Sharp Output Drop (> 40% below 30-day baseline)
    const baseline = Number(fatigueRadar?.baseline30dMWhPerStep ?? 0);
    const recent = Number(fatigueRadar?.recent7dMWhPerStep ?? 0);
    const driftPercent = Number(fatigueRadar?.driftPercent ?? 0);
    if (baseline > 0 && recent > 0 && driftPercent <= OUTPUT_DROP_THRESHOLD_PERCENT) {
      const dropMagnitude = Math.abs(Math.round(driftPercent));
      const isCritical = driftPercent <= -60;
      candidates.push({
        type: AlertType.OUTPUT_DROP,
        severity: isCritical ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: `Sharp Tile Output Drop (${dropMagnitude}% Below Baseline)`,
        description: `Recent energy per step (${recent.toFixed(4)} mWh) dropped ${dropMagnitude}% below the 30-day average (${baseline.toFixed(4)} mWh). A piezo pad, rectifier wire, or capacitor connection may be loose or degraded.`,
        recommendedAction:
          (faultDiagnosis as any)?.recommendedAction ||
          (faultDiagnosis as any)?.action ||
          'Run a Step Test in Diagnostics and inspect the piezo pad wiring and capacitor connections.',
        metrics: [
          { label: 'Recent 7-Day Yield', value: `${recent.toFixed(4)} mWh/step` },
          { label: '30-Day Baseline', value: `${baseline.toFixed(4)} mWh/step` },
          { label: 'Change vs. Baseline', value: `${driftPercent}%` },
        ],
        metadata: {
          recent7dMWhPerStep: recent,
          baseline30dMWhPerStep: baseline,
          driftPercent,
          threshold: OUTPUT_DROP_THRESHOLD_PERCENT,
        },
      });
    }

    // Rule 3: Tile Wear / Low Health Score (overall or any part < 70/100)
    const weakParts: string[] = [];
    if ((scoreBreakdown?.harvesting ?? 100) < MIN_HEALTH_SCORE) {
      weakParts.push(`Footstep Pads (${scoreBreakdown.harvesting}/100)`);
    }
    if ((scoreBreakdown?.consistency ?? 100) < MIN_HEALTH_SCORE) {
      weakParts.push(`Power Storage (${scoreBreakdown.consistency}/100)`);
    }
    if ((scoreBreakdown?.telemetry ?? 100) < MIN_HEALTH_SCORE) {
      weakParts.push(`Wi-Fi Sensor (${scoreBreakdown.telemetry}/100)`);
    }

    const lowestScore = Math.min(
      healthScore,
      scoreBreakdown?.harvesting ?? 100,
      scoreBreakdown?.consistency ?? 100,
      scoreBreakdown?.telemetry ?? 100,
    );

    if (
      (fatigueRadar?.totalLifetimeSteps ?? 0) > 0 &&
      (healthScore < MIN_HEALTH_SCORE || weakParts.length > 0)
    ) {
      const isCritical = lowestScore < 50;
      const partsSummary =
        weakParts.length > 0
          ? `Low part scores: ${weakParts.join(', ')}.`
          : `Overall tile health is ${healthScore}/100.`;

      candidates.push({
        type: AlertType.TILE_HEALTH_DEGRADED,
        severity: isCritical ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: `Tile Health Warning (${healthScore}/100)`,
        description: `${partsSummary} ${faultDiagnosis?.summary || 'Schedule a quick inspection to prevent wasted energy.'}`,
        recommendedAction:
          (faultDiagnosis as any)?.recommendedAction ||
          (faultDiagnosis as any)?.action ||
          'Open the Tile Diagnostics page to inspect which component needs calibration or repair.',
        metrics: [
          { label: 'Overall Tile Health', value: `${healthScore}/100` },
          { label: 'Footstep Pads (Piezo)', value: `${scoreBreakdown?.harvesting ?? 0}/100` },
          { label: 'Power Storage (Steadiness)', value: `${scoreBreakdown?.consistency ?? 0}/100` },
          { label: 'Wi-Fi Sensor (Connection)', value: `${scoreBreakdown?.telemetry ?? 0}/100` },
        ],
        metadata: {
          healthScore,
          scoreBreakdown,
          weakParts,
          threshold: MIN_HEALTH_SCORE,
        },
      });
    }

    const triggered: HealthCheckRunSummary['triggered'] = [];
    const suppressedByCooldown: AlertType[] = [];

    if (candidates.length > 0) {
      const adminEmails = await this.getActiveAdminEmails();

      for (const candidate of candidates) {
        const inCooldown = await this.isAlertInCooldown(candidate.type, now);
        if (inCooldown) {
          suppressedByCooldown.push(candidate.type);
          continue;
        }

        await this.alertsService.createAlert({
          title: candidate.title,
          description: candidate.description,
          type: candidate.type,
          severity: candidate.severity,
          sensorName: 'EcoStep Floor Tile',
          metadata: candidate.metadata,
        });

        const emailResult = await this.emailService.sendHealthAlertEmail(
          adminEmails,
          {
            title: candidate.title,
            description: candidate.description,
            severity: candidate.severity,
            recommendedAction: candidate.recommendedAction,
            metrics: candidate.metrics,
            detectedAt: now,
          },
        );

        triggered.push({
          type: candidate.type,
          severity: candidate.severity,
          title: candidate.title,
          emailedCount: emailResult.sent,
        });
      }
    }

    const summary: HealthCheckRunSummary = {
      checkedAt,
      triggered,
      suppressedByCooldown,
      snapshot: {
        healthScore,
        harvesting: scoreBreakdown?.harvesting ?? 0,
        consistency: scoreBreakdown?.consistency ?? 0,
        telemetry: scoreBreakdown?.telemetry ?? 0,
        driftPercent,
        hoursSinceLastReading,
      },
    };
    this.lastRunSummary = summary;
    return summary;
  }

  private async isAlertInCooldown(type: AlertType, now: Date): Promise<boolean> {
    const cutoff = new Date(now.getTime() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
    const recent = await this.alertModel
      .exists({
        type,
        createdAt: { $gte: cutoff },
      })
      .exec();
    return Boolean(recent);
  }

  private async getActiveAdminEmails(): Promise<string[]> {
    const admins = await this.userModel
      .find({
        role: { $in: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
        isActive: true,
        email: { $exists: true, $ne: '' },
      })
      .select('email')
      .lean()
      .exec();

    return Array.from(
      new Set(
        admins
          .map((a) => (a.email || '').trim().toLowerCase())
          .filter((e) => e.includes('@')),
      ),
    );
  }

  private isWeekdayInManila(date: Date): boolean {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      weekday: 'short',
    }).format(date);
    return weekday !== 'Sat' && weekday !== 'Sun';
  }
}
