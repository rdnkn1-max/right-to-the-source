import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { NativeAppFrame, bootstrapNativeApp } from "./nativeApp";

bootstrapNativeApp();

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <NativeAppFrame>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </NativeAppFrame>
);
