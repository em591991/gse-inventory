// frontend/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import "./index.css";
import App from "./App.jsx";
import axiosClient from "./api/axiosClient";

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect promise
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().then(async (response) => {
    if (response && response.account) {
      // User just logged in via redirect
      console.log("Login successful, exchanging token...");
      
      try {
        // Get the access token
        const tokenResponse = await msalInstance.acquireTokenSilent({
          scopes: ["User.Read"],
          account: response.account,
        });

        // Exchange Microsoft token with our backend
        const backendResponse = await axiosClient.post("/users/auth/microsoft/", {
          access_token: tokenResponse.accessToken,
        });

        const { access_token, refresh_token, user } = backendResponse.data;

        // Store tokens
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("user", JSON.stringify(user));

        console.log("Authentication complete!");
        
        // Redirect to home page after storing tokens
        window.location.href = "/";
      } catch (error) {
        console.error("Token exchange failed:", error);
      }
    }
  }).catch((error) => {
    console.error("Redirect handling failed:", error);
  });
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </MsalProvider>
  </StrictMode>
);