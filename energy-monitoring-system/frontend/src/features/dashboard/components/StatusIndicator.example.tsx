/**
 * StatusIndicator Component Examples
 * 
 * Visual examples showcasing the StatusIndicator component in different states.
 * Use this file for development reference and documentation.
 */

import { StatusIndicator } from './StatusIndicator';

/**
 * Example 1: Connected Status (with pulse animation)
 */
export function ConnectedExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3>Connected Status (Pulse Animation)</h3>
      <StatusIndicator
        label="Wi-Fi"
        status="connected"
      />
    </div>
  );
}

/**
 * Example 2: Disconnected Status
 */
export function DisconnectedExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3>Disconnected Status</h3>
      <StatusIndicator
        label="Bluetooth"
        status="disconnected"
      />
    </div>
  );
}

/**
 * Example 3: Active Status with Timestamp
 */
export function ActiveWithTimestampExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3>Active Status with Timestamp</h3>
      <StatusIndicator
        label="Data Transfer"
        status="active"
        timestamp="2024-01-15T14:30:45Z"
      />
    </div>
  );
}

/**
 * Example 4: Waiting Status
 */
export function WaitingExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3>Waiting Status</h3>
      <StatusIndicator
        label="Data Transfer"
        status="waiting"
      />
    </div>
  );
}

/**
 * Example 5: Unknown Status
 */
export function UnknownExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3>Unknown Status</h3>
      <StatusIndicator
        label="Sensor"
        status="unknown"
      />
    </div>
  );
}

/**
 * Example 6: Custom Value
 */
export function CustomValueExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3>Custom Value Display</h3>
      <StatusIndicator
        label="API Server"
        status="connected"
        value="Online"
      />
    </div>
  );
}

/**
 * Example 7: All States Grid
 */
export function AllStatesExample() {
  return (
    <div style={{ padding: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      <StatusIndicator label="Connected" status="connected" />
      <StatusIndicator label="Disconnected" status="disconnected" />
      <StatusIndicator label="Active" status="active" timestamp="2024-01-15T14:30:45Z" />
      <StatusIndicator label="Waiting" status="waiting" />
      <StatusIndicator label="Unknown" status="unknown" />
      <StatusIndicator label="Error" status="error" />
    </div>
  );
}
