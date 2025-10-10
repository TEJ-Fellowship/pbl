import React, { useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";

const CodeEditor = ({
  language = "javascript",
  value = "",
  readOnly = false,
  height = "300px",
  onChange = () => {},
  theme = "vs-dark",
}) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      readOnly: readOnly,
      contextmenu: !readOnly,
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: readOnly ? "line" : "line",
      cursorBlinking: readOnly ? "solid" : "blink",
      renderLineHighlight: "line",
      renderWhitespace: "selection",
      renderControlCharacters: false,
      renderIndentGuides: true,
      highlightActiveIndentGuide: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    // Add custom themes for better syntax highlighting
    monaco.editor.defineTheme("twilio-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "regexp", foreground: "D16969" },
        { token: "type", foreground: "4EC9B0" },
        { token: "class", foreground: "4EC9B0" },
        { token: "interface", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "constant", foreground: "4FC1FF" },
        { token: "parameter", foreground: "9CDCFE" },
        { token: "property", foreground: "9CDCFE" },
        { token: "operator", foreground: "D4D4D4" },
        { token: "delimiter", foreground: "D4D4D4" },
        { token: "tag", foreground: "569CD6" },
        { token: "attribute.name", foreground: "92C5F8" },
        { token: "attribute.value", foreground: "CE9178" },
      ],
      colors: {
        "editor.background": "#1E1E1E",
        "editor.foreground": "#D4D4D4",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#D4D4D4",
        "editor.selectionBackground": "#264F78",
        "editor.selectionHighlightBackground": "#ADD6FF26",
        "editorCursor.foreground": "#AEAFAD",
        "editorWhitespace.foreground": "#3C4043",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editorLineHighlight.background": "#2D2D30",
        "editorBracketMatch.background": "#0E639C50",
        "editorBracketMatch.border": "#888888",
      },
    });

    monaco.editor.defineTheme("twilio-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "008000", fontStyle: "italic" },
        { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
        { token: "string", foreground: "A31515" },
        { token: "number", foreground: "098658" },
        { token: "regexp", foreground: "811F3F" },
        { token: "type", foreground: "267F99" },
        { token: "class", foreground: "267F99" },
        { token: "interface", foreground: "267F99" },
        { token: "function", foreground: "795E26" },
        { token: "variable", foreground: "001080" },
        { token: "constant", foreground: "0070C1" },
        { token: "parameter", foreground: "001080" },
        { token: "property", foreground: "001080" },
        { token: "operator", foreground: "000000" },
        { token: "delimiter", foreground: "000000" },
        { token: "tag", foreground: "800000" },
        { token: "attribute.name", foreground: "FF0000" },
        { token: "attribute.value", foreground: "0451A5" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#000000",
        "editorLineNumber.foreground": "#237893",
        "editorLineNumber.activeForeground": "#0B216F",
        "editor.selectionBackground": "#ADD6FF",
        "editor.selectionHighlightBackground": "#ADD6FF",
        "editorCursor.foreground": "#000000",
        "editorWhitespace.foreground": "#BFBFBF",
        "editorIndentGuide.background": "#D3D3D3",
        "editorIndentGuide.activeBackground": "#939393",
        "editorLineHighlight.background": "#F0F8FF",
        "editorBracketMatch.background": "#A9D8FF",
        "editorBracketMatch.border": "#888888",
      },
    });

    // Set the theme
    monaco.editor.setTheme(readOnly ? "twilio-dark" : "twilio-light");
  };

  const handleEditorChange = (value) => {
    if (!readOnly) {
      onChange(value);
    }
  };

  // Language-specific configurations
  const getLanguageConfig = (lang) => {
    const configs = {
      javascript: {
        wordPattern:
          /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: "`", close: "`" },
        ],
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
      },
      python: {
        wordPattern:
          /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
      },
      php: {
        wordPattern:
          /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
      },
    };

    return configs[lang] || configs.javascript;
  };

  return (
    <div className="code-editor-container">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          ...getLanguageConfig(language),
          fontSize: 14,
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          readOnly: readOnly,
          contextmenu: !readOnly,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: readOnly ? "line" : "line",
          cursorBlinking: readOnly ? "solid" : "blink",
          renderLineHighlight: "line",
          renderWhitespace: "selection",
          renderControlCharacters: false,
          renderIndentGuides: true,
          highlightActiveIndentGuide: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
};

export default CodeEditor;
