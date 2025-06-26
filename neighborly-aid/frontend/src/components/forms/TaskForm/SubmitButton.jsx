// frontend/src/components/myNeighbourhood/SubmitButton.jsx
import React from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, CheckCircle } from 'lucide-react';

const SubmitButton = ({ submitStatus }) => {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gradient-to-r from-primary-light to-primary text-background px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Posting...
        </>
      ) : submitStatus === 'success' ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Posted!
        </>
      ) : (
        'Post Request'
      )}
    </button>
  );
};

export default SubmitButton;