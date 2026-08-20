import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Save, Printer, RefreshCw, Plus, Trash2, FileText, Info, Settings } from 'lucide-react';
import { 
  INDEKS_FUNGSI, 
  INDEKS_BG_TERBANGUN, 
  PARAMETERS_KLASIFIKASI, 
  KOEFISIEN_LANTAI,
  PRASARANA_TYPES 
} from '../lib/retribusiData';
import { Application, PrasaranaPriceConfig } from '../types';
import { 
  subscribeToPrasaranaPrices, 
  initializePrasaranaPrices,
  subscribeToGlobalSettings,
  ParameterWeight
} from '../lib/firebaseSettings';
import { PrasaranaSettings } from './PrasaranaSettings';
import { motion, AnimatePresence } from 'motion/react';
import { RetribusiPrintPreviewModal } from './RetribusiPrintPreviewModal';
import { exportToPdf } from '../lib/pdfPrintEngine';

interface PrasaranaItem {
  id: string;
  type: string;
  volume: number;
  index: number;
  price: number;
  manualName?: string;
  manualUnit?: string;
}

interface RetribusiFormProps {
  application?: Application;
  onSave?: (data: any) => void;
}

export const RetribusiForm: React.FC<RetribusiFormProps> = ({ application, onSave }) => {
  // Constants
  const INDEKS_LOKALITAS = 0.5;

  // State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [shst, setShst] = useState<number>(5400000); // Default SHST for Garut
  const [parameterWeights, setParameterWeights] = useState<ParameterWeight[]>([]);
  const [luasLantai, setLuasLantai] = useState<number>(application?.building?.buildingArea || 0);
  const [indeksFungsi, setIndeksFungsi] = useState<number>(0.17); // Default Hunian > 100
  const [indeksBgTerbangun, setIndeksBgTerbangun] = useState<number>(1); // Default Baru
  const [paramValues, setParamValues] = useState<Record<string, number>>({
    'Kompleksitas': 0.4,
    'Permanensi': 1.0,
    'Zonasi Gempa': 0.7,
    'Kepadatan': 0.7,
    'Ketinggian': 0.4,
    'Kepemilikan': 1.0,
    'Waktu Penggunaan': 1.0,
  });
  
  const [prasaranaList, setPrasaranaList] = useState<PrasaranaItem[]>([]);
  const [prasaranaConfigs, setPrasaranaConfigs] = useState<PrasaranaPriceConfig[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initialize if empty, then subscribe
    const initAndSubscribe = async () => {
      try {
        await initializePrasaranaPrices();
        const unsubPrices = subscribeToPrasaranaPrices((updatedPrices) => {
          setPrasaranaConfigs(updatedPrices);
        });
        const unsubGlobal = subscribeToGlobalSettings((settings) => {
          setShst(settings.shst);
          if (settings.parameterWeights) {
            setParameterWeights(settings.parameterWeights);
          }
        });
        return () => {
          unsubPrices();
          unsubGlobal();
        };
      } catch (err) {
        console.error('Error initializing prices:', err);
      }
    };

    const cleanup = initAndSubscribe();
    return () => {
      cleanup.then(unsub => unsub?.());
    };
  }, []);

  // Use dynamic configs if available, otherwise fallback to static types
  const currentPrasaranaTypes = useMemo(() => {
    if (prasaranaConfigs.length > 0) {
      return prasaranaConfigs;
    }
    return PRASARANA_TYPES;
  }, [prasaranaConfigs]);

  // Calculations
  const indeksParameterTotal = useMemo(() => {
    // Use dynamic weights if available, otherwise fallback to static data
    if (parameterWeights.length > 0) {
      return parameterWeights.reduce((acc, param) => {
        const val = paramValues[param.name] || 0;
        return acc + (param.weight * val);
      }, 0);
    }

    return PARAMETERS_KLASIFIKASI.reduce((acc, param) => {
      const val = paramValues[param.name] || 0;
      return acc + (param.weight * val);
    }, 0);
  }, [paramValues, parameterWeights]);

  const indeksTerintegrasi = useMemo(() => {
    return indeksFungsi * indeksParameterTotal;
  }, [indeksFungsi, indeksParameterTotal]);

  const retribusiBangunan = useMemo(() => {
    return luasLantai * (INDEKS_LOKALITAS * shst) * indeksTerintegrasi * indeksBgTerbangun;
  }, [luasLantai, shst, indeksTerintegrasi, indeksBgTerbangun]);

  const retribusiPrasarana = useMemo(() => {
    return prasaranaList.reduce((acc, item) => {
      return acc + (item.volume * item.index * indeksBgTerbangun * item.price);
    }, 0);
  }, [prasaranaList, indeksBgTerbangun]);

  const totalRetribusi = retribusiBangunan + retribusiPrasarana;

  // Handlers
  const addPrasarana = (isManual = false) => {
    const defaultType = currentPrasaranaTypes[0];
    const newItem: PrasaranaItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: isManual ? 'MANUAL' : (defaultType?.label || ''),
      volume: 0,
      index: 1,
      price: isManual ? 0 : (defaultType?.price || 0)
    };
    setPrasaranaList([...prasaranaList, newItem]);
  };

  const removePrasarana = (id: string) => {
    setPrasaranaList(prasaranaList.filter(item => item.id !== id));
  };

  const updatePrasarana = (id: string, updates: Partial<PrasaranaItem>) => {
    setPrasaranaList(prasaranaList.map(item => {
      if (item.id === id) {
        if (updates.type && updates.type !== 'MANUAL') {
          const typeInfo = currentPrasaranaTypes.find(t => t.label === updates.type);
          return { ...item, ...updates, price: typeInfo?.price || item.price };
        }
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded-none overflow-hidden">
      {/* Official Header (KOP) */}
      <div className="border-b-4 border-double border-slate-900 p-8 flex justify-between items-center bg-white">
        <div className="flex gap-6 items-center">
          <img 
            src="/logo_garut.png" 
            alt="Logo Pemkab Garut" 
            className="w-16 h-20 object-contain"
          />
          <div className="border-l-2 border-slate-200 pl-6">
            <h1 className="text-lg font-black text-slate-900 uppercase leading-tight tracking-tighter">PEMERINTAH KABUPATEN GARUT</h1>
            <h2 className="text-md font-bold text-slate-800 uppercase leading-tight">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
            <p className="text-[10px] font-medium text-slate-500 mt-1 max-w-xs">
              Jalan Prof. KH. Cecep Syarifuddin No. 117 Telp. (0262) 233730 Fax (0262) 544184 Garut 44151
            </p>
          </div>
        </div>
        <div className="text-right border-l-2 border-slate-900 pl-8 h-full flex flex-col justify-center">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">RINCIAN PERHITUNGAN</h1>
          <h2 className="text-xl font-bold text-indigo-600 uppercase">RETRIBUSI PBG</h2>
          <p className="text-[10px] font-mono font-bold text-slate-400 mt-1">Ref: {application?.registerNumber || '________________'}</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-40 font-semibold text-slate-600">Nama Pemohon</span>
              <span className="text-slate-900">: {application?.applicant.name || '________________'}</span>
            </div>
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-40 font-semibold text-slate-600">Alamat Pemohon</span>
              <span className="text-slate-900">: {application?.building?.address || '________________'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-40 font-semibold text-slate-600">Pekerjaan</span>
              <span className="text-slate-900">: Swasta</span>
            </div>
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-40 font-semibold text-slate-600">NPWP</span>
              <span className="text-slate-900">: ________________</span>
            </div>
          </div>
        </div>

        {/* Section A: Bangunan Gedung */}
        <section>
          <h3 className="bg-slate-900 text-white px-4 py-1.5 text-sm font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4" /> A. RINCIAN BANGUNAN GEDUNG
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 border border-slate-200">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Luas Lantai Total (L_Lt)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={luasLantai}
                    onChange={(e) => setLuasLantai(parseFloat(e.target.value))}
                    className="w-full bg-white border-2 border-slate-200 px-3 py-2 font-mono text-lg focus:border-indigo-600 outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">m²</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Fungsi Bangunan (I_f)</label>
                <select 
                  value={indeksFungsi}
                  onChange={(e) => setIndeksFungsi(parseFloat(e.target.value))}
                  className="w-full bg-white border-2 border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:border-indigo-600 outline-none appearance-none cursor-pointer"
                >
                  {INDEKS_FUNGSI.map(opt => (
                    <option key={opt.label} value={opt.value}>{opt.label} ({opt.value})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Kondisi Bangunan (I_bg)</label>
                <select 
                  value={indeksBgTerbangun}
                  onChange={(e) => setIndeksBgTerbangun(parseFloat(e.target.value))}
                  className="w-full bg-white border-2 border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:border-indigo-600 outline-none appearance-none cursor-pointer"
                >
                  {INDEKS_BG_TERBANGUN.map(opt => (
                    <option key={opt.label} value={opt.value}>{opt.label} ({opt.value})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200 pl-6">
              <div className="bg-white p-4 border-2 border-slate-900">
                <h4 className="text-[10px] font-black text-slate-900 uppercase mb-3 border-b-2 border-slate-900 pb-1">Perhitungan Indeks Terintegrasi</h4>
                <div className="space-y-2">
                  {PARAMETERS_KLASIFIKASI.map(param => {
                    const dynamicWeight = parameterWeights.find(w => w.name === param.name)?.weight ?? param.weight;
                    return (
                      <div key={param.name} className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase w-32">{param.name}</span>
                        <select 
                          value={paramValues[param.name]}
                          onChange={(e) => setParamValues({...paramValues, [param.name]: parseFloat(e.target.value)})}
                          className="flex-1 bg-slate-50 border border-slate-200 px-2 py-1 text-[11px] font-bold focus:border-indigo-600 outline-none"
                        >
                          {param.options.map(opt => (
                            <option key={opt.label} value={opt.value}>{opt.label} ({opt.value})</option>
                          ))}
                        </select>
                        <span className="text-[10px] font-mono font-bold text-slate-400">x {dynamicWeight.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-900 uppercase">Indeks Parameter Total</span>
                    <span className="text-sm font-black text-indigo-600 font-mono">{indeksParameterTotal.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-900 p-6 text-white grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Formula Perhitungan Retribusi Bangunan</p>
              <p className="font-mono text-xs text-slate-300 italic">L_Lt × (I_lo × SHST) × I_t × I_bg</p>
              <p className="mt-2 font-mono text-[11px]">
                {luasLantai} × ({INDEKS_LOKALITAS} × {shst.toLocaleString()}) × {indeksTerintegrasi.toFixed(4)} × {indeksBgTerbangun}
              </p>
            </div>
            <div className="text-right flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Retribusi Bangunan</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{formatIDR(retribusiBangunan)}</span>
            </div>
          </div>
        </section>

        {/* Section B: Prasarana */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="bg-slate-900 text-white px-4 py-1.5 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4" /> B. RINCIAN PRASARANA BANGUNAN GEDUNG
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <Settings className="w-3 h-3" /> Pengaturan Harga
              </button>
              <button 
                onClick={() => addPrasarana(true)}
                className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Plus className="w-3 h-3" /> Input Manual
              </button>
              <button 
                onClick={() => addPrasarana(false)}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-3 h-3" /> Tambah Prasarana
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-slate-900">
            <table className="w-full text-left text-[11px] font-bold border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-900 uppercase tracking-wider">
                <tr>
                  <th className="p-3 border-r-2 border-slate-900">Jenis Prasarana</th>
                  <th className="p-3 border-r-2 border-slate-900 w-32">Volume (V)</th>
                  <th className="p-3 border-r-2 border-slate-900 w-24">Indeks (I)</th>
                  <th className="p-3 border-r-2 border-slate-900 w-40">Harga Satuan (HSpbg)</th>
                  <th className="p-3 w-40">Subtotal</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {prasaranaList.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-r-2 border-slate-900">
                      {item.type === 'MANUAL' ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            type="text"
                            placeholder="Nama Prasarana..."
                            value={item.manualName || ''}
                            onChange={(e) => updatePrasarana(item.id, { manualName: e.target.value })}
                            className="w-full bg-slate-50 border-b border-slate-300 outline-none text-[11px] font-bold py-1 px-2"
                          />
                          <div className="flex items-center gap-2 px-2">
                            <select 
                              onChange={(e) => updatePrasarana(item.id, { type: e.target.value })}
                              className="text-[9px] text-indigo-600 font-bold bg-transparent outline-none"
                            >
                              <option value="MANUAL">Custom</option>
                              {currentPrasaranaTypes.map(t => (
                                <option key={t.label} value={t.label}>{t.label}</option>
                              ))}
                            </select>
                            <input 
                              type="text"
                              placeholder="Satuan (M2/Unit...)"
                              value={item.manualUnit || ''}
                              onChange={(e) => updatePrasarana(item.id, { manualUnit: e.target.value })}
                              className="w-20 bg-slate-50 border-b border-slate-200 outline-none text-[9px] font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        <select 
                          value={item.type}
                          onChange={(e) => updatePrasarana(item.id, { type: e.target.value })}
                          className="w-full bg-transparent outline-none cursor-pointer"
                        >
                          {currentPrasaranaTypes.map(t => (
                            <option key={t.label} value={t.label}>{t.label}</option>
                          ))}
                          <option value="MANUAL">+ Input Manual...</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3 border-r-2 border-slate-900">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={item.volume}
                          onChange={(e) => updatePrasarana(item.id, { volume: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-transparent outline-none font-mono"
                        />
                        <span className="text-slate-400 font-mono">
                          {item.type === 'MANUAL' 
                            ? (item.manualUnit || 'Unit') 
                            : currentPrasaranaTypes.find(t => t.label === item.type)?.unit}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-slate-900">
                      <input 
                        type="number" 
                        value={item.index}
                        onChange={(e) => updatePrasarana(item.id, { index: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent outline-none font-mono"
                      />
                    </td>
                    <td className="p-3 border-r-2 border-slate-900 font-mono">
                      {item.type === 'MANUAL' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Rp</span>
                          <input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => updatePrasarana(item.id, { price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border-b border-indigo-200 outline-none font-mono text-indigo-600 font-bold px-1"
                          />
                        </div>
                      ) : (
                        formatIDR(item.price)
                      )}
                    </td>
                    <td className="p-3 font-mono text-indigo-600">{formatIDR(item.volume * item.index * indeksBgTerbangun * item.price)}</td>
                    <td className="p-3">
                      <button onClick={() => removePrasarana(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {prasaranaList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 uppercase italic text-[10px]">Belum ada prasarana tambahan yang diinput.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-slate-100 border-2 border-slate-900 p-6 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Formula Perhitungan Retribusi Prasarana</p>
              <p className="font-mono text-xs text-slate-500 italic">V × I × I_bg × HSpbg</p>
            </div>
            <div className="text-right flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Nilai Total Retribusi Prasarana</span>
              <span className="text-2xl font-black font-mono text-slate-900">{formatIDR(retribusiPrasarana)}</span>
            </div>
          </div>
        </section>

        {/* Final Total */}
        <div className="mt-12 bg-emerald-600 p-10 text-white shadow-xl flex justify-between items-center border-4 border-white outline outline-4 outline-emerald-600">
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Total Pembayaran Retribusi (Grand Total)</h4>
            <p className="text-sm font-bold text-emerald-100">DPUPR Kabupaten Garut - SIMBG Digital Assistant</p>
          </div>
          <div className="text-right">
            <span className="text-4xl sm:text-6xl font-black font-mono tracking-tight">{formatIDR(totalRetribusi)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8 border-t-2 border-slate-100 no-print">
          <button 
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-4 px-6 text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <Printer className="w-5 h-5" /> Cetak Rincian Retribusi
          </button>
          <button 
            onClick={() => onSave?.({ 
              retribusiBangunan, 
              retribusiPrasarana, 
              totalRetribusi, 
              luasLantai, 
              indeksTerintegrasi,
              prasaranaList,
              timestamp: new Date().toISOString()
            })}
            className="flex-1 flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 px-6 text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <Save className="w-5 h-5" /> Simpan Hasil Perhitungan
          </button>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-950 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden border border-white/20"
              >
                <PrasaranaSettings onClose={() => setShowSettings(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Print Preview Modal */}
        {isPrintPreviewOpen && application && (
          <RetribusiPrintPreviewModal
            application={{
              ...application,
              retribution: {
                id: `RET-${application.id}`,
                formulaVersion: 'PP_16_2021',
                calculatedAt: new Date().toISOString(),
                calculatedBy: 'Operator',
                indexFungsi: INDEKS_FUNGSI[indeksFungsi],
                indexKompleksitas: paramValues['Kompleksitas'] || 0,
                indexPermanensi: paramValues['Permanensi'] || 0,
                indexJumlahLantai: KOEFISIEN_LANTAI[Math.min(Math.floor(paramValues['Ketinggian'] || 1), 10)] || 1,
                indeksLokalitas: INDEKS_LOKALITAS,
                shst,
                totalBuildingArea: luasLantai,
                buildingSubtotal: retribusiBangunan,
                infrastructureItems: prasaranaList.map(p => ({
                  id: p.id,
                  name: p.type === 'LAINNYA' ? p.manualName! : p.type,
                  volume: p.volume,
                  unit: p.type === 'LAINNYA' ? p.manualUnit! : p.type.includes('Pagar') ? 'm' : 'm²',
                  index: p.index,
                  unitPrice: p.price,
                  subtotal: p.volume * p.index * p.price
                })),
                infrastructureSubtotal: retribusiPrasarana,
                finalRetribution: totalRetribusi,
                variance: 0,
                isVerified: true,
                status: 'DRAFT'
              }
            }}
            customShst={shst}
            onClose={() => setIsPrintPreviewOpen(false)}
            onExportPdf={async () => {
              await exportToPdf('retribusi-print-preview-content', `Rincian_Retribusi_${application.registerNumber}.pdf`);
            }}
          />
        )}
      </div>
    </div>
  );
};
