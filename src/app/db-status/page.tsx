'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DbStatus {
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
  error?: string;
  details?: any;
}

export default function DbStatusPage() {
  const router = useRouter();
  const [dbStatus, setDbStatus] = useState<DbStatus>({ status: 'loading', message: 'Checking database connection...' });
  const [isTesting, setIsTesting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and has admin/tester role
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    setUser(user);
    
    // Check if user has admin or tester role
    if (user.role !== 'admin' && user.role !== 'tester') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
    testConnection();
  }, [router]);

  const testConnection = async () => {
    setIsTesting(true);
    setDbStatus({ status: 'loading', message: 'Testing database connection...' });

    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();

      if (response.ok) {
        setDbStatus({
          status: 'success',
          message: data.message,
          data: data.data
        });
      } else {
        setDbStatus({
          status: 'error',
          message: data.message,
          error: data.error,
          details: data.details
        });
      }
    } catch (error) {
      setDbStatus({
        status: 'error',
        message: 'Failed to test database connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white font-sans">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold tracking-wide text-white">
          TenexAI
        </Link>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            Welcome, {user?.first_name} ({user?.role})
          </span>
          <ul className="flex gap-6 text-sm text-gray-300">
            <li>
              <Link href="/dashboard" className="hover:text-white transition duration-200">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-white transition duration-200">
                Profile
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="hover:text-white transition duration-200"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">Database Status</h1>
            <p className="text-gray-400">Check your PostgreSQL database connection</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Connection Status</h2>
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                dbStatus.status === 'success' ? 'bg-green-500' :
                dbStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`font-medium ${
                dbStatus.status === 'success' ? 'text-green-400' :
                dbStatus.status === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {dbStatus.status === 'success' ? 'Connected' :
                 dbStatus.status === 'error' ? 'Connection Failed' : 'Checking...'}
              </span>
            </div>

            {/* Message */}
            <p className="text-gray-300 mb-4">{dbStatus.message}</p>

            {/* Success Data */}
            {dbStatus.status === 'success' && dbStatus.data && (
              <div className="bg-green-900/20 border border-green-500 rounded-md p-4 mb-4">
                <h3 className="text-green-400 font-semibold mb-2">Database Information:</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Current Time:</span> {dbStatus.data.currentTime}</p>
                  <p><span className="text-gray-400">Database Version:</span> {dbStatus.data.dbVersion}</p>
                  <div>
                    <span className="text-gray-400">Connection Pool Status:</span>
                    <ul className="ml-4 mt-1">
                      <li>• Total Connections: {dbStatus.data.poolStatus.totalCount}</li>
                      <li>• Idle Connections: {dbStatus.data.poolStatus.idleCount}</li>
                      <li>• Waiting Connections: {dbStatus.data.poolStatus.waitingCount}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Error Details */}
            {dbStatus.status === 'error' && (
              <div className="bg-red-900/20 border border-red-500 rounded-md p-4">
                <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
                <p className="text-red-300 mb-3">{dbStatus.error}</p>
                
                {dbStatus.details?.checkEnvironmentVariables && (
                  <div>
                    <h4 className="text-red-400 font-medium mb-2">Environment Variables Check:</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">DB_USER:</span> {dbStatus.details.checkEnvironmentVariables.DB_USER}</p>
                      <p><span className="text-gray-400">DB_HOST:</span> {dbStatus.details.checkEnvironmentVariables.DB_HOST}</p>
                      <p><span className="text-gray-400">DB_NAME:</span> {dbStatus.details.checkEnvironmentVariables.DB_NAME}</p>
                      <p><span className="text-gray-400">DB_PASSWORD:</span> {dbStatus.details.checkEnvironmentVariables.DB_PASSWORD}</p>
                      <p><span className="text-gray-400">DB_PORT:</span> {dbStatus.details.checkEnvironmentVariables.DB_PORT}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Troubleshooting Guide */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Troubleshooting Guide</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-400 mb-2">1. Check PostgreSQL Installation</h4>
                <p className="text-gray-400">Make sure PostgreSQL is installed and running on your system.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400 mb-2">2. Verify Database Exists</h4>
                <p className="text-gray-400">Create the database: <code className="bg-gray-800 px-2 py-1 rounded">CREATE DATABASE tenexai;</code></p>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400 mb-2">3. Check Environment Variables</h4>
                <p className="text-gray-400">Create a <code className="bg-gray-800 px-2 py-1 rounded">.env.local</code> file in the root directory with your database credentials.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400 mb-2">4. Test Connection Manually</h4>
                <p className="text-gray-400">Try connecting to your database using a PostgreSQL client to verify credentials.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="px-6 py-3 border border-white text-white rounded-md hover:bg-white hover:text-black transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6 border-t border-gray-800">
        <p>© 2025 TenexAI. All rights reserved.</p>
      </footer>
    </div>
  );
} 