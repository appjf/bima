import React from 'react';
import { Save, CheckCircle2, RotateCcw, Trash2, Clock, Sparkles } from 'lucide-react';

interface AutoSaveIndicatorProps {
  lastSavedTime: string | null;
  isSaving: boolean;
  hasDraft?: boolean;
  onLoadDraft?: () => void;
  onClearDraft?: () => void;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSavedTime,
  isSaving,
  hasDraft,
  onLoadDraft,
  onClearDraft,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-2 font-mono text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 ${className}`}>
      <div className="flex items-center gap-1.5">
        {isSaving ? (
          <Save className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
        ) : lastSavedTime ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        )}

        <span className="font-semibold">
          {isSaving ? (
            <span className="text-indigo-600 dark:text-indigo-400">Menyimpan Draf Otomatis...</span>
          ) : lastSavedTime ? (
            <span>Tersimpan Draf (30s): <strong className="text-emerald-700 dark:text-emerald-400">{lastSavedTime}</strong></span>
          ) : (
            <span className="text-slate-500">Auto-Save Aktif (30s)</span>
          )}
        </span>
      </div>

      {hasDraft && onLoadDraft && (
        <button
          type="button"
          onClick={onLoadDraft}
          className="ml-1 px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase transition flex items-center gap-1"
          title="Muat isi draf form yang tersimpan sebelumnya"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Pulihkan Draf</span>
        </button>
      )}

      {hasDraft && onClearDraft && (
        <button
          type="button"
          onClick={onClearDraft}
          className="p-0.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
          title="Hapus draf dari penyimpanan lokal"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
