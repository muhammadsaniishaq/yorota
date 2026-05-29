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
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Category Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure dynamic registration types, pricing, and operating rules.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/10 text-xs transition"
        >
          <Plus className="w-4 h-4" />
          CREATE SERVICE TYPE
        </button>
      </div>

      {/* Info notice about Dynamic prices */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-[#1f2937] flex gap-3 text-xs leading-relaxed max-w-4xl">
        <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Accounting Integrity Enforced: </span>
          Altering a category price instantly affects any new registrations entered into the system. Historic registrations already logged retain the exact prices they were originally processed at, ensuring ledger accuracy.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or keyword..."
            className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 w-full md:w-auto">
          {['all', 'active', 'inactive'].map((filt) => (
            <button
              key={filt}
              onClick={() => setStatusFilter(filt)}
              className={`py-1.5 px-4 rounded-md text-[10px] font-bold uppercase transition flex-1 md:flex-none ${
                statusFilter === filt
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filt}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Data Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                  <th className="py-3.5 px-4">SERVICE CATEGORY NAME</th>
                  <th className="py-3.5 px-4">PRICE</th>
                  <th className="py-3.5 px-4">DESCRIPTION</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">OPERATIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-secondary/20 transition">
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      {srv.name}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-emerald-500">
                      ${parseFloat(srv.price).toFixed(2)}
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
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-slate-500 mb-2" />
            <p className="font-semibold text-sm">No service categories found</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              {search ? 'Try adjusting your search criteria.' : 'Create your first operating category above.'}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Service Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-1.5">
              {isEdit ? <Edit3 className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
              {isEdit ? 'Edit Category' : 'Create New Category'}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rider Registration, Tricycle Permit"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Category Price ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about permit guidelines..."
                  rows="3"
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Active Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#10b981] transition"
                >
                  <option value="active">Active (Available for logged entries)</option>
                  <option value="inactive">Inactive (Hides from dropdowns)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-bold text-xs shadow-md shadow-emerald-500/10 transition"
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
