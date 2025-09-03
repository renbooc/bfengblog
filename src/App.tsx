import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import Auth from './components/Auth'
import Home from './pages/Home'
import Posts from './pages/Posts'
import PostDetail from './pages/PostDetail'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/about" element={<About />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/post/:id" element={<PostDetail />} />
              </Routes>
            </Layout>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { user, loading } = auth
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

// 公开路由组件（未登录用户可访问）
function PublicRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { user, loading } = auth
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return !user ? <>{children}</> : <Navigate to="/" />
}

// 导入 useAuth
import { useAuth } from './hooks/useAuth'

export default App
