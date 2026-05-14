export const getLanguageId = (code, languages = []) => {
  if (languages.length > 0) {
    const found = languages.find((l) => l.code === code)
    if (found) return found.id
  }
  return code === 'am' ? 2 : 1
}

export const translate = (item, langCode, fieldKey, fallback = '') => {
  if (!item) return fallback
  if (langCode === 'am') {
    return item[`${fieldKey}Am`] || item[fieldKey] || fallback
  }
  return item[fieldKey] || fallback
}
