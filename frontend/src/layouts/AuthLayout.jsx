export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">A</span>
          <span className="text-xl font-semibold text-gray-900">AyurSutra</span>
        </div>
        <p className="text-sm text-gray-500">Panchakarma Management System</p>
      </div>
      {children}
    </div>
  )
}
