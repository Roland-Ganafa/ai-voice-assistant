import { useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@headlessui/react';

function Settings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoTranscribe: true,
    voiceSpeed: 1,
    language: 'en',
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-800 dark:text-white mb-8"
      >
        Settings
      </motion.h1>

      <div className="space-y-6">
        {/* Appearance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500">
                Enable dark mode for a better night-time experience
              </p>
            </div>
            <Switch
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
              className={`${
                settings.darkMode ? 'bg-primary' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </motion.section>

        {/* Voice Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Voice Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-800 dark:text-white">Voice Speed</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    voiceSpeed: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>

            <div>
              <label className="text-gray-800 dark:text-white">Language</label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    language: e.target.value,
                  }))
                }
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-white">
                Enable Notifications
              </p>
              <p className="text-sm text-gray-500">
                Receive notifications about completed tasks and updates
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onChange={() => handleToggle('notifications')}
              className={`${
                settings.notifications ? 'bg-primary' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default Settings;
