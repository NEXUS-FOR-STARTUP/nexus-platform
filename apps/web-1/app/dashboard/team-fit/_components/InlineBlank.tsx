"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface InlineBlankProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onBlurField?: () => void;
  hasError?: boolean;
  errorMessage?: string;
}

export default function InlineBlank({
  value,
  onChange,
  placeholder = "nhập...",
  onBlurField,
  hasError,
  errorMessage,
}: InlineBlankProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasText, setHasText] = useState(() => Boolean(value && value.trim()));

  // Sync internal span innerText when value changes externally while not editing
  useEffect(() => {
    if (spanRef.current && !isFocused) {
      const trimmed = value ? value.trim() : "";
      if (trimmed === "") {
        spanRef.current.innerHTML = "";
      } else if (spanRef.current.innerText !== value) {
        spanRef.current.innerText = value;
      }
      setHasText(trimmed.length > 0);
    }
  }, [value, isFocused]);

  const handleInput = useCallback(() => {
    if (spanRef.current) {
      const rawText = spanRef.current.innerText.replace(/[\r\n]+/g, " ");
      const trimmed = rawText.trim();
      setHasText(trimmed.length > 0);
      onChange(rawText);
    }
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      spanRef.current?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " ");
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    selection.deleteFromDocument();
    const textNode = document.createTextNode(text);
    selection.getRangeAt(0).insertNode(textNode);
    selection.collapseToEnd();
    handleInput();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (spanRef.current) {
      const trimmed = spanRef.current.innerText.replace(/[\r\n]+/g, " ").trim();
      onChange(trimmed);
      if (trimmed === "") {
        spanRef.current.innerHTML = "";
        setHasText(false);
      } else {
        spanRef.current.innerText = trimmed;
        setHasText(true);
      }
    }
    onBlurField?.();
  };

  const isEmpty = !hasText;

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      tabIndex={0}
      role="textbox"
      aria-label={placeholder}
      data-placeholder={placeholder}
      data-empty={isEmpty ? "true" : "false"}
      title={
        errorMessage
          ? errorMessage
          : isEmpty
            ? `Nhấp để nhập ${placeholder}`
            : "Nhấp để chỉnh sửa"
      }
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`inline cursor-text outline-none transition-all duration-150 rounded-xs px-1.5 py-0.5 mx-0.5 select-text break-words font-normal [box-decoration-break:clone] [-webkit-box-decoration-break:clone] data-[empty=true]:before:content-[attr(data-placeholder)] data-[empty=true]:before:italic data-[empty=true]:before:pointer-events-none ${
        hasError
          ? isFocused
            ? "bg-danger-soft/40 text-danger ring-2 ring-danger/40 data-[empty=true]:before:text-danger/60"
            : "bg-danger-soft/40 text-danger ring-1 ring-danger/30 data-[empty=true]:before:text-danger/80"
          : isFocused
            ? "bg-brand/10 dark:bg-brand/20 text-brand ring-2 ring-brand/30 underline decoration-brand decoration-2 underline-offset-4 data-[empty=true]:before:text-text-muted/40"
            : isEmpty
              ? "border-b-2 border-dashed border-brand/40 text-text-muted hover:border-brand hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10 data-[empty=true]:before:text-text-muted/70"
              : "text-brand underline decoration-brand/35 decoration-2 underline-offset-4 hover:decoration-brand hover:bg-brand/5 dark:hover:bg-brand/10"
      }`}
    />
  );
}

