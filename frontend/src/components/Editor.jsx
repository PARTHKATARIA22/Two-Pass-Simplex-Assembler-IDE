import React, { useRef, useEffect } from 'react';

const Editor = ({ code, setCode, onRun, onClear, isLoading }) => {
  const textareaRef = useRef(null);

  // Calculate line numbers based on the code's newline characters
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sync scrolling between line numbers and textarea
  const handleScroll = (e) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      // Put cursor at right position again
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">ASM CODE EDITOR</span>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onRun}
            disabled={isLoading}
            className={`px-3 py-1 text-xs font-semibold text-white rounded transition-colors flex items-center gap-1
              ${isLoading ? 'bg-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : (
              'Run'
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div
          className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-end py-4 px-2 select-none overflow-hidden text-gray-500 font-mono text-sm leading-relaxed"
          onScroll={handleScroll}
          ref={textareaRef}
        >
          {lines.map((line) => (
            <div key={line} className="h-6 leading-6">{line}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop = e.target.scrollTop;
            }
          }}
          spellCheck="false"
          className="flex-1 bg-transparent text-gray-300 font-mono text-sm p-4 h-full w-full resize-none focus:outline-none leading-relaxed whitespace-pre"
          placeholder="; Enter SIMPLEX assembly code here..."
        />
      </div>
    </div>
  );
};

export default Editor;
