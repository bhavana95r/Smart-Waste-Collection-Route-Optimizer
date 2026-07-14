import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Truck, X } from 'lucide-react';
import api from '../services/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    driver_id: -1,
    capacity: 2000,
    fuel_type: 'Diesel',
    status: 'Active'
  });

  // Static list of drivers representing our seeded database users for selection
  const driversList = [
    { id: 3, name: 'John Doe' },
    { id: 4, name: 'Sarah Connor' },
    { id: 5, name: 'James Smith' }
  ];

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_number: '',
      driver_id: -1,
      capacity: 2000,
      fuel_type: 'Diesel',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({
      vehicle_number: v.vehicle_number,
      driver_id: v.driver_id || -1,
      capacity: v.capacity,
      fuel_type: v.fuel_type,
      status: v.status
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this vehicle from the fleet?")) {
      try {
        await api.delete(`/vehicles/${id}`);
        fetchVehicles();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      driver_id: formData.driver_id === -1 ? null : formData.driver_id
    };
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, dataToSend);
      } else {
        await api.post('/vehicles', dataToSend);
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Fleet Management</h1>
          <p className="text-xs text-slate-400">Add, edit, track and manage collection trucks</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md shadow-emerald-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Add Truck</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div key={v.id} className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{v.vehicle_number}</h3>
                    <p className="text-[10px] text-slate-400">Capacity: {v.capacity} kg</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  v.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {v.status}
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Assigned Driver:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{v.driver_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fuel Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-white capitalize">{v.fuel_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Route:</span>
                  <span className={`font-semibold ${v.assigned_route_id ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {v.assigned_route_id ? `Route #${v.assigned_route_id}` : 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 transition-colors"
                >
                  Edit details
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-2 rounded-xl border border-rose-500/20 hover:bg-rose-500/5 text-rose-500 transition-colors"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingVehicle ? 'Edit Vehicle Details' : 'Add Vehicle to Fleet'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs text-left">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Vehicle License Plate</label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                  placeholder="KA-03-HA-4321"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseFloat(e.target.value)})}
                    placeholder="2500"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Fuel Type</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:text-white"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Driver Assignment</label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({...formData, driver_id: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:text-white"
                  >
                    <option value="-1">Unassigned</option>
                    {driversList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Breakdown">Breakdown</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/10 transition-colors"
              >
                Save Truck Config
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
