import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConnectionAuthenticatedEventDto,
  NewReadingEventDto,
  SensorUpdateEventDto,
  StatisticsUpdateEventDto,
  PowerAlertEventDto,
} from './dto';

/**
 * Dashboard Gateway
 *
 * Handles WebSocket connections for real-time dashboard updates.
 *
 * Features:
 * - JWT authentication on connection
 * - Real-time event broadcasting
 * - Room-based subscriptions
 * - Connection lifecycle management
 *
 * Events Broadcasted:
 * - reading:new - New energy reading
 * - sensor:update - Sensor status update
 * - statistics:update - System statistics
 * - alert:power - Power threshold alert
 * - sensor:online - Sensor online
 * - sensor:offline - Sensor offline
 *
 * Connection Flow:
 * 1. Client connects with JWT token in auth header
 * 2. Server validates token
 * 3. Client joins 'dashboard' room
 * 4. Server sends connection:authenticated event
 * 5. Client receives real-time updates
 *
 * Security:
 * - JWT authentication required
 * - CORS configured
 * - Only authenticated users can connect
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
export class DashboardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register the '/dashboard' namespace alongside the root '/' namespace
   * so clients connecting to either path authenticate and receive broadcasts.
   */
  afterInit(server: Server) {
    if (typeof server?.of !== 'function') {
      return;
    }
    const dashboardNs = server.of('/dashboard');
    dashboardNs.on('connection', (client: Socket) => {
      void this.handleConnection(client);
      client.on('disconnect', () => this.handleDisconnect(client));
      client.on('statistics:request', () => this.handleStatisticsRequest(client));
    });
  }

  private emitToDashboard(event: string, data: any): void {
    this.server?.to('dashboard').emit(event, data);
    if (typeof this.server?.of === 'function') {
      this.server.of('/dashboard').to('dashboard').emit(event, data);
    }
  }

  /**
   * Handle Client Connection
   *
   * Called when client connects to WebSocket.
   *
   * Authentication Flow:
   * 1. Extract JWT token from handshake auth
   * 2. Verify token using JwtService
   * 3. If valid: Join 'dashboard' room, send authenticated event
   * 4. If invalid: Disconnect client
   *
   * @param client - Socket.IO client
   */
  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided - ${client.id}`,
        );
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Store user info in socket data
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Join 'dashboard' room for broadcasts
      client.join('dashboard');

      this.logger.log(
        `Client connected: ${client.id} - User: ${payload.email} (${payload.role})`,
      );

      // Send authentication confirmation
      const authEvent: ConnectionAuthenticatedEventDto = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        connectedAt: new Date(),
        message: 'Successfully connected to dashboard',
      };

      client.emit('connection:authenticated', authEvent);
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error.message}`,
      );
      client.emit('error', {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
      client.disconnect();
    }
  }

  /**
   * Handle Client Disconnection
   *
   * Called when client disconnects from WebSocket.
   *
   * @param client - Socket.IO client
   */
  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(
        `Client disconnected: ${client.id} - User: ${user.email}`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id} (unauthenticated)`);
    }
  }

  /**
   * Handle Statistics Request
   *
   * Client requests current statistics.
   *
   * Event: 'statistics:request'
   * Response: Send statistics to requesting client
   *
   * @param client - Socket.IO client
   */
  @SubscribeMessage('statistics:request')
  handleStatisticsRequest(@ConnectedSocket() client: Socket) {
    this.logger.log(
      `Statistics requested by client: ${client.id} - User: ${client.data.user?.email}`,
    );
    // Statistics will be sent by DashboardService
    // This is just a trigger event
    return { event: 'statistics:request', data: { acknowledged: true } };
  }

  /**
   * Broadcast New Reading
   *
   * Broadcasts new energy reading to all connected dashboard clients.
   *
   * Called by: IoT Service after storing reading
   *
   * @param reading - New reading data
   */
  broadcastNewReading(reading: NewReadingEventDto) {
    this.logger.debug(`Broadcasting new reading: ${reading.id}`);
    this.emitToDashboard('reading:new', reading);
  }

  /**
   * Broadcast Sensor Update
   *
   * Broadcasts sensor status update to all connected dashboard clients.
   *
   * Called by: IoT Service after updating sensor
   *
   * @param sensor - Sensor update data
   */
  broadcastSensorUpdate(sensor: SensorUpdateEventDto) {
    this.logger.debug(`Broadcasting sensor update: ${sensor.id}`);
    this.emitToDashboard('sensor:update', sensor);
  }

  /**
   * Broadcast Statistics Update
   *
   * Broadcasts system statistics to all connected dashboard clients.
   *
   * Called by: Dashboard Service periodically
   *
   * @param statistics - Statistics data
   */
  broadcastStatistics(statistics: StatisticsUpdateEventDto) {
    this.logger.debug('Broadcasting statistics update');
    this.emitToDashboard('statistics:update', statistics);
  }

  /**
   * Broadcast Power Alert
   *
   * Broadcasts power threshold alert to all connected dashboard clients.
   *
   * Called by: IoT Service when power exceeds threshold
   *
   * @param alert - Alert data
   */
  broadcastPowerAlert(alert: PowerAlertEventDto) {
    this.logger.warn(
      `Broadcasting power alert: ${alert.sensorName} - ${alert.power}W > ${alert.threshold}W`,
    );
    this.emitToDashboard('alert:power', alert);
  }

  /**
   * Broadcast Sensor Online
   *
   * Broadcasts sensor online notification.
   *
   * @param sensorId - Sensor ID
   * @param sensorName - Sensor name
   * @param sensorLocation - Sensor location
   */
  broadcastSensorOnline(
    sensorId: string,
    sensorName: string,
    sensorLocation: string,
  ) {
    this.logger.log(`Broadcasting sensor online: ${sensorName}`);
    this.emitToDashboard('sensor:online', {
      sensorId,
      sensorName,
      sensorLocation,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast Sensor Offline
   *
   * Broadcasts sensor offline notification.
   *
   * @param sensorId - Sensor ID
   * @param sensorName - Sensor name
   * @param sensorLocation - Sensor location
   * @param lastSeenAt - Last seen timestamp
   */
  broadcastSensorOffline(
    sensorId: string,
    sensorName: string,
    sensorLocation: string,
    lastSeenAt: Date,
  ) {
    this.logger.warn(`Broadcasting sensor offline: ${sensorName}`);
    this.emitToDashboard('sensor:offline', {
      sensorId,
      sensorName,
      sensorLocation,
      lastSeenAt,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast Alert Created
   *
   * Broadcasts new alert to all connected dashboard clients.
   *
   * Called by: Alerts Service after creating alert
   *
   * @param alert - Alert data
   */
  broadcastAlertCreated(alert: any) {
    this.logger.warn(
      `Broadcasting new alert: ${alert.type} - ${alert.severity}`,
    );
    this.emitToDashboard('alert:created', alert);
  }

  /**
   * Broadcast Alert Acknowledged
   *
   * Broadcasts alert acknowledgement to all connected dashboard clients.
   *
   * @param alert - Updated alert data
   */
  broadcastAlertAcknowledged(alert: any) {
    this.logger.log(`Broadcasting alert acknowledged: ${alert.id}`);
    this.emitToDashboard('alert:acknowledged', alert);
  }

  /**
   * Broadcast Alert Resolved
   *
   * Broadcasts alert resolution to all connected dashboard clients.
   *
   * @param alert - Updated alert data
   */
  broadcastAlertResolved(alert: any) {
    this.logger.log(`Broadcasting alert resolved: ${alert.id}`);
    this.emitToDashboard('alert:resolved', alert);
  }

  /**
   * Get Connected Clients Count
   *
   * Returns number of currently connected dashboard clients.
   *
   * Safety:
   * - Checks full Socket.IO initialization chain
   * - Returns 0 if server/namespace/sockets Map not ready
   * - Prevents "Cannot read properties of undefined" errors
   *
   * Socket.IO Structure:
   * - server: Server instance
   * - server.sockets: Namespace (e.g., '/dashboard')
   * - server.sockets.sockets: Map<string, Socket> of connected clients
   *
   * @returns Number of connected clients (0 if not initialized)
   */
  private getAllNamespaceSockets(): Socket[] {
    const sockets: Socket[] = [];
    const rootSockets = this.server?.sockets?.sockets;
    if (rootSockets) {
      sockets.push(...rootSockets.values());
    }
    if (typeof this.server?.of === 'function') {
      const dashSockets = this.server.of('/dashboard')?.sockets;
      if (dashSockets) {
        sockets.push(...dashSockets.values());
      }
    }
    return sockets;
  }

  getConnectedClientsCount(): number {
    return this.getAllNamespaceSockets().length;
  }

  /**
   * Emit Event to Admin Users Only
   *
   * Broadcasts WebSocket event only to connected admin users.
   * Filters clients by role stored in socket.data during authentication.
   *
   * Use Cases:
   * - Diagnostic operations (only admins can perform diagnostics)
   * - Admin-specific system notifications
   * - Sensitive operations that shouldn't be broadcasted to public users
   *
   * @param event - Event name (e.g., 'diagnostic:test-completed')
   * @param data - Event payload data
   */
  emitToAdmins(event: string, data: any): void {
    const sockets = this.getAllNamespaceSockets();
    if (sockets.length === 0 && !this.server?.sockets) {
      this.logger.warn(
        `Cannot emit to admins: Server not initialized for event ${event}`,
      );
      return;
    }

    let adminCount = 0;

    // Iterate through all connected sockets and emit only to admins
    sockets.forEach((socket) => {
      const role = socket.data.user?.role;
      if (role === 'admin' || role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN') {
        socket.emit(event, data);
        adminCount++;
      }
    });

    this.logger.debug(`Emitted ${event} to ${adminCount} admin client(s)`);
  }
}
