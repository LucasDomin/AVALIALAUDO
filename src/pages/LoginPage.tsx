import { useEffect, useRef } from "react";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

export default function LoginPage() {
  const btnRef = useRef<HTMLDivElement>(null);

  useGoogleAuth((token) => {
    console.log("Token recebido:", token);
    // aqui você envia para o backend
  });

  useEffect(() => {
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      locale: "pt-BR",
    });
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem" }}>
      <div ref={btnRef} />
    </div>
  );
}