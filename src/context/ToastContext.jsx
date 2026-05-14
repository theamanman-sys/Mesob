import { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert } from '@mui/material'

const ToastContext = createContext()

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  const showToast = useCallback((msg, sev = 'success') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar open={open} autoHideDuration={5000} onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setOpen(false)} severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
