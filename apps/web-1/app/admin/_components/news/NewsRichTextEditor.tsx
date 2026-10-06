'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import ImageExtension from '@tiptap/extension-image';
import { RichTextEditor } from '@mantine/tiptap';
import { Skeleton, Modal, TextInput, Button, Group } from '@mantine/core';
import { Image as ImageIcon } from 'lucide-react';

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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageError, setImageError] = useState('');

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Highlight,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ImageExtension.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
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

  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      setImageError('Vui lòng nhập URL hình ảnh');
      return;
    }
    try {
      const url = new URL(imageUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        setImageError('URL hình ảnh phải bắt đầu bằng http:// hoặc https://');
        return;
      }
    } catch {
      setImageError('URL hình ảnh không hợp lệ');
      return;
    }

    editor.chain().focus().setImage({ src: imageUrl.trim(), alt: imageAlt.trim() }).run();
    setImageUrl('');
    setImageAlt('');
    setImageError('');
    setImageModalOpen(false);
  };

  return (
    <div className="news-editor-container">
      {/* Modal chèn hình ảnh vào nội dung */}
      <Modal
        opened={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setImageError('');
        }}
        title="Chèn hình ảnh vào bài viết"
        centered
        size="md"
      >
        <div className="space-y-4">
          <TextInput
            label="URL hình ảnh"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.currentTarget.value);
              setImageError('');
            }}
            error={imageError}
            withAsterisk
          />
          <TextInput
            label="Mô tả ảnh / Chú thích (Alt text)"
            placeholder="Ví dụ: Đồ thị tăng trưởng người dùng 2025"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.currentTarget.value)}
          />
          {imageUrl && !imageError && (
            <div className="mt-2 border border-border-app rounded-md overflow-hidden bg-surface-soft p-2">
              <p className="text-xs text-text-muted mb-1 font-medium">Xem trước:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-48 max-w-full mx-auto object-contain rounded"
                onError={() => setImageError('Không thể tải ảnh từ URL này. Vui lòng kiểm tra lại link.')}
              />
            </div>
          )}
          <Group justify="flex-end" gap="sm" pt="xs">
            <Button
              variant="default"
              onClick={() => {
                setImageModalOpen(false);
                setImageError('');
              }}
            >
              Hủy
            </Button>
            <Button color="brand" onClick={handleInsertImage}>
              Chèn ảnh
            </Button>
          </Group>
        </div>
      </Modal>

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
        .news-editor-container .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.75rem 0 !important;
        }
        .news-editor-container .ProseMirror ul ul {
          list-style-type: circle !important;
        }
        .news-editor-container .ProseMirror ul ul ul {
          list-style-type: square !important;
        }
        .news-editor-container .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.75rem 0 !important;
        }
        .news-editor-container .ProseMirror li {
          margin-bottom: 0.35rem !important;
          display: list-item !important;
        }
        .news-editor-container .ProseMirror li > p {
          margin: 0 !important;
        }
        .news-editor-container .ProseMirror blockquote {
          border-left: 3px solid #288ad6 !important;
          padding-left: 1rem !important;
          margin: 1rem 0 !important;
          font-style: italic;
          color: #64748b;
        }
        .news-editor-container .ProseMirror h2 {
          font-size: 1.375rem !important;
          font-weight: 700 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
        }
        .news-editor-container .ProseMirror h3 {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
        }
        .news-editor-container .ProseMirror h4 {
          font-size: 1.125rem !important;
          font-weight: 700 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
        }
        .news-editor-container .ProseMirror hr {
          margin: 1.5rem 0 !important;
          border: 0 !important;
          border-top: 1px solid var(--color-border-app, #e2e8f0) !important;
        }
        .news-editor-container .ProseMirror pre {
          background-color: var(--color-surface-soft, #f1f5f9);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-family: monospace;
          font-size: 0.875rem;
          margin: 1rem 0;
        }
        .news-editor-container .ProseMirror code {
          background-color: var(--color-surface-soft, #f1f5f9);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        .news-editor-container .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
        .news-editor-container .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
          border: 1px solid var(--color-border-app, #e2e8f0);
        }
      `}</style>
      <RichTextEditor editor={editor} className={`border rounded-xl overflow-hidden bg-surface-app ${error ? 'border-red-500' : 'border-border-app'}`}>
        <RichTextEditor.Toolbar className="bg-surface-soft border-b border-border-app flex flex-wrap gap-1 p-1">
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Code />
            <RichTextEditor.Highlight />
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignRight />
            <RichTextEditor.AlignJustify />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Blockquote />
            <RichTextEditor.CodeBlock />
            <RichTextEditor.Hr />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
            <RichTextEditor.Control
              onClick={() => {
                setImageUrl('');
                setImageAlt('');
                setImageError('');
                setImageModalOpen(true);
              }}
              aria-label="Chèn hình ảnh vào bài viết"
              title="Chèn hình ảnh"
            >
              <ImageIcon size={15} strokeWidth={2} />
            </RichTextEditor.Control>
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
