import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToastContainer } from '@/components/common/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { router } from '@/routes';
import FloatingChatButton from '@/components/FloatingChatButton';

/**
 * TanStack Query Client Configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Root App Component
 * Wraps application with all providers
 * 
 * FloatingChatButton is rendered globally here to be accessible
 * on all routes (Home and Dashboard).
 * Requirements: 4.1
 */
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <RouterProvider router={router} />
              <ToastContainer />
              {/* 
                FloatingChatButton rendered outside routing container
                to appear globally across all routes.
                z-index: 9999+ ensures it stays above other content.
                Requirements: 4.1
              */}
              <FloatingChatButton />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
