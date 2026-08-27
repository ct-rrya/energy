import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

/**
 * 404 Not Found Page
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
          Page Not Found
        </h2>
        <p className="mt-2 text-neutral-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-3 font-medium text-white hover:bg-primary-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
