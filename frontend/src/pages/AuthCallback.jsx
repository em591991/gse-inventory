// frontend/src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function AuthCallback() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          console.error("No authorization code found");
          navigate("/login");
          return;
        }

        // Send code to backend to exchange for JWT tokens
        const response = await axiosClient.post("/users/auth/microsoft/", {
          code: code,
        });

        const { access_token, refresh_token, user } = response.data;

        // Store tokens in localStorage
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("user", JSON.stringify(user));

        // Redirect to dashboard
        navigate("/");
      } catch (error) {
        console.error("Authentication failed:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, [instance, accounts, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}