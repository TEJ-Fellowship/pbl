import { useState } from "react";

const CATEGORIES = [
  "Sports",
  "Business",
  "Technology",
  "Health",
  "Entertainment",
  "Science",
];

export default function Category({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-gray-100 text-lg font-semibold"
      >
        Category
        <svg className={`w-4 h-4 ml-1 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <ul className="pl-4 mt-1 space-y-1">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <button
                onClick={() => { setOpen(false); onSelect?.(c); }}
                className="block w-full text-left py-1 px-2 rounded hover:bg-gray-200 text-gray-700"
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
