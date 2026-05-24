import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const Home = lazy(() => import('./pages/Home'))
const ServiceCatalogue = lazy(() => import('./pages/ServiceCatalogue'))
const Departments = lazy(() => import('./pages/Departments'))
const DepartmentDetail = lazy(() => import('./pages/DepartmentDetail'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Login = lazy(() => import('./pages/Login'))
const CitizenLogin = lazy(() => import('./pages/CitizenLogin'))
const CitizenRegister = lazy(() => import('./pages/citizen/CitizenRegister'))
const CitizenLayout = lazy(() => import('./pages/citizen/CitizenLayout'))
const CitizenDashboard = lazy(() => import('./pages/citizen/CitizenDashboard'))
const CitizenServices = lazy(() => import('./pages/citizen/CitizenServices'))
const CitizenApplications = lazy(() => import('./pages/citizen/CitizenApplications'))
const CitizenDocuments = lazy(() => import('./pages/citizen/CitizenDocuments'))
const CitizenProfile = lazy(() => import('./pages/citizen/CitizenProfile'))
const CitizenDocumentScanner = lazy(() => import('./pages/citizen/CitizenDocumentScanner'))
const CitizenPension = lazy(() => import('./pages/citizen/CitizenPension'))
const CitizenInheritance = lazy(() => import('./pages/citizen/CitizenInheritance'))
const CitizenInsurance = lazy(() => import('./pages/citizen/CitizenInsurance'))
const CitizenBank = lazy(() => import('./pages/citizen/CitizenBank'))
const CitizenProperty = lazy(() => import('./pages/citizen/CitizenProperty'))
const CitizenTickets = lazy(() => import('./pages/citizen/CitizenTickets'))
const CitizenFinance = lazy(() => import('./pages/citizen/CitizenFinance'))
const CitizenFaydaId = lazy(() => import('./pages/citizen/CitizenFaydaId'))
const CitizenVerification = lazy(() => import('./pages/citizen/CitizenVerification'))
const CitizenJobs = lazy(() => import('./pages/citizen/CitizenJobs'))
const CitizenLegal = lazy(() => import('./pages/citizen/CitizenLegal'))
const CitizenEservices = lazy(() => import('./pages/citizen/CitizenEservices'))
const CitizenTrading = lazy(() => import('./pages/citizen/CitizenTrading'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminLanguages = lazy(() => import('./admin/AdminLanguages'))
const AdminBanner = lazy(() => import('./admin/AdminBanner'))
const AdminBannerImages = lazy(() => import('./admin/AdminBannerImages'))
const AdminOrganization = lazy(() => import('./admin/AdminOrganization'))
const AdminServices = lazy(() => import('./admin/AdminServices'))
const AdminServiceCatalog = lazy(() => import('./admin/AdminServiceCatalog'))
const AdminLocations = lazy(() => import('./admin/AdminLocations'))
const AdminNews = lazy(() => import('./admin/AdminNews'))
const AdminContactInfo = lazy(() => import('./admin/AdminContactInfo'))
const AdminHeadquarters = lazy(() => import('./admin/AdminHeadquarters'))
const AdminContactUiText = lazy(() => import('./admin/AdminContactUiText'))
const AdminSocialMediaLinks = lazy(() => import('./admin/AdminSocialMediaLinks'))
const AdminBodyTexts = lazy(() => import('./admin/AdminBodyTexts'))
const AdminVideoData = lazy(() => import('./admin/AdminVideoData'))
const AdminPopularServices = lazy(() => import('./admin/AdminPopularServices'))
const AdminMessages = lazy(() => import('./admin/AdminMessages'))
const AdminAdvImage = lazy(() => import('./admin/AdminAdvImage'))
const AdminAdvVideo = lazy(() => import('./admin/AdminAdvVideo'))
const AdminGovernmentServices = lazy(() => import('./admin/AdminGovernmentServices'))
const AdminNewsUiText = lazy(() => import('./admin/AdminNewsUiText'))
const AdminAboutUs = lazy(() => import('./admin/AdminAboutUs'))
const AdminUserManagement = lazy(() => import('./admin/AdminUserManagement'))
const AdminAccountSettings = lazy(() => import('./admin/AdminAccountSettings'))
const AdminDocumentScanner = lazy(() => import('./admin/AdminDocumentScanner'))
const AdminApplications = lazy(() => import('./admin/AdminApplications'))
const AdminPension = lazy(() => import('./admin/AdminPension'))
const AdminInheritance = lazy(() => import('./admin/AdminInheritance'))
const AdminInsurance = lazy(() => import('./admin/AdminInsurance'))
const AdminBank = lazy(() => import('./admin/AdminBank'))
const AdminProperty = lazy(() => import('./admin/AdminProperty'))
const AdminTickets = lazy(() => import('./admin/AdminTickets'))
const AdminEconomy = lazy(() => import('./admin/AdminEconomy'))
const AdminPopulation = lazy(() => import('./admin/AdminPopulation'))
const AdminDepartments = lazy(() => import('./admin/AdminDepartments'))
const AdminWealthAllocator = lazy(() => import('./admin/AdminWealthAllocator'))
const AdminTax = lazy(() => import('./admin/AdminTax'))
const AdminApiSix = lazy(() => import('./admin/AdminApiSix'))
const AdminVerifications = lazy(() => import('./admin/AdminVerifications'))
const AdminLegal = lazy(() => import('./admin/AdminLegal'))
const AdminDocuments = lazy(() => import('./admin/AdminDocuments'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <PageLoader />

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return children
}

function RoleGuard({ allowedRoles = [], children }) {
  const { user } = useAuth()
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
  return children
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen dark:bg-gray-900 dark:text-white">
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/citizen-login" element={<CitizenLogin />} />
        <Route path="/citizen-register" element={<CitizenRegister />} />
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="dashboard" element={<CitizenDashboard />} />
          <Route path="services" element={<CitizenServices />} />
          <Route path="applications" element={<CitizenApplications />} />
          <Route path="documents" element={<CitizenDocuments />} />
          <Route path="document-scanner" element={<CitizenDocumentScanner />} />
          <Route path="pension" element={<CitizenPension />} />
          <Route path="inheritance" element={<CitizenInheritance />} />
          <Route path="insurance" element={<CitizenInsurance />} />
          <Route path="bank" element={<CitizenBank />} />
          <Route path="property" element={<CitizenProperty />} />
          <Route path="tickets" element={<CitizenTickets />} />
          <Route path="finance" element={<CitizenFinance />} />
          <Route path="fayda-id" element={<CitizenFaydaId />} />
          <Route path="verification" element={<CitizenVerification />} />
          <Route path="jobs" element={<CitizenJobs />} />
          <Route path="legal" element={<CitizenLegal />} />
          <Route path="eservices" element={<CitizenEservices />} />
          <Route path="trading" element={<CitizenTrading />} />
          <Route path="profile" element={<CitizenProfile />} />
        </Route>
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'socialMedia', 'contentManager']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminDashboard /></RoleGuard>
          } />
          <Route path="languages" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminLanguages /></RoleGuard>
          } />
          <Route path="banner" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminBanner /></RoleGuard>
          } />
          <Route path="banner-images" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminBannerImages /></RoleGuard>
          } />
          <Route path="organization" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminOrganization /></RoleGuard>
          } />
          <Route path="service" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminServices /></RoleGuard>
          } />
          <Route path="service-catalog" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminServiceCatalog /></RoleGuard>
          } />
          <Route path="location" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminLocations /></RoleGuard>
          } />
          <Route path="news" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminNews /></RoleGuard>
          } />
          <Route path="contact-info" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminContactInfo /></RoleGuard>
          } />
          <Route path="headquarters" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminHeadquarters /></RoleGuard>
          } />
          <Route path="contact-ui-text" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminContactUiText /></RoleGuard>
          } />
          <Route path="social-media-links" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminSocialMediaLinks /></RoleGuard>
          } />
          <Route path="body-texts" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminBodyTexts /></RoleGuard>
          } />
          <Route path="video-data" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminVideoData /></RoleGuard>
          } />
          <Route path="popular-services" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminPopularServices /></RoleGuard>
          } />
          <Route path="messages" element={
            <RoleGuard allowedRoles={['admin']}><AdminMessages /></RoleGuard>
          } />
          <Route path="adv-image" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminAdvImage /></RoleGuard>
          } />
          <Route path="adv-video" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia']}><AdminAdvVideo /></RoleGuard>
          } />
          <Route path="government-services" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminGovernmentServices /></RoleGuard>
          } />
          <Route path="news-ui-text" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminNewsUiText /></RoleGuard>
          } />
          <Route path="about-us" element={
            <RoleGuard allowedRoles={['admin', 'contentManager']}><AdminAboutUs /></RoleGuard>
          } />
          <Route path="user-management" element={
            <RoleGuard allowedRoles={['admin']}><AdminUserManagement /></RoleGuard>
          } />
          <Route path="account-settings" element={
            <RoleGuard allowedRoles={['admin', 'socialMedia', 'contentManager']}><AdminAccountSettings /></RoleGuard>
          } />
          <Route path="document-scanner" element={
            <RoleGuard allowedRoles={['admin']}><AdminDocumentScanner /></RoleGuard>
          } />
          <Route path="applications" element={
            <RoleGuard allowedRoles={['admin']}><AdminApplications /></RoleGuard>
          } />
          <Route path="pension" element={
            <RoleGuard allowedRoles={['admin']}><AdminPension /></RoleGuard>
          } />
          <Route path="inheritance" element={
            <RoleGuard allowedRoles={['admin']}><AdminInheritance /></RoleGuard>
          } />
          <Route path="insurance" element={
            <RoleGuard allowedRoles={['admin']}><AdminInsurance /></RoleGuard>
          } />
          <Route path="bank" element={
            <RoleGuard allowedRoles={['admin']}><AdminBank /></RoleGuard>
          } />
          <Route path="property" element={
            <RoleGuard allowedRoles={['admin']}><AdminProperty /></RoleGuard>
          } />
          <Route path="tickets" element={
            <RoleGuard allowedRoles={['admin']}><AdminTickets /></RoleGuard>
          } />
          <Route path="economy" element={
            <RoleGuard allowedRoles={['admin']}><AdminEconomy /></RoleGuard>
          } />
          <Route path="population" element={
            <RoleGuard allowedRoles={['admin']}><AdminPopulation /></RoleGuard>
          } />
          <Route path="departments" element={
            <RoleGuard allowedRoles={['admin']}><AdminDepartments /></RoleGuard>
          } />
          <Route path="wealth-allocator" element={
            <RoleGuard allowedRoles={['admin']}><AdminWealthAllocator /></RoleGuard>
          } />
          <Route path="tax" element={
            <RoleGuard allowedRoles={['admin']}><AdminTax /></RoleGuard>
          } />
          <Route path="apisix" element={
            <RoleGuard allowedRoles={['admin']}><AdminApiSix /></RoleGuard>
          } />
  <Route path="verifications" element={
    <RoleGuard allowedRoles={['admin']}><AdminVerifications /></RoleGuard>
  } />
  <Route path="documents" element={
    <RoleGuard allowedRoles={['admin']}><AdminDocuments /></RoleGuard>
  } />
  <Route path="legal" element={
            <RoleGuard allowedRoles={['admin']}><AdminLegal /></RoleGuard>
          } />
          <Route path="*" element={<div className="text-center py-12 text-gray-500">Page not found</div>} />
        </Route>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/service-catalogue" element={<PublicLayout><ServiceCatalogue /></PublicLayout>} />
        <Route path="/services/:id" element={<PublicLayout><ServiceDetail /></PublicLayout>} />
        <Route path="/departments" element={<PublicLayout><Departments /></PublicLayout>} />
        <Route path="/departments/:id" element={<PublicLayout><DepartmentDetail /></PublicLayout>} />
        <Route path="/about-us" element={<PublicLayout><AboutUs /></PublicLayout>} />
        <Route path="*" element={<PublicLayout><Home /></PublicLayout>} />
      </Routes>
      </Suspense>
    </div>
  )
}
