import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#1565c0' }
  },
  typography: {
    fontFamily: "'Inter', sans-serif"
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <AuthProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
