'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LogEntry {
  id: number;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  url: string;
  action: string;
  status_code: number;
  threat_category: string;
  severity: string;
}

interface Analysis {
  id: number;
  filename: string;
  log_type: string;
  total_entries: number;
  time_range: string;
  threat_summary: string;
  top_sources: string[];
  top_destinations: string[];
  threat_categories: Record<string, number>;
  severity_distribution: Record<string, number>;
  created_at: string;
}

interface AIInsights {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  insights: string[];
  recommendations: string[];
  ioc_indicators: string[];
  attack_patterns: string[];
}

interface UploadedFile {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  log_type: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('enduser');
  const [userName, setUserName] = useState<string>('');
  const [deletingFile, setDeletingFile] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    setUserId(userData.id);
    setUserRole(userData.role);
    setUserName(`${userData.first_name} ${userData.last_name}`);
    fetchFiles(userData.id);
  }, [router]);

  const fetchFiles = async (userId: number) => {
    try {
      const response = await fetch(`/api/logs/files?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file);
    console.log('👤 User ID:', userId);
    
    if (!file || !userId) {
      console.log('❌ Missing file or user ID');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    console.log('🚀 Starting upload...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());
    
    console.log('📋 Form data prepared');

    try {
      console.log('📤 Sending upload request...');
      const response = await fetch('/api/logs/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response received:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        setUploadProgress(100);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          fetchFiles(userId);
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('❌ Upload failed:', errorData);
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploading(false);
      setUploadProgress(0);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileSelect = async (file: UploadedFile) => {
    if (file.status !== 'completed') return;
    
    setSelectedFile(file);
    setLoading(true);

    try {
      const response = await fetch(`/api/logs/analysis/${file.id}?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setLogEntries(data.sample_entries);
        setAiInsights(data.ai_insights);
        setExecutiveSummary(data.executive_summary);
        setActiveTab('analysis');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAIAnalysis = async () => {
    if (!selectedFile || !userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/logs/analysis/${selectedFile.id}?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'regenerate_ai_analysis' }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.aiInsights);
        setExecutiveSummary(data.executiveSummary);
      }
    } catch (error) {
      console.error('Error regenerating AI analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: number, fileName: string) => {
    if (!userId) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingFile(fileId);
    try {
      const response = await fetch(`/api/logs/files/${fileId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove file from state
        setFiles(prev => prev.filter(f => f.id !== fileId));
        
        // If this was the selected file, clear the analysis
        if (selectedFile && selectedFile.id === fileId) {
          setSelectedFile(null);
          setAnalysis(null);
          setLogEntries([]);
          setAiInsights(null);
          setExecutiveSummary('');
        }
        
        alert('File deleted successfully');
      } else {
        const error = await response.json();
        alert(`Failed to delete file: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingFile(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">TenexAI</h1>
                <span className="text-sm text-white/60">SOC Analysis Platform</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-white/60 capitalize">{userRole}</p>
              </div>
              
              {/* Role-based Navigation */}
              <div className="flex space-x-2">
                {(userRole === 'admin' || userRole === 'tester') && (
                  <button
                    onClick={() => router.push('/db-status')}
                    className="px-3 py-1 text-xs font-medium text-white/80 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all"
                  >
                    DB Status
                  </button>
                )}
                
                {userRole === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-3 py-1 text-xs font-medium text-white bg-white/20 border border-white/30 rounded-lg hover:bg-white/30 transition-all"
                  >
                    Admin Panel
                  </button>
                )}
                
                <button
                  onClick={() => router.push('/profile')}
                  className="px-3 py-1 text-xs font-medium text-white/80 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all"
                >
                  Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'upload', name: 'Upload Logs' },
              { id: 'analysis', name: 'Analysis' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/40'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Welcome to TenexAI</h2>
              <p className="text-white/70 mb-4">
                Upload your log files to get AI-powered threat analysis and insights for your SOC operations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-white">Upload Logs</h3>
                  <p className="text-white/60 text-sm">Support for ZScaler, Apache, Nginx logs</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-white">AI Analysis</h3>
                  <p className="text-white/60 text-sm">Advanced threat detection with GPT-4</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-white">SOC Insights</h3>
                  <p className="text-white/60 text-sm">Actionable recommendations and IOCs</p>
                </div>
              </div>
            </div>

            {/* Recent Files */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Recent Files</h3>
              </div>
              <div className="divide-y divide-white/10">
                {files.slice(0, 5).map((file) => (
                  <div
                    key={file.id}
                    className="px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{file.original_name}</p>
                        <p className="text-sm text-white/60">
                          {new Date(file.created_at).toLocaleDateString()} • {file.log_type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          file.status === 'completed' ? 'bg-white/20 text-white' :
                          file.status === 'processing' ? 'bg-white/10 text-white/80' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {file.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file.id, file.original_name);
                          }}
                          disabled={deletingFile === file.id}
                          className="px-2 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-50 transition-colors"
                        >
                          {deletingFile === file.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="px-6 py-8 text-center text-white/60">
                    No files uploaded yet. Start by uploading a log file.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Upload Log File</h2>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  accept=".txt,.log"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 text-white/60">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">
                        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-white/60">TXT or LOG files up to 10MB</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="mt-4">
                  <div className="bg-white/10 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-white/60 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* File List */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Uploaded Files</h3>
              </div>
              <div className="divide-y divide-white/10">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{file.original_name}</p>
                        <p className="text-sm text-white/60">
                          {new Date(file.created_at).toLocaleDateString()} • {file.log_type} • {(file.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          file.status === 'completed' ? 'bg-white/20 text-white' :
                          file.status === 'processing' ? 'bg-white/10 text-white/80' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {file.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file.id, file.original_name);
                          }}
                          disabled={deletingFile === file.id}
                          className="px-2 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-50 transition-colors"
                        >
                          {deletingFile === file.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="px-6 py-8 text-center text-white/60">
                    No files uploaded yet. Start by uploading a log file.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analysis...</p>
              </div>
            ) : analysis ? (
              <>
                {/* AI Executive Summary */}
                {executiveSummary && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">AI Executive Summary</h2>
                      <button
                        onClick={regenerateAIAnalysis}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Regenerating...' : 'Regenerate AI Analysis'}
                      </button>
                    </div>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                        {executiveSummary}
                      </pre>
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {aiInsights && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Insights</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Threat Level */}
                      <div className={`p-4 rounded-lg border ${getThreatLevelColor(aiInsights.threat_level)}`}>
                        <h3 className="font-medium mb-2">Threat Level</h3>
                        <p className="text-2xl font-bold">{aiInsights.threat_level.toUpperCase()}</p>
                        <p className="text-sm">Confidence: {(aiInsights.confidence * 100).toFixed(1)}%</p>
                      </div>

                      {/* Key Insights */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Key Insights</h3>
                          <ul className="space-y-1">
                            {aiInsights.insights.map((insight, index) => (
                              <li key={index} className="text-sm text-gray-600">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                      <ul className="space-y-1">
                        {aiInsights.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600">• {rec}</li>
                        ))}
                      </ul>
                    </div>

                    {/* IOCs and Attack Patterns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Indicators of Compromise (IOCs)</h3>
                        <ul className="space-y-1">
                          {aiInsights.ioc_indicators.map((ioc, index) => (
                            <li key={index} className="text-sm text-red-600 font-mono">• {ioc}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Attack Patterns</h3>
                        <ul className="space-y-1">
                          {aiInsights.attack_patterns.map((pattern, index) => (
                            <li key={index} className="text-sm text-orange-600">• {pattern}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Total Entries</p>
                      <p className="text-2xl font-bold text-blue-900">{analysis.total_entries}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Time Range</p>
                      <p className="text-lg font-semibold text-green-900">{analysis.time_range}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-yellow-600">Log Type</p>
                      <p className="text-lg font-semibold text-yellow-900">{analysis.log_type}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-purple-600">File</p>
                      <p className="text-sm font-semibold text-purple-900 truncate">{analysis.filename}</p>
                    </div>
                  </div>

                  {/* Threat Summary */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Threat Summary</h3>
                    <p className="text-gray-600">{analysis.threat_summary}</p>
                  </div>

                  {/* Severity Distribution */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Severity Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(analysis.severity_distribution).map(([severity, count]) => (
                        <div key={severity} className="text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(severity)}`}>
                            {severity}: {count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Sources and Destinations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Top Sources</h3>
                      <ul className="space-y-1">
                        {analysis.top_sources.slice(0, 5).map((source, index) => (
                          <li key={index} className="text-sm text-gray-600 font-mono">• {source}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Top Destinations</h3>
                      <ul className="space-y-1">
                        {analysis.top_destinations.slice(0, 5).map((dest, index) => (
                          <li key={index} className="text-sm text-gray-600 font-mono">• {dest}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Log Entries Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Sample Log Entries</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source IP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {logEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {entry.source_ip}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {entry.url}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.status_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(entry.severity)}`}>
                                {entry.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Select a file to view its analysis.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 