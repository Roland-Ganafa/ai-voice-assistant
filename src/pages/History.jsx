import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  TrashIcon, 
  DocumentIcon, 
  MicrophoneIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/outline';
import { fetchHistory, deleteHistoryItem } from '../services/api';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import HistorySkeleton from '../components/HistorySkeleton';
import ConfirmDialog from '../components/ConfirmDialog';

function History() {
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('desc');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, itemId: null });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0
  });

  const loadHistory = async (options = {}) => {
    try {
      setLoading(true);
      const data = await fetchHistory({
        page: pagination.page,
        perPage: pagination.perPage,
        typeFilter: selectedType === 'all' ? null : selectedType,
        search: searchQuery || null,
        sort: sortBy,
        ...options
      });
      setHistoryItems(data.items);
      setPagination({
        page: data.page,
        perPage: data.per_page,
        total: data.total,
        totalPages: data.total_pages
      });
      setError(null);
    } catch (err) {
      setError('Failed to load history. Please try again later.');
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value) => {
    loadHistory({ page: 1, search: value });
  }, 300);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedType !== 'all') {
      loadHistory({ page: 1 });
    }
  }, [selectedType]);

  useEffect(() => {
    loadHistory({ page: 1 });
  }, [sortBy]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleDeleteItem = async (id) => {
    try {
      setDeleteConfirm({ open: false, itemId: null });
      await deleteHistoryItem(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      loadHistory({ page: historyItems.length === 1 ? Math.max(1, pagination.page - 1) : pagination.page });
      toast.success('Item deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete item');
    }
  };

  const confirmDelete = (id, e) => {
    e?.stopPropagation();
    setDeleteConfirm({ open: true, itemId: id });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadHistory({ page: newPage });
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    return date.toLocaleDateString();
  };

  if (loading && !historyItems.length) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-800 dark:text-white mb-8"
        >
          History
        </motion.h1>
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4 opacity-50 pointer-events-none">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search in history..."
                disabled
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <select
              disabled
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option>All Types</option>
            </select>
            <select
              disabled
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option>Newest First</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <HistorySkeleton />
          </div>
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button 
            onClick={() => loadHistory()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-800 dark:text-white mb-8"
      >
        History
      </motion.h1>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search in history..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="voice">Voice</option>
            <option value="document">Document</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>
            {pagination.total} total items
            {searchQuery && ` • ${pagination.total} results`}
          </p>
          <div className="flex items-center space-x-4">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-1 rounded-full ${
                  pagination.page === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`p-1 rounded-full ${
                  pagination.page === pagination.totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* History List */}
        <div className="md:col-span-1 space-y-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <HistorySkeleton />
            ) : (
              <AnimatePresence>
                {historyItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => setSelectedItem(item)}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md cursor-pointer
                      transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
                      ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {item.type === 'voice' ? (
                          <MicrophoneIcon className="w-5 h-5 text-primary" />
                        ) : (
                          <DocumentIcon className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <p className="text-gray-800 dark:text-white font-medium truncate">
                            {item.content}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTimestamp(item.timestamp)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => confirmDelete(item.id, e)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                      >
                        <TrashIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </AnimatePresence>

          {!loading && historyItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ClockIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {searchQuery ? 'No matching items found' : 'No history items yet'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Detail View */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
              >
                <div className="flex items-center space-x-3 mb-6">
                  {selectedItem.type === 'voice' ? (
                    <MicrophoneIcon className="w-6 h-6 text-primary" />
                  ) : (
                    <DocumentIcon className="w-6 h-6 text-primary" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {selectedItem.type === 'voice' ? 'Conversation' : 'Document Summary'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedItem.timestamp).toLocaleString()}
                  </span>
                </div>

                {selectedItem.type === 'voice' ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-2">You said:</p>
                      <p className="text-gray-800 dark:text-white">
                        {selectedItem.content}
                      </p>
                    </div>
                    <div className="bg-primary bg-opacity-5 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-2">AI responded:</p>
                      <p className="text-gray-800 dark:text-white">
                        {selectedItem.response}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-2">Document:</p>
                      <p className="text-gray-800 dark:text-white font-medium">
                        {selectedItem.content}
                      </p>
                    </div>
                    <div className="bg-primary bg-opacity-5 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-2">Summary:</p>
                      <p className="text-gray-800 dark:text-white">
                        {selectedItem.summary}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-center"
              >
                <DocumentIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Select an item to view details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={() => handleDeleteItem(deleteConfirm.itemId)}
        onCancel={() => setDeleteConfirm({ open: false, itemId: null })}
        title="Delete History Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  );
}

export default History;
