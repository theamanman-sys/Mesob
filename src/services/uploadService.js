import api from './api'

export const uploadService = {
  getInfo: (filePath) => api.get(`/upload/info?filePath=${encodeURIComponent(filePath)}`),
  uploadSingle: (file, fieldName = 'file') => {
    const formData = new FormData()
    formData.append(fieldName, file)
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadMultiple: (files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadVideo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadNewsImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/news-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  delete: (filePath) => api.delete('/upload/delete', { data: { filePath } })
}
