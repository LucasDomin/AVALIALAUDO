import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Navbar } from './components/Navbar';
import { PropertyCalculator } from './components/PropertyCalculator';
import { History } from './components/History';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? (
    <Navigate to="/calculator" />
  ) : (
    <Navigate to="/login" />
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800 font-sans">
      {/* SIDEBAR */}
      {isAuthenticated && (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 text-xl font-bold text-blue-900">
            SISTEMA
          </div>

          <nav className="flex flex-col gap-2 px-4">
            <a className="text-orange-500 font-bold uppercase py-2">
              CALCULADORA
            </a>
            <a className="text-orange-500 font-bold uppercase py-2">
              HISTÓRICO
            </a>
          </nav>
        </aside>
      )}

      {/* CONTENT */}
      <div className="flex-1 flex flex-col">
        {isAuthenticated && <Navbar />}

        <main className="p-6 bg-gray-100 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/calculator"
          element={
            <ProtectedRoute>
              <PropertyCalculator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
};

export default App;