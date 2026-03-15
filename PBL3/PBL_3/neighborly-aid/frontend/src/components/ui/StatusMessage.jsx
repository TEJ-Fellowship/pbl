// frontend/src/components/myNeighbourhood/StatusMessages.jsx
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const StatusMessage = ({ error, submitStatus }) => {
  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-in slide-in-from-bottom duration-300">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Your request has been posted successfully!
          </span>
        </div>
      )}
    </>
  );
};

export default StatusMessage;