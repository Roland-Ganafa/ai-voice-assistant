import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentIcon, XIcon, CheckIcon } from '@heroicons/react/outline';
import { uploadDocument } from '../services/api';

function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    for (const fileObj of newFiles) {
      try {
        setActiveFile(fileObj.id);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          ));
        }, 200);

        // Process the file
        const result = await uploadDocument(fileObj.file);

        clearInterval(progressInterval);

        setFiles(prev => prev.map(f => 
          f.id === fileObj.id
            ? { 
                ...f, 
                status: 'complete',
                progress: 100,
                summary: result.summary,
                text: result.text
              }
            : f
        ));
      } catch (error) {
        console.error('Error processing file:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id
            ? { ...f, status: 'error', progress: 0 }
            : f
        ));
      }
    }

    setActiveFile(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-800 dark:text-white mb-8"
      >
        Upload Documents
      </motion.h1>

      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200 ${
            isDragActive
              ? 'border-primary bg-primary bg-opacity-5'
              : 'border-gray-300 hover:border-primary'
          }`}
      >
        <input {...getInputProps()} />
        <DocumentIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {isDragActive
            ? 'Drop your files here...'
            : 'Drag and drop your files here, or click to select files'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Supported formats: PDF, DOC, DOCX, PNG, JPG
        </p>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Uploaded Files
            </h2>
            {files.map(({ file, id, status, progress, summary }) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <DocumentIcon className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-gray-800 dark:text-white font-medium">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {status === 'uploading' && (
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    {status === 'complete' && (
                      <CheckIcon className="w-6 h-6 text-green-500" />
                    )}
                    {status === 'error' && (
                      <p className="text-red-500 text-sm">Error processing file</p>
                    )}
                    <button
                      onClick={() => removeFile(id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <XIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Summary Section */}
                {status === 'complete' && summary && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      Summary
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {summary}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DocumentUpload;
