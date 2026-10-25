const FOCUS_RETRY_FRAMES = 30;

/**
 * Focuses the first answer box. Coming from another tab the editor mounts a few frames
 * later, so retry per animation frame until it exists or the budget runs out.
 */
export function focusFirstAnswer(): void {
  let framesLeft = FOCUS_RETRY_FRAMES;
  const focusEditor = () => {
    const box = document.querySelector<HTMLTextAreaElement>("textarea");
    if (box) box.focus();
    else if (framesLeft-- > 0) requestAnimationFrame(focusEditor);
  };
  requestAnimationFrame(focusEditor);
}
