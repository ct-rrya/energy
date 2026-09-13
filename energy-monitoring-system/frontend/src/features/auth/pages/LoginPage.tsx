import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EcoStepLogo } from '@/components/common/EcoStepLogo';
import { ROUTES } from '@/routes/routes.config';
import { APP_NAME } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';

/**
 * Login Page - Split Screen Design
 * Left: EcoStep brand and mission (55%)
 * Right: Authentication form (45%)
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      showToast('Welcome back!', 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* LEFT SIDE - ECOSTEP BRAND PANEL (55%) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Deep forest green atmospheric background */}
        <div 
          className="absolute inset-0 bg-[#1A312C]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 20%, rgba(66, 132, 117, 0.15), transparent 40%),
              radial-gradient(circle at 80% 60%, rgba(137, 215, 183, 0.10), transparent 45%),
              radial-gradient(circle at 40% 80%, rgba(66, 132, 117, 0.08), transparent 35%)
            `
          }}
        />

        {/* Subtle environmental-inspired abstract shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {/* Curved leaf-like lines */}
          <svg className="absolute top-10 left-10 w-64 h-64" viewBox="0 0 200 200">
            <path
              d="M20,100 Q50,40 100,50 T180,100"
              stroke="rgba(137, 215, 183, 0.3)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse-glow"
            />
          </svg>
          
          {/* Flowing energy curves */}
          <svg className="absolute bottom-20 right-10 w-80 h-80" viewBox="0 0 300 300">
            <path
              d="M50,150 Q150,50 250,150"
              stroke="rgba(66, 132, 117, 0.25)"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="120" cy="120" r="60" stroke="rgba(137, 215, 183, 0.15)" strokeWidth="1" fill="none" />
          </svg>

          {/* Abstract leaf silhouettes */}
          <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-[rgba(137,215,183,0.08)] to-transparent" />
        </div>

        {/* Brand Content - Vertically Centered */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16 w-full">
          {/* EcoStep Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#428475] to-[#89D7B7] shadow-lg p-3">
                <EcoStepLogo className="h-full w-full" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#FFF4E1] tracking-tight">
                  {APP_NAME}
                </h1>
                <p className="text-xs font-medium text-[#89D7B7] uppercase tracking-wider mt-0.5">
                  SUSTAINABILITY & ENERGY MONITORING
                </p>
              </div>
            </div>
          </div>

          {/* Large Heading */}
          <h2 className="text-4xl xl:text-5xl font-bold text-[#FFF4E1] mb-6 leading-tight">
            Make Every Step<br />More Sustainable.
          </h2>

          {/* Description */}
          <p className="text-lg text-[#89D7B7]/90 mb-10 leading-relaxed max-w-md">
            EcoStep helps monitor energy consumption, understand usage patterns, 
            and make smarter decisions for a more sustainable future.
          </p>

          {/* Value Indicators */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#428475]/30 mt-0.5">
                <svg className="h-5 w-5 text-[#89D7B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#FFF4E1] font-semibold text-base">Monitor</h3>
                <p className="text-[#89D7B7]/75 text-sm">Track energy consumption</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#428475]/30 mt-0.5">
                <svg className="h-5 w-5 text-[#89D7B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#FFF4E1] font-semibold text-base">Understand</h3>
                <p className="text-[#89D7B7]/75 text-sm">Discover usage patterns</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#428475]/30 mt-0.5">
                <svg className="h-5 w-5 text-[#89D7B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#FFF4E1] font-semibold text-base">Improve</h3>
                <p className="text-[#89D7B7]/75 text-sm">Make sustainable decisions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - AUTHENTICATION FORM (45%) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-6 py-12 lg:px-12 bg-white dark:bg-[#0B0D12]">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Show only on small screens */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A312C] to-[#428475] shadow-lg p-2">
                <EcoStepLogo className="h-full w-full" />
              </div>
              <h1 className="text-2xl font-bold text-[#1A312C] dark:text-[#FFF4E1]">
                {APP_NAME}
              </h1>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1A312C] dark:text-[#FFF4E1] mb-2">
              Welcome back
            </h2>
            <h3 className="text-xl font-semibold text-[#428475] dark:text-[#89D7B7] mb-3">
              Sign in to EcoStep
            </h3>
            <p className="text-sm text-[#1A312C]/70 dark:text-[#FFF4E1]/70">
              Monitor your energy. Make every step count.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-[#1A312C] dark:text-[#FFF4E1] mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-[#1A312C]/20 dark:border-[#89D7B7]/30 bg-white/80 dark:bg-[#1A312C]/50 text-[#1A312C] dark:text-[#FFF4E1] placeholder:text-[rgb(var(--color-neutral-400))] focus:outline-none focus:ring-2 focus:ring-[#428475] focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#1A312C] dark:text-[#FFF4E1] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-[#1A312C]/20 dark:border-[#89D7B7]/30 bg-white/80 dark:bg-[#1A312C]/50 text-[#1A312C] dark:text-[#FFF4E1] placeholder:text-[rgb(var(--color-neutral-400))] focus:outline-none focus:ring-2 focus:ring-[#428475] focus:border-transparent transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-neutral-500))] hover:text-[#428475] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="group flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  {/* Custom Checkbox */}
                  <div className="w-5 h-5 rounded-md border-2 border-[#1A312C]/20 dark:border-[#89D7B7]/30 bg-white dark:bg-[#1A312C]/50 transition-all duration-200 peer-checked:border-[#428475] peer-checked:bg-[#428475] peer-focus:ring-2 peer-focus:ring-[#428475]/30 peer-focus:ring-offset-2 group-hover:border-[#428475]/50 flex items-center justify-center">
                    {/* Checkmark */}
                    <svg 
                      className={`w-3 h-3 text-white transition-all duration-200 ${rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                      viewBox="0 0 12 10" 
                      fill="none"
                    >
                      <path 
                        d="M1 5L4.5 8.5L11 1.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#1A312C]/70 dark:text-[#FFF4E1]/70 group-hover:text-[#1A312C] dark:group-hover:text-[#FFF4E1] transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#428475] hover:text-[#1A312C] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#1A312C] text-[#FFF4E1] font-semibold hover:bg-[#428475] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-xl bg-[#89D7B7]/10 dark:bg-[#428475]/20 border border-[#89D7B7]/30 dark:border-[#89D7B7]/20">
            <p className="text-xs font-semibold text-[#1A312C] dark:text-[#FFF4E1] uppercase tracking-wide mb-2">
              Demo Credentials
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-[#1A312C]/70 dark:text-[#FFF4E1]/70">
                <span className="font-medium">Email:</span> admin@energymonitor.com
              </p>
              <p className="text-[#1A312C]/70 dark:text-[#FFF4E1]/70">
                <span className="font-medium">Password:</span> Admin@2024!
              </p>
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-[#1A312C]/70 dark:text-[#FFF4E1]/70">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#428475] hover:text-[#1A312C] transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
