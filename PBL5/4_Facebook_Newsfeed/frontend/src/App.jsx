import { useState } from 'react';
import Header from './components/Header';
import Feed from './components/Feed';

function App() {
  // For demo purposes, using user ID 1. In a real app, this would come from authentication
  const [currentUserId] = useState(500);
  const [feedUserId] = useState(500)

 // User whose feed we're viewing

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentUserId={currentUserId} />
      <main className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
        <Feed userId={feedUserId} currentUserId={currentUserId} />
      </main>
    </div>
  );
}

export default App;