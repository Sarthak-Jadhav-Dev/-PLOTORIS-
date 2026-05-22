"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Download, Maximize2, Minimize2, Bold, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered } from 'lucide-react';
import { saveAs } from 'file-saver';
import type mermaid from 'mermaid';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const getRandomName = () => 'Researcher ' + Math.floor(Math.random() * 100);

interface CollaborationEditorProps {
  projectId: string;
  initialDraft?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// ─── IEEE Paginated View Component ───────────────────────────────────────────
// Renders the HTML paper as multiple discrete A4-sized page cards.
// Each page is a fixed-height (29.7cm) container with CSS column-count:2,
// so the browser fills the LEFT column first, then the RIGHT, per real IEEE layout.
function IEEEPaginatedView({ html }: { html: string }) {
  const [pages, setPages] = useState<string[][]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!html) return;

    // Parse the HTML into individual block-level child nodes
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const children = Array.from(doc.body.firstElementChild?.children ?? []);

    if (children.length === 0) return;

    // A4 page inner height at 96dpi: 29.7cm - 4.4cm padding = 25.3cm ≈ 960px
    // Two columns each ~9.5cm wide. Column height = page height = ~960px
    // We'll stack children until the estimated height exceeds one column height,
    // then start a new page.
    const PAGE_HEIGHT_PX = 960; // approx pixels for printable column height
    const COL_HEIGHT_PX = PAGE_HEIGHT_PX; // each column is the full page height

    const pageGroups: string[][] = [];
    let currentPage: string[] = [];
    let currentColHeight = 0;
    let currentCol = 0; // 0 = left col, 1 = right col

    const estimateHeight = (el: Element): number => {
      const tag = el.tagName.toLowerCase();
      // Title/h1 spans both columns (always starts new page if too tall)
      if (tag === 'div' && el.querySelector('h1')) return 100; // title block
      if (tag === 'h1') return 70;
      if (tag === 'h2') return 28;
      if (tag === 'p') {
        const textLen = (el.textContent || '').length;
        // ~85 chars per line at 10pt Times New Roman in a single column
        const lines = Math.max(1, Math.ceil(textLen / 85));
        return lines * 14 + 6; // 14px per line + margin
      }
      if (tag === 'table') return 200;
      if (tag === 'pre') return 180;
      if (tag === 'div') {
        // estimate based on children
        return Array.from(el.children).reduce((s, c) => s + estimateHeight(c), 40);
      }
      return 20;
    };

    for (const child of children) {
      const elHtml = child.outerHTML;
      const tag = child.tagName.toLowerCase();
      const isFullWidth = tag === 'h1' || 
        (tag === 'div' && child.querySelector('h1')) ||
        (tag === 'div' && (child.getAttribute('style') || '').includes('column-span'));
      const h = estimateHeight(child);

      if (isFullWidth) {
        // Full-width elements go on their own new page (or start of page)
        if (currentPage.length > 0 && currentColHeight > 50) {
          pageGroups.push(currentPage);
          currentPage = [];
          currentColHeight = 0;
          currentCol = 0;
        }
        currentPage.push(elHtml);
        currentColHeight += h;
        continue;
      }

      if (currentColHeight + h > COL_HEIGHT_PX) {
        // Current column is full
        if (currentCol === 0) {
          // Move to right column
          currentCol = 1;
          currentColHeight = h;
          currentPage.push(elHtml);
        } else {
          // Right column full — start a new page
          pageGroups.push(currentPage);
          currentPage = [elHtml];
          currentColHeight = h;
          currentCol = 0;
        }
      } else {
        currentPage.push(elHtml);
        currentColHeight += h;
      }
    }

    if (currentPage.length > 0) pageGroups.push(currentPage);
    setPages(pageGroups);
  }, [html]);

  if (pages.length === 0) {
    return (
      <div className="ieee-page flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <>
      {pages.map((pageChildren, i) => (
        <div key={i} className="ieee-page border border-gray-300">
          {/* Page number */}
          <div style={{ position: 'absolute', bottom: '0.8cm', left: 0, right: 0, textAlign: 'center', fontSize: '8pt', fontFamily: 'Times New Roman, serif', color: '#666' }}>
            {i + 1}
          </div>
          <div
            className="ieee-page-inner"
            dangerouslySetInnerHTML={{ __html: pageChildren.join('') }}
          />
        </div>
      ))}
    </>
  );
}

// ─── Main Editor Component ────────────────────────────────────────────────────

export function CollaborationEditor(props: CollaborationEditorProps) {
  const { projectId } = props;
  const [isReady, setIsReady] = useState(false);
  
  // Use refs to strictly guarantee single instantiation without state hooks
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => {
    // 1. Initialize Y.Doc
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }

    // 2. Initialize WebRTC Provider
    if (!providerRef.current) {
      const roomName = `plotoris-ieee-draft-${projectId}`;
      const signalingServers = [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com'
      ];
      
      providerRef.current = new WebrtcProvider(roomName, ydocRef.current, { signaling: signalingServers });
    }

    setIsReady(true);

    // 3. Cleanup securely for React Strict Mode
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      setIsReady(false);
    };
  }, [projectId]);

  if (!isReady || !ydocRef.current || !providerRef.current) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Connecting to secure WebRTC IEEE workspace...</p>
      </div>
    );
  }

  return <CollaborationEditorInner {...props} ydoc={ydocRef.current} provider={providerRef.current} />;
}

// ─── Inner Editor Component (Guaranteed Provider) ─────────────────────────────
interface InnerProps extends CollaborationEditorProps {
  ydoc: Y.Doc;
  provider: WebrtcProvider;
}

function CollaborationEditorInner({ projectId, initialDraft, isExpanded, onToggleExpand, ydoc, provider }: InnerProps) {
  const [userName] = useState(getRandomName());
  const [userColor] = useState(getRandomColor());
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'draft' | 'preview'>('draft');
  const [editorHtml, setEditorHtml] = useState<string>('');
  const mermaidRef = useRef<typeof mermaid | null>(null);

  // Initialize Mermaid on mount
  useEffect(() => {
    import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'Times New Roman, serif',
        fontSize: 12,
        flowchart: { curve: 'basis', padding: 20 },
      });
      mermaidRef.current = m.default;
    }).catch(() => {
      console.warn('Mermaid not available');
    });
  }, []);

  // Sync WebRTC Awareness (Canva Avatars)
  useEffect(() => {
    const updateAwareness = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const others = states.filter(s => s.user && s.user.name !== userName);
      setCollaborators(others);
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness(); // initial call

    return () => {
      provider.awareness.off('change', updateAwareness);
    };
  }, [provider, userName]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // history is handled by Yjs natively
      } as any),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Collaboration.configure({
        document: ydoc,
      }),
      // CollaborationCursor.configure({
      //   provider: provider as any,
      //   user: { name: userName, color: userColor },
      // }),
    ],
    onUpdate: ({ editor }) => {
      setEditorHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialDraft) {
      const currentText = editor.getText();
      if (currentText.trim() === '') {
        editor.commands.setContent(initialDraft);
        setEditorHtml(initialDraft);
      } else {
        setEditorHtml(editor.getHTML());
      }
    }
  }, [editor, initialDraft]);

  // Re-render Mermaid diagrams when html content changes
  useEffect(() => {
    if (!mermaidRef.current || !editorHtml) return;
    const timer = setTimeout(async () => {
      try {
        await mermaidRef.current!.run();
      } catch (e) {
        console.warn('Mermaid render warning:', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editorHtml, viewMode]);

  const exportDocx = async () => {
    if (!editor) return;
    setIsExporting(true);
    try {
      const rawHtml = editor.getHTML();
      const response = await fetch('/api/phase9/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rawHtml, projectId })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Export failed');
      }
      const blob = await response.blob();
      saveAs(blob, `IEEE_Draft_${projectId}.docx`);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to export DOCX: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="w-full h-full flex flex-col bg-[#e5e7eb] text-black overflow-hidden relative">
      <style>{`
        .collaboration-cursor__caret { border-left: 2px solid #0d0d0d; border-right: 2px solid #0d0d0d; margin-left: -2px; margin-right: -2px; pointer-events: none; position: relative; word-break: normal; }
        .collaboration-cursor__label { border-radius: 3px 3px 3px 0; color: #0d0d0d; font-size: 12px; font-style: normal; font-weight: 600; left: -2px; line-height: normal; padding: 2px 4px; position: absolute; top: -1.5em; user-select: none; white-space: nowrap; }
        
        /* Simulated Multiple Pages Layout */
        .ieee-format {
          font-family: "Times New Roman", Times, serif;
          line-height: 1.5;
          padding: 2.5cm;
          min-height: 29.7cm;
          height: max-content;
          column-count: 2;
          column-gap: 1.5cm;
          column-rule: 1px solid #e5e7eb;
        }
        .ieee-format h1 {
          column-span: all;
          text-align: center;
          font-size: 18pt;
          margin-bottom: 8pt;
          font-weight: bold;
        }
        .ieee-format h2 {
          font-size: 11pt;
          text-transform: uppercase;
          margin-top: 14pt;
          margin-bottom: 5pt;
          font-weight: bold;
          text-align: center;
        }
        .ieee-format p {
          font-size: 10pt;
          text-align: justify;
          text-indent: 14pt;
          margin-bottom: 8pt;
        }
        .ieee-format table {
          width: 100%;
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 9pt;
          column-span: all;
          display: table;
        }
        .ieee-format th, .ieee-format td {
          border: 1px solid #666;
          padding: 4pt 8pt;
          text-align: left;
        }
        .ieee-format th {
          background: #f0f0f0;
          font-weight: bold;
        }
        /* Mermaid diagrams */
        .ieee-format pre.mermaid {
          column-span: all;
          background: #fafafa;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12pt;
          margin: 10pt 0;
          font-family: monospace;
          font-size: 9pt;
          overflow-x: auto;
          text-align: center;
        }
        .ieee-format pre.mermaid svg {
          max-width: 100%;
          height: auto;
        }
        /* A4 Page pattern background */
        .paper-background {
          background-color: #fff;
          background-image: linear-gradient(to bottom, transparent calc(29.7cm - 2px), #d1d5db calc(29.7cm - 2px), #d1d5db 29.7cm);
          background-size: 100% 29.7cm;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 21cm;
          min-height: 29.7cm;
          height: max-content;
        }
      `}</style>
      
      {/* Word-Style Ribbon */}
      <div className="bg-[#f3f2f1] border-b border-[#c8c6c4] flex flex-col shrink-0 shadow-sm z-10 font-sans">
        
        {/* Ribbon Top Bar (File, Home, Insert...) & Canva Avatars */}
        <div className="flex items-center justify-between px-4 py-1 bg-white border-b border-gray-200 text-xs">
          <div className="flex items-center space-x-6">
            <div className="flex space-x-4">
              <span className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-1 cursor-pointer">Home</span>
              <span className="text-gray-600 hover:text-black cursor-pointer pb-1">Insert</span>
              <span className="text-gray-600 hover:text-black cursor-pointer pb-1">Layout</span>
              <span className="text-gray-600 hover:text-black cursor-pointer pb-1">References</span>
            </div>
            
            <div className="w-px h-4 bg-gray-300"></div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200">
              <button 
                onClick={() => setViewMode('draft')}
                className={`px-3 py-1 text-[11px] font-medium rounded-sm transition-colors ${viewMode === 'draft' ? 'bg-white shadow-sm text-black border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📝 Draft Mode
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-[11px] font-medium rounded-sm transition-colors ${viewMode === 'preview' ? 'bg-white shadow-sm text-black border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📄 Print Preview
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Canva Style Live Avatars */}
            <div className="flex -space-x-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white z-10 relative group"
                style={{ backgroundColor: userColor }}
                title={`${userName} (You)`}
              >
                {userName.charAt(0)}
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
              </div>
              {collaborators.map((c, i) => (
                <div 
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white relative group"
                  style={{ backgroundColor: c.user.color, zIndex: 9 - i }}
                  title={c.user.name}
                >
                  {c.user.name.charAt(0)}
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={exportDocx} 
              disabled={isExporting}
              className="flex items-center gap-1 bg-[#0078d4] hover:bg-[#106ebe] text-white px-3 py-1 rounded-sm transition-colors"
            >
              {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Export DOCX
            </button>
            <button 
              onClick={onToggleExpand}
              className="p-1 rounded hover:bg-gray-200 text-gray-700"
              title={isExpanded ? "Collapse Editor" : "Expand Editor"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Ribbon Tools (Disabled in Preview Mode) */}
        <div className={`flex items-center px-4 py-2 gap-4 bg-[#f3f2f1] transition-opacity ${viewMode === 'preview' ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Font Group */}
          <div className="flex flex-col border-r border-gray-300 pr-4">
            <div className="flex items-center gap-1 mb-1">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><Bold size={14} /></button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><Italic size={14} /></button>
              <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive('strike') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><Strikethrough size={14} /></button>
              <input 
                type="color" 
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} 
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-6 h-6 p-0 border-0 rounded cursor-pointer ml-1"
                title="Text Color"
              />
            </div>
            <span className="text-[10px] text-center text-gray-500">Font</span>
          </div>

          {/* Paragraph Group */}
          <div className="flex flex-col border-r border-gray-300 pr-4">
            <div className="flex items-center gap-1 mb-1">
              <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><AlignLeft size={14} /></button>
              <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><AlignCenter size={14} /></button>
              <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><AlignRight size={14} /></button>
              <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><AlignJustify size={14} /></button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><List size={14} /></button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`w-7 h-7 flex items-center justify-center rounded ${editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><ListOrdered size={14} /></button>
            </div>
            <span className="text-[10px] text-center text-gray-500">Paragraph</span>
          </div>

          {/* Styles Group */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <button onClick={() => editor.chain().focus().setParagraph().run()} className={`px-2 h-7 flex items-center justify-center rounded text-xs font-serif ${editor.isActive('paragraph') ? 'bg-blue-100 border border-blue-400' : 'bg-white border border-gray-300 hover:bg-gray-100'}`}>Normal</button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 h-7 flex items-center justify-center rounded text-xs font-serif font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 border border-blue-400' : 'bg-white border border-gray-300 hover:bg-gray-100'}`}>Title</button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 h-7 flex items-center justify-center rounded text-xs font-serif font-bold uppercase ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 border border-blue-400' : 'bg-white border border-gray-300 hover:bg-gray-100'}`}>Heading</button>
            </div>
            <span className="text-[10px] text-center text-gray-500">Styles</span>
          </div>
        </div>
      </div>
      
      {/* Editor Page Wrapper — paginated, each page is fixed A4 height with 2 columns */}
      <div className="flex-1 overflow-y-auto py-8 flex flex-col items-center bg-[#f0f0f0] gap-6">
        <style>{`
          /* Each A4 page is a fixed-size box. Two-column CSS fills left col first, then right col. */
          .ieee-page {
            width: 21cm;
            height: 29.7cm;
            background: #fff;
            box-shadow: 0 4px 20px rgba(0,0,0,0.18);
            box-sizing: border-box;
            padding: 2.2cm 1.8cm;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .ieee-page-inner {
            flex: 1;
            column-count: 2;
            column-gap: 0.8cm;
            column-rule: 1px solid #d1d5db;
            column-fill: auto;
            height: 100%;
            overflow: hidden;
          }
          /* Title block spans both columns */
          .ieee-page-inner .ieee-title-block {
            column-span: all;
            margin-bottom: 10pt;
          }
          .ieee-page-inner h1, .ieee-page-inner [style*='22pt'], .ieee-page-inner [style*='font-size:22'] {
            column-span: all;
            text-align: center;
            font-size: 18pt !important;
            font-weight: bold;
            margin-bottom: 6pt;
            font-family: 'Times New Roman', serif;
            line-height: 1.2;
          }
          .ieee-page-inner h2 {
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin: 10pt 0 4pt 0;
            break-before: avoid;
          }
          .ieee-page-inner p {
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
            text-align: justify;
            margin: 0 0 5pt 0;
            line-height: 1.2;
          }
          .ieee-page-inner em { font-style: italic; }
          .ieee-page-inner strong { font-weight: bold; }
          .ieee-page-inner table {
            column-span: all;
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            font-family: 'Times New Roman', serif;
            margin: 8pt 0;
          }
          .ieee-page-inner th, .ieee-page-inner td {
            border: 1px solid #555;
            padding: 3pt 6pt;
            text-align: center;
          }
          .ieee-page-inner th { background: #f0f0f0; font-weight: bold; }
          .ieee-page-inner pre.mermaid {
            column-span: all;
            background: #fafafa;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 8pt;
            font-size: 8pt;
            overflow: hidden;
          }
          /* Draft Mode Editor Styling */
          .draft-container {
            width: 21cm;
            min-height: 29.7cm;
            background: #fff;
            box-shadow: 0 4px 20px rgba(0,0,0,0.18);
            box-sizing: border-box;
            padding: 2.5cm;
            margin-bottom: 2cm;
          }
          .draft-container .ProseMirror {
            outline: none;
            min-height: 100%;
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.5;
            text-align: justify;
          }
          .draft-container .ProseMirror h1 {
            text-align: center;
            font-size: 18pt !important;
            font-weight: bold;
            margin-bottom: 12pt;
          }
          .draft-container .ProseMirror h2 {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin: 14pt 0 6pt 0;
          }
          .draft-container .ProseMirror p {
            margin: 0 0 8pt 0;
            text-indent: 14pt;
          }
          .draft-container .ProseMirror table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin: 12pt 0;
          }
          .draft-container .ProseMirror th, .draft-container .ProseMirror td {
            border: 1px solid #555;
            padding: 4pt 8pt;
            text-align: center;
          }
          .draft-container .ProseMirror th { background: #f0f0f0; font-weight: bold; }
          .draft-container .ProseMirror p.is-editor-empty:first-child::before { display: none; }
        `}</style>

        {viewMode === 'preview' ? (
          /* Paginator view */
          <IEEEPaginatedView html={editorHtml} />
        ) : (
          /* Live Editor */
          <div className="draft-container">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </div>
  );
}
