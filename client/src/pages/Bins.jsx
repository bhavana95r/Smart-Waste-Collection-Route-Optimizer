import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Search, Filter, X } from 'lucide-react';
import api from '../services/api';

export default function Bins() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [formData, setFormData] = useState({
    location_name: '',
    latitude: '',
    longitude: '',
    fill_level: 0,
    waste_type: 'General',
    priority: 1,
    status: 'Active'
  });

  const fetchBins = async () => {
    try {
      const res = await api.get('/bins');
      setBins(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  const handleOpenAdd = () => {
    setEditingBin(null);
    setFormData({
      location_name: '',
      latitude: '',
      longitude: '',
      fill_level: 0,
      waste_type: 'General',
      priority: 1,
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (bin) => {
    setEditingBin(bin);
    setFormData({
      location_name: bin.location_name,
      latitude: bin.latitude.toString(),
      longitude: bin.longitude.toString(),
      fill_level: bin.fill_level,
      waste_type: bin.waste_type,
      priority: bin.priority,
      status: bin.status
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this smart bin?")) {
      try {
        await api.delete(`/bins/${id}`);
        fetchBins();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingBin) {
        await api.put(`/bins/${editingBin.id}`, formData);
      } else {
        await api.post('/bins', formData);
      }
      setModalOpen(false);
      fetchBins();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter & Search logic
  const filteredBins = bins.filter(b => {
    const matchesSearch = b.location_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || b.waste_type === filterType;
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBins.length / itemsPerPage);

  const getPriorityColor = (p) => {
    if (p >= 5) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    if (p >= 3) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Smart Bin Management</h1>
          <p className="text-xs text-slate-400">Add, edit, monitor, or remove IoT waste bins</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md shadow-emerald-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Add Bin</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by location name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
          />
        </div>
        
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
          >
            <option value="All">All Types</option>
            <option value="Organic">Organic</option>
            <option value="Recyclable">Recyclable</option>
            <option value="Hazardous">Hazardous</option>
            <option value="General">General</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 font-bold">
                  <th className="p-4">Bin ID</th>
                  <th className="p-4">Location Name</th>
                  <th className="p-4">Waste Category</th>
                  <th className="p-4">Fill Level (%)</th>
                  <th className="p-4">Priority Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Overflow Prediction (ML)</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-350">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">No smart bins matching your search filter.</td>
                  </tr>
                ) : (
                  currentItems.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
                      <td className="p-4 font-mono font-semibold">#BIN-{b.id}</td>
                      <td className="p-4 font-medium text-slate-800 dark:text-white">{b.location_name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-[10px] font-semibold">{b.waste_type}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                b.fill_level >= 80 ? 'bg-rose-500' : b.fill_level >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${b.fill_level}%` }}
                            ></div>
                          </div>
                          <span className="font-bold">{b.fill_level}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPriorityColor(b.priority)}`}>
                          P-{b.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`h-2 w-2 rounded-full inline-block mr-1.5 ${
                          b.status === 'Active' ? 'bg-emerald-500' : b.status === 'Maintenance' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}></span>
                        <span className="font-medium text-[10px]">{b.status}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                        {b.fill_level >= 100 ? (
                          <span className="text-rose-500 font-bold">Overflowing</span>
                        ) : (
                          <span>~{b.hours_to_overflow} hrs</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-xs">
              <span className="text-slate-400">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingBin ? 'Edit Smart Bin' : 'Add Smart Bin'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Location Name</label>
                <input
                  type="text"
                  required
                  value={formData.location_name}
                  onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                  placeholder="Cubbon Park Gate 2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="12.9716"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="77.5946"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Waste Type</label>
                  <select
                    value={formData.waste_type}
                    onChange={(e) => setFormData({...formData, waste_type: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:text-white"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Recyclable">Recyclable</option>
                    <option value="Hazardous">Hazardous</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Priority (1-5)</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:text-white"
                  >
                    <option value="1">1 (Low)</option>
                    <option value="2">2 (Normal)</option>
                    <option value="3">3 (Medium)</option>
                    <option value="4">4 (High)</option>
                    <option value="5">5 (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Fill Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fill_level}
                    onChange={(e) => setFormData({...formData, fill_level: parseFloat(e.target.value)})}
                    placeholder="35"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
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
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/10 transition-colors"
              >
                Save Bin Config
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
