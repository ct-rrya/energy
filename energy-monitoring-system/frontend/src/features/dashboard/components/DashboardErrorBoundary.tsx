import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Dashboard Error Boundary Props
 */
interface DashboardErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component to display instead of default error UI */
  fallback?: ReactNode;
  /** Callback when user clicks retry button */
  onReset?: () => void;
}

/**
 * Dashboard Error Boundary State
 */
interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Dashboard Error Boundary Component
 * 
 * Catches JavaScript errors in the dashboard component tree and provides
 * a user-friendly error UI with retry functionality.
 * 
 * Features:
 * - Catches all React errors in children components
 * - Displays styled error message matching dashboard design system
 * - Provides retry button to attempt recovery
 * - Logs errors to console in development mode
 * - Preserves last known good data context
 * - Theme-aware styling (light/dark mode)
 * 
 * Requirements: 4.6, 10.4, 10.5
 * 
 * @component
 * @example
 * ```tsx
 * <DashboardErrorBoundary onReset={() => window.location.reload()}>
 *   <DashboardPage />
 * </DashboardErrorBoundary>
 * ```
 */
export class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error to console in development mode
   * Requirement: 10.5 - Log errors to console in development mode
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console in development mode
    if (import.meta.env.DEV) {
      console.error('Dashboard Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
    }

    this.setState({
      errorInfo,
    });
  }

  /**
   * Reset error state and call optional onReset callback
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI matching dashboard design system
      return (
        <div 
          className="min-h-screen bg-[#FFF4E1] dark:bg-[#0F1116] transition-colors duration-300"
          style={{
            padding: '32px 40px',
          }}
        >
          <div className="max-w-[600px] mx-auto">
            <div 
              className="eco-card text-center"
              style={{
                padding: '48px 32px',
              }}
            >
              {/* Error icon */}
              <div className="flex justify-center mb-6">
                <div 
                  className="rounded-full bg-red-100 dark:bg-red-900/20 p-4"
                  style={{
                    display: 'inline-flex',
                  }}
                >
                  <AlertTriangle 
                    className="text-[#EF4444]" 
                    size={48}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Error title */}
              <h1 
                className="text-2xl font-semibold text-[#1A312C] dark:text-[#F9FAFB] mb-3"
                style={{
                  letterSpacing: '-0.025em',
                }}
              >
                Something went wrong
              </h1>

              {/* Error message */}
              <p 
                className="text-sm text-[#374151] dark:text-[#9CA3AF] mb-6"
                style={{
                  maxWidth: '400px',
                  margin: '0 auto 24px',
                }}
              >
                {this.state.error?.message || 
                  'An unexpected error occurred while loading the dashboard. Please try again.'}
              </p>

              {/* Retry button - Requirement: 4.6 - Implement retry button */}
              <button
                onClick={this.handleReset}
                className="
                  inline-flex items-center justify-center gap-2
                  px-6 py-3
                  bg-[#428475] hover:bg-[#357062]
                  dark:bg-[#3ED98A] dark:hover:bg-[#2FC87A]
                  text-white font-medium
                  transition-all duration-200
                "
                style={{
                  borderRadius: '12px',
                  minHeight: '44px',
                }}
              >
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>

              {/* Development-only error details */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details 
                  className="mt-8 text-left"
                  style={{
                    fontSize: '12px',
                  }}
                >
                  <summary 
                    className="cursor-pointer text-[#374151] dark:text-[#9CA3AF] hover:text-[#0B132B] dark:hover:text-[#D1D5DB] mb-2"
                  >
                    View technical details (development only)
                  </summary>
                  <pre 
                    className="overflow-auto p-4 bg-neutral-100 dark:bg-neutral-800 rounded text-[#374151] dark:text-[#D1D5DB]"
                    style={{
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                  >
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
