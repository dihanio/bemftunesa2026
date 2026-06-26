'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect } from 'react';

interface SuratEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

const ToolbarButton = ({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded text-sm border transition-colors cursor-pointer ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

export default function SuratEditor({
  content, onChange, editable = true,
}: SuratEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content when template changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
          {/* Text style */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline"
          >
            <span className="underline">U</span>
          </ToolbarButton>

          <span className="w-px bg-gray-300 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <span className="w-px bg-gray-300 mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            ≡←
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            ≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            ≡→
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            ☰
          </ToolbarButton>

          <span className="w-px bg-gray-300 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            •—
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered List"
          >
            1—
          </ToolbarButton>

          <span className="w-px bg-gray-300 mx-1" />

          {/* Table */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            title="Insert Table"
          >
            ⊞
          </ToolbarButton>

          <span className="w-px bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            ↩
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            ↪
          </ToolbarButton>
        </div>
      )}

      {/* Editor area — A4 paper style */}
      <div className="bg-gray-100 p-6 min-h-[600px] overflow-x-auto">
        <div
          className="bg-white shadow-md mx-auto print-container relative"
          style={{ width: '210mm', minHeight: '297mm', padding: '0 20mm 15mm 20mm', display: 'flex', flexDirection: 'column' }}
        >
          {/* KOP Header — centered at top */}
          <div style={{ textAlign: 'center', marginBottom: '6mm', marginLeft: '-15mm', marginRight: '-15mm' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/KOP.png"
              alt="Kop Surat BEM FT UNESA"
              style={{ width: '100%', maxWidth: '200mm', height: 'auto', margin: '0 auto', display: 'block' }}
              draggable={false}
            />
          </div>

          {/* Content area */}
          <div style={{ flex: 1 }}>
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none text-black focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200mm]"
            />
          </div>

          {/* Footer — left aligned at bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '8mm' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/footer.jpg"
              alt="Footer BEM FT UNESA"
              style={{ height: '8mm', width: 'auto', display: 'block' }}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
