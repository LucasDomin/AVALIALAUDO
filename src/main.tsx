import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";

// Substitua pelo seu CLIENT_ID do Google Cloud Console
const GOOGLE_CLIENT_ID = "172388166776-4rj6oe6npprn3k3e4ftj2k2t3h8fpu6j.apps.googleusercontent.comm";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
