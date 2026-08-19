import React, { useState } from 'react';
import { History, Clock, User, ArrowRight, ShieldCheck, FileText, Search, Tag } from 'lucide-react';
import { Application, StatusAuditLog } from '../types';
import { ensureInitialAuditLogs, getStatusIndonesianLabel } from '../lib/auditLogEngine';

interface StatusAuditTrailViewProps {
  application: Application;
}

export const StatusAuditTrailView: React.FC<StatusAuditTrailViewProps> = ({ application }) => {
  const appWithLogs = ensureInitialAuditLogs(application);
  const logs: StatusAuditLog[] = appWithLogs.statusAuditLogs || [];
  const [filterText, setFilterText] = useState('');

  const filteredLogs = logs.filter(log => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      log.actorName.toLowerCase().includes(q) ||
      log.actorRole.toLowerCase().includes(q) ||
      log.fromStatus.toLowerCase().includes(q) ||
      log.toStatus.toLowerCase().includes(q) ||
      (log.notes && log.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 font-sans">
      {/* Header Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-mono space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            <History className="w-4 h-4 text-emerald-600" />
            <span>LOG RIWAYAT & AUDIT TRAIL PERUBAHAN STATUS VERIFIKASI</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold">
            {logs.length} PERUBAHAN TERCATAT
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
          Melacak seluruh jejak perubahan status verifikasi, penanggung jawab (actor ASN), serta catatan kronologis permohonan No. Register <strong>{application.registerNumber}</strong>.
        </p>
      </div>

      {/* Filter / Search within logs */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Cari kata kunci dalam riwayat log (Nama Actor, Status, Catatan)..."
          className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-white"
        />
      </div>

      {/* Timeline view */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-300 dark:border-slate-800">
            Belum ada riwayat perubahan status yang cocok dengan pencarian.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const dateObj = new Date(log.timestamp);
            const dateStr = dateObj.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            const timeStr = dateObj.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={log.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-emerald-600 border-2 border-white dark:border-slate-900 rounded-full shadow-2xs group-hover:scale-125 transition"></div>

                {/* Log Item Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  
                  {/* Top Bar: Actor & Timestamp */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{log.actorName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                        {log.actorRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{dateStr} • {timeStr} WIB</span>
                    </div>
                  </div>

                  {/* Status Transition Badges */}
                  <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold">
                      {getStatusIndonesianLabel(log.fromStatus)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold">
                      {getStatusIndonesianLabel(log.toStatus)}
                    </span>

                    {log.stageName && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                        {log.stageName}
                      </span>
                    )}
                  </div>

                  {/* Notes / Description */}
                  {log.notes && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 border-l-2 border-indigo-600">
                      {log.notes}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
