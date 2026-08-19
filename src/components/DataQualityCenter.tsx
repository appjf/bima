import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RotateCcw, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  RefreshCw,
  Layers,
  Wrench
} from 'lucide-react';
import { Application, DataQualityIssue } from '../types';
import { autoFixQualityIssue, scanDataQualityIssues } from '../lib/storage';

interface DataQualityCenterProps {
  applications: Application[];
  onUpdateApplications: (updated: Application[]) => void;
  onSelectApplication: (app: Application) => void;
}

export const DataQualityCenter: React.FC<DataQualityCenterProps> = ({
  applications,
  onUpdateApplications,
  onSelectApplication
}) => {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const issues = scanDataQualityIssues(applications);

  const filteredIssues = issues.filter(issue => {
    const matchSev = filterSeverity === 'ALL' || issue.severity === filterSeverity;
    const matchSearch = 
      issue.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      issue.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      issue.suggestion.toLowerCase().includes(search.toLowerCase()) ||
      issue.issueType.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  const handleFixAllAnomalies = () => {
    let current = applications;
    issues.forEach(issue => {
      current = autoFixQualityIssue(issue.applicationId, issue.issueType);
    });
    onUpdateApplications(current);
  };

  const handleSingleFix = (issue: DataQualityIssue) => {
    const updated = autoFixQualityIssue(issue.applicationId, issue.issueType);
    onUpdateApplications(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              DATA SANITY ENGINE // ANOMALY SCANNER
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 border border-emerald-200">
              {issues.length} ANOMALI DETECTED
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Pusat Sanitasi Data & Perbaikan Error Impor
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Mendeteksi dan memperbaiki kerusakan data akibat kesalahan rumus spreadsheet (seperti <code>=CONCATENATE</code>, <code>#REF!</code>, format nomor telepon rusak, dan duplikasi nomor registrasi).
          </p>
        </div>

        <button
          onClick={handleFixAllAnomalies}
          disabled={issues.length === 0}
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition ${
            issues.length > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-300" />
          <span>Auto-Fix Semua Anomali ({issues.length})</span>
        </button>
      </div>

      {/* Issues Table (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari register atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-mono">
            <span className="text-slate-400">SEVERITY:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL SEVERITY</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Severity & Tipe Anomali</th>
                <th className="px-4 py-3">No. Register & Pemohon</th>
                <th className="px-4 py-3">Field Rusak</th>
                <th className="px-4 py-3">Snippet Nilai Mentah</th>
                <th className="px-4 py-3">Rekomendasi Perbaikan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  
                  {/* Severity */}
                  <td className="px-4 py-3 font-mono">
                    <span className={`text-[10px] px-2 py-0.5 font-bold ${
                      issue.severity === 'CRITICAL'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {issue.issueType}
                    </span>
                  </td>

                  {/* Register & Applicant */}
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      {issue.registerNumber}
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {issue.applicantName}
                    </div>
                  </td>

                  {/* Field */}
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {issue.field}
                  </td>

                  {/* Raw Snippet */}
                  <td className="px-4 py-3 font-mono text-[11px] text-rose-600 dark:text-rose-400">
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700">
                      {issue.rawSnippet}
                    </code>
                  </td>

                  {/* Suggestion */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {issue.suggestion}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSingleFix(issue)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-bold uppercase transition"
                    >
                      Perbaiki
                    </button>
                  </td>

                </tr>
              ))}

              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                    ✓ SELURUH DATA BERSIH DARI FORMULA ERROR & ANOMALI SPREADSHEET.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
