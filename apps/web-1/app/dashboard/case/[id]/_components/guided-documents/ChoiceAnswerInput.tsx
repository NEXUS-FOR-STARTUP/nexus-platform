"use client";

import { useState } from "react";
import { Radio, Stack, TextInput } from "@mantine/core";
import {
  MAX_OTHER_TEXT_LENGTH,
  OTHER_CHOICE_VALUE,
  parseChoice,
  serializeChoice,
  type Question,
} from "@repo/validation";

interface ChoiceAnswerInputProps {
  question: Question;
  /** Stored answer string (serialized choice, or "" when nothing is chosen). */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Radio group with an optional "Khác" text field. "Khác" with an empty field emits "" (no answer),
 * so an unfinished choice is never stored; `pick` keeps the radio selected meanwhile.
 * Remount with `key={question.id}` when the question changes.
 */
export default function ChoiceAnswerInput({ question, value, onChange }: ChoiceAnswerInputProps) {
  const stored = parseChoice(value, question);
  const [pick, setPick] = useState<string | null>(stored?.value ?? null);
  const [otherText, setOtherText] = useState(stored?.otherText ?? "");

  const emit = (nextPick: string | null, nextOther: string) => {
    if (nextPick === null) return onChange("");
    if (nextPick === OTHER_CHOICE_VALUE) {
      const text = nextOther.trim();
      return onChange(text === "" ? "" : serializeChoice({ value: nextPick, otherText: text }));
    }
    onChange(serializeChoice({ value: nextPick, otherText: null }));
  };

  return (
    <Radio.Group
      aria-label="Câu trả lời"
      value={pick}
      onChange={(next) => {
        setPick(next);
        emit(next, otherText);
      }}
    >
      <Stack gap="sm">
        {(question.options ?? []).map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} description={option.description} />
        ))}
        {question.allow_other && <Radio value={OTHER_CHOICE_VALUE} label="Khác" />}
        {question.allow_other && pick === OTHER_CHOICE_VALUE && (
          <TextInput
            aria-label="Nội dung mục Khác"
            placeholder="Mô tả ngắn dự án của nhóm"
            maxLength={MAX_OTHER_TEXT_LENGTH}
            value={otherText}
            onChange={(e) => {
              setOtherText(e.currentTarget.value);
              emit(OTHER_CHOICE_VALUE, e.currentTarget.value);
            }}
          />
        )}
      </Stack>
    </Radio.Group>
  );
}
