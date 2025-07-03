// frontend/src/components/myNeighbourhood/SubmitButton.jsx
import React from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, CheckCircle } from 'lucide-react';

const SubmitButton = ({ submitStatus ,formData, user}) => {
  const { pending } = useFormStatus();
  // Check if karma validation fails
  const isKarmaInvalid = () => {
    if (!user || !formData.karmaPoints) return false;
    const karmaPoints = parseInt(formData.karmaPoints) || 0;
    const userKarma = user.karmaPoints || 0;
    return karmaPoints > userKarma || karmaPoints < 10 || karmaPoints > 5000;
  };
  
  const isLoading = pending || submitStatus === 'creating_category' || submitStatus === 'submitting';
  
  const getButtonContent = () => {
    if (submitStatus === 'creating_category') {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating Category...
        </>
      );
    }
    
    if (pending || submitStatus === 'submitting') {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Posting...
        </>
      );
    }
    
    if (submitStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          Posted!
        </>
      );
    }
    
    return 'Post Request';
  };
  
  return (
    <button
      type="submit"
      disabled={isLoading || isKarmaInvalid()}
      className="bg-gradient-to-r from-primary-light to-primary text-background px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {getButtonContent()}
    </button>
  );
};

export default SubmitButton;