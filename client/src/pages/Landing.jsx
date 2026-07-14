import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Navigation, Shield, BarChart3, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Decorative Animated Gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px] animate-bounce duration-[8s]"></div>
      
      {/* Top Navigation */}
      <header className="relative z-10 flex h-20 items-center justify-between px-8 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-emerald-400 text-xl">
          <Leaf className="h-6 w-6" />
          <span>Smart Waste</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-emerald-400 transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex items-center px-8 md:px-16 max-w-7xl mx-auto w-full py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Autonomous Municipal Operations
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Optimize Waste <br />
              Collection using <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">AI & Real-Time IoT</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
              Empower your municipality with real-time smart bin monitoring, predictive machine learning overflow forecasts, and dynamic VRP route planning to slash fuel costs by up to 30%.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link to="/signup" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-105">
                <span>Deploy Smart Optimizer</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero Right: Stats Grid (Glassmorphism layout) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Navigation className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-3xl font-extrabold">30%</h3>
              <p className="text-sm text-slate-400 mt-1">Fuel Consumption Cut</p>
            </div>
            
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md mt-6 lg:mt-0">
              <BarChart3 className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-3xl font-extrabold">95%</h3>
              <p className="text-sm text-slate-400 mt-1">Collection Efficiency</p>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Shield className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-3xl font-extrabold">0%</h3>
              <p className="text-sm text-slate-400 mt-1">Overflow Hazard Incidents</p>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md mt-6 lg:mt-0">
              <Leaf className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-3xl font-extrabold">2.4 Tons</h3>
              <p className="text-sm text-slate-400 mt-1">CO₂ Emissions Abated</p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950/40 py-6 text-center text-slate-500 text-xs">
        <p>&copy; 2026 Smart Waste Collection Route Optimizer. Developed for Municipal AI Systems.</p>
      </footer>
    </div>
  );
}
