import React from 'react'
import {
  ChevronLeft,
  Calendar,
  Bold,
  Italic,
  Underline,
  Image,
  Link,
  Quote,
  List,
  ListOrdered,
  Type,
} from "lucide-react";
function Editor({setTitle,title,content,setContent}) {
  return (
   <div>
            {/* Writing Section */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          <input
            type="text"
            placeholder="Add a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-semibold text-gray-800 placeholder-gray-400 border-none outline-none mb-6 bg-transparent"
          />

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex gap-1">
              <button
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Bold"
              >
                <Bold size={16} className="text-gray-600" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Italic"
              >
                <Italic size={16} className="text-gray-600" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Underline"
              >
                <Underline size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <div className="flex gap-1">
              <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                H1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                H2
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                H3
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <div className="flex gap-1">
              <button
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Bullet List"
              >
                <List size={16} className="text-gray-600" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Numbered List"
              >
                <ListOrdered size={16} className="text-gray-600" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Quote"
              >
                <Quote size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <div className="flex gap-1">
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                <Image size={16} />
                Image
              </button>
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                <Link size={16} />
                Link
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
            //   onClick={() => setShowEmojiPanel(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              😊 Emoji
            </button>
          </div>

          {/* Text Area */}
          <div className="relative">
            <div
              contenteditable="true"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full min-h-80 p-4 border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 text-gray-700 leading-relaxed"
            >
             Write here...

            </div>

            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
              {content.length} characters
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Last saved: Never</span>
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Auto-save enabled</span>
            </div>
            <div className="flex gap-2">
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Publish
              </button>
            </div>
          </div>
        </div>
   </div>
  )
}

export default Editor