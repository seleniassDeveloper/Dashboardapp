import React from "react";
import { useAuth } from "./AuthProvider.jsx";
import LoginScreen from "./LoginScreen.jsx";

export default function LoginGate({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <LoginScreen />;
  }
  return children;
}
