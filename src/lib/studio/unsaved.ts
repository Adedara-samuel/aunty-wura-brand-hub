"use client";

/* Tiny global flag so Studio navigation can warn about unsaved edits. */
let dirty = false;

export function setUnsaved(value: boolean) {
  dirty = value;
}

export function hasUnsaved() {
  return dirty;
}

/** Use as a link onClick: cancels navigation if the user chooses to stay. */
export function confirmLeave(e: { preventDefault: () => void }) {
  if (dirty && !window.confirm("You have unsaved changes. Leave this page without saving?")) {
    e.preventDefault();
    return false;
  }
  if (dirty) dirty = false;
  return true;
}
