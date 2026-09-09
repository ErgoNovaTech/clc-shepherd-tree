import { useEffect } from "react";
import { useTreeStore } from "@/store/useTreeStore";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/** Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) to redo — ignored while typing in a field. */
export function useUndoRedoShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta || isEditableTarget(e.target)) return;

      if (e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        useTreeStore.getState().redo();
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        useTreeStore.getState().undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        useTreeStore.getState().redo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
