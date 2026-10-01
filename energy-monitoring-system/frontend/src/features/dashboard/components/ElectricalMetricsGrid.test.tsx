import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ElectricalMetricsGrid } from './ElectricalMetricsGrid';

describe('ElectricalMetricsGrid', () => {
  it('renders four metric cards when not loading', () => {
    render(
      <ElectricalMetricsGrid
        voltage={230.2}
        current={12.45}
        power={2867}
        energy={3.42}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('Voltage')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Energy Today')).toBeInTheDocument();
  });

  it('renders four skeleton cards when loading', () => {
    const { container } = render(
      <ElectricalMetricsGrid
        voltage={230.2}
        current={12.45}
        power={2867}
        energy={3.42}
        isLoading={true}
      />
    );
    
    // Should have 4 skeleton cards with aria-busy
    const skeletons = container.querySelectorAll('[aria-busy="true"]');
    expect(skeletons.length).toBe(4);
  });

  it('does not render metric cards when loading', () => {
    render(
      <ElectricalMetricsGrid
        voltage={230.2}
        current={12.45}
        power={2867}
        energy={3.42}
        isLoading={true}
      />
    );
    
    expect(screen.queryByText('Voltage')).not.toBeInTheDocument();
    expect(screen.queryByText('Current')).not.toBeInTheDocument();
  });

  it('applies correct grid layout classes', () => {
    const { container } = render(
      <ElectricalMetricsGrid
        voltage={230.2}
        current={12.45}
        power={2867}
        energy={3.42}
      />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('has proper aria label for accessibility', () => {
    render(
      <ElectricalMetricsGrid
        voltage={230.2}
        current={12.45}
        power={2867}
        energy={3.42}
      />
    );
    
    expect(screen.getByRole('region', { name: 'Electrical metrics' })).toBeInTheDocument();
  });

  it('passes undefined values to MetricCards when data is not provided', () => {
    render(
      <ElectricalMetricsGrid
        isLoading={false}
      />
    );
    
    // MetricCards should still render with empty states
    expect(screen.getByText('Voltage')).toBeInTheDocument();
  });

  it('maintains consistent grid gap spacing', () => {
    const { container } = render(
      <ElectricalMetricsGrid
        voltage={230.2}
        current={12.45}
        power={2867}
        energy={3.42}
      />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveStyle({ gap: '16px' });
  });
});
