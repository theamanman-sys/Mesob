import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { languageService } from '../services/languageService'
import { translatedOrganizationService } from '../services/translatedOrganizationService'
import { serviceService } from '../services/serviceService'
import { bannerService } from '../services/bannerService'
import { bodyTextService } from '../services/bodyTextService'
import { serviceCatalogService } from '../services/serviceCatalogService'
import { governmentServiceService } from '../services/governmentServiceService'
import translations from '../i18n/translations'

const LanguageContext = createContext()

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('lang') || 'en'
  })
  const [languages, setLanguages] = useState([])
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true)
  const [governmentServices, setGovernmentServices] = useState([])
  const [bodyTexts, setBodyTexts] = useState([])
  const [bannerData, setBannerData] = useState([])
  const [serviceCatalog, setServiceCatalog] = useState([])

  const fetchLanguages = useCallback(async () => {
    try {
      const { data } = await languageService.getActive()
      const list = data.data || data || []
      setLanguages(Array.isArray(list) ? list : [])
    } catch { setLanguages([]) }
    finally { setIsLoadingLanguages(false) }
  }, [])

  const fetchBodyTexts = useCallback(async () => {
    try {
      const { data } = await bodyTextService.getAll()
      const list = data.data || data || []
      setBodyTexts(Array.isArray(list) ? list : [])
    } catch { setBodyTexts([]) }
  }, [])

  const fetchBannerData = useCallback(async () => {
    try {
      const { data } = await bannerService.getAll()
      const list = data.data || data || []
      setBannerData(Array.isArray(list) ? list : [])
    } catch { setBannerData([]) }
  }, [])

  const fetchServiceCatalog = useCallback(async () => {
    try {
      const { data } = await serviceCatalogService.getAll()
      const list = data.data || data || []
      setServiceCatalog(Array.isArray(list) ? list : [])
    } catch { setServiceCatalog([]) }
  }, [])

  const fetchGovernmentServices = useCallback(async () => {
    try {
      const { data } = await governmentServiceService.getAll()
      const list = data.data || data || []
      setGovernmentServices(Array.isArray(list) ? list : [])
    } catch { setGovernmentServices([]) }
  }, [])

  useEffect(() => { fetchLanguages() }, [fetchLanguages])

  const changeLanguage = useCallback((langCode) => {
    setCurrentLanguage(langCode)
    localStorage.setItem('lang', langCode)
  }, [])

  const t = useCallback((textKey, params) => {
    const lang = (params && typeof params === 'string') ? params : currentLanguage
    if (!textKey) return ''
    if (lang === 'en' || !translations[lang]) {
      let result = textKey
      if (params && typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => { result = result.replace(`{${k}}`, v) })
      }
      return result
    }
    let result = translations[lang][textKey] || textKey
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => { result = result.replace(`{${k}}`, v) })
    }
    return result
  }, [currentLanguage])

  return (
    <LanguageContext.Provider value={{
      currentLanguage, changeLanguage, t, languages, isLoadingLanguages,
      governmentServices, bodyTexts, bannerData, serviceCatalog,
      fetchBodyTexts, fetchBannerData, fetchServiceCatalog, fetchGovernmentServices
    }}>
      {children}
    </LanguageContext.Provider>
  )
}
