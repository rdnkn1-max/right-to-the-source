import React, { useEffect } from "react";

export default function TransitionOverlay({
  visible,
  label = "",
  duration = 260,
  soundKey,
  onTriggerSound,
  onComplete,
  children,
}) {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    if (soundKey && typeof onTriggerSound === "function") {
      onTriggerSound(soundKey);
    }

    const timer = window.setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, duration);

    return () => window.clearTimeout(timer);
  }, [visible, duration, soundKey, onTriggerSound, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <div className="app-transition-overlay" aria-hidden="true">
      <div className="app-transition-overlay__backdrop" />
      <div className="app-transition-overlay__pulse" />
      <div className="app-transition-overlay__card">
        {children || <span>{label}</span>}
      </div>
    </div>
  );
}
