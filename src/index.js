import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import MobilePage from "./MobilePage";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/mobile" element={<MobilePage />} />
        {/* ✅ 可选：默认跳转到 /mobile */}
        <Route path="*" element={<Navigate to="/mobile" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
