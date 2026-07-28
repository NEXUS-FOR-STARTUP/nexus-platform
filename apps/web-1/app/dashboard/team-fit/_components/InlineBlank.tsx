"use client";

import React, { useState, useRef, useEffect } from "react";

interface InlineBlankProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onBlurField?: () => void;
  hasError?: boolean;
}

export default function InlineBlank({
  value,
  onChange,
  placeholder = "nhập...",
  onBlurField,
  hasError,
}: InlineBlankProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal span innerText when value changes externally while not editing
  useEffect(() => {
    if (spanRef.current && !isFocused) {
      const trimmed = value ? value.trim() : "";
      if (trimmed === "") {
        spanRef.current.innerHTML = "";
      } else if (spanRef.current.innerText !== value) {
        spanRef.current.innerText = value;
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (spanRef.current) {
      const rawText = spanRef.current.innerText.replace(/[\r\n]+/g, " ");
      if (rawText.trim() === "" && spanRef.current.innerHTML !== "") {
        spanRef.current.innerHTML = "";
      }
      onChange(rawText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      spanRef.current?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " ");
    document.execCommand("insertText", false, text);
  };

  const isEmpty = !value || value.trim() === "";

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      title={isEmpty ? "Nhấp để nhập" : "Nhấp để chỉnh sửa"}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        if (spanRef.current) {
          const trimmed = spanRef.current.innerText.replace(/[\r\n]+/g, " ").trim();
          onChange(trimmed);
          if (trimmed === "") {
            spanRef.current.innerHTML = "";
          } else {
            spanRef.current.innerText = trimmed;
          }
        }
        onBlurField?.();
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`inline cursor-text outline-none transition-all rounded-xs px-1.5 py-0.5 mx-0.5 break-words ${
        hasError && !isFocused
          ? "border-b-2 border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
          : isEmpty && !isFocused
          ? "border-b-2 border-dashed border-border-app text-text-muted bg-transparent hover:border-brand hover:text-brand empty:before:content-[attr(data-placeholder)] empty:before:italic"
          : isFocused
          ? "border-b-2 border-brand bg-brand/15 text-brand empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-text-muted"
          : "border-b-2 border-brand/50 text-brand hover:border-brand hover:bg-brand/10"
      }`}
    />
  );
}
