import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">T</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">TenexAI</h1>
            </div>
            <ul className="flex gap-8 text-sm font-medium">
              <li>
                <Link href="/" className="hover:text-white/80 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white/80 transition-colors">
                  Signup
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white/80 transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Content */}
          <div className="text-center mb-20">
            <div className="mb-8">
              <h2 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  TenexAI
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Advanced AI-powered cybersecurity platform for SOC analysts. 
                Detect threats, analyze logs, and secure your digital infrastructure.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 btn-hover"
              >
                Get Started
                <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Analysis</h3>
              <p className="text-white/70 leading-relaxed">
                Leverage advanced machine learning algorithms to detect sophisticated threats and anomalies in your log data.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Monitoring</h3>
              <p className="text-white/70 leading-relaxed">
                Monitor your security infrastructure in real-time with instant threat detection and alerting capabilities.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Comprehensive Reports</h3>
              <p className="text-white/70 leading-relaxed">
                Generate detailed security reports with actionable insights and executive summaries for stakeholders.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-white/60">Threat Detection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/60">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-white/60">Log Formats Supported</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10s</div>
              <div className="text-white/60">Average Response Time</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-black font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold">TenexAI</span>
            </div>
            <p className="text-white/60 mb-6">
              Securing the digital world with advanced AI technology
            </p>
            <div className="text-white/40 text-sm">
              © 2025 TenexAI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
