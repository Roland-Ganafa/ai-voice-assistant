import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  DocumentIcon,
  ClockIcon,
  CogIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/outline';

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/upload', icon: DocumentIcon, label: 'Upload' },
  { path: '/history', icon: ClockIcon, label: 'History' },
  { path: '/settings', icon: CogIcon, label: 'Settings' },
];

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        className="fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg lg:translate-x-0"
      >
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-primary">AI Assistant</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  location.pathname === item.path
                    ? 'bg-primary bg-opacity-10 text-primary'
                    : ''
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <MenuIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
