import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white sm:rounded-lg sm:shadow-md px-8 py-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-red-600">Myntra</h1>
          </div>

          {/* Main Content */}
          <div className="mb-6">
            {children}
          </div>

          {/* Footer Links */}
          <div className="text-center text-sm text-gray-600">
            <p>
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-red-600 hover:text-red-500">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-red-600 hover:text-red-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;