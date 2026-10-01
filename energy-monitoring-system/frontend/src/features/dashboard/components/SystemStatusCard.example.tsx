/**
 * SystemStatusCard Component Examples
 * 
 * Visual examples showcasing the SystemStatusCardNew component in different states.
 * Use this file for development reference and documentation.
 */

import { SystemStatusCardNew } from './SystemStatusCard.new';

/**
 * Example 1: All Connected
 */
export function AllConnectedExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '1rem' }}>All Connected</h3>
      <SystemStatusCardNew
        wifi={true}
        bluetooth={true}
        dataTimestamp="2024-01-15T14:30:45Z"
        hasData={true}
      />
    </div>
  );
}

/**
 * Example 2: Wi-Fi Disconnected
 */
export function WifiDisconnectedExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '1rem' }}>Wi-Fi Disconnected</h3>
      <SystemStatusCardNew
        wifi={false}
        bluetooth={true}
        dataTimestamp="2024-01-15T14:25:30Z"
        hasData={true}
      />
    </div>
  );
}

/**
 * Example 3: No Data Yet (Waiting State)
 */
export function NoDataExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '1rem' }}>No Data Yet (Waiting)</h3>
      <SystemStatusCardNew
        wifi={true}
        bluetooth={true}
        dataTimestamp={undefined}
        hasData={false}
      />
    </div>
  );
}

/**
 * Example 4: Unknown Status
 */
export function UnknownStatusExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '1rem' }}>Unknown Status</h3>
      <SystemStatusCardNew
        wifi={undefined}
        bluetooth={undefined}
        dataTimestamp={undefined}
        hasData={false}
      />
    </div>
  );
}

/**
 * Example 5: Mixed States
 */
export function MixedStatesExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '1rem' }}>Mixed States</h3>
      <SystemStatusCardNew
        wifi={true}
        bluetooth={false}
        dataTimestamp="2024-01-15T14:30:45Z"
        hasData={true}
      />
    </div>
  );
}

/**
 * Example 6: Responsive Layout Test
 */
export function ResponsiveExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Responsive Layout (Resize Window)</h3>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <div style={{ maxWidth: '1200px' }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Desktop (3 columns):</p>
          <SystemStatusCardNew
            wifi={true}
            bluetooth={true}
            dataTimestamp="2024-01-15T14:30:45Z"
            hasData={true}
          />
        </div>
        <div style={{ maxWidth: '400px' }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Mobile (1 column):</p>
          <SystemStatusCardNew
            wifi={true}
            bluetooth={true}
            dataTimestamp="2024-01-15T14:30:45Z"
            hasData={true}
          />
        </div>
      </div>
    </div>
  );
}
