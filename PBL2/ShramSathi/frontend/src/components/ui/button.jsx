// src/components/ui/button.jsx
export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
