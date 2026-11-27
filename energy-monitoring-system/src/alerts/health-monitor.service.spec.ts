import { HealthMonitorService } from './health-monitor.service';
import { AlertSeverity, AlertType } from './schemas/alert.schema';

describe('HealthMonitorService', () => {
  let service: HealthMonitorService;
  let mockAlertModel: any;
  let mockUserModel: any;
  let mockAlertsService: any;
  let mockDiagnosticsService: any;
  let mockMaintenanceService: any;
  let mockEmailService: any;

  const baseHealthyInsights = () => ({
    healthScore: 92,
    status: 'healthy',
    scoreBreakdown: { harvesting: 95, consistency: 90, telemetry: 91 },
    fatigueRadar: {
      baseline30dMWhPerStep: 0.01,
      recent7dMWhPerStep: 0.0098,
      driftPercent: -2,
      totalLifetimeSteps: 500,
      readingsLast24h: 12,
      lastReadingAt: new Date('2026-11-27T07:00:00Z').toISOString(),
    },
    faultDiagnosis: {
      code: 'HEALTHY',
      summary: 'All systems healthy.',
      recommendedAction: 'No action needed.',
    },
  });

  beforeEach(() => {
    mockAlertModel = {
      exists: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };
    mockUserModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              { email: 'admin1@ecostep.edu' },
              { email: 'admin2@ecostep.edu' },
            ]),
          }),
        }),
      }),
    };
    mockAlertsService = {
      createAlert: jest.fn().mockResolvedValue({ id: 'alert-1' }),
    };
    mockDiagnosticsService = {
      getDiagnosticInsights: jest.fn().mockResolvedValue(baseHealthyInsights()),
    };
    mockMaintenanceService = {
      isEnabled: jest.fn().mockResolvedValue(false),
    };
    mockEmailService = {
      isEmailConfigured: jest.fn().mockReturnValue(true),
      sendHealthAlertEmail: jest
        .fn()
        .mockResolvedValue({ sent: 2, failed: 0, skipped: false }),
    };

    service = new HealthMonitorService(
      mockAlertModel,
      mockUserModel,
      mockAlertsService,
      mockDiagnosticsService,
      mockMaintenanceService,
      mockEmailService,
    );
  });

  it('pauses automatically when Maintenance Mode is ON', async () => {
    mockMaintenanceService.isEnabled.mockResolvedValue(true);

    const summary = await service.runHealthCheck({
      source: 'cron',
      now: new Date('2026-11-27T08:00:00Z'), // Friday
    });

    expect(summary.skippedReason).toContain('Maintenance Mode');
    expect(mockAlertsService.createAlert).not.toHaveBeenCalled();
    expect(mockEmailService.sendHealthAlertEmail).not.toHaveBeenCalled();
  });

  it('triggers no alerts when tile is healthy', async () => {
    const summary = await service.runHealthCheck({
      source: 'cron',
      now: new Date('2026-11-27T08:00:00Z'), // Friday, 1h after last reading
    });

    expect(summary.triggered).toHaveLength(0);
    expect(mockAlertsService.createAlert).not.toHaveBeenCalled();
  });

  it('triggers SENSOR_OFFLINE alert and emails all active admins when silent >24h on a weekday', async () => {
    const insights = baseHealthyInsights();
    insights.fatigueRadar.lastReadingAt = new Date('2026-11-25T06:00:00Z').toISOString(); // 50h ago
    mockDiagnosticsService.getDiagnosticInsights.mockResolvedValue(insights);

    const summary = await service.runHealthCheck({
      source: 'cron',
      now: new Date('2026-11-27T08:00:00Z'), // Friday PHT
    });

    expect(summary.triggered).toHaveLength(1);
    expect(summary.triggered[0].type).toBe(AlertType.SENSOR_OFFLINE);
    expect(summary.triggered[0].severity).toBe(AlertSeverity.CRITICAL);
    expect(summary.triggered[0].emailedCount).toBe(2);
    expect(mockEmailService.sendHealthAlertEmail).toHaveBeenCalledWith(
      ['admin1@ecostep.edu', 'admin2@ecostep.edu'],
      expect.objectContaining({ severity: AlertSeverity.CRITICAL }),
    );
  });

  it('does NOT trigger SENSOR_OFFLINE on weekends (Sat/Sun PHT)', async () => {
    const insights = baseHealthyInsights();
    insights.fatigueRadar.lastReadingAt = new Date('2026-11-26T06:00:00Z').toISOString();
    mockDiagnosticsService.getDiagnosticInsights.mockResolvedValue(insights);

    const summary = await service.runHealthCheck({
      source: 'cron',
      now: new Date('2026-11-28T08:00:00Z'), // Saturday PHT
    });

    expect(summary.triggered).toHaveLength(0);
  });

  it('triggers OUTPUT_DROP and TILE_HEALTH_DEGRADED when output drops >40% and a part score <70', async () => {
    const insights = baseHealthyInsights();
    insights.healthScore = 62;
    insights.scoreBreakdown = { harvesting: 58, consistency: 65, telemetry: 88 };
    insights.fatigueRadar.recent7dMWhPerStep = 0.005;
    insights.fatigueRadar.driftPercent = -50;
    mockDiagnosticsService.getDiagnosticInsights.mockResolvedValue(insights);

    const summary = await service.runHealthCheck({
      source: 'manual',
      now: new Date('2026-11-27T08:00:00Z'),
    });

    const types = summary.triggered.map((t) => t.type);
    expect(types).toContain(AlertType.OUTPUT_DROP);
    expect(types).toContain(AlertType.TILE_HEALTH_DEGRADED);
    expect(mockAlertsService.createAlert).toHaveBeenCalledTimes(2);
    expect(mockEmailService.sendHealthAlertEmail).toHaveBeenCalledTimes(2);
  });

  it('suppresses duplicate alerts within the 12-hour cooldown window', async () => {
    const insights = baseHealthyInsights();
    insights.healthScore = 60;
    insights.scoreBreakdown.harvesting = 55;
    mockDiagnosticsService.getDiagnosticInsights.mockResolvedValue(insights);
    mockAlertModel.exists.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'existing-alert' }),
    });

    const summary = await service.runHealthCheck({
      source: 'cron',
      now: new Date('2026-11-27T08:00:00Z'),
    });

    expect(summary.triggered).toHaveLength(0);
    expect(summary.suppressedByCooldown).toContain(AlertType.TILE_HEALTH_DEGRADED);
    expect(mockAlertsService.createAlert).not.toHaveBeenCalled();
    expect(mockEmailService.sendHealthAlertEmail).not.toHaveBeenCalled();
  });
});
