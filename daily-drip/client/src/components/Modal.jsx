// src/components/Modal.jsx
import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, article }) => {
    useEffect(() => {
        const handleEsc = (e) => {
          if (e.key === 'Escape') onClose()
        }
    
        if (isOpen) {
          document.addEventListener('keydown', handleEsc)
        }
    
        return () => {
          document.removeEventListener('keydown', handleEsc)
        }
      }, [isOpen, onClose])
    if (!isOpen || !article) return null; // If modal is not open or no article, show nothing
  
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 p-4 rounded-lg max-w-xl w-full relative">
          {/* Close button */}
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition">✕</button>
  
          {/* Article content */}
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{article.title}</h2>
  
          {article.urlToImage && (
            <img src={article.urlToImage} alt="News" className="w-full my-2 rounded dark:bg-gray-700" />
          )}
  
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {article.source?.name} • {new Date(article.publishedAt).toLocaleString()}
          </p>
  
          <p>{article.description || "No description available."}</p>
  
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 mt-2 inline-block hover:underline"
            >
              Read more →
            </a>
          )}
        </div>
      </div>
    );
  };
  
  export default Modal;
  