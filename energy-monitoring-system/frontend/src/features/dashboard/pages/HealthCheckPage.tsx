import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/api/services';
import { QUERY_KEYS } from '@/api/constants';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Health Check Page
 * Tests backend connectivity
 */
export function HealthCheckPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: healthService.check,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-card">
        <h1 className="mb-6 text-center text-3xl font-bold text-primary-500">
          Backend Connection
        </h1>

        {isLoading && (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-neutral-600">Checking backend status...</p>
          </div>
        )}

        {isError && (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <div className="mb-2 text-4xl">❌</div>
            <h2 className="mb-2 text-xl font-semibold text-red-900">
              Connection Failed
            </h2>
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Unable to connect to backend'}
            </p>
            <p className="mt-2 text-xs text-red-600">
              Make sure the backend server is running at{' '}
              <code className="rounded bg-red-100 px-1">
                {import.meta.env.VITE_API_BASE_URL}
              </code>
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary-50 p-4 text-center">
              <div className="mb-2 text-4xl">✅</div>
              <h2 className="mb-2 text-xl font-semibold text-secondary-900">
                Connected Successfully
              </h2>
              <p className="text-sm text-secondary-700">
                Backend is healthy and responding
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <h3 className="mb-2 font-semibold text-neutral-900">
                Backend Status
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Status:</dt>
                  <dd className="font-medium text-neutral-900">
                    {data.data.status}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Database:</dt>
                  <dd className="font-medium text-neutral-900">
                    {data.data.database.status}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Response Time:</dt>
                  <dd className="font-medium text-neutral-900">
                    {data.data.database.responseTime}ms
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Uptime:</dt>
                  <dd className="font-medium text-neutral-900">
                    {Math.floor(data.data.uptime)}s
                  </dd>
                </div>
              </dl>
            </div>

            <div className="text-center">
              <a
                href="/dashboard"
                className="inline-block rounded-lg bg-primary-500 px-6 py-2 font-medium text-white hover:bg-primary-600 transition-colors"
              >
                Continue to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
