import React, { useState, useEffect } from 'react';
import { 
  PrasaranaPriceConfig 
} from '../types';
import { 
  subscribeToPrasaranaPrices, 
  updatePrasaranaPrice,
  initializePrasaranaPrices,
  subscribeToGlobalSettings,
  updateSHST,
  updateParameterWeights,
  GlobalSettings,
  ParameterWeight
} from '../lib/firebaseSettings';
import { 
  Save, 
  Search, 
  Settings2,
  RefreshCw,
  CheckCircle2,
  X,
  Coins,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrasaranaSettingsProps {
  onClose?: () => void;
}

export const PrasaranaSettings: React.FC<PrasaranaSettingsProps> = ({ onClose }) => {
  const [prices, setPrices] = useState<PrasaranaPriceConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingSHST, setEditingSHST] = useState(false);
  const [shstValue, setShstValue] = useState<string>('');
  const [editingWeights, setEditingWeights] = useState(false);
  const [tempWeights, setTempWeights] = useState<ParameterWeight[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Initialize if empty, then subscribe
    const initAndSubscribe = async () => {
      try {
        await initializePrasaranaPrices();
        const unsubPrices = subscribeToPrasaranaPrices((updatedPrices) => {
          setPrices(updatedPrices);
          setLoading(false);
        });
        const unsubGlobal = subscribeToGlobalSettings((settings) => {
          setGlobalSettings(settings);
          setShstValue(settings.shst.toString());
          if (settings.parameterWeights) {
            setTempWeights(settings.parameterWeights);
          }
        });
        return () => {
          unsubPrices();
          unsubGlobal();
        };
      } catch (err) {
        console.error('Error initializing prices:', err);
        setLoading(false);
      }
    };

    const cleanup = initAndSubscribe();
    return () => {
      cleanup.then(unsub => unsub?.());
    };
  }, []);

  const handleStartEdit = (item: PrasaranaPriceConfig) => {
    setEditingId(item.id);
    setEditValue(item.price.toString());
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const newPrice = parseFloat(editValue);
      if (isNaN(newPrice)) throw new Error('Harga tidak valid');
      
      await updatePrasaranaPrice(id, newPrice, 'ADMIN_USER');
      setEditingId(null);
      setMessage({ text: 'Harga prasarana berhasil diperbarui', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: 'Gagal memperbarui harga', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSHST = async () => {
    setSaving(true);
    try {
      const newSHST = parseFloat(shstValue);
      if (isNaN(newSHST)) throw new Error('SHST tidak valid');
      
      await updateSHST(newSHST, 'ADMIN_USER');
      setEditingSHST(false);
      setMessage({ text: 'Nilai SHST berhasil diperbarui', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: 'Gagal memperbarui SHST', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleWeightChange = (index: number, value: string) => {
    const newWeights = [...tempWeights];
    const numValue = parseFloat(value);
    newWeights[index] = { ...newWeights[index], weight: isNaN(numValue) ? 0 : numValue };
    setTempWeights(newWeights);
  };

  const handleSaveWeights = async () => {
    setSaving(true);
    try {
      await updateParameterWeights(tempWeights, 'ADMIN_USER');
      setEditingWeights(false);
      setMessage({ text: 'Bobot parameter berhasil diperbarui', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: 'Gagal memperbarui bobot', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredPrices = prices.filter(p => 
    p.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalWeight = tempWeights.reduce((acc, w) => acc + w.weight, 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Konfigurasi Harga Retribusi</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-wrap">SHST & Unit Price (HSpbg) Berdasarkan PP 16/2021</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* SHST Global Section */}
        <div className="p-6 bg-indigo-600 text-white border-b border-indigo-700">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <Coins className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Standard Harga Satuan Tertinggi</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter">
                    Rp {globalSettings?.shst.toLocaleString('id-ID') || '5.400.000'}
                  </span>
                  <span className="text-[10px] font-bold opacity-60">/ M2</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto">
              {editingSHST ? (
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">Rp</span>
                    <input 
                      autoFocus
                      type="number"
                      value={shstValue}
                      onChange={(e) => setShstValue(e.target.value)}
                      className="w-40 pl-8 pr-3 py-2 bg-white text-indigo-900 border-none rounded-xl text-sm font-black focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <button 
                    onClick={handleSaveSHST}
                    disabled={saving}
                    className="p-2.5 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setEditingSHST(false)}
                    className="p-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setEditingSHST(true);
                    setShstValue(globalSettings?.shst.toString() || '5400000');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" /> Ubah Nilai SHST
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-bold uppercase tracking-widest opacity-60">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Update Terakhir: {globalSettings ? new Date(globalSettings.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </div>
            <div className="w-1 h-1 bg-white rounded-full" />
            <div>Oleh: {globalSettings?.updatedBy || 'Sistem'}</div>
          </div>
        </div>

        {/* Parameter Weights Section */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Bobot Parameter Indeks</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Penentuan Indeks Terintegrasi</p>
                </div>
              </div>
              {!editingWeights ? (
                <button 
                  onClick={() => {
                    setEditingWeights(true);
                    setTempWeights(globalSettings?.parameterWeights || []);
                  }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md"
                >
                  Edit Bobot
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${Math.abs(totalWeight - 1.0) < 0.001 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    Total: {totalWeight.toFixed(2)}
                  </div>
                  <button 
                    onClick={handleSaveWeights}
                    disabled={saving}
                    className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setEditingWeights(false)}
                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(editingWeights ? tempWeights : (globalSettings?.parameterWeights || [])).map((w, idx) => (
                <div key={w.name} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{w.name}</p>
                  {editingWeights ? (
                    <input 
                      type="number"
                      step="0.01"
                      value={w.weight}
                      onChange={(e) => handleWeightChange(idx, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-1 px-2 text-sm font-black text-indigo-600"
                    />
                  ) : (
                    <p className="text-xl font-black text-slate-800 dark:text-white">{(w.weight * 100).toFixed(0)}<span className="text-[10px] font-bold ml-0.5 opacity-50">%</span></p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infrastructure Prices Search & List */}
        <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari jenis prasarana (HSpbg)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              />
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
              {filteredPrices.length} Items Ditemukan
            </div>
          </div>
        </div>

        {/* Message Toast */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight shadow-2xl backdrop-blur-md border ${
                message.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid List */}
        <div className="p-4 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest">Sinkronisasi Harga Cloud...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPrices.map((item) => (
                <div 
                  key={item.id}
                  className="group relative p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500 transition-all shadow-sm hover:shadow-xl"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase rounded-lg tracking-tighter">
                          Per {item.unit}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Live
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-4 min-h-[2.5rem]">
                        {item.label}
                      </h3>
                    </div>

                    <div className="mt-auto">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                            <input 
                              autoFocus
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-indigo-500 rounded-xl text-sm font-black text-indigo-600 focus:ring-0"
                            />
                          </div>
                          <button 
                            onClick={() => handleSave(item.id)}
                            disabled={saving}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleStartEdit(item)}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group/price"
                        >
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">HSpbg</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="p-2 opacity-0 group-hover/price:opacity-100 transition-all bg-indigo-600 text-white rounded-xl shadow-lg">
                            <Save className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex justify-between items-center px-1">
                        <span className="text-[8px] text-slate-400 font-medium italic">
                          Update: {new Date(item.updatedAt).toLocaleDateString('id-ID')}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">
                          Oleh: {item.updatedBy === 'SYSTEM_INITIAL' ? 'PP 16/2021' : item.updatedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-8">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Total Kapasitas: 256 Nodes
          </span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Protocol: Firestore Realtime
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Synchronized
        </div>
      </div>
    </div>
  );
};
