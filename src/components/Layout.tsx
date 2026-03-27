import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Bell, 
  LogOut, 
  GraduationCap,
  Briefcase,
  Menu,
  X,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  to, 
  icon: Icon, 
  label, 
  active, 
  onClick 
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon size={20} className={cn("transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-muted-foreground")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isFaculty, isStudent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const adminNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/companies', icon: Building2, label: 'Companies' },
    { to: '/applications', icon: FileText, label: 'Applications' },
  ];

  const studentNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
    { to: '/companies', icon: Building2, label: 'Companies' },
    { to: '/applications', icon: FileText, label: 'My Applications' },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900">PlacementHub</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">University Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="text-slate-400" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-slate-900">
              {navItems.find(item => item.to === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{user?.displayName}</p>
                <p className="text-[10px] text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
