'use client';

import React, { useEffect, useMemo } from 'react';
import { useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { RichTextEditor } from '@mantine/tiptap';
import { Skeleton } from '@mantine/core';

interface NewsRichTextEditorProps {
  content: unknown;
  onChange: (json: unknown) => void;
  minHeight?: number;
  error?: string | null;
}

const DEFAULT_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

export function NewsRichTextEditor({
  content,
  onChange,
  minHeight = 400,
  error,
}: NewsRichTextEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    []
  );

  const initialContent = useMemo(() => {
    return (content as JSONContent) || DEFAULT_DOC;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON());
    },
  });

  // Đồng bộ nội dung khi content thay đổi từ bên ngoài (e.g. tải dữ liệu bài viết cũ)
  useEffect(() => {
    if (!editor || !content) return;
    const currentJson = JSON.stringify(editor.getJSON());
    const nextJson = JSON.stringify(content);
    if (currentJson !== nextJson) {
      editor.commands.setContent(content as JSONContent, { emitUpdate: false });
    }
  }, [content, editor]);

  // Tránh render RichTextEditor khi editor chưa khởi tạo (ngăn controls bị kẹt snapshot disabled)
  if (!editor) {
    return <Skeleton height={minHeight} radius="xl" />;
  }

  return (
    <div className="news-editor-container">
      <style>{`
        .news-editor-container .ProseMirror {
          min-height: ${minHeight}px;
          cursor: text;
          outline: none;
          padding: 1rem;
        }
        .news-editor-container .ProseMirror > p:first-child:has(> br:only-child)::before,
        .news-editor-container .ProseMirror > p.is-editor-empty:first-of-type::before {
          content: 'Nhập nội dung bài viết tại đây...';
          color: #9ca3af;
          float: left;
          pointer-events: none;
          height: 0;
        }
      `}</style>
      <RichTextEditor editor={editor} className={`border rounded-xl overflow-hidden bg-surface-app ${error ? 'border-red-500' : 'border-border-app'}`}>
        <RichTextEditor.Toolbar className="bg-surface-soft border-b border-border-app">
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <div
          className="w-full cursor-text"
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.stopPropagation();
          }}
          onClick={() => {
            if (!editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
        >
          <RichTextEditor.Content
            style={{ minHeight: `${minHeight}px` }}
            className="text-text-app"
          />
        </div>
      </RichTextEditor>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
