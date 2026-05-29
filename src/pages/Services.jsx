// YOROTA Smart Office - Category & Services Management (Admin Exclusive)
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Info
} from 'lucide-react';
import { db } from '../services/db';

export default function Services({ setGlobalNotification }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await db.services.getAll();
      setServices(data);
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading categories', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setIsEdit(false);
    setEditId(null);
    setName('');
    setPrice('');
    setDescription('');
    setStatus('active');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setIsEdit(true);
    setEditId(service.id);
    setName(service.name);
    setPrice(service.price.toString());
    setDescription(service.description || '');
    setStatus(service.status);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    setFormLoading(true);
    setError('');

    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      description: description.trim(),
      status
    };

    try {
      if (isEdit) {
        await db.services.update(editId, payload);
        setGlobalNotification({ message: `Successfully updated "${name}"`, type: 'success' });
      } else {
        await db.services.create(payload);
        setGlobalNotification({ message: `Successfully created "${name}"`, type: 'success' });
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while saving category.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, serviceName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${serviceName}"? This action is irreversible.`)) {
      return;
    }

    try {
      await db.services.delete(id);
      setGlobalNotification({ message: `Successfully deleted "${serviceName}"`, type: 'success' });
      fetchServices();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not delete category. Note: If this category was already used to log registrations, you must deactivate it instead of deleting.');
    }
  };

  // Search & Filter Category Lists
  const filteredServices = services.filter(srv => {
    const matchesSearch = srv.name.toLowerCase().includes(search.toLowerCase()) || 
                          (srv.description && srv.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || srv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 px-1 sm:px-4">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">Manage Categories</h1>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
            Configure dynamic registration types, Naira pricing, and operating rules.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-extrabold hover:from-[#FFD740] hover:to-[#F5C800] shadow-md shadow-[#F5C800]/10 text-[10px] sm:text-xs transition cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5" />
          CREATE CATEGORY
        </button>
      </div>

      {/* Info notice about Dynamic prices */}
      <div className="p-3.5 rounded-xl premium-glass border border-slate-800 flex gap-2.5 text-[10px] sm:text-xs leading-relaxed max-w-4xl">
        <Info className="w-4.5 h-4.5 text-[#F5C800] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Accounting Integrity: </span>
          Altering a category price instantly affects any new registrations entered. Historical records retain their original processed prices to guarantee ledger audit accuracy.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 sm:p-4 shadow-sm">
        {/* Search input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by keyword..."
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1 bg-slate-950/40 rounded-lg p-1 w-full sm:w-auto">
          {['all', 'active', 'inactive'].map((filt) => (
            <button
              key={filt}
              onClick={() => setStatusFilter(filt)}
              className={`py-1 px-3.5 rounded-md text-[9px] font-extrabold uppercase transition flex-1 sm:flex-none cursor-pointer ${
                statusFilter === filt
                  ? 'bg-slate-900 text-slate-100 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filt}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Data Section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="space-y-2">
          
          {/* MOBILE RESPONSIVE COMPACT CARD VIEW (sm:hidden) */}
          <div className="block sm:hidden space-y-2">
            {filteredServices.map(srv => (
              <div key={srv.id} className="premium-glass p-3 rounded-xl border border-slate-800 space-y-2 text-xs shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-100 truncate pr-2">{srv.name}</span>
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    srv.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                  }`}>
                    {srv.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {srv.description || 'No description provided.'}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                  <div className="font-black text-emerald-400 text-xs">₦{parseFloat(srv.price).toFixed(2)}</div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(srv)}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold hover:bg-slate-800 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(srv.id, srv.name)}
                      className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold hover:bg-red-500 hover:text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TRADITIONAL DATA TABLE VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                  <th className="py-3 px-4">SERVICE CATEGORY NAME</th>
                  <th className="py-3 px-4">PRICE</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">OPERATIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-secondary/20 transition">
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      {srv.name}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-emerald-400">
                      ₦{parseFloat(srv.price).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground max-w-sm truncate">
                      {srv.description || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        srv.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {srv.status === 'active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {srv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-emerald-400 hover:border-emerald-400/30 transition"
                          title="Edit Category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id, srv.name)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 premium-glass border border-slate-800 rounded-xl flex flex-col items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-slate-600 mb-2" />
          <p className="font-bold text-xs">No service categories found</p>
          <p className="text-[10px] text-slate-500 mt-1">
            {search ? 'Try adjusting your search criteria.' : 'Create your first operating category above.'}
          </p>
        </div>
      )}

      {/* Add / Edit Service Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs">
            <h2 className="text-xs font-black text-slate-100 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide">
              {isEdit ? <Edit3 className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
              {isEdit ? 'Edit Category' : 'Create Category'}
            </h2>

            {error && (
              <div className="mb-3.5 p-2 rounded bg-red-950/40 border border-red-500/20 text-red-200 text-[10px]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rider Registration"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Category Price (₦ Naira) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition font-bold text-emerald-450"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Category operating details..."
                  rows="2"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Active Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-400 focus:outline-none focus:border-[#F5C800] transition"
                >
                  <option value="active">Active (Show in registries)</option>
                  <option value="inactive">Inactive (Hide from selection)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-[10px] uppercase shadow-md shadow-[#F5C800]/10 transition cursor-pointer"
                >
                  {formLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
