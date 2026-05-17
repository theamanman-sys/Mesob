import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { TextField, Button, Typography, Box, CircularProgress, Divider, IconButton } from '@mui/material'
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import { socialMediaLinkService } from '../services/socialMediaLinkService'
import { Facebook, Twitter, Send, Linkedin, Youtube, Globe } from 'lucide-react'

const socialIcons = {
  facebook: Facebook, twitter: Twitter, telegram: Send,
  linkedin: Linkedin, youtube: Youtube, website: Globe
}

const socialColors = {
  facebook: '#1877f2', twitter: '#1da1f2', telegram: '#0088cc',
  linkedin: '#0077b5', youtube: '#ff0000', website: '#1976d2'
}

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [socialLinks, setSocialLinks] = useState([])
  const [form, setForm] = useState({ username: '', password: '' })

  useEffect(() => {
    (async () => {
      try {
        const { data } = await socialMediaLinkService.getActive()
        setSocialLinks(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
      } catch { setSocialLinks([]) }
    })()
  }, [])

  useEffect(() => {
    if (!loading && isAuthenticated()) {
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    }
  }, [loading])

  const handleChange = (field) => (e) => {
    const val = e.target.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    if (field === 'username' && val.length > 50) return
    if (field === 'password' && val.length > 128) return
    setForm({ ...form, [field]: val })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await login(form)
        if (result?.mustChangePassword) {
          showToast('You must change your password before proceeding.', 'warning')
          localStorage.setItem('mustChangePassword', 'true')
          navigate('/admin/account-settings')
        } else {
          localStorage.removeItem('mustChangePassword')
          navigate(location.state?.from?.pathname || '/admin')
      }
    } catch (err) {
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        if (form.username === 'admin' && form.password === 'admin123') {
          localStorage.setItem('accessToken', 'demo-token-mesob-admin')
          localStorage.setItem('user', JSON.stringify({
            id: 1, username: 'admin', email: 'admin@mesobcenter.et',
            role: 'admin',             isActive: true, mustChangePassword: false
          }))
          localStorage.removeItem('mustChangePassword')
          showToast('Demo mode — logged in as admin', 'success')
          navigate(location.state?.from?.pathname || '/admin')
        } else {
          showToast('API unavailable. For demo access use admin / admin123', 'warning')
        }
      } else if (!err.message?.includes('Too many login attempts')) {
        showToast(err.message || 'Login failed. Please check your credentials.', 'error')
      }
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)', p: 2 }}>
      <Box sx={{ display: 'flex', maxWidth: 1000, width: '100%', height: 600, overflow: 'hidden',
        borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <Box sx={{ flex: '0 0 45%', background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 50%, #1565c0 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, color: 'white',
          position: 'relative', overflow: 'hidden' }}>
          <Box component="img" src="/files/logo.png" alt="Logo"
            sx={{ width: 120, height: 120, objectFit: 'contain', animation: 'spin 10s linear infinite',
              '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2, textTransform: 'uppercase', letterSpacing: '2px', color: '#FFD700' }}>
            MESOB Portal
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1, textTransform: 'uppercase', color: '#FFD700' }}>
            Modern Ethiopia Service for Organized Benefit
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, textAlign: 'center', maxWidth: 350 }}>
            Let's establish a seamless, efficient, and secure one-stop service center where Ethiopian residents can access essential services.
          </Typography>
        </Box>

        <Box sx={{ flex: '0 0 55%', bgcolor: 'white', p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>Login</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
              Please Provide Your Credentials
            </Typography>
            <TextField fullWidth placeholder="User Name" value={form.username} onChange={handleChange('username')}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} /> }} />
            <TextField fullWidth type={showPassword ? 'text' : 'password'} placeholder="Password"
              value={form.password} onChange={handleChange('password')}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#1976d2' }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }} />
            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 600,
                bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Login'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/" style={{ color: '#1976d2', fontSize: '0.875rem', textDecoration: 'none' }}>
                ← Back to Main Site
              </Link>
            </Box>
            <Divider sx={{ my: 2 }}>social</Divider>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {socialLinks.filter((s) => s?.platform && s?.link && String(s.platform).toLowerCase() !== 'telegram').map((s) => {
                const key = String(s.platform).toLowerCase()
                const Icon = socialIcons[key]
                const color = socialColors[key]
                return Icon ? (
                  <IconButton key={s.id || key} href={s.link} target="_blank"
                    sx={{ color, '&:hover': { bgcolor: `${color}20` } }}>
                    <Icon size={20} />
                  </IconButton>
                ) : null
              })}
              <IconButton href="https://t.me/addismesob" target="_blank"
                sx={{ color: '#0088cc', '&:hover': { bgcolor: '#0088cc20' } }}>
                <Send size={20} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
