// frontend/src/authConfig.js
export const msalConfig = {
  auth: {
    clientId: "f2ed5934-cb77-4832-80b2-907b66185d73",
    authority: "https://login.microsoftonline.com/386954e0-7e6d-4706-8c42-dd2b0e2e2643",
    redirectUri: "http://localhost:5173",  // Changed this
  },
  cache: {
    cacheLocation: "sessionStorage",  // Changed to sessionStorage
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
