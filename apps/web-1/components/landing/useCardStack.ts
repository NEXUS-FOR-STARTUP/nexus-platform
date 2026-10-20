"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

/** Pointer travel (px) below which a press counts as a click, not a drag. */
export const DRAG_MIN = 6;
/** Release farther than this (px) flings the card away; shorter snaps back. */
export const FLING_MIN = 90;
/** Duration (ms) of the fly-out before the card tucks under the stack. */
export const OUT_MS = 320;
/** Extra lock (ms) after the card is placed back, so rapid clicks cannot skip cards. */
export const LOCK_MS = 450;
/** Offset (px) of each card behind the top one (up and to the right). */
export const STACK_OFFSET_PX = 14;
/** Share of the stack that must be visible before the intro plays. */
const INTRO_VISIBLE_RATIO = 0.4;
/** How long (ms) the one-time "draggable" nudge stays armed after the pile opens. */
const INTRO_NUDGE_MS = 1800;
/** Fly-out direction for click/keyboard: left and slightly down. */
export const FLY_VECTOR = { x: -1, y: 0.35 } as const;
/** Fly-out distance as a share of the stack width. */
export const FLY_DISTANCE_RATIO = 0.8;
/** Card tilt (deg) while flying out. */
export const FLY_ROTATE_DEG = 8;
/** Card tilt (deg) per px of horizontal drag. */
export const DRAG_ROTATE_PER_PX = 0.04;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const noopUnsubscribe = () => undefined;
const subscribeNever = () => noopUnsubscribe;

interface Flight {
  index: number;
  x: number;
  y: number;
  rotate: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
}

const move = (x: number, y: number, rotate: number) => `translate(${x}px, ${y}px) rotate(${rotate}deg)`;

/**
 * Shared behaviour of a draggable card stack: click/drag/keyboard moves the top card to the
 * back. `ready` is false on the server and before hydration, so the no-JS markup stays a plain
 * vertical list; cards only become a stack once this hook has run in the browser.
 */
export function useCardStack(count: number, hasLinks: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: count }, (_, i) => i));
  const [flight, setFlight] = useState<Flight | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const reducedRef = useRef(false);
  const busyRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const timersRef = useRef<number[]>([]);
  const [intro, setIntro] = useState<"pending" | "fan" | "done">("pending");

  // Intro: the pile opens once when it scrolls into view, then the top card nudges to show it can be dragged.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      setIntro("done");
      return;
    }
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setIntro("fan");
        timer = window.setTimeout(() => setIntro("done"), INTRO_NUDGE_MS);
      },
      { threshold: INTRO_VISIBLE_RATIO },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => {
      reducedRef.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    const timers = timersRef.current;
    return () => {
      query.removeEventListener("change", sync);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const fly = useCallback(
    (vx: number, vy: number) => {
      const top = order[0];
      if (busyRef.current || count < 2 || top === undefined) return;
      busyRef.current = true;
      const length = Math.hypot(vx, vy) || 1;
      const distance = (rootRef.current?.offsetWidth ?? 0) * FLY_DISTANCE_RATIO;
      const outMs = reducedRef.current ? 0 : OUT_MS;
      setDrag(null);
      setFlight({
        index: top,
        x: (vx / length) * distance,
        y: (vy / length) * distance,
        rotate: vx < 0 ? -FLY_ROTATE_DEG : FLY_ROTATE_DEG,
      });
      setOrder((current) => {
        const [head, ...rest] = current;
        return head === undefined ? current : [...rest, head];
      });
      timersRef.current.push(
        window.setTimeout(() => {
          setFlight(null);
          timersRef.current.push(
            window.setTimeout(() => {
              busyRef.current = false;
            }, outMs ? LOCK_MS : 0),
          );
        }, outMs),
      );
    },
    [count, order],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    const card = target.closest("[data-stack-card]");
    if (busyRef.current || e.button !== 0 || target.closest("a") || card?.getAttribute("data-top") !== "true") return;
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || e.pointerId !== state.pointerId) return;
    state.dx = e.clientX - state.startX;
    state.dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(state.dx, state.dy) > DRAG_MIN) state.moved = true;
    if (state.moved) setDrag({ dx: state.dx, dy: state.dy });
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || e.pointerId !== state.pointerId) return;
    dragRef.current = null;
    if (e.type === "pointercancel") setDrag(null);
    else if (!state.moved) fly(FLY_VECTOR.x, FLY_VECTOR.y);
    else if (Math.hypot(state.dx, state.dy) > FLING_MIN) fly(state.dx, state.dy);
    else setDrag(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("a")) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowLeft") {
      e.preventDefault();
      fly(FLY_VECTOR.x, FLY_VECTOR.y);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      fly(-FLY_VECTOR.x, FLY_VECTOR.y);
    }
  };

  const rootProps = {
    "data-js": ready,
    "data-intro": intro,
    // Cards with their own links keep them clickable, so the stack itself takes keyboard focus.
    tabIndex: ready && hasLinks ? 0 : undefined,
    style: { "--lp-stack-offset": `${STACK_OFFSET_PX}px` } as CSSProperties,
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onKeyDown,
  };

  const getCardProps = (index: number, ariaLabel: string) => {
    if (!ready) return {};
    const position = order.indexOf(index);
    const isTop = position === 0;
    const flying = flight?.index === index;
    const dragging = isTop && drag !== null && !flying;
    let transform: string | undefined;
    if (flying && flight) transform = move(flight.x, flight.y, flight.rotate);
    else if (dragging && drag) transform = move(drag.dx, drag.dy, drag.dx * DRAG_ROTATE_PER_PX);
    return {
      "data-stack-card": "",
      "data-top": isTop,
      "data-dragging": dragging,
      style: { "--i": position, zIndex: flying ? count + 1 : count - position, transform } as CSSProperties,
      "aria-hidden": !isTop,
      inert: !isTop,
      ...(hasLinks ? {} : { role: "button", tabIndex: isTop ? 0 : -1, "aria-label": isTop ? ariaLabel : undefined }),
    };
  };

  const topIndex = order[0] ?? 0;
  return { rootRef, rootProps, getCardProps, topIndex, ready };
}
