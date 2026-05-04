import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { logout } from '../services/auth';
import { Wallet, LogOut, LayoutDashboard, ReceiptText, Users, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-primary-600 font-bold text-xl">
              <Wallet className="w-6 h-6" />
              <span>FinTrack</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="flex items-center space-x-1 text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/transacciones" className="flex items-center space-x-1 text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <ReceiptText className="w-4 h-4" />
                <span>Transacciones</span>
              </Link>
              {user.rol === 'admin' && (
                <Link to="/usuarios" className="flex items-center space-x-1 text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 hidden sm:block">Hola, {user.nombre}</span>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center space-x-1 text-slate-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-primary-600 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 text-slate-600 hover:text-primary-600 hover:bg-slate-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/transacciones" 
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 text-slate-600 hover:text-primary-600 hover:bg-slate-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <ReceiptText className="w-5 h-5" />
              <span>Transacciones</span>
            </Link>
            {user.rol === 'admin' && (
              <Link 
                to="/usuarios" 
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 text-slate-600 hover:text-primary-600 hover:bg-slate-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Usuarios</span>
              </Link>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-2 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
