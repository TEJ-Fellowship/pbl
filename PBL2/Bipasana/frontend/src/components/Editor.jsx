import React, { useContext, useState } from "react";
import { ThemeContext } from "../ThemeContext";
import {
  Bold,
  Italic,
  Underline,
  Image,
  Link,
  Quote,
  List,
  ListOrdered,
} from "lucide-react";

function Editor({
  setTitle = () => {},
  title = "",
  content = "",
  setContent = () => {},
  handleSave = () => {},
  editorRef
}) {
  const {isDark} = useContext(ThemeContext)
  const [selectedFormat, setSelectedFormat] = useState(new Set());
  const fileInputRef = React.useRef();

  const toggleFormat = (format) => {
    const newFormats = new Set(selectedFormat);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setSelectedFormat(newFormats);
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target.result;
        const img = `<img src="${base64Image}" style="max-width:100%;height:auto;resize:both;overflow:auto;width:300px;" contenteditable="false" />`;
        applyFormat("insertHTML", img);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  return (
    <div className="${isDark?bg-gray-800:bg-gray-200} shadow-lg rounded-2xl p-6 border border-gray-100">
      {/* Title */}
      <input
        type="text"
        placeholder="Add a title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`w-full text-2xl font-semibold ${isDark?'text-gray-200 placeholder-gray-400':'text-gray-800 placeholder-gray-500'} border-none outline-none mb-4 bg-transparent`}
        style={{ direction: "ltr", textAlign: "left" }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => {
              applyFormat("bold");
              toggleFormat("bold");
            }}
            className={`p-2 rounded-lg transition-colors ${
              selectedFormat.has("bold")
                ? "bg-purple-100 text-purple-600"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => {
              applyFormat("italic");
              toggleFormat("italic");
            }}
            className={`p-2 rounded-lg transition-colors ${
              selectedFormat.has("italic")
                ? "bg-purple-100 text-purple-600"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => {
              applyFormat("underline");
              toggleFormat("underline");
            }}
            className={`p-2 rounded-lg transition-colors ${
              selectedFormat.has("underline")
                ? "bg-purple-100 text-purple-600"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Underline"
          >
            <Underline size={16} />
          </button>
        </div>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <div className="flex gap-1">
          <button
            onClick={() => applyFormat("insertUnorderedList")}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            title="Bullet List"
          >
            <List size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => applyFormat("insertOrderedList")}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => applyFormat("formatBlock", "blockquote")}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            title="Quote"
          >
            <Quote size={16} className="text-gray-600" />
          </button>
        </div>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Image size={16} /> Image
          </button>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            onClick={() => {
              const url = prompt("Enter link URL:");
              if (url) applyFormat("createLink", url);
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Link size={16} /> Link
          </button>
        </div>
      </div>

      {/* Rich Text Editor - Fixed text direction */}
      <div
       ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={(e) => {
          const selection = window.getSelection();
          const range =
            selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const cursorPosition = range ? range.startOffset : 0;
          const parentNode = range ? range.startContainer : null;

          setContent(e.target.innerHTML);

          // Restore cursor position after state update
          setTimeout(() => {
            if (parentNode && parentNode.nodeType === Node.TEXT_NODE) {
              try {
                const newRange = document.createRange();
                newRange.setStart(
                  parentNode,
                  Math.min(cursorPosition, parentNode.textContent.length)
                );
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              } catch (err) {
                // If cursor restoration fails, just continue
              }
            }
          }, 0);
        }}
        ref={(el) => {
          if (el && !el.innerHTML && !content) {
            el.innerHTML = "";
          }
        }}
        placeholder="Write your journal here..."
        className="min-h-80 mb-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        style={{
          minHeight: "320px",
          direction: "ltr",
          textAlign: "left",
          unicodeBidi: "normal",
          writingMode: "horizontal-tb",
        }}
        data-placeholder="Write your journal here..."
      />

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className={isDark?`text-gray-200`:`text-gray-600`}>Last saved: Never</span>
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span className={isDark?`text-gray-200`:`text-gray-600`}>Auto-save enabled</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

export default Editor;
