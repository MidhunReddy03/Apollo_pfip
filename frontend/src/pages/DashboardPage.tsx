import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Activity,
  Building2,
  Clock,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Calendar,
  BarChart3,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store';
import { authService } from '../services/auth';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Button from '../components/Button';
import { cn } from '../utils/helpers';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    authService.logout();
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const stats = [
    { title: 'Total Patients', value: 248, icon: Users, color: 'primary' as const, trend: { value: 12, isPositive: true } },
    { title: 'Active Queues', value: 34, icon: Activity, color: 'success' as const, trend: { value: 8, isPositive: true } },
    { title: 'Available Stations', value: 18, icon: Building2, color: 'warning' as const, trend: { value: 3, isPositive: false } },
    { title: 'Avg Wait Time', value: 12, icon: Clock, color: 'danger' as const, trend: { value: 15, isPositive: true } },
  ];

  const recentActivity = [
    { id: 1, patient: 'John Doe', action: 'Checked in', time: '2 min ago', status: 'success' },
    { id: 2, patient: 'Jane Smith', action: 'In Queue', time: '5 min ago', status: 'warning' },
    { id: 3, patient: 'Bob Johnson', action: 'Completed', time: '10 min ago', status: 'success' },
    { id: 4, patient: 'Alice Brown', action: 'Called', time: '15 min ago', status: 'primary' },
  ];

  const menuItems = [
    { icon: Activity, label: 'Dashboard', path: '/dashboard', active: true },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Calendar, label: 'Encounters', path: '/encounters' },
    { icon: Building2, label: 'Stations', path: '/stations' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 flex flex-col"
          >
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <Activity className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Apollo DQMS</h2>
                  <p className="text-xs text-gray-500">v2.0</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    item.active
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<LogOut size={16} />}
                onClick={handleLogout}
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-0')}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
                </motion.button>

                {/* Time */}
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <Clock size={18} className="text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={stat.title} {...stat} delay={index * 0.1} />
            ))}
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Queue Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Queue Overview</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="mx-auto text-primary-600 mb-2" size={48} />
                    <p className="text-gray-600">Queue visualization chart</p>
                    <p className="text-sm text-gray-500 mt-1">Coming soon with real-time data</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-2',
                          activity.status === 'success' && 'bg-success-500',
                          activity.status === 'warning' && 'bg-warning-500',
                          activity.status === 'primary' && 'bg-primary-500'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{activity.patient}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'New Patient', icon: Users, color: 'primary' },
                  { label: 'Check-in', icon: Calendar, color: 'success' },
                  { label: 'View Queue', icon: Activity, color: 'warning' },
                  { label: 'Reports', icon: BarChart3, color: 'danger' },
                ].map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
                  >
                    <action.icon className="mx-auto mb-2 text-gray-400 group-hover:text-primary-600 transition-colors" size={24} />
                    <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
