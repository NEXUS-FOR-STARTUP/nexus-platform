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
      element = <strong className="font-bold text-text-app">{element}</strong>;
    } else if (mark.type === 'italic') {
      element = <em className="italic">{element}</em>;
    } else if (mark.type === 'strike') {
      element = <s className="line-through">{element}</s>;
    } else if (mark.type === 'underline') {
      element = <u className="underline underline-offset-2">{element}</u>;
    } else if (mark.type === 'code') {
      element = (
        <code className="px-1.5 py-0.5 mx-0.5 rounded bg-surface-soft text-brand font-mono text-[0.85em] border border-border-app">
          {element}
        </code>
      );
    } else if (mark.type === 'highlight') {
      element = (
        <mark className="bg-yellow-200 dark:bg-yellow-900/60 px-1 py-0.5 rounded text-text-app">
          {element}
        </mark>
      );
    } else if (mark.type === 'subscript') {
      element = <sub>{element}</sub>;
    } else if (mark.type === 'superscript') {
      element = <sup>{element}</sup>;
    } else if (mark.type === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
      if (isSafeHttpUrl(href)) {
        element = (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#288ad6] hover:underline font-medium inline-flex items-center gap-0.5"
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
  const textAlign = typeof node.attrs?.textAlign === 'string' ? node.attrs.textAlign : undefined;
  const style = textAlign ? { textAlign: textAlign as React.CSSProperties['textAlign'] } : undefined;

  switch (node.type) {
    case 'doc':
      return <div key={index} className="news-prose font-serif">{children}</div>;
    case 'paragraph':
      return (
        <p
          key={index}
          style={style}
          className="font-serif text-[19px] leading-[1.9] sm:leading-[1.95] text-text-app mb-8 sm:mb-9 tracking-normal"
        >
          {children && children.length > 0 ? children : null}
        </p>
      );
    case 'heading': {
      const level = node.attrs?.level;
      if (level === 4) {
        return (
          <h4
            key={index}
            style={style}
            className="font-sans text-[20px] font-bold text-text-app mt-10 mb-6 tracking-tight leading-snug"
          >
            {children}
          </h4>
        );
      }
      if (level === 3) {
        return (
          <h3
            key={index}
            style={style}
            className="font-sans text-[22px] font-bold text-text-app mt-12 mb-8 sm:mb-9 tracking-tight leading-snug"
          >
            {children}
          </h3>
        );
      }
      return (
        <h2
          key={index}
          style={style}
          className="font-sans text-[22px] font-bold text-text-app mt-14 mb-8 sm:mb-9 tracking-tight leading-snug"
        >
          {children}
        </h2>
      );
    }
    case 'codeBlock':
      return (
        <pre
          key={index}
          className="my-8 p-4 rounded-xl bg-surface-soft border border-border-app overflow-x-auto font-mono text-sm leading-relaxed text-text-app"
        >
          <code>{children}</code>
        </pre>
      );
    case 'bulletList':
      return (
        <ul
          key={index}
          className="font-serif list-disc pl-6 my-8 space-y-4 text-[19px] leading-[1.9] text-text-app"
        >
          {children}
        </ul>
      );
    case 'orderedList':
      return (
        <ol
          key={index}
          className="font-serif list-decimal pl-6 my-8 space-y-4 text-[19px] leading-[1.9] text-text-app"
        >
          {children}
        </ol>
      );
    case 'listItem':
      return <li key={index} className="leading-relaxed pl-1 mb-2">{children}</li>;
    case 'blockquote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-[#3199d5] pl-6 py-1 my-10 font-serif italic text-[19px] leading-[1.9] text-text-app [&>p:last-child]:!mb-0"
        >
          {children}
        </blockquote>
      );
    case 'horizontalRule':
      return <div key={index} className="my-12" />;
    case 'image': {
      const src = typeof node.attrs?.src === 'string' ? node.attrs.src : '';
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : '';
      if (!isSafeHttpUrl(src)) return null;
      return (
        <figure key={index} className="my-10 text-center">
          <img
            src={src}
            alt={alt}
            className="w-full max-w-[700px] mx-auto object-cover border border-border-app"
            loading="lazy"
          />
          {alt && <figcaption className="mt-2 text-xs text-text-muted italic font-serif">{alt}</figcaption>}
        </figure>
      );
    }
    case 'hardBreak':
      return null;
    default:
      return null;
  }
}

export function NewsTipTapRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null;
  }
  return <div className="max-w-[700px] mx-auto">{renderNode(content as TipTapNode, 0)}</div>;
}
