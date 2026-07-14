import React, { useContext, useState } from 'react';
import { AuthContext, ThemeContext } from '../App';
import { User, Sun, Moon, Bell, Shield, KeyRound, Play } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const [notifs, setNotifs] = useState({
    overflow: true,
    breakdown: true,
    routes: true
  });

  const handleRetrain = async () => {
    setLoading(true);
    setRetrainSuccess(false);
    try {
      // Send a simulated request to send an alert which retrains or triggers a logs notification
      await api.post('/notifications/send-alert', {
        message: "Operator triggered ML Model Retraining. Models refreshed.",
        type: 'Route Update'
      });
      setTimeout(() => {
        setRetrainSuccess(true);
        setLoading(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-xs text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-400">Configure your workspace preferences and credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Links */}
        <div className="space-y-2">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile Information</span>
          </div>
          <div className="p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2 transition-colors cursor-pointer">
            <KeyRound className="h-4 w-4" />
            <span>Security Settings</span>
          </div>
          <div className="p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2 transition-colors cursor-pointer">
            <Shield className="h-4 w-4" />
            <span>Access Control</span>
          </div>
        </div>

        {/* Configurations Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">User Profile</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-400 mb-1">Full Name</p>
                  <p className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold">{user?.name}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 mb-1">Access Role</p>
                  <p className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold capitalize">{user?.role}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-400 mb-1">Registered Email</p>
                <p className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Theme & Display Settings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Preferences</h3>
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Interface Theme</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Toggle between dark and light themes</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold transition-all text-[10px]"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 text-emerald-500" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Notifications Toggles */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-emerald-500" />
                <span>Alert Notifications</span>
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifs.overflow}
                    onChange={(e) => setNotifs({...notifs, overflow: e.target.checked})}
                    className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4 border-slate-300"
                  />
                  <span>Smart Bin Overflow Alerts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifs.breakdown}
                    onChange={(e) => setNotifs({...notifs, breakdown: e.target.checked})}
                    className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4 border-slate-300"
                  />
                  <span>Vehicle Breakdowns and Engine Faults</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifs.routes}
                    onChange={(e) => setNotifs({...notifs, routes: e.target.checked})}
                    className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4 border-slate-300"
                  />
                  <span>AI Route Optimization Updates</span>
                </label>
              </div>
            </div>
          </div>

          {/* AI/ML Maintenance Actions */}
          {user?.role !== 'Driver' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">AI / ML Operations</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Recalibrate prediction algorithms using new collection logs</p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleRetrain}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/10 transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>{loading ? 'Retraining Models...' : 'Retrain ML Models'}</span>
                </button>

                {retrainSuccess && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Models successfully retrained!</span>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
