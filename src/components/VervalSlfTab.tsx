import React, { useState } from 'react';
import { Application } from '../types';
import { Sparkles, FileText, CheckCircle, AlertTriangle, Download, Link as LinkIcon, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VervalSlfTabProps {
  application: Application;
  onUpdate: (updated: Application) => void;
}

export const VervalSlfTab: React.FC<VervalSlfTabProps> = ({ application, onUpdate }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lkText, setLkText] = useState('');
  
  // Combine all revisions from BA Konsultasi
  const baNotes = [
    ...(application.baKonsultasi?.arsitekturRevisions || []),
    ...(application.baKonsultasi?.strukturRevisions || []),
    ...(application.baKonsultasi?.mepRevisions || [])
  ].filter(r => r.trim()).join('\n');

  const handleVerify = async () => {
    if (!lkText.trim()) {
      setErrorMsg('Harap isi Laporan Kajian / Jawaban Konsultan.');
      return;
    }
    
    setIsVerifying(true);
    setErrorMsg('');
    setResultMarkdown('');
    
    try {
      const response = await fetch('/api/gemini/verval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingType: application.building.functionType,
          buildingName: application.building.name,
          baText: baNotes,
          lkText: lkText
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan pada server AI.');
      
      setResultMarkdown(data.result || 'Tidak ada respons dari AI.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghubungi server verifikasi AI.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-500 font-bold border-b border-slate-100 dark:border-slate-700 pb-3">
          <Sparkles className="w-5 h-5" />
          <h2>Verifikasi & Validasi Perbaikan Laporan SLF dengan AI</h2>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Fitur ini menggunakan AI untuk membandingkan Daftar Revisi (Berita Acara) dengan Laporan Kajian (Jawaban Konsultan) secara otomatis.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col h-[400px]">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-500" />
              1. Temuan Lapangan (Berita Acara Konsultasi)
            </label>
            <textarea
              className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-slate-300"
              readOnly
              value={baNotes}
              placeholder="Data daftar revisi belum tersedia di BA Konsultasi..."
            />
            <p className="text-[10px] text-slate-500 mt-2">*Otomatis ditarik dari hasil Berita Acara Konsultasi permohonan ini.</p>
          </div>

          <div className="flex flex-col h-[400px]">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              2. Jawaban Konsultan (Laporan Perbaikan)
            </label>
            <textarea
              className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300"
              value={lkText}
              onChange={(e) => setLkText(e.target.value)}
              placeholder="Salin dan tempelkan teks jawaban dari dokumen Laporan Konsultan di sini..."
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 p-4 rounded-xl flex items-center gap-3 border border-rose-100 dark:border-rose-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <button
            onClick={handleVerify}
            disabled={isVerifying || !lkText.trim()}
            className="group flex items-center gap-3 px-8 py-3.5 rounded-full font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-600 to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isVerifying ? (
              <>
                <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Mulai Verifikasi & Validasi AI</span>
              </>
            )}
          </button>
        </div>

        {resultMarkdown && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Hasil Verifikasi Komprehensif
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <ReactMarkdown>{resultMarkdown}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
