// frontend/src/pages/InfoDashboard.jsx
import React from 'react';

export default function InfoDashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Information Center</h1>
          <p className="text-gray-600 mt-2">Documentation, help, and system information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Information</h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Framework:</strong> Django + React</p>
              <p><strong>Database:</strong> SQLite</p>
              <p><strong>Authentication:</strong> Azure AD</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a href="#" className="block text-gseblue hover:text-gselightblue">📖 User Guide</a>
              <a href="#" className="block text-gseblue hover:text-gselightblue">🎥 Video Tutorials</a>
              <a href="#" className="block text-gseblue hover:text-gselightblue">❓ FAQ</a>
              <a href="#" className="block text-gseblue hover:text-gselightblue">📞 Support</a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">ℹ️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Help Center Coming Soon</h2>
          <p className="text-gray-600">Full documentation and help resources are under development</p>
        </div>
      </div>
    </div>
  );
}
