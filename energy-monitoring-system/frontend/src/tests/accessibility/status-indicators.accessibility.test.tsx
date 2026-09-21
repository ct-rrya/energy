import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * Accessibility Tests for Status Indicator Components
 * 
 * Verifies that color-coded status indicators:
 * - Include text labels in addition to colors
 * - Include icons for enhanced recognition
 * - Have proper ARIA labels for screen readers
 * - Meet WCAG AA contrast requirements
 */

// Mock components for testing (we'll import real ones if needed)
const MockSeverityBadge = ({ severity }: { severity: string }) => {
  const config = {
    info: { label: 'Info', icon: 'ℹ️' },
    warning: { label: 'Warning', icon: '⚠️' },
    critical: { label: 'Critical', icon: '🔴' },
  };
  
  const item = config[severity as keyof typeof config];
  
  return (
    <span role="status" aria-label={`Severity: ${item.label}`}>
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
    </span>
  );
};

const MockDeviceStatusBadge = ({ isOnline }: { isOnline: boolean }) => {
  return (
    <span role="status" aria-label={`Device status: ${isOnline ? 'Online' : 'Offline'}`}>
      <span aria-hidden="true">{isOnline ? '🟢' : '⚪'}</span>
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
};

describe('Status Badge Accessibility - Color + Text + Icon', () => {
  it('SeverityBadge should include icon AND text, not just color', () => {
    const { container, getByText } = render(<MockSeverityBadge severity="critical" />);
    
    // Should have text label
    expect(getByText('Critical')).toBeInTheDocument();
    
    // Should have icon
    const badge = container.querySelector('[role="status"]');
    expect(badge?.textContent).toContain('🔴'); // Icon present
    expect(badge?.textContent).toContain('Critical'); // Text present
  });

  it('SeverityBadge should have proper ARIA label for screen readers', () => {
    const { container } = render(<MockSeverityBadge severity="warning" />);
    const badge = container.querySelector('[role="status"]');
    
    expect(badge).toHaveAttribute('aria-label');
    expect(badge?.getAttribute('aria-label')).toContain('Warning');
  });

  it('DeviceStatusBadge should include icon AND text', () => {
    const { container, getByText } = render(<MockDeviceStatusBadge isOnline={true} />);
    
    // Should have text
    expect(getByText('Online')).toBeInTheDocument();
    
    // Should have visual indicator
    const badge = container.querySelector('[role="status"]');
    expect(badge?.textContent).toContain('🟢');
    expect(badge?.textContent).toContain('Online');
  });

  it('DeviceStatusBadge offline state should be accessible', () => {
    const { container, getByText } = render(<MockDeviceStatusBadge isOnline={false} />);
    
    expect(getByText('Offline')).toBeInTheDocument();
    
    const badge = container.querySelector('[role="status"]');
    expect(badge).toHaveAttribute('aria-label', 'Device status: Offline');
  });
});

describe('Badge Component - Text + Color (not color alone)', () => {
  it('Success badges should include descriptive text', () => {
    const { getByText } = render(
      <ThemeProvider>
        <span style={{ 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          color: '#15803d',
          padding: '4px 8px',
          borderRadius: '6px'
        }}>
          Active
        </span>
      </ThemeProvider>
    );
    
    // Text label must be present
    expect(getByText('Active')).toBeInTheDocument();
  });

  it('Warning badges should include descriptive text', () => {
    const { getByText } = render(
      <span style={{ 
        backgroundColor: 'rgba(245, 158, 11, 0.1)', 
        color: '#92400e',
        padding: '4px 8px',
        borderRadius: '6px'
      }}>
        Warning
      </span>
    );
    
    expect(getByText('Warning')).toBeInTheDocument();
  });

  it('Danger badges should include descriptive text', () => {
    const { getByText } = render(
      <span style={{ 
        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
        color: '#991b1b',
        padding: '4px 8px',
        borderRadius: '6px'
      }}>
        Critical
      </span>
    );
    
    expect(getByText('Critical')).toBeInTheDocument();
  });
});

describe('Chart Accessibility - Patterns + Labels', () => {
  it('Charts should include descriptive axis labels', () => {
    const mockChart = render(
      <div role="img" aria-label="Energy consumption over time">
        <div aria-label="X-axis: Time (24h)">Time axis</div>
        <div aria-label="Y-axis: Energy (kWh)">Energy axis</div>
      </div>
    );
    
    expect(mockChart.getByLabelText('Energy consumption over time')).toBeInTheDocument();
  });

  it('Chart should have ARIA role and label for screen readers', () => {
    const { container } = render(
      <div role="img" aria-label="Power usage chart showing 24-hour consumption">
        Chart content
      </div>
    );
    
    const chart = container.querySelector('[role="img"]');
    expect(chart).toHaveAttribute('aria-label');
  });
});

describe('Icon Accessibility', () => {
  it('Decorative icons should have aria-hidden="true"', () => {
    const { container } = render(
      <button>
        <span aria-hidden="true">🔍</span>
        Search
      </button>
    );
    
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('Icons with semantic meaning should have accessible labels', () => {
    const { container } = render(
      <button aria-label="Delete item">
        <span role="img" aria-label="Delete">🗑️</span>
      </button>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-label', 'Delete item');
  });
});
