"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Code,
  Minus,
} from "lucide-react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({
  content,
  onChange,
  placeholder = "Start writing your email...",
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-[var(--text-primary)]",
      },
    },
  });

  if (!editor) return null;

  function addLink() {
    const url = window.prompt("Enter URL:");
    if (url && editor) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  function addImage() {
    const url = window.prompt("Enter image URL:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  const btnClass = (active: boolean) =>
    `rounded p-1.5 transition-colors ${
      active
        ? "bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
        : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-secondary)]"
    }`;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1.5">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={btnClass(false)}
          title="Undo"
        >
          <Undo size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={btnClass(false)}
          title="Redo"
        >
          <Redo size={15} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--border-color)]" />

        {/* Headings */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--border-color)]" />

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Underline"
        >
          <UnderlineIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive("strike"))}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive("code"))}
          title="Code"
        >
          <Code size={15} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--border-color)]" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          title="Align left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          title="Align center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          title="Align right"
        >
          <AlignRight size={15} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--border-color)]" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Bullet list"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Ordered list"
        >
          <ListOrdered size={15} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--border-color)]" />

        {/* Link & Image */}
        <button
          type="button"
          onClick={addLink}
          className={btnClass(editor.isActive("link"))}
          title="Insert link"
        >
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className={btnClass(false)}
          title="Insert image"
        >
          <ImageIcon size={15} />
        </button>

        <div className="mx-1 h-5 w-px bg-[var(--border-color)]" />

        {/* Horizontal rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btnClass(false)}
          title="Horizontal rule"
        >
          <Minus size={15} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
