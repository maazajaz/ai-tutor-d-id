import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// Suppress MediaPipe WASM module warnings globally
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error
console.error = (...args) => {
  const msg = args[0]?.toString() || '';
  const stack = args[0]?.stack?.toString() || '';
  
  // Filter out MediaPipe/WASM noise
  if (
    msg.includes('Module.arguments') || 
    msg.includes('face_mesh_solution') ||
    msg.includes('assets_loader.js') ||
    msg.includes('simd_wasm_bin.js') ||
    msg.includes('face_mesh_solution_packed_assets') ||
    msg.includes('ERR_INSUFFICIENT_RESOURCES') ||
    msg.includes('gl_context') ||
    msg.includes('Maximum update depth exceeded') ||
    msg.includes('Cannot read properties of undefined') && msg.includes('cdn.jsdelivr.net') ||
    stack.includes('face_mesh') ||
    stack.includes('mediapipe')
  ) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn for MediaPipe warnings
console.warn = (...args) => {
  const msg = args[0]?.toString() || '';
  const stack = new Error().stack || '';
  
  if (
    msg.includes('Module.arguments') ||
    msg.includes('face_mesh') ||
    msg.includes('mediapipe') ||
    msg.includes('Assertion failed') ||
    msg.includes('gl_context') ||
    msg.includes('GL version') ||
    msg.includes('OpenGL') ||
    stack.includes('face_mesh_solution') ||
    stack.includes('simd_wasm_bin')
  ) {
    return; // Suppress these warnings
  }
  originalConsoleWarn.apply(console, args);
};

// Suppress unhandled errors from MediaPipe
window.addEventListener('error', (e) => {
  if (
    e.message?.includes('Module.arguments') ||
    e.message?.includes('face_mesh') ||
    e.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
    e.message?.includes('gl_context') ||
    e.filename?.includes('face_mesh') ||
    e.filename?.includes('mediapipe') ||
    e.message?.includes('face_mesh_solution_packed_assets')
  ) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AuthProvider>
  </React.StrictMode>
);
