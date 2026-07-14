import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Navigation, Trash2, Calendar, MapPin } from 'lucide-react';
import api from '../services/api';

export default function DriverPortal() {
  const [route, setRoute] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActiveRoute = async () => {
    try {
      const res = await api.get('/routes/live-route');
      setRoute(res.data);
      // Filter out bins that have already been emptied during this session (fill_level == 0)
      setBins(res.data.bins || []);
    } catch (e) {
      setError(e.response?.data?.message || 'No active collection routes assigned.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRoute();
  }, []);

  const handleCollect = async (binId) => {
    try {
      // Send PUT request to reset the bin level to 0% and record the collection
      await api.put(`/bins/${binId}`, {
        last_collected: new Date().toISOString(),
        fill_level: 0
      });
      
      // Update local state to mark it as collected
      setBins(prev => prev.map(b => b.id === binId ? { ...b, fill_level: 0 } : b));
      
      // Post a simulated collection weight log
      // Normally, the scale on the truck would feed this weight. We simulate a weight between 40-150 kg
      const simulatedWeight = Math.floor(Math.random() * 110) + 40;
      await api.post('/notifications/send-alert', {
        message: `Driver collected bin #${binId} (${simulatedWeight}kg). Bin cleared.`,
        type: 'General'
      });
    } catch (e) {
      console.error("Error collecting waste:", e);
    }
  };

  const handleCompleteRoute = async () => {
    if (!route) return;
    try {
      await api.put(`/routes/${route.id}`, { status: 'Completed' });
      setRoute(null);
      setBins([]);
      alert("Route completed! Returning to depot.");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* Driver welcome & Truck Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/20 text-white">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black">Driver Portal</h1>
            <p className="text-[10px] text-emerald-100">Live collection logs and navigation list</p>
          </div>
        </div>
      </div>

      {error || !route ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-center space-y-3">
          <Trash2 className="h-12 w-12 text-slate-350 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">No Active Assignment</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You do not currently have any routes assigned. Please wait for dispatch control to initialize your schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Route Overview */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs text-left space-y-2.5">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span>Assigned Route Summary</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-slate-500 dark:text-slate-400">
              <div>
                <p>Route ID: <span className="font-bold text-slate-800 dark:text-white">#{route.id}</span></p>
                <p className="mt-1">Estimated Time: <span className="font-bold text-slate-800 dark:text-white">{route.estimated_time} mins</span></p>
              </div>
              <div>
                <p>Route Distance: <span className="font-bold text-slate-800 dark:text-white">{route.total_distance} km</span></p>
                <p className="mt-1">Est. Fuel: <span className="font-bold text-slate-800 dark:text-white">{route.fuel_consumption} L</span></p>
              </div>
            </div>
            <button
              onClick={handleCompleteRoute}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 font-bold text-white transition-colors"
            >
              Complete Route & Return to Depot
            </button>
          </div>

          {/* Checklist Bins */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 text-left">Bins Collection Checklist</h3>
            {bins.map((b, idx) => {
              const isCollected = b.fill_level === 0;
              return (
                <div 
                  key={b.id} 
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                    isCollected 
                      ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40 opacity-60' 
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3 text-left">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${
                      isCollected 
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-400' 
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${isCollected ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                        Stop #{idx + 1}: {b.location_name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Category: {b.waste_type} | Fill Level: <span className="font-bold">{b.fill_level}%</span>
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isCollected}
                    onClick={() => handleCollect(b.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      isCollected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-900/60'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 active:scale-[0.98]'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isCollected ? 'Emptied' : 'Mark Collected'}</span>
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
