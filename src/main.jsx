import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// A built page arrives pre-rendered (scripts/prerender.mjs), so React takes
// over the markup already there. The dev server sends a root holding only the
// prerender placeholder comment, which has no element in it.
const root = document.getElementById("root");
if (root.firstElementChild) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
