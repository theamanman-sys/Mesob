export function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || ''
  const rules = [
    /FBAN|FBAV|FBBV|FBMD|FBSV|FBCR|FBID|FBLC|FBOP/i.test(ua),  // Facebook
    /Instagram/i.test(ua),                                          // Instagram
    /WhatsApp/i.test(ua),                                           // WhatsApp
    /Line/i.test(ua),                                               // LINE
    /Messenger/i.test(ua),                                          // Messenger
    /MicroMessenger/i.test(ua),                                     // WeChat
    /TikTok/i.test(ua),                                             // TikTok
    /LinkedIn/i.test(ua),                                           // LinkedIn
    /Snapchat/i.test(ua),                                           // Snapchat
    /Twitter/i.test(ua) && /_/i.test(ua),                           // Twitter/X
  ]
  return rules.some(Boolean)
}
