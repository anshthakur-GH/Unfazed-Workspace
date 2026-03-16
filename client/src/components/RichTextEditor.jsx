import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Highlighter, X, Strikethrough } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, className, minHeight = "200px", readOnly = false }) => {
    const editorRef = useRef(null);
    const toolbarRef = useRef(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

    // Sync external value with contentEditable div
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only update if content is significantly different to avoid cursor jumps
            // A simple check is to compare innerHTML. 
            // However, doing this on every keystroke when we are the ones updating it causes issues.
            // We usually only want to set it if it's external, but for simplicity here we check mismatch.
            // Ideally, we track if we are currently editing.

            // For now, only set if empty or completely different (like switching notes)
            if (value === '' && editorRef.current.innerHTML !== '<br>') {
                editorRef.current.innerHTML = '';
            } else if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current && onChange) {
            const html = editorRef.current.innerHTML;
            onChange(html === '<br>' ? '' : html);
        }
    };

    const updateToolbarPosition = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            setShowToolbar(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Ensure the selection is inside our editor
        if (!editorRef.current.contains(selection.anchorNode)) {
            setShowToolbar(false);
            return;
        }

        setToolbarPosition({
            top: rect.top - 50, // Position above text
            left: rect.left + (rect.width / 2) - 85 // Center horizontally (approx width)
        });
        setShowToolbar(true);
    };

    useEffect(() => {
        if (readOnly) return;
        document.addEventListener('selectionchange', updateToolbarPosition);
        return () => document.removeEventListener('selectionchange', updateToolbarPosition);
    }, [readOnly]);

    const format = (command, value = null) => {
        document.execCommand(command, false, value);
        // Resync input after formatting
        handleInput();
        // Keep selection to allow multiple formats? 
        // execCommand usually keeps selection. 
    };

    const toggleHighlight = () => {
        const highlightColor = '#FDE68A'; // Warm aesthetic yellow

        let isHighlighted = false;

        // Method 1: queryCommandValue
        const val = document.queryCommandValue('hiliteColor');
        if (val && val !== 'transparent' && val !== 'rgba(0, 0, 0, 0)') {
            isHighlighted = true;
        }

        // Method 2: Manual DOM check (fallback)
        if (!isHighlighted) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const node = selection.anchorNode;
                const element = node.nodeType === 3 ? node.parentElement : node;

                // Check inline style specifically
                if (element && element.style.backgroundColor && element.style.backgroundColor !== 'transparent') {
                    isHighlighted = true;
                }
            }
        }

        format('hiliteColor', isHighlighted ? 'transparent' : highlightColor);
    };

    return (
        <div className={`relative rich-text-editor flex flex-col ${className || ''}`}>
            {showToolbar && !readOnly && (
                <div
                    ref={toolbarRef}
                    className="fixed z-50 flex items-center gap-1 bg-gray-800 text-white p-1 rounded-lg shadow-xl border border-gray-700 animate-in fade-in zoom-in duration-200"
                    style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
                >
                    <button
                        onClick={() => format('bold')}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title="Bold"
                    >
                        <Bold size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-600 mx-1"></div>
                    <button
                        onClick={() => format('italic')}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title="Italic"
                    >
                        <Italic size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-600 mx-1"></div>
                    <button
                        onClick={() => format('strikeThrough')}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title="Strikethrough"
                    >
                        <Strikethrough size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-600 mx-1"></div>
                    <button
                        onClick={toggleHighlight}
                        className="p-2 hover:bg-gray-700 rounded transition-colors text-[#FDE68A]"
                        title="Highlight"
                    >
                        <Highlighter size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-600 mx-1"></div>
                    <button
                        onClick={() => setShowToolbar(false)}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div
                ref={editorRef}
                contentEditable={!readOnly}
                onInput={handleInput}
                className={`flex-1 w-full bg-background border border-border rounded-xl p-4 text-text focus:outline-none focus:border-accent overflow-y-auto ${!readOnly ? 'cursor-text' : ''}`}
                style={{ minHeight: minHeight }}
                placeholder={placeholder} // CSS empty:before needed for true placeholder behavior on contentEditable
                onKeyDown={(e) => {
                    // Ensure shortcuts work even if toolbar isn't visible
                    if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'b') { e.preventDefault(); format('bold'); }
                        if (e.key === 'i') { e.preventDefault(); format('italic'); }
                    }
                }}
            />
            {/* Placeholder emulation if empty */}
            {!value && (
                <div className="absolute top-4 left-4 text-text-muted pointer-events-none select-none">
                    {placeholder}
                </div>
            )}

            {/* Style to ensure highlights are visible and clean - targeted within this component */}
            <style>{`
                .rich-text-editor span[style*="background-color"] {
                    color: black !important;
                    text-shadow: none !important;
                    box-shadow: none !important; /* Extra safety */
                }
                /* Explicitly target the new color for robustness */
                span[style*="background-color: #FDE68A"],
                span[style*="background-color: rgb(253, 230, 138)"] {
                    color: black !important;
                    text-shadow: none !important;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
