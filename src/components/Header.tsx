export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-0 active:outline-none">
            <img
              src="/icon-192.png"
              alt="Flghtly Logo"
              className="w-10 h-10 rounded-full shadow-md"
            />
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900 text-left">Flghtly</h1>
              <p className="text-xs text-gray-500 -mt-0.5 text-left">Compensation made simple</p>
            </div>
          </a>

          <nav className="hidden md:flex space-x-8">
            <button className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
              Dashboard
            </button>
            <button className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
              Claims
            </button>
            <button className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
              Settings
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
