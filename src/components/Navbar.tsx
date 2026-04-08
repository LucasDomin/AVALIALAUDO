import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calculator, History, LogOut, User, Home } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">Avalia Imóvel</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/calculator"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/calculator')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calculator className="w-5 h-5" />
              <span className="hidden sm:inline">Calculadora</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/history')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>

            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
