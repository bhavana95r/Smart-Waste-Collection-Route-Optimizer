import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { 
  Trash2, Navigation, Truck, Scale, Fuel, Leaf, ArrowUpRight, AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchNotifications } = useContext(AuthContext);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const { kpis, waste_breakdown, monthly_data, vehicle_utilization } = data;

  const cardItems = [
    { label: 'Total Smart Bins', value: kpis.total_bins, icon: Trash2, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Overflow Bins (>=80%)', value: kpis.overflow_bins, icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Vehicles Available', value: kpis.vehicles_available, icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Weight Collected Today', value: `${kpis.today_weight} kg`, icon: Scale, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Fuel Saved (AI)', value: `${kpis.fuel_saved} L`, icon: Fuel, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Total Distance', value: `${kpis.distance_travelled} km`, icon: Navigation, color: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'CO₂ Reduction', value: `${kpis.co2_emissions} kg`, icon: Leaf, color: 'text-teal-500 bg-teal-500/10' },
    { label: 'Collection Efficiency', value: `${kpis.efficiency}%`, icon: ArrowUpRight, color: 'text-indigo-500 bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Operations Dashboard</h1>
        <p className="text-xs text-slate-400">Real-time IoT metrics and route efficiency tracking</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
              <div className={`p-3 rounded-xl ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400">{item.label}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Waste Curve */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Waste Volume Collected Trend</h3>
            <p className="text-[10px] text-slate-400">Monthly breakdown of historical weights (kg)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWaste)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Categories Split */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Waste Type Breakdown</h3>
            <p className="text-[10px] text-slate-400">Current share of smart bins by category</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={waste_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {waste_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {waste_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 justify-center">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Fleet Utilization charts */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Vehicle Capacity Utilization</h3>
          <p className="text-[10px] text-slate-400">Percentage of truck capacity filled during active collections</p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicle_utilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
              <XAxis dataKey="vehicle" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="utilization" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {vehicle_utilization.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.utilization >= 80 ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
