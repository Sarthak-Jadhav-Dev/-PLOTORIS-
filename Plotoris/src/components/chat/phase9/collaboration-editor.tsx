"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const getRandomName = () => 'Researcher ' + Math.floor(Math.random() * 100);

export function CollaborationEditor({ projectId, initialDraft }: { projectId: string, initialDraft?: string }) {
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [userName] = useState(getRandomName());
  const [userColor] = useState(getRandomColor());
  
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  useEffect(() => {
    // We use a public signaling server for demonstration. In production, host your own!
    const roomName = `plotoris-draft-${projectId}`;
    const webrtcProvider = new WebrtcProvider(roomName, ydoc, { signaling: ['wss://signaling.yjs.dev'] });
    setProvider(webrtcProvider);
    return () => {
      webrtcProvider.destroy();
    };
  }, [projectId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // history is handled by Y.js
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
      // Only include cursor extension if provider is ready
      ...(provider ? [
        CollaborationCursor.configure({
          provider: provider as any,
          user: { name: userName, color: userColor },
        })
      ] : []),
    ],
    // Let Y.js handle the initial content sync across peers
  });

  useEffect(() => {
    if (editor && initialDraft) {
      // If the editor is empty (just a single empty paragraph), populate it with the AI draft.
      // In a real CRDT environment, you'd want to be careful about overwriting peers.
      const currentText = editor.getText();
      if (currentText.trim() === '') {
        editor.commands.setContent(initialDraft);
      }
    }
  }, [editor, initialDraft]);

  if (!editor || !provider) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Connecting to secure WebRTC collaboration room...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#e5e7eb] text-black font-serif overflow-hidden relative">
      <style>{`
        /* Minimal Cursor styling for CollaborationCursor */
        .collaboration-cursor__caret {
          border-left: 2px solid #0d0d0d;
          border-right: 2px solid #0d0d0d;
          margin-left: -2px;
          margin-right: -2px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }
        .collaboration-cursor__label {
          border-radius: 3px 3px 3px 0;
          color: #0d0d0d;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          left: -2px;
          line-height: normal;
          padding: 2px 4px;
          position: absolute;
          top: -1.5em;
          user-select: none;
          white-space: nowrap;
        }
      `}</style>
      
      {/* Editor Toolbar */}
      <div className="bg-white border-b border-gray-300 p-2 flex gap-2 shrink-0 shadow-sm z-10 sticky top-0 items-center">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className="w-8 h-8 flex items-center justify-center rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 font-bold text-gray-700">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className="w-8 h-8 flex items-center justify-center rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 italic text-gray-700">I</button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="px-3 h-8 flex items-center justify-center rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 text-sm font-semibold text-gray-700">H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="px-3 h-8 flex items-center justify-center rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 text-sm font-semibold text-gray-700">H2</button>
        <div className="ml-auto text-xs flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live IEEE Format
        </div>
      </div>
      
      {/* Editor Page Wrapper */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        {/* The Paper */}
        <div className="bg-white shadow-lg w-full max-w-[21cm] min-h-[29.7cm] p-10 md:p-16 border border-gray-200">
          <EditorContent 
            editor={editor} 
            className="prose prose-sm md:prose-base max-w-none focus:outline-none 
              prose-headings:font-bold prose-headings:font-serif
              prose-h1:text-center prose-h1:text-3xl prose-h1:mb-8
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-p:leading-relaxed prose-p:text-justify prose-p:font-serif
              min-h-[500px]" 
          />
        </div>
      </div>
    </div>
  );
}
