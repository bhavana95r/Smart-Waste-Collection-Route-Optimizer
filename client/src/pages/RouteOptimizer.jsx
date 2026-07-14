import React, { useState, useEffect } from 'react';
import { Truck, Navigation, Fuel, Leaf, DollarSign, Download, Play, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Create custom icons to avoid Vite path errors and color pins dynamically
const getBinIcon = (fillLevel) => {
  const color = fillLevel >= 80 ? '#ef4444' : fillLevel >= 50 ? '#f59e0b' : '#10b981';
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: transform 0.2s;" class="hover:scale-125"></div>`,
    className: 'custom-bin-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const getDepotIcon = () => {
  return new L.DivIcon({
    html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display: flex; items-center justify-center;"><span style="color: white; font-size: 8px; font-weight: bold;">D</span></div>`,
    className: 'custom-depot-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

export default function RouteOptimizer() {
  const [vehicles, setVehicles] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [depot, setDepot] = useState({ lat: 12.9716, lon: 77.5946, name: 'Bangalore Municipal Depot' });
  const [loading, setLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        const [vRes, bRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/bins')
        ]);
        const activeVehicles = vRes.data.filter(v => v.status === 'Active');
        setVehicles(activeVehicles);
        if (activeVehicles.length > 0) {
          setSelectedVehicle(activeVehicles[0].id.toString());
        }
        setBins(bRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    initPage();
  }, []);

  const handleOptimize = async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    try {
      const res = await api.post('/routes/optimize-route', {
        vehicle_id: parseInt(selectedVehicle),
        depot_lat: depot.lat,
        depot_lon: depot.lon
      });
      setOptimizedRoute(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/analytics/export/pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'SmartWaste_Operations_Report.pdf';
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/analytics/export/excel', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'SmartWaste_Analytics_Report.xlsx';
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-7rem)]">
      
      {/* Control Panel (Left Column) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full space-y-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">Route Optimizer</h1>
            <p className="text-[10px] text-slate-400">AI-driven vehicle routing optimization solver</p>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Select Active Truck</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:text-white"
              >
                {vehicles.length === 0 ? (
                  <option>No active trucks available</option>
                ) : (
                  vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_number} ({v.fuel_type} - Max: {v.capacity}kg)</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-400 block mb-1">Depot Coordinates</label>
              <input
                type="text"
                disabled
                value={`${depot.lat}, ${depot.lon} (${depot.name})`}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400"
              />
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading || !selectedVehicle}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50 text-xs"
          >
            <Play className="h-4 w-4" />
            <span>{loading ? 'Solving VRP Model...' : 'Optimize Collection Route'}</span>
          </button>
        </div>

        {/* Optimized metrics results */}
        {optimizedRoute ? (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">Optimization Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{optimizedRoute.total_distance} km</p>
                  <p className="text-[8px] text-slate-400">Total Distance</p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">~{optimizedRoute.estimated_time} mins</p>
                  <p className="text-[8px] text-slate-400">ETA duration</p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 flex items-center gap-2">
                <Fuel className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{optimizedRoute.fuel_consumption} L</p>
                  <p className="text-[8px] text-slate-400">Fuel Used</p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-teal-500" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{optimizedRoute.co2_emissions} kg</p>
                  <p className="text-[8px] text-slate-400">CO₂ Output</p>
                </div>
              </div>
            </div>
            
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex justify-between items-center">
              <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Est. Cost:</span>
              <span className="font-black text-sm">${optimizedRoute.collection_cost}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-[10px]">
            Select parameters and run the VRP optimizer.
          </div>
        )}

        {/* Reports Download */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF Summary</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel Logs</span>
          </button>
        </div>
      </div>

      {/* Live Map (Right Columns) */}
      <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-full relative">
        <MapContainer center={[depot.lat, depot.lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Depot Marker */}
          <Marker position={[depot.lat, depot.lon]} icon={getDepotIcon()}>
            <Popup>
              <div className="text-xs font-bold">Bangalore Center Depot</div>
            </Popup>
          </Marker>

          {/* Bins Markers */}
          {bins.map(b => (
            <Marker key={b.id} position={[b.latitude, b.longitude]} icon={getBinIcon(b.fill_level)}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold">{b.location_name}</p>
                  <p>Waste Type: <span className="font-semibold">{b.waste_type}</span></p>
                  <p>Fill level: <span className="font-bold text-emerald-500">{b.fill_level}%</span></p>
                  <p>Priority: <span className="font-semibold text-amber-500">P-{b.priority}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Polylines for optimized route */}
          {optimizedRoute && optimizedRoute.path_coordinates && (
            <Polyline 
              positions={optimizedRoute.path_coordinates} 
              color="#10b981" 
              weight={4} 
              opacity={0.85} 
              dashArray="5, 10"
            />
          )}
        </MapContainer>
      </div>

    </div>
  );
}
