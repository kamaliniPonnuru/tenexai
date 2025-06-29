'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DatabaseStatus {
  status: string;
  tables: {
    name: string;
    count: number;
  }[];
}

interface UserData {
  id: number;
  role: string;
}

export default function DbStatusPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    setUser(user);
    
    // Check if user has access to database status
    if (user.role !== 'admin' && user.role !== 'tester') {
      router.push('/dashboard');
      return;
    }

    fetchDatabaseStatus();
  }, [router]);

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/test-db');
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data);
      } else {
        setError('Failed to fetch database status');
      }
    } catch {
      setError('Failed to fetch database status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Status</h1>
              <p className="mt-2 text-gray-600">Monitor database connection and table statistics</p>
            </div>
            <div className="flex space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Database Status Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
          </div>
          
          <div className="p-6">
            {dbStatus ? (
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${dbStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-lg font-medium">
                    {dbStatus.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                
                {/* Table Statistics */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Table Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dbStatus.tables.map((table) => (
                      <div key={table.name} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{table.name}</span>
                          <span className="text-2xl font-bold text-blue-600">{table.count}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">records</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No database status available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 