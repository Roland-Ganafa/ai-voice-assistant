import { motion } from 'framer-motion';

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default HistorySkeleton;
