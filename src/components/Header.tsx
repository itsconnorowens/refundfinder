export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/icon-192.png"
              alt="Flghtly Logo"
              className="w-10 h-10 rounded-xl shadow-md"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Flghtly</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Compensation made simple</p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Dashboard
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Claims
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Settings
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
