import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  ClipboardCheck,
  Monitor,
  BarChart3,
  Calendar,
  UserPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  Stethoscope,
  Shield,
  Wrench,
  Heart,
  LayoutDashboard,
  GitBranch,
} from 'lucide-react';
import { useAuthStore } from '../store';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  role: string;
  collapsed?: boolean;
}

const roleConfigs: Record<string, { title: string; navItems: NavItem[] }> = {
  receptionist: {
    title: 'Receptionist',
    navItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/receptionist/dashboard' },
      { icon: UserPlus, label: 'Register Patient', path: '/receptionist/register-patient' },
      { icon: ClipboardCheck, label: 'Check-In', path: '/receptionist/check-in' },
      { icon: Users, label: 'All Patients', path: '/receptionist/patients' },
      { icon: Calendar, label: 'Appointments', path: '/receptionist/appointments' },
    ],
  },
  floor_manager: {
    title: 'Floor Manager',
    navItems: [
      { icon: LayoutDashboard, label: 'Queue Monitor', path: '/manager/dashboard' },
      { icon: Monitor, label: 'Stations', path: '/manager/stations' },
      { icon: BarChart3, label: 'Analytics', path: '/manager/analytics' },
      { icon: GitBranch, label: 'Workflows', path: '/manager/workflows' },
    ],
  },
  doctor: {
    title: 'Doctor',
    navItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard' },
      { icon: Users, label: 'My Patients', path: '/doctor/patients' },
      { icon: Calendar, label: 'Schedule', path: '/doctor/schedule' },
    ],
  },
  technician: {
    title: 'Technician',
    navItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/technician/dashboard' },
      { icon: Monitor, label: 'My Station', path: '/technician/station' },
      { icon: Users, label: 'Queue', path: '/technician/queue' },
    ],
  },
  hospital_admin: {
    title: 'Admin',
    navItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Users, label: 'Staff', path: '/admin/staff' },
      { icon: Monitor, label: 'Stations', path: '/admin/stations' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: Shield, label: 'Security', path: '/admin/security' },
    ],
  },
  super_admin: {
    title: 'Super Admin',
    navItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Users, label: 'Staff', path: '/admin/staff' },
      { icon: Monitor, label: 'Stations', path: '/admin/stations' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: Shield, label: 'Security', path: '/admin/security' },
    ],
  },
  patient: {
    title: 'Patient',
    navItems: [
      { icon: LayoutDashboard, label: 'My Visit', path: '/patient/dashboard' },
      { icon: Calendar, label: 'History', path: '/patient/history' },
    ],
  },
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'doctor': return Stethoscope;
    case 'technician': return Wrench;
    case 'patient': return Heart;
    case 'hospital_admin':
    case 'super_admin': return Shield;
    default: return Activity;
  }
};

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const config = roleConfigs[role] || roleConfigs.receptionist;
  const RoleIcon = getRoleIcon(role);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    authService.logout();
    logoutStore();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0, width: collapsed ? 72 : 264 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col sidebar shadow-sidebar overflow-hidden"
    >
      {/* Logo */}
      <div className={`p-5 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-10 h-10 gradient-medical rounded-xl flex items-center justify-center flex-shrink-0 shadow-medical">
          <Activity className="text-white" size={22} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <h2 className="font-display font-bold text-white text-sm tracking-wide">Apollo DQMS</h2>
              <p className="text-[11px] text-slate-400 font-medium">{config.title} Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Time Display */}
      {!collapsed && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-white/5 flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-300">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-slate-500 ml-auto">
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Navigation
          </p>
        )}
        {config.navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center ${collapsed ? 'justify-center px-3' : 'px-3'} py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-medical-500/15 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-400 rounded-r-full"
                />
              )}
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
              )}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-emergency-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
      </button>

      {/* User Profile */}
      <div className="p-3 border-t border-white/10">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-3`}>
          <div className="w-9 h-9 gradient-medical rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{user?.full_name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">{role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors`}
        >
          <LogOut size={16} />
          {!collapsed && <span className="text-xs font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
