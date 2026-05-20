// frontend/src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import FullscreenLoader from './components/FullscreenLoader';
import AdminLayout from './layouts/AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';

// Public pages
const Home                   = lazy(() => import('./pages/Home'));
const NewTools               = lazy(() => import('./pages/NewTools'));
const ToolDetail             = lazy(() => import('./pages/ToolDetail'));
const Case                   = lazy(() => import('./pages/Case'));
const CaseDetail             = lazy(() => import('./pages/CaseDetail'));
const LayananPage            = lazy(() => import('./pages/LayananPage'));
const PreassessmentPage      = lazy(() => import('./pages/PreassessmentPage'));
const PreassessmentFormPage  = lazy(() => import('./pages/PreassessmentFormPage'));
const ReviewConfirmationPage = lazy(() => import('./pages/ReviewConfirmationPage'));
const WaitingPage            = lazy(() => import('./pages/WaitingPage'));
const PaymentSuccessPage     = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentPendingPage     = lazy(() => import('./pages/PaymentPendingPage'));
const PaymentFailedPage      = lazy(() => import('./pages/PaymentFailedPage'));
const PaymentUploadPage      = lazy(() => import('./pages/PaymentUploadPage'));
const SessionUsedPage        = lazy(() => import('./pages/SessionUsedPage'));
const SessionPendingPage     = lazy(() => import('./pages/SessionPendingPage'));
const SessionExpiredPage     = lazy(() => import('./pages/SessionExpiredPage'));
const SessionInvalidPage     = lazy(() => import('./pages/SessionInvalidPage'));
const JoinPage               = lazy(() => import('./pages/JoinPage'));
const Pricing                = lazy(() => import('./pages/Pricing'));

// Admin pages
const AdminConsultations = lazy(() => import('./pages/admin/AdminConsultations'));
const AdminTools         = lazy(() => import('./pages/admin/AdminTools'));
const AdminCases         = lazy(() => import('./pages/admin/AdminCases'));
const AdminCaseEditor    = lazy(() => import('./pages/admin/AdminCaseEditor'));
const AdminConsultants   = lazy(() => import('./pages/admin/AdminConsultants'));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<FullscreenLoader />}>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/"                                   element={<Home />} />
            <Route path="/tool"                               element={<NewTools />} />
            <Route path="/tool/:slug"                         element={<ToolDetail />} />
            <Route path="/case"                               element={<Case />} />
            <Route path="/case/:slug"                         element={<CaseDetail />} />
            <Route path="/layanan"                            element={<LayananPage />} />
            <Route path="/preassessment"                      element={<PreassessmentPage />} />
            <Route path="/preassessment/form"                 element={<PreassessmentFormPage />} />
            <Route path="/preassessment/review-confirmation"  element={<ReviewConfirmationPage />} />
            <Route path="/waiting"                            element={<WaitingPage />} />
            <Route path="/payment/success"                    element={<PaymentSuccessPage />} />
            <Route path="/payment/failed"                     element={<PaymentFailedPage />} />
            <Route path="/payment/pending"                    element={<PaymentPendingPage />} />
            <Route path="/payment/upload"                     element={<PaymentUploadPage />} />
            <Route path="/payment-error"                      element={<PaymentFailedPage />} />
            <Route path="/session-used"                       element={<SessionUsedPage />} />
            <Route path="/session-pending"                    element={<SessionPendingPage />} />
            <Route path="/session-expired"                    element={<SessionExpiredPage />} />
            <Route path="/session-invalid"                    element={<SessionInvalidPage />} />
            <Route path="/join"                               element={<JoinPage />} />
            <Route path="/pricing"                            element={<Pricing />} />
          </Route>

          {/* Admin login (outside AdminLayout) */}
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/consultations" replace />} />
            <Route path="consultations" element={<AdminConsultations />} />
            <Route path="tools"         element={<AdminTools />} />
            <Route path="cases"         element={<AdminCases />} />
            <Route path="cases/edit/:id" element={<AdminCaseEditor />} />
            <Route path="consultants"   element={<AdminConsultants />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
