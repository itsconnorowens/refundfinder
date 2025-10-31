import CurrencySelector from './CurrencySelector';

export default function Footer() {
  return (
    <footer className="bg-orange-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/icon-192.png"
                alt="Flghtly Logo"
                className="w-10 h-10 rounded-full shadow-md"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900">Flghtly</h3>
                <p className="text-xs text-gray-600 -mt-0.5">Compensation made simple</p>
              </div>
            </div>
            <p className="text-gray-600">
              Get the compensation you deserve for flight delays and cancellations.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Product</h4>
            <ul className="space-y-2">
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Features</button></li>
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Pricing</button></li>
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">API</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Support</h4>
            <ul className="space-y-2">
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Help Center</button></li>
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Contact Us</button></li>
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Status</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Legal</h4>
            <ul className="space-y-2">
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Privacy Policy</button></li>
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Terms of Service</button></li>
              <li><button className="text-gray-600 hover:text-purple-600 transition-colors">Cookie Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600">&copy; 2024 Flghtly. All rights reserved.</p>
            <CurrencySelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
