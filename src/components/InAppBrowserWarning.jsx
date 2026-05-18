import { ExternalLink } from 'lucide-react'

export default function InAppBrowserWarning() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
          <ExternalLink className="w-7 h-7 text-yellow-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Open in Browser</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Google sign-in doesn't work inside this app's browser. Tap <strong>⋯</strong> (or the menu icon) and choose <strong>"Open in Chrome/Safari"</strong> to continue.
        </p>
        <ul className="text-xs text-left text-gray-400 space-y-1.5 bg-gray-50 rounded-xl p-4">
          <li><strong className="text-gray-600">Chrome:</strong> ⋯ → Open in Chrome</li>
          <li><strong className="text-gray-600">Safari:</strong> ⋯ → Open in Safari</li>
          <li><strong className="text-gray-600">Samsung:</strong> ⋯ → Open in browser</li>
        </ul>
      </div>
    </div>
  )
}
