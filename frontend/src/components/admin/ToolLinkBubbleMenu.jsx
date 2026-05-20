// frontend/src/components/admin/ToolLinkBubbleMenu.jsx
import { useState, useEffect, useRef } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useEditorState } from '@tiptap/react';
import { useTools } from '../../hooks/useTools';

export default function ToolLinkBubbleMenu({ editor }) {
  const { data: tools } = useTools();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const { isToolLink } = useEditorState({
    editor,
    selector: (ctx) => ({
      isToolLink: ctx.editor?.isActive('toolLink') ?? false,
    }),
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (!searchOpen) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [searchOpen]);

  // Reset dropdown state when editor selection collapses (BubbleMenu will hide)
  useEffect(() => {
    if (!editor) return;
    const handler = ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from === to) {
        setSearchOpen(false);
        setQuery('');
      }
    };
    editor.on('selectionUpdate', handler);
    return () => editor.off('selectionUpdate', handler);
  }, [editor]);

  const filtered = (tools || []).filter((t) =>
    !query || t.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (tool) => {
    editor.chain().focus().setToolLink({ toolSlug: tool.slug, toolName: tool.name }).run();
    setSearchOpen(false);
    setQuery('');
  };

  const handleUnset = () => {
    editor.chain().focus().unsetToolLink().run();
  };

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed, state }) => {
        // Don't show if image is active
        if (ed.isActive('image')) return false;
        // Show only when there is an actual text selection
        const { from, to } = state.selection;
        return from !== to;
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderRadius: 12,
          border: '1px solid rgba(0,61,107,0.12)',
          background: 'white',
          padding: 4,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        }}
      >
        {isToolLink ? (
          <button
            type="button"
            onClick={handleUnset}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(239,68,68,0.1)',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            ✕ Hapus Tautan Alat
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setSearchOpen((v) => !v); }}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(217,119,6,0.1)',
              color: '#D97706',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            🔧 Tautkan Alat
          </button>
        )}

        {/* Search dropdown */}
        {searchOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              width: 240,
              borderRadius: 10,
              border: '1px solid rgba(0,61,107,0.12)',
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari alat..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderBottom: '1px solid rgba(0,61,107,0.08)',
                fontSize: 13,
                fontFamily: "'Manrope', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <p style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(0,61,107,0.4)', fontFamily: "'Manrope', sans-serif" }}>
                  Tidak ada alat ditemukan
                </p>
              )}
              {filtered.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(tool); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 12px',
                    border: 'none',
                    background: 'none',
                    fontSize: 13,
                    fontFamily: "'Manrope', sans-serif",
                    color: '#003D6B',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,61,107,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
