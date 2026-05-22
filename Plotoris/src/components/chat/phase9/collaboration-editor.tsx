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

export function CollaborationEditor({ projectId, initialDraft, isExpanded, onToggleExpand }: CollaborationEditorProps) {
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [userName] = useState(getRandomName());
  const [userColor] = useState(getRandomColor());
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const mermaidRef = useRef<typeof mermaid | null>(null);

  // Initialize Mermaid on mount (dynamic import to avoid SSR issues)
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
  
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  useEffect(() => {
    const roomName = `plotoris-ieee-draft-${projectId}`;
    const webrtcProvider = new WebrtcProvider(roomName, ydoc, { signaling: ['wss://signaling.yjs.dev'] });
    setProvider(webrtcProvider);

    webrtcProvider.awareness.on('change', () => {
      const states = Array.from(webrtcProvider.awareness.getStates().values());
      // Filter out ourselves
      const others = states.filter(s => s.user && s.user.name !== userName);
      setCollaborators(others);
    });

    return () => {
      webrtcProvider.destroy();
    };
  }, [projectId, ydoc, userName]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      } as any),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Collaboration.configure({
        document: ydoc,
      }),
      ...(provider ? [
        CollaborationCursor.configure({
          provider: provider as any,
          user: { name: userName, color: userColor },
        })
      ] : []),
    ],
  });

  useEffect(() => {
    if (editor && initialDraft) {
      const currentText = editor.getText();
      if (currentText.trim() === '') {
        editor.commands.setContent(initialDraft);
      }
    }
  }, [editor, initialDraft]);

  // Re-render Mermaid diagrams when draft content changes
  useEffect(() => {
    if (!mermaidRef.current || !initialDraft) return;
    // Small delay to let the editor DOM settle
    const timer = setTimeout(async () => {
      try {
        await mermaidRef.current!.run();
      } catch (e) {
        // Mermaid render errors are non-fatal
        console.warn('Mermaid render warning:', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [initialDraft]);

  const exportDocx = async () => {
    if (!editor) return;
    setIsExporting(true);
    try {
      const html = editor.getHTML();
      const response = await fetch('/api/phase9/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      saveAs(blob, `IEEE_Draft_${projectId}.docx`);
    } catch (e) {
      console.error(e);
      alert("Failed to export DOCX");
    } finally {
      setIsExporting(false);
    }
  };

  if (!editor || !provider) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Connecting to secure WebRTC IEEE workspace...</p>
      </div>
    );
  }

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
          <div className="flex space-x-4">
            <span className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-1 cursor-pointer">Home</span>
            <span className="text-gray-600 hover:text-black cursor-pointer pb-1">Insert</span>
            <span className="text-gray-600 hover:text-black cursor-pointer pb-1">Layout</span>
            <span className="text-gray-600 hover:text-black cursor-pointer pb-1">References</span>
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

        {/* Ribbon Tools */}
        <div className="flex items-center px-4 py-2 gap-4 bg-[#f3f2f1]">
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
      
      {/* Editor Page Wrapper */}
      <div className="flex-1 overflow-y-auto py-8 flex justify-center bg-[#f0f0f0]">
        {/* The Paper */}
        <div className="paper-background border border-gray-300">
          <EditorContent 
            editor={editor} 
            className="ieee-format w-full outline-none focus:outline-none" 
          />
        </div>
      </div>
    </div>
  );
}
