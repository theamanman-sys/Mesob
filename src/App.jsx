import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ServiceCatalogue from './pages/ServiceCatalogue'
import AboutUs from './pages/AboutUs'
import Login from './pages/Login'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminLanguages from './admin/AdminLanguages'
import AdminBanner from './admin/AdminBanner'
import AdminBannerImages from './admin/AdminBannerImages'
import AdminOrganization from './admin/AdminOrganization'
import AdminServices from './admin/AdminServices'
import AdminServiceCatalog from './admin/AdminServiceCatalog'
import AdminLocations from './admin/AdminLocations'
import AdminNews from './admin/AdminNews'
import AdminContactInfo from './admin/AdminContactInfo'
import AdminHeadquarters from './admin/AdminHeadquarters'
import AdminContactUiText from './admin/AdminContactUiText'
import AdminSocialMediaLinks from './admin/AdminSocialMediaLinks'
import AdminBodyTexts from './admin/AdminBodyTexts'
import AdminVideoData from './admin/AdminVideoData'
import AdminPopularServices from './admin/AdminPopularServices'
import AdminMessages from './admin/AdminMessages'
import AdminAdvImage from './admin/AdminAdvImage'
import AdminAdvVideo from './admin/AdminAdvVideo'
import AdminGovernmentServices from './admin/AdminGovernmentServices'
import AdminNewsUiText from './admin/AdminNewsUiText'
import AdminAboutUs from './admin/AdminAboutUs'
import AdminUserManagement from './admin/AdminUserManagement'
import AdminAccountSettings from './admin/AdminAccountSettings'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="min-h-screen dark:bg-gray-900 dark:text-white">
      <Routes>
        <Route path="/login" element={<Login />} />
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
          <Route path="*" element={<div className="text-center py-12 text-gray-500">Page not found</div>} />
        </Route>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/service-catalogue" element={<PublicLayout><ServiceCatalogue /></PublicLayout>} />
        <Route path="/about-us" element={<PublicLayout><AboutUs /></PublicLayout>} />
        <Route path="*" element={<PublicLayout><Home /></PublicLayout>} />
      </Routes>
    </motion.div>
  )
}
