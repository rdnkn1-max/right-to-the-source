import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const READY_CLASS = "app-ready";
const NATIVE_CLASS = "native-app";
const WEB_CLASS = "web-app";

let didBootstrap = false;
let bounceGuardInstalled = false;

function updateAppHeight() {
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
}

function installGestureGuards() {
  let lastTouchEnd = 0;

  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  ["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
    document.addEventListener(
      eventName,
      (event) => {
        event.preventDefault();
      },
      { passive: false }
    );
  });

  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

function installBounceGuard() {
  if (bounceGuardInstalled) {
    return;
  }

  bounceGuardInstalled = true;

  let startY = 0;
  let startX = 0;

  document.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches?.[0];
      if (!touch) {
        return;
      }

      startY = touch.clientY;
      startX = touch.clientX;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) {
        return;
      }

      if (
        target.closest(
          ".leaflet-container, input, textarea, select, [contenteditable='true'], [data-native-bounce-allow='true']"
        )
      ) {
        return;
      }

      const touch = event.touches?.[0];
      if (!touch) {
        return;
      }

      const deltaY = touch.clientY - startY;
      const deltaX = Math.abs(touch.clientX - startX);

      if (deltaX > Math.abs(deltaY)) {
        return;
      }

      const scrollParent = target.closest("[data-native-scroll='true']") || document.querySelector(".app-shell");

      if (!(scrollParent instanceof HTMLElement)) {
        return;
      }

      const atTop = scrollParent.scrollTop <= 0;
      const atBottom =
        Math.ceil(scrollParent.scrollTop + scrollParent.clientHeight) >=
        scrollParent.scrollHeight;

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}

export function bootstrapNativeApp() {
  if (didBootstrap) {
    return;
  }

  didBootstrap = true;

  updateAppHeight();
  window.addEventListener("resize", updateAppHeight);
  window.addEventListener("orientationchange", updateAppHeight);

  const isNative = Capacitor.isNativePlatform();
  document.documentElement.classList.add(isNative ? NATIVE_CLASS : WEB_CLASS);

  if (isNative) {
    installGestureGuards();
    installBounceGuard();
  }
}

export function hideLaunchScreen() {
  updateAppHeight();
  document.documentElement.classList.add(READY_CLASS);
}

export function NativeAppFrame({ children }) {
  useEffect(() => {
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          hideLaunchScreen();
        }, 140);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
    };
  }, []);

  return (
    <div className="app-shell" data-native-scroll="true">
      {children}
    </div>
  );
}
