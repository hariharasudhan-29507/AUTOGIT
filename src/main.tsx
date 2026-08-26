import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { DashboardPage, ProtectedRoute, RepositoriesPage, RepositoryDetailPage } from '@/pages'
import { AboutPage, ActivityPage, AnalyticsPage, AutomationPage, HelpPage, NotFoundPage, NotificationsPage, ProfilePage, SettingsPage } from '@/pages/workspace'
import { AuthPage, FeaturesPage, HowItWorksPage, LandingPage, OnboardingPage, SecurityPage } from '@/pages/public'
import { Toaster } from '@/components/ui/sonner'
import '@/styles.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
function Protected({ children }: { children: React.ReactNode }) { return <ProtectedRoute>{children}</ProtectedRoute> }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/login/*" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/signup/*" element={<AuthPage mode="signup" />} />
            <Route path="/sso-callback" element={<AuthPage mode="login" />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
            <Route path="/repositories" element={<Protected><RepositoriesPage /></Protected>} />
            <Route path="/repositories/:id" element={<Protected><RepositoryDetailPage /></Protected>} />
            <Route path="/automation" element={<Protected><AutomationPage /></Protected>} />
            <Route path="/activity" element={<Protected><ActivityPage /></Protected>} />
            <Route path="/analytics" element={<Protected><AnalyticsPage /></Protected>} />
            <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
            <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    <Toaster />
  </StrictMode>
)
