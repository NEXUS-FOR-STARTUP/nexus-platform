"use client";

import { useRef, type ReactNode } from "react";
import { Accordion } from "@mantine/core";
import { ChevronDown } from "lucide-react";
import s from "./expandable-list.module.css";

export interface ExpandableItem {
  id: string;
  summary: ReactNode;
  children: ReactNode;
}

interface ExpandableListProps {
  items: ExpandableItem[];
  /** Fired with the id of a row that was just opened (lazy fetch hook point). */
  onOpen?: (id: string) => void;
}

export function ExpandableList({ items, onOpen }: ExpandableListProps) {
  const previous = useRef<Set<string>>(new Set());
  const handleChange = (opened: string[]) => {
    const next = new Set(opened);
    if (onOpen) for (const id of opened) if (!previous.current.has(id)) onOpen(id);
    previous.current = next;
  };

  return (
    <Accordion multiple variant="unstyled" chevron={<ChevronDown size={18} />} classNames={s} onChange={handleChange}>
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id}>
          <Accordion.Control>{item.summary}</Accordion.Control>
          <Accordion.Panel>{item.children}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
