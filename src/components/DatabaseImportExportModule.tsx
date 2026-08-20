import React, { useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  FileSpreadsheet, 
  Sparkles, 
  Info,
  X,
  Radio,
  FileCheck2,
  Table as TableIcon
} from 'lucide-react';
import { 
  DatabaseTargetTable, 
  DATABASE_TABLE_METAS, 
  generateSampleCsvTemplate, 
  generateSampleJsonTemplate,
  parseAndValidateImportPayload,
  ParseAndValidationResult
} from '../lib/databaseTemplates';
import { 
  executeImportToSupabase, 
  isSupabaseConfigured,
  saveApplicationToSupabase,
  batchSaveApplicationsToSupabase
} from '../lib/supabase';
import { Application, UserAccount, NotificationLog, StatusAuditLog, PrasaranaPriceConfig } from '../types';
import { getStoredUserAccounts, saveStoredUserAccounts } from '../lib/accountEngine';
import { getStoredNotifications, saveStoredNotifications, getStoredAuditLogs, saveStoredApplications } from '../lib/storage';

interface DatabaseImportExportModuleProps {
  applications?: Application[];
  onApplicationsImported?: (apps: Application[]) => void;
  onRefreshApplications?: (forceFull?: boolean) => Promise<void>;
}

export const DatabaseImportExportModule: React.FC<DatabaseImportExportModuleProps> = ({
  applications = [],
  onApplicationsImported,
  onRefreshApplications
}) => {
  const [selectedTable, setSelectedTable] = useState<DatabaseTargetTable>('APPLICATIONS');
  const [inputFormat, setInputFormat] = useState<'JSON' | 'CSV'>('CSV');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'UPSERT' | 'INSERT_NEW' | 'REPLACE_ALL'>('UPSERT');
  
  // Validation state
  const [validationResult, setValidationResult] = useState<ParseAndValidationResult<any> | null>(null);
  
  // Execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importReport, setImportReport] = useState<{
    success: boolean;
    inserted: number;
    updated: number;
    failed: number;
    errors: string[];
    timestamp: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMeta = DATABASE_TABLE_METAS[selectedTable];

  // Auto-switch format if FULL_BUNDLE is selected (JSON only)
  const handleTableChange = (table: DatabaseTargetTable) => {
    setSelectedTable(table);
    setValidationResult(null);
    setImportReport(null);
    setFileName(null);
    setRawText('');
    if (table === 'FULL_BUNDLE') {
      setInputFormat('JSON');
    }
  };

  // Download Sample Template (JSON or CSV)
  const handleDownloadTemplate = (format: 'JSON' | 'CSV') => {
    let content = '';
    let ext = 'json';
    let mimeType = 'application/json';

    if (format === 'CSV') {
      content = generateSampleCsvTemplate(selectedTable);
      ext = 'csv';
      mimeType = 'text/csv';
    } else {
      content = generateSampleJsonTemplate(selectedTable);
      ext = 'json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEMPLATE_SIMBG_${selectedTable}_${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1-Click Load Demo Data into Editor
  const handleLoadSampleData = () => {
    const sample = inputFormat === 'CSV' 
      ? generateSampleCsvTemplate(selectedTable)
      : generateSampleJsonTemplate(selectedTable);
    
    setRawText(sample);
    setFileName(`contoh_data_${selectedTable.toLowerCase()}.${inputFormat.toLowerCase()}`);
    
    // Auto-validate immediately
    const res = parseAndValidateImportPayload(selectedTable, sample, inputFormat);
    setValidationResult(res);
    setImportReport(null);
  };

  // Handle File Upload / Dropzone
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isCsv = file.name.endsWith('.csv');
    const isJson = file.name.endsWith('.json');
    const fmt = isCsv ? 'CSV' : isJson ? 'JSON' : inputFormat;
    setInputFormat(fmt);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      const res = parseAndValidateImportPayload(selectedTable, text, fmt);
      setValidationResult(res);
      setImportReport(null);
    };
    reader.readAsText(file);
  };

  // Handle Textarea Change & Live Re-validate
  const handleRawTextChange = (text: string) => {
    setRawText(text);
    if (text.trim().length > 0) {
      const res = parseAndValidateImportPayload(selectedTable, text, inputFormat);
      setValidationResult(res);
    } else {
      setValidationResult(null);
    }
    setImportReport(null);
  };

  // Export Active Live Data
  const handleExportLiveData = (format: 'JSON' | 'CSV') => {
    let exportData: any[] = [];
    
    switch (selectedTable) {
      case 'APPLICATIONS':
        exportData = applications;
        break;
      case 'USER_ACCOUNTS':
        exportData = getStoredUserAccounts();
        break;
      case 'NOTIFICATION_LOGS':
        exportData = getStoredNotifications();
        break;
      case 'STATUS_AUDIT_LOGS':
        exportData = getStoredAuditLogs();
        break;
      case 'FULL_BUNDLE':
        exportData = [{
          version: 'SIMBG-GARUT-V2-2026',
          exportedAt: new Date().toISOString(),
          applications,
          userAccounts: getStoredUserAccounts(),
          notificationLogs: getStoredNotifications(),
          statusAuditLogs: getStoredAuditLogs()
        }];
        break;
      default:
        exportData = applications;
    }

    let output = '';
    let ext = 'json';
    let mimeType = 'application/json';

    if (format === 'JSON' || selectedTable === 'FULL_BUNDLE') {
      output = JSON.stringify(exportData, null, 2);
      ext = 'json';
      mimeType = 'application/json';
    } else {
      // Export as CSV
      if (selectedTable === 'APPLICATIONS') {
        const headers = ['registerNumber', 'applicantName', 'applicantPhone', 'applicantEmail', 'buildingName', 'functionType', 'buildingDistrict', 'buildingVillage', 'buildingArea', 'landArea', 'floors', 'height', 'permitType', 'status', 'submissionDate'];
        const rows = (exportData as Application[]).map(a => [
          `"${a.registerNumber}"`,
          `"${a.applicant?.name || ''}"`,
          `"${a.applicant?.phone || ''}"`,
          `"${a.applicant?.email || ''}"`,
          `"${a.building?.name || ''}"`,
          `"${a.building?.functionType || ''}"`,
          `"${a.building?.district || ''}"`,
          `"${a.building?.village || ''}"`,
          a.building?.buildingArea || 0,
          a.building?.landArea || 0,
          a.building?.floors || 1,
          a.building?.height || 0,
          `"${a.permitType || 'PBG_BARU'}"`,
          `"${a.status || 'NEW'}"`,
          `"${a.submissionDate || ''}"`
        ].join(','));
        output = [headers.join(','), ...rows].join('\n');
      } else if (selectedTable === 'USER_ACCOUNTS') {
        const headers = ['username', 'name', 'nip', 'email', 'role', 'positionTitle', 'subSpecialty', 'phone', 'isActive'];
        const rows = (exportData as UserAccount[]).map(u => [
          `"${u.username}"`,
          `"${u.name}"`,
          `"${u.nip || ''}"`,
          `"${u.email}"`,
          `"${u.role}"`,
          `"${u.positionTitle}"`,
          `"${u.subSpecialty || ''}"`,
          `"${u.phone || ''}"`,
          u.isActive
        ].join(','));
        output = [headers.join(','), ...rows].join('\n');
      } else if (selectedTable === 'NOTIFICATION_LOGS') {
        const headers = ['id', 'registerNumber', 'recipientName', 'recipientPhone', 'templateType', 'message', 'status', 'channel', 'createdAt'];
        const rows = (exportData as NotificationLog[]).map(l => [
          `"${l.id}"`,
          `"${l.registerNumber}"`,
          `"${l.recipientName}"`,
          `"${l.recipientPhone}"`,
          `"${l.templateType}"`,
          `"${l.message.replace(/"/g, '""')}"`,
          `"${l.status}"`,
          `"${l.channel || 'WHATSAPP'}"`,
          `"${l.createdAt}"`
        ].join(','));
        output = [headers.join(','), ...rows].join('\n');
      } else {
        output = JSON.stringify(exportData, null, 2);
      }
      ext = 'csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([output], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EKSPOR_SIMBG_${selectedTable}_${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Commit & Execute Import to Supabase & Local Cache
  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.success || validationResult.data.length === 0) return;

    setIsImporting(true);
    setImportProgress(10);
    setImportReport(null);

    const startTime = Date.now();

    try {
      if (selectedTable === 'FULL_BUNDLE') {
        const bundle = validationResult.data[0];
        let totalInserted = 0;
        const allErrors: string[] = [];

        // 1. Applications in bundle
        if (bundle.applications && Array.isArray(bundle.applications)) {
          const res = await executeImportToSupabase('applications', bundle.applications, importMode);
          totalInserted += res.insertedCount;
          if (res.errors.length) allErrors.push(...res.errors);
          if (onApplicationsImported) onApplicationsImported(bundle.applications);
        }

        // 2. User accounts in bundle
        if (bundle.userAccounts && Array.isArray(bundle.userAccounts)) {
          const res = await executeImportToSupabase('user_accounts', bundle.userAccounts, importMode);
          totalInserted += res.insertedCount;
          if (res.errors.length) allErrors.push(...res.errors);
          saveStoredUserAccounts(bundle.userAccounts);
        }

        // 3. Notification logs in bundle
        if (bundle.notificationLogs && Array.isArray(bundle.notificationLogs)) {
          const res = await executeImportToSupabase('notification_logs', bundle.notificationLogs, importMode);
          totalInserted += res.insertedCount;
          if (res.errors.length) allErrors.push(...res.errors);
          saveStoredNotifications(bundle.notificationLogs);
        }

        // 4. Prasarana Prices in bundle
        if (bundle.prasaranaPrices && Array.isArray(bundle.prasaranaPrices)) {
          const res = await executeImportToSupabase('prasarana_prices', bundle.prasaranaPrices, importMode);
          totalInserted += res.insertedCount;
          if (res.errors.length) allErrors.push(...res.errors);

          // Sync to Firestore too!
          try {
            const { importPricesToFirestore } = await import('../lib/firebaseSettings');
            await importPricesToFirestore(bundle.prasaranaPrices);
          } catch (err) {
            console.error('Failed to sync imported prasarana prices to Firestore:', err);
          }
        }

        setImportProgress(100);
        setImportReport({
          success: allErrors.length === 0,
          inserted: totalInserted,
          updated: 0,
          failed: allErrors.length,
          errors: allErrors,
          timestamp: new Date().toLocaleTimeString('id-ID')
        });

        if (onRefreshApplications) await onRefreshApplications(true);

      } else {
        // Single table import
        const dbTableName = currentMeta.tableName;
        const dataItems = validationResult.data;

        setImportProgress(30);

        // 1. Write to Supabase PostgreSQL in chunked execution
        const res = await executeImportToSupabase(
          dbTableName, 
          dataItems, 
          importMode,
          (pct) => setImportProgress(Math.max(30, pct))
        );

        // 2. Update local state caches for instant real-time reflection
        if (selectedTable === 'APPLICATIONS') {
          if (importMode === 'REPLACE_ALL') {
            saveStoredApplications(dataItems);
            if (onApplicationsImported) onApplicationsImported(dataItems);
          } else {
            const currentMap = new Map(applications.map(a => [a.id, a]));
            dataItems.forEach((a: Application) => currentMap.set(a.id, a));
            const merged = Array.from(currentMap.values());
            saveStoredApplications(merged);
            if (onApplicationsImported) onApplicationsImported(merged);
          }
        } else if (selectedTable === 'USER_ACCOUNTS') {
          const existing = getStoredUserAccounts();
          const userMap = new Map(existing.map(u => [u.id, u]));
          dataItems.forEach((u: UserAccount) => userMap.set(u.id, u));
          saveStoredUserAccounts(Array.from(userMap.values()));
        } else if (selectedTable === 'NOTIFICATION_LOGS') {
          const existing = getStoredNotifications();
          saveStoredNotifications([...dataItems, ...existing]);
        }

        setImportProgress(100);
        setImportReport({
          success: res.success,
          inserted: res.insertedCount,
          updated: res.updatedCount,
          failed: res.failedCount,
          errors: res.errors,
          timestamp: new Date().toLocaleTimeString('id-ID')
        });

        if (onRefreshApplications) {
          await onRefreshApplications(false);
        }
      }
    } catch (err: any) {
      setImportReport({
        success: false,
        inserted: 0,
        updated: 0,
        failed: validationResult.data.length,
        errors: [err.message || 'Terjadi kesalahan sistem saat mengimpor.'],
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Modul Impor & Ekspor Database SIMBG
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Impor data berkas, akun pengguna, tarif, dan log notifikasi secara langsung ke PostgreSQL Supabase dan cache lokal dengan validasi skema otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Template Download Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate(inputFormat)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
            title="Unduh berkas template kolom resmi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Template {inputFormat}</span>
          </button>
          
          <button
            onClick={() => handleExportLiveData(inputFormat)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
            title="Ekspor seluruh data aktif yang ada di sistem"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ekspor Data Aktif</span>
          </button>
        </div>
      </div>

      {/* Step 1: Database Table Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px]">1</span>
          <span>Pilih Target Tabel Database:</span>
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(Object.keys(DATABASE_TABLE_METAS) as DatabaseTargetTable[]).map((tabKey) => {
            const meta = DATABASE_TABLE_METAS[tabKey];
            const isSelected = selectedTable === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => handleTableChange(tabKey)}
                className={`p-3 text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {meta.tableName}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-xs font-bold truncate mt-1">
                  {meta.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Table Details & Specifications Banner */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Spesifikasi Tabel: <code className="text-indigo-600 dark:text-indigo-400 font-mono">{currentMeta.tableName}</code>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Primary Key: <span className="font-bold text-slate-700 dark:text-slate-300">{currentMeta.primaryKey}</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
          {currentMeta.description}
        </p>
        
        {/* Column pills preview */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Kolom-kolom yang Didukung / Diimpor:</div>
          <div className="flex flex-wrap gap-1.5">
            {currentMeta.columns.map((col) => (
              <span
                key={col.name}
                className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                title={`${col.label} (${col.type}): ${col.description}`}
              >
                <span className={col.required ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>{col.name}</span>
                {col.required && <span className="text-rose-500 ml-0.5">*</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Input Format & Upload / Paste */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px]">2</span>
            <span>Unggah Berkas atau Masukkan Data ({inputFormat}):</span>
          </label>

          <div className="flex items-center gap-2">
            {selectedTable !== 'FULL_BUNDLE' && (
              <div className="flex border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setInputFormat('CSV');
                    if (rawText) parseAndValidateImportPayload(selectedTable, rawText, 'CSV');
                  }}
                  className={`px-3 py-1 text-xs font-bold uppercase transition ${
                    inputFormat === 'CSV' 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Format CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputFormat('JSON');
                    if (rawText) parseAndValidateImportPayload(selectedTable, rawText, 'JSON');
                  }}
                  className={`px-3 py-1 text-xs font-bold uppercase transition ${
                    inputFormat === 'JSON' 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Format JSON
                </button>
              </div>
            )}

            <button
              onClick={handleLoadSampleData}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase border border-amber-300 dark:border-amber-700 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Muat Contoh Data</span>
            </button>
          </div>
        </div>

        {/* Dropzone & File Picker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="md:col-span-1 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer flex flex-col items-center justify-center text-center space-y-2 transition group"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="hidden" 
            />
            <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full group-hover:scale-105 transition text-emerald-600">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pilih Berkas CSV / JSON
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                Klik untuk menjelajah atau seret berkas ke area ini
              </p>
            </div>
            {fileName && (
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 border border-emerald-200 dark:border-emerald-800 truncate max-w-full">
                {fileName}
              </div>
            )}
          </div>

          {/* Text Editor Area */}
          <div className="md:col-span-2 space-y-2">
            <textarea
              value={rawText}
              onChange={(e) => handleRawTextChange(e.target.value)}
              placeholder={
                inputFormat === 'CSV'
                  ? `Tempelkan baris data CSV di sini...\nContoh:\nregisterNumber,applicantName,applicantPhone...\nPBG-320501-20082026-001,H. Ahmad Supriyadi,08122334455...`
                  : `Tempelkan array JSON di sini...\nContoh:\n[\n  {\n    "registerNumber": "PBG-320501-20082026-001",\n    "applicant": { "name": "H. Ahmad" }\n  }\n]`
              }
              rows={8}
              className="w-full p-3 bg-slate-900 text-emerald-400 text-xs font-mono border border-slate-700 focus:border-emerald-500 focus:outline-hidden leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Ukuran Konten: {new Blob([rawText]).size} bytes | {rawText.split('\n').length} baris</span>
              {rawText && (
                <button
                  onClick={() => {
                    setRawText('');
                    setValidationResult(null);
                    setFileName(null);
                  }}
                  className="text-rose-500 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Bersihkan Editor
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Validation & Preview Section */}
      {validationResult && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px]">3</span>
              <span>Hasil Validasi Skema & Pratinjau:</span>
            </label>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{validationResult.validRows} Baris Valid</span>
              </span>
              {validationResult.invalidRows > 0 && (
                <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{validationResult.invalidRows} Baris Gagal</span>
                </span>
              )}
            </div>
          </div>

          {/* Validation Error Warnings if any */}
          {validationResult.errors.length > 0 && (
            <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Catatan Kesalahan Validasi:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-sans pl-1">
                {validationResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {validationResult.errors.length > 5 && (
                  <li>...dan {validationResult.errors.length - 5} kesalahan lainnya.</li>
                )}
              </ul>
            </div>
          )}

          {/* Data Preview Table */}
          {validationResult.previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                Pratinjau 5 Baris Data Teratas:
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700">#</th>
                      {selectedTable === 'APPLICATIONS' && (
                        <>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Register</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Pemohon</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Bangunan</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Fungsi</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Luas (m²)</th>
                          <th className="p-2">Status</th>
                        </>
                      )}
                      {selectedTable === 'USER_ACCOUNTS' && (
                        <>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Username</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Nama</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">NIP</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Role</th>
                          <th className="p-2">Jabatan</th>
                        </>
                      )}
                      {selectedTable === 'NOTIFICATION_LOGS' && (
                        <>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Register</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Penerima</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">No. WA</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Tipe Template</th>
                          <th className="p-2">Pesan</th>
                        </>
                      )}
                      {selectedTable === 'STATUS_AUDIT_LOGS' && (
                        <>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Register</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Status Asal</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Status Baru</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Petugas</th>
                          <th className="p-2">Catatan</th>
                        </>
                      )}
                      {selectedTable === 'PRASARANA_PRICES' && (
                        <>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">ID Kode</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Nama Prasarana</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Satuan</th>
                          <th className="p-2">Tarif Satuan</th>
                        </>
                      )}
                      {selectedTable === 'FULL_BUNDLE' && (
                        <>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Versi</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Total Berkas</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Total Akun</th>
                          <th className="p-2">Total Log WA</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {validationResult.previewRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 text-slate-400">{idx + 1}</td>
                        {selectedTable === 'APPLICATIONS' && (
                          <>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.registerNumber}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.applicant?.name}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.building?.name}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.building?.functionType}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.building?.buildingArea}</td>
                            <td className="p-2">{row.status}</td>
                          </>
                        )}
                        {selectedTable === 'USER_ACCOUNTS' && (
                          <>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.username}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.name}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.nip || '-'}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.role}</td>
                            <td className="p-2">{row.positionTitle}</td>
                          </>
                        )}
                        {selectedTable === 'NOTIFICATION_LOGS' && (
                          <>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.registerNumber}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.recipientName}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.recipientPhone}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.templateType}</td>
                            <td className="p-2 truncate max-w-xs">{row.message}</td>
                          </>
                        )}
                        {selectedTable === 'STATUS_AUDIT_LOGS' && (
                          <>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.registerNumber || '-'}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.fromStatus}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.toStatus}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.actorName}</td>
                            <td className="p-2 truncate max-w-xs">{row.notes || '-'}</td>
                          </>
                        )}
                        {selectedTable === 'PRASARANA_PRICES' && (
                          <>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.id}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.label}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.unit}</td>
                            <td className="p-2">Rp {Number(row.price).toLocaleString('id-ID')}</td>
                          </>
                        )}
                        {selectedTable === 'FULL_BUNDLE' && (
                          <>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.bundleVersion}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.totalApplications} berkas</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-700">{row.totalUserAccounts} akun</td>
                            <td className="p-2">{row.totalNotificationLogs} log</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Strategy & Execution Actions */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Strategi Penanganan Konflik & Duplikasi:
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  Pilih bagaimana sistem menangani data jika ID / Nomor Register sudah ada di database.
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <label className={`px-3 py-1.5 border cursor-pointer flex items-center gap-1.5 transition ${
                  importMode === 'UPSERT' 
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="UPSERT"
                    checked={importMode === 'UPSERT'}
                    onChange={() => setImportMode('UPSERT')}
                    className="hidden"
                  />
                  <span>UPSERT (Perbarui / Gabung)</span>
                </label>

                <label className={`px-3 py-1.5 border cursor-pointer flex items-center gap-1.5 transition ${
                  importMode === 'REPLACE_ALL' 
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="REPLACE_ALL"
                    checked={importMode === 'REPLACE_ALL'}
                    onChange={() => setImportMode('REPLACE_ALL')}
                    className="hidden"
                  />
                  <span>REPLACE_ALL (Ganti Total)</span>
                </label>
              </div>
            </div>

            {/* Commit Button */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Data akan langsung ditulis ke PostgreSQL Supabase & disinkronkan ke cache runtime.
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={isImporting || validationResult.validRows === 0}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengimpor ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Eksekusi Impor {validationResult.validRows} Baris ke Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar during Import */}
      {isImporting && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Mengimpor data ke PostgreSQL Supabase...</span>
            <span>{importProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 4: Import Report Result */}
      {importReport && (
        <div className={`p-5 border space-y-3 ${
          importReport.success 
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {importReport.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {importReport.success ? 'Impor Database Berhasil!' : 'Impor Selesai dengan Catatan'}
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">Pukul {importReport.timestamp}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase">Berhasil Disimpan</div>
              <div className="text-sm font-bold text-emerald-600">{importReport.inserted}</div>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase">Gagal / Dilewati</div>
              <div className="text-sm font-bold text-rose-600">{importReport.failed}</div>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase">Status Realtime</div>
              <div className="text-xs font-bold text-indigo-600">Aktif & Sinkron</div>
            </div>
          </div>

          {importReport.errors.length > 0 && (
            <div className="text-[11px] text-rose-700 dark:text-rose-400 font-sans space-y-0.5">
              <div className="font-bold">Log Peringatan / Kesalahan:</div>
              <ul className="list-disc list-inside pl-1">
                {importReport.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
