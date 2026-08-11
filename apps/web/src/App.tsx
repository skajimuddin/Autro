import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import { TenantProvider, useTenant } from '@/providers/tenant-provider'

// Pages — auth
import LoginPage from '@/pages/auth/login'
import AuthCallbackPage from '@/pages/auth/callback'

// Pages — onboarding
import OnboardingPage from '@/pages/onboarding/setup'

// Pages — main (stubs for now, implemented in later tasks)
import DashboardPage from '@/pages/dashboard/index'
import VehicleListPage from '@/pages/vehicles/list'
import VehicleDetailsPage from '@/pages/vehicles/details'
import AddVehiclePage from '@/pages/vehicles/add'
import EstimateListPage from '@/pages/estimates/list'
import EstimateEditorPage from '@/pages/estimates/editor'
import InvoiceListPage from '@/pages/invoices/list'
import InvoiceEditorPage from '@/pages/invoices/editor'
import StaffListPage from '@/pages/staff/list'
import StaffAddPage from '@/pages/staff/add'
import StaffProfilePage from '@/pages/staff/profile'
import StaffAttendancePage from '@/pages/staff/attendance'
import StaffCheckinPage from '@/pages/staff/checkin'
import InviteAcceptPage from '@/pages/invite/accept'
import SettingsPage from '@/pages/settings/index'

// ── Loading spinner (used while auth/tenant state resolves) ───────────────────
function AppLoader(): React.JSX.Element {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            margin: '0 auto 12px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Loading Workshop…</p>
      </div>
    </div>
  )
}

// ── Route guard: requires authentication ──────────────────────────────────────
function RequireAuth(): React.JSX.Element {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AppLoader />

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

// ── Route guard: requires authentication + tenant (garage) ────────────────────
function RequireTenant(): React.JSX.Element {
  const { isLoading: tenantLoading, tenant } = useTenant()
  const location = useLocation()

  if (tenantLoading) return <AppLoader />

  if (!tenant) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <Outlet />
}

// ── App routes ────────────────────────────────────────────────────────────────
function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      {/* ── Public routes ──────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />

      {/* ── Protected: requires JWT (auth) ────────────────────────── */}
      <Route element={<RequireAuth />}>
        {/* Onboarding — authenticated but no garage yet */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Staff-only: check-in page (no tenant required in header) */}
        <Route path="/checkin" element={<StaffCheckinPage />} />

        {/* ── Protected: requires JWT + garage (tenant) ──────────── */}
        <Route element={<RequireTenant />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Vehicles */}
          <Route path="/vehicles" element={<VehicleListPage />} />
          <Route path="/vehicles/add" element={<AddVehiclePage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />

          {/* Estimates */}
          <Route path="/estimates" element={<EstimateListPage />} />
          <Route path="/estimates/:id" element={<EstimateEditorPage />} />
          <Route path="/estimates/new" element={<EstimateEditorPage />} />

          {/* Invoices */}
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/:id" element={<InvoiceEditorPage />} />
          <Route path="/invoices/new" element={<InvoiceEditorPage />} />

          {/* Staff */}
          <Route path="/staff" element={<StaffListPage />} />
          <Route path="/staff/add" element={<StaffAddPage />} />
          <Route path="/staff/attendance" element={<StaffAttendancePage />} />
          <Route path="/staff/:id" element={<StaffProfilePage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ── Root App component ────────────────────────────────────────────────────────
export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <TenantProvider>
            <AppRoutes />
          </TenantProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}
