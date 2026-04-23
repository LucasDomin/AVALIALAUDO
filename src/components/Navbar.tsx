import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calculator, History, LogOut, User, Home } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gray-100 border-b border-gray-300 sticky top-0 z-40 font-sans">

      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-900 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-blue-900 uppercase tracking-wide">
            AVALIALAUDO
          </span>
        </Link>

        {/* NAV LINKS */}
        <div className="flex items-center gap-2">

          <Link
            to="/calculator"
            className={`flex items-center gap-2 px-3 py-1 border text-sm font-bold uppercase transition ${
              isActive('/calculator')
                ? 'border-orange-500 text-orange-600'
                : 'border-gray-300 text-gray-700 hover:border-orange-400'
            }`}
          >
            <Calculator className="w-4 h-4" />
            CALCULADORA
          </Link>

          <Link
            to="/history"
            className={`flex items-center gap-2 px-3 py-1 border text-sm font-bold uppercase transition ${
              isActive('/history')
                ? 'border-orange-500 text-orange-600'
                : 'border-gray-300 text-gray-700 hover:border-orange-400'
            }`}
          >
            <History className="w-4 h-4" />
            HISTÓRICO
          </Link>

          {/* USER AREA */}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-900 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>

              <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                {user?.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-gray-600 hover:text-orange-600 font-bold uppercase text-sm"
              title="SAIR"
            >
              SAIR
            </button>

          </div>

        </div>
      </div>
    </nav>
  );
};