// frontend/src/pages/Login.jsx
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

export default function Login() {
  const { instance } = useMsal();

  const handleLogin = () => {
    // Use redirect flow
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error("Login failed:", e);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gseblue to-gselightblue">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          {/* GSE Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="GSE Logo"
              className="h-24 w-auto"
            />
          </div>
          <p className="text-gray-600 text-lg">Sign in to continue</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gseblue hover:text-gseblue transition-all duration-200 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Sign in with Microsoft
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Use your Office 365 account to sign in
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Powered by GSE Technology Solutions
          </p>
        </div>
      </div>
    </div>
  );
}