import React from 'react';
import { isSafeHttpUrl } from '@repo/validation';

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

function renderMarks(text: string, marks?: TipTapMark[]): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  let element: React.ReactNode = text;
  for (const mark of marks) {
    if (mark.type === 'bold') {
      element = <strong className="font-semibold text-text-app">{element}</strong>;
    } else if (mark.type === 'italic') {
      element = <em className="italic">{element}</em>;
    } else if (mark.type === 'strike') {
      element = <s className="line-through">{element}</s>;
    } else if (mark.type === 'underline') {
      element = <u className="underline underline-offset-2">{element}</u>;
    } else if (mark.type === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
      if (isSafeHttpUrl(href)) {
        element = (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline font-medium inline-flex items-center gap-0.5"
          >
            {element}
          </a>
        );
      }
    }
  }
  return element;
}

function renderNode(node: TipTapNode, index: number): React.ReactNode {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'text') {
    return (
      <React.Fragment key={index}>
        {renderMarks(node.text || '', node.marks)}
      </React.Fragment>
    );
  }

  const children = node.content?.map((child, i) => renderNode(child, i));

  switch (node.type) {
    case 'doc':
      return <div key={index} className="news-prose space-y-4">{children}</div>;
    case 'paragraph':
      return (
        <p key={index} className="text-base sm:text-lg leading-relaxed text-text-app/90 mb-5">
          {children && children.length > 0 ? children : <br />}
        </p>
      );
    case 'heading': {
      const level = node.attrs?.level === 3 ? 3 : 2;
      if (level === 3) {
        return (
          <h3 key={index} className="text-xl font-semibold tracking-tight text-text-app mt-8 mb-3">
            {children}
          </h3>
        );
      }
      return (
        <h2 key={index} className="text-2xl sm:text-3xl font-bold tracking-tight text-text-app mt-10 mb-4">
          {children}
        </h2>
      );
    }
    case 'bulletList':
      return (
        <ul key={index} className="list-disc pl-6 my-4 space-y-2 text-text-app/90">
          {children}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={index} className="list-decimal pl-6 my-4 space-y-2 text-text-app/90">
          {children}
        </ol>
      );
    case 'listItem':
      return <li key={index} className="leading-relaxed">{children}</li>;
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-brand pl-4 py-1 italic text-text-muted my-6">
          {children}
        </blockquote>
      );
    case 'horizontalRule':
      return <hr key={index} className="border-border-app my-8" />;
    case 'hardBreak':
      return <br key={index} />;
    default:
      return null;
  }
}

export function NewsTipTapRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null;
  }
  return <div className="max-w-[720px] mx-auto">{renderNode(content as TipTapNode, 0)}</div>;
}
