"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, Stack, TextInput } from "@mantine/core";
import { MAX_OTHER_TEXT_LENGTH, OTHER_CHOICE_VALUE, type Question } from "@repo/validation";
import { choiceStateFromValue, choiceValueFor, reconcileChoiceState } from "../../../../../../lib/choice-input-state";

interface ChoiceAnswerInputProps {
  question: Question;
  /** Stored answer string (serialized choice, or "" when nothing is chosen). */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Radio group with an optional "Khác" text field. An unfinished "Khác" emits "" (no answer), so local
 * state keeps the radio selected; value changes from outside (late answers, discarded drafts) win.
 */
export default function ChoiceAnswerInput({ question, value, onChange }: ChoiceAnswerInputProps) {
  const [state, setState] = useState(() => choiceStateFromValue(value, question));
  const lastEmitted = useRef(value);

  useEffect(() => {
    setState((current) => reconcileChoiceState(current, value, lastEmitted.current, question));
    lastEmitted.current = value;
  }, [value, question]);

  const update = (pick: string | null, otherText: string) => {
    const next = choiceValueFor(pick, otherText);
    lastEmitted.current = next;
    setState({ pick, otherText });
    onChange(next);
  };

  return (
    <Radio.Group aria-label="Câu trả lời" value={state.pick} onChange={(next) => update(next, state.otherText)}>
      <Stack gap="sm">
        {(question.options ?? []).map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} description={option.description} />
        ))}
        {question.allow_other && <Radio value={OTHER_CHOICE_VALUE} label="Khác" />}
        {question.allow_other && state.pick === OTHER_CHOICE_VALUE && (
          <TextInput
            aria-label="Nội dung mục Khác"
            placeholder="Mô tả ngắn dự án của nhóm"
            maxLength={MAX_OTHER_TEXT_LENGTH}
            value={state.otherText}
            onChange={(e) => update(OTHER_CHOICE_VALUE, e.currentTarget.value)}
          />
        )}
      </Stack>
    </Radio.Group>
  );
}
