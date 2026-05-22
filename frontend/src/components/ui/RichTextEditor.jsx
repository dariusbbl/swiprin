import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import styles from './RichTextEditor.module.css';

const ToolBtn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    className={[styles.btn, active ? styles.btnActive : ''].join(' ')}
    title={title}
  >
    {children}
  </button>
);

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: styles.editorArea },
    },
  });

  if (!editor) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Bold">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Italic">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')} title="Underline">
          <u>U</u>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')} title="Strikethrough">
          <s>S</s>
        </ToolBtn>
        <span className={styles.sep} />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Bullet list">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Ordered list">
          ①
        </ToolBtn>
      </div>

      <EditorContent editor={editor} />

      {editor.isEmpty && (
        <p className={styles.placeholder}>{placeholder}</p>
      )}
    </div>
  );
}
