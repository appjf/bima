import React, { useState, useRef } from 'react';
import { 
  Settings, 
  MessageSquare, 
  Sparkles, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Send, 
  ExternalLink, 
  Info, 
  Layers, 
  Phone, 
  Building2, 
  Sliders, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Smartphone,
  FileText,
  Tag,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  X,
  PenTool,
  ShieldCheck,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Coins,
  Database
} from 'lucide-react';
import { Application, WhatsAppSettings, WhatsAppTemplate } from '../types';
import { 
  AVAILABLE_TEMPLATE_TAGS, 
  DEFAULT_WHATSAPP_SETTINGS, 
  compileWhatsAppMessage 
} from '../lib/notificationTemplateEngine';
import { SignatureCanvasPad } from './SignatureCanvasPad';
import { getSavedSignatures, saveSignatures, SignatureStore, DigitalSignatureData } from '../lib/signatureEngine';
import { ASNPersonnelSettings } from './ASNPersonnelSettings';
import { useAutoSaveForm } from '../hooks/useAutoSaveForm';
import { DatabaseConnectivityModule } from './DatabaseConnectivityModule';
import { DatabaseImportExportModule } from './DatabaseImportExportModule';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { PrasaranaSettings } from './PrasaranaSettings';

interface SettingsViewProps {
  applications: Application[];
  settings: WhatsAppSettings;
  onSaveSettings: (newSettings: WhatsAppSettings) => void;
  onResetSettings: () => void;
  onOpenWhatsApp: (phone: string, text: string) => void;
  onOpenDatabaseManager?: () => void;
  onApplicationsImported?: (apps: Application[]) => void;
  onRefreshApplications?: (forceFull?: boolean) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  applications,
  settings,
  onSaveSettings,
  onResetSettings,
  onOpenWhatsApp,
  onOpenDatabaseManager,
  onApplicationsImported,
  onRefreshApplications
}) => {
  // Local active settings state
  const [currentSettings, setCurrentSettings] = useState<WhatsAppSettings>(settings);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    settings.templates[0]?.id || 'TPL-MASUK'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'TEMPLATES' | 'SIMULATOR' | 'ASN' | 'SIGNATURE' | 'PRICES' | 'GENERAL' | 'BACKUP' | 'DATABASE'>('TEMPLATES');
  
  // Digital Signatures Store
  const [signaturesStore, setSignaturesStore] = useState<SignatureStore>(() => getSavedSignatures());

  const handleUpdateRoleSignature = (role: 'operator' | 'pengawas' | 'kabid', updated: DigitalSignatureData) => {
    const newStore: SignatureStore = {
      ...signaturesStore,
      [role]: updated
    };
    setSignaturesStore(newStore);
    saveSignatures(newStore);
  };
  
  // Sample application for live preview
  const [previewAppId, setPreviewAppId] = useState<string>(applications[0]?.id || '');
  
  // Feedback states
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [tagInsertFeedback, setTagInsertFeedback] = useState<string | null>(null);

  // Reordering & Preview Toggle states
  const [isPreviewToggleActive, setIsPreviewToggleActive] = useState(false);
  const [draggedTemplateIndex, setDraggedTemplateIndex] = useState<number | null>(null);

  // Auto-save form progress hook for SettingsView (every 30 seconds)
  const autoSave = useAutoSaveForm({
    key: 'simbg_garut_wa_settings_draft',
    data: currentSettings,
    intervalMs: 30000,
    enabled: true,
    onSave: (savedData) => {
      onSaveSettings(savedData);
    }
  });

  // Template Reordering handlers
  const handleMoveTemplate = (index: number, direction: 'UP' | 'DOWN') => {
    const newTemplates = [...currentSettings.templates];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTemplates.length) return;

    const [moved] = newTemplates.splice(index, 1);
    newTemplates.splice(targetIndex, 0, moved);

    const updated = { ...currentSettings, templates: newTemplates };
    setCurrentSettings(updated);
    handleSave(updated);
  };

  const handleDragStartTemplate = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTemplateIndex(index);
  };

  const handleDropTemplate = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDraggedTemplateIndex(null);
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    if (dragIndexStr === '') return;
    const dragIndex = parseInt(dragIndexStr, 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    const newTemplates = [...currentSettings.templates];
    const [moved] = newTemplates.splice(dragIndex, 1);
    newTemplates.splice(dropIndex, 0, moved);

    const updated = { ...currentSettings, templates: newTemplates };
    setCurrentSettings(updated);
    handleSave(updated);
  };

  // New Template Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'VERIFIKASI' | 'VISITE' | 'KONSULTASI' | 'RETRIBUSI' | 'PENERBITAN' | 'UMUM'>('UMUM');
  const [newTriggerStatus, setNewTriggerStatus] = useState('CUSTOM');
  const [newDescription, setNewDescription] = useState('');
  const [newBody, setNewBody] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedApp = applications.find(a => a.id === previewAppId) || applications[0];
  const activeTemplate = currentSettings.templates.find(t => t.id === selectedTemplateId) || currentSettings.templates[0];

  // Create new template
  const handleAddNewTemplate = () => {
    if (!newTitle.trim() || !newBody.trim()) {
      alert('Judul template dan isi pesan tidak boleh kosong.');
      return;
    }

    const templateId = `TPL-CUST-${Date.now().toString(36).toUpperCase()}`;
    const newTpl: WhatsAppTemplate = {
      id: templateId,
      title: newTitle.trim(),
      category: newCategory,
      triggerStatus: newTriggerStatus.trim() || 'CUSTOM',
      description: newDescription.trim() || 'Template custom buatan operator',
      templateBody: newBody,
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Operator SIMBG'
    };

    const updated = {
      ...currentSettings,
      templates: [newTpl, ...currentSettings.templates]
    };

    setCurrentSettings(updated);
    setSelectedTemplateId(templateId);
    handleSave(updated);

    // Reset modal fields
    setNewTitle('');
    setNewDescription('');
    setNewBody('');
    setNewTriggerStatus('CUSTOM');
    setIsCreateModalOpen(false);
  };

  // Delete a template
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus template pesan WhatsApp ini?')) {
      const updatedTemplates = currentSettings.templates.filter(t => t.id !== templateId);
      const updated = { ...currentSettings, templates: updatedTemplates };
      setCurrentSettings(updated);
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(updatedTemplates[0]?.id || '');
      }
      handleSave(updated);
    }
  };

  // Save changes
  const handleSave = (updated: WhatsAppSettings = currentSettings) => {
    onSaveSettings(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  // Update a single template body
  const handleTemplateBodyChange = (newBody: string) => {
    const updatedTemplates = currentSettings.templates.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, templateBody: newBody, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    const updated = { ...currentSettings, templates: updatedTemplates };
    setCurrentSettings(updated);
  };

  // Toggle template active state
  const handleToggleTemplateActive = (templateId: string) => {
    const updatedTemplates = currentSettings.templates.map(t => {
      if (t.id === templateId) {
        return { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    const updated = { ...currentSettings, templates: updatedTemplates };
    setCurrentSettings(updated);
    handleSave(updated);
  };

  // Insert tag into textarea at cursor position
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = activeTemplate?.templateBody || '';
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);
    
    handleTemplateBodyChange(newText);
    
    setTagInsertFeedback(`Tag ${tag} disisipkan`);
    setTimeout(() => setTagInsertFeedback(null), 1800);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Reset single template to default
  const handleResetSingleTemplate = (templateId: string) => {
    const defaultTpl = DEFAULT_WHATSAPP_SETTINGS.templates.find(t => t.id === templateId);
    if (!defaultTpl) return;
    const updatedTemplates = currentSettings.templates.map(t => {
      if (t.id === templateId) {
        return { ...defaultTpl };
      }
      return t;
    });
    const updated = { ...currentSettings, templates: updatedTemplates };
    setCurrentSettings(updated);
    handleSave(updated);
  };

  // Reset all to default
  const handleResetAll = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan SEMUA template dan pengaturan WhatsApp ke setelan bawaan standar DPUPR Garut?')) {
      onResetSettings();
      setCurrentSettings(DEFAULT_WHATSAPP_SETTINGS);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `simbg-wa-templates-garut-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.templates && Array.isArray(parsed.templates)) {
          const merged: WhatsAppSettings = {
            ...DEFAULT_WHATSAPP_SETTINGS,
            ...parsed
          };
          setCurrentSettings(merged);
          handleSave(merged);
          alert('Template berhasil diimpor!');
        } else {
          alert('Format berkas JSON tidak sesuai struktur template WhatsApp SIMBG.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON: format tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  // Filter templates
  const filteredTemplates = currentSettings.templates.filter(t => {
    if (selectedCategoryFilter !== 'ALL' && t.category !== selectedCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.triggerStatus.toLowerCase().includes(q) ||
        t.templateBody.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Compiled preview text
  const previewRendered = selectedApp && activeTemplate 
    ? compileWhatsAppMessage(activeTemplate.templateBody, selectedApp, undefined, currentSettings)
    : 'Pilih permohonan untuk melihat preview.';

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewRendered);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleTestSendWhatsApp = () => {
    if (!selectedApp) return;
    onOpenWhatsApp(selectedApp.applicant.phone, previewRendered);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>SETTINGS & COMMUNICATION ENGINE // WHATSAPP AUTOMATION</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 border border-emerald-200">
              PP NO. 16/2021
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Pengaturan Template Pesan Otomatis WhatsApp
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl mt-0.5">
            Kustomisasi narasi pesan otomatis untuk setiap status alur permohonan PBG & SLF. Sisipkan variabel dinamis (*tags*), sesuaikan nomor helpdesk dinas, dan uji coba langsung dengan simulator WhatsApp.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <AutoSaveIndicator
            lastSavedTime={autoSave.lastSavedTime}
            isSaving={autoSave.isSaving}
            hasDraft={autoSave.hasDraft}
            onLoadDraft={() => {
              const draft = autoSave.loadDraft();
              if (draft) {
                setCurrentSettings(draft);
                onSaveSettings(draft);
              }
            }}
            onClearDraft={autoSave.clearDraft}
          />

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Template</span>
          </button>

          <button
            onClick={() => handleSave()}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition shadow-xs ${
              isSavedRecently 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 transition"
            title="Kembalikan semua template ke default dinas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-xs font-mono font-bold uppercase overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('TEMPLATES')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'TEMPLATES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>Editor Template Status ({currentSettings.templates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SIMULATOR')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'SIMULATOR'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-600" />
          <span>Simulator Live WhatsApp & Uji Kirim</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ASN')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'ASN'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Identitas Kepegawaian ASN</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SIGNATURE')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'SIGNATURE'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PenTool className="w-4 h-4 text-amber-600" />
          <span>Tanda Tangan Digital (TTE) & QR Code</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PRICES')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'PRICES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4 text-indigo-600" />
          <span>Pengaturan Harga & SHST</span>
        </button>

        <button
          onClick={() => setActiveSubTab('GENERAL')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'GENERAL'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Parameter Instansi & Helpdesk</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BACKUP')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'BACKUP'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Cadangan & Impor JSON</span>
        </button>

        <button
          onClick={() => setActiveSubTab('DATABASE')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeSubTab === 'DATABASE'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-emerald-600/80 hover:text-emerald-700 dark:hover:text-emerald-300'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Database Supabase & SQL</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATE EDITOR (MAIN) */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Template List (5 Cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                Daftar Template Status ({filteredTemplates.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-400">PILIH STATUS</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari status atau isi template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold uppercase">
              {['ALL', 'VERIFIKASI', 'KONSULTASI', 'VISITE', 'RETRIBUSI', 'PENERBITAN'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2 py-1 border transition whitespace-nowrap ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat}
                </button>
              ))}
            </div>

            {/* Template Item List with Drag-and-Drop Reordering */}
            <div className="space-y-1 text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Urutan Template (Geser / Gunakan Tombol Panah):</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[580px] overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                const realIndex = currentSettings.templates.findIndex(t => t.id === tpl.id);
                const isFirst = realIndex === 0;
                const isLast = realIndex === currentSettings.templates.length - 1;

                return (
                  <div
                    key={tpl.id}
                    draggable
                    onDragStart={(e) => handleDragStartTemplate(e, realIndex)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropTemplate(e, realIndex)}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 cursor-pointer transition flex flex-col gap-1 border-l-2 select-none group ${
                      draggedTemplateIndex === realIndex ? 'opacity-40 bg-indigo-100 dark:bg-indigo-900 border-indigo-400' : ''
                    } ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <GripVertical className="w-3.5 h-3.5 shrink-0" />
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                          {tpl.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Reorder Buttons */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTemplate(realIndex, 'UP');
                          }}
                          className={`p-1 transition ${
                            isFirst ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'
                          }`}
                          title="Naikkan Urutan"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTemplate(realIndex, 'DOWN');
                          }}
                          className={`p-1 transition ${
                            isLast ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'
                          }`}
                          title="Turunkan Urutan"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTemplateActive(tpl.id);
                          }}
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border transition ${
                            tpl.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300'
                          }`}
                          title={tpl.isActive ? 'Klik untuk menonaktifkan notifikasi otomatis' : 'Klik untuk mengaktifkan'}
                        >
                          {tpl.isActive ? 'AKTIF' : 'NONAKTIF'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(tpl.id);
                          }}
                          className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pl-5">
                      <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.2 text-slate-600 dark:text-slate-400">
                        {tpl.category}
                      </span>
                      <span>Trigger: <strong className="text-indigo-600 dark:text-indigo-400">{tpl.triggerStatus}</strong></span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-sans leading-tight pl-5">
                      {tpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Editor & Dynamic Tags (8 Cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            {activeTemplate ? (
              <>
                {/* Active Template Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 border border-indigo-200">
                        KATEGORI: {activeTemplate.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        STATUS TRIGGER: <strong className="text-slate-900 dark:text-white font-bold">{activeTemplate.triggerStatus}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono uppercase mt-1">
                      {activeTemplate.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeTemplate.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsPreviewToggleActive(!isPreviewToggleActive)}
                      className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase border flex items-center gap-1.5 transition ${
                        isPreviewToggleActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                      title="Alihkan ke tampilan pratinjau pesan WhatsApp dengan data pemohon nyata"
                    >
                      {isPreviewToggleActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isPreviewToggleActive ? 'Mode Edit Teks' : 'Pratinjau Live WhatsApp'}</span>
                    </button>

                    <button
                      onClick={() => handleResetSingleTemplate(activeTemplate.id)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                      title="Kembalikan narasi template ini ke format standar"
                    >
                      Reset Template
                    </button>
                    
                    <button
                      onClick={() => handleSave()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-mono font-bold uppercase transition"
                    >
                      Simpan
                    </button>
                  </div>
                </div>

                {isPreviewToggleActive ? (
                  /* LIVE WHATSAPP PREVIEW TOGGLE PANEL */
                  <div className="space-y-4 bg-emerald-950/20 dark:bg-emerald-950/40 p-5 border border-emerald-500/30 font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                          Simulasi Pratinjau WhatsApp Real-time
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Berkas Contoh:</span>
                        <select
                          value={previewAppId}
                          onChange={(e) => setPreviewAppId(e.target.value)}
                          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] font-mono"
                        >
                          {applications.map(app => (
                            <option key={app.id} value={app.id}>
                              {app.registerNumber} - {app.applicant.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* WhatsApp Chat Container */}
                    <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-4 rounded-lg shadow-inner space-y-3">
                      <div className="text-center text-[10px] font-mono text-slate-500 bg-white/60 dark:bg-slate-800/60 py-1 px-3 rounded-full w-max mx-auto border border-slate-300 dark:border-slate-700">
                        🔒 Pesan terenkripsi secara otomatis melalui Helpdesk SIMBG DPUPR Garut
                      </div>

                      {/* Green WhatsApp Bubble */}
                      <div className="max-w-xl bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-emerald-50 p-4 rounded-lg shadow-xs space-y-2 border border-emerald-600/20 relative ml-auto font-sans text-xs leading-relaxed whitespace-pre-wrap">
                        <div className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200 border-b border-emerald-600/20 pb-1 mb-2 flex justify-between items-center">
                          <span>DPUPR Garut Official Notifier</span>
                          <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                        </div>
                        {compileWhatsAppMessage(activeTemplate.templateBody, selectedApp, undefined, currentSettings)}
                        <div className="text-[9px] text-emerald-700 dark:text-emerald-300 text-right font-mono mt-2">
                          ✓✓ Terkirim
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 font-mono text-xs">
                      <span className="text-[11px] text-slate-500">
                        Penerima: <strong className="text-slate-800 dark:text-slate-200">{selectedApp?.applicant.name}</strong> ({selectedApp?.applicant.phone})
                      </span>
                      <button
                        onClick={handleTestSendWhatsApp}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Uji Coba WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Interactive Dynamic Variables / Tags Inserter Palette */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Daftar Variabel Dinamis (Klik untuk Menyisipkan ke Pesan):</span>
                    </span>
                    {tagInsertFeedback && (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200 animate-pulse">
                        ✓ {tagInsertFeedback}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1">
                    {AVAILABLE_TEMPLATE_TAGS.map(t => (
                      <button
                        key={t.tag}
                        onClick={() => handleInsertTag(t.tag)}
                        className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold transition flex items-center gap-1 shadow-2xs hover:border-indigo-400 group"
                        title={`${t.description} (Contoh: ${t.example})`}
                      >
                        <span>{t.tag}</span>
                        <span className="text-[9px] text-slate-400 group-hover:text-indigo-500">[{t.label}]</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    * Variabel di dalam tanda kurung kurawal akan otomatis digantikan dengan data riil dari berkas permohonan saat pesan dikirimkan.
                  </p>
                </div>

                {/* Textarea Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <label className="font-bold uppercase text-slate-700 dark:text-slate-300">
                      Isi Teks Template Pesan WhatsApp:
                    </label>
                    <span>
                      {activeTemplate.templateBody.length} Karakter // {activeTemplate.templateBody.split('\n').length} Baris
                    </span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={12}
                    value={activeTemplate.templateBody}
                    onChange={(e) => handleTemplateBodyChange(e.target.value)}
                    placeholder="Tuliskan format pesan WhatsApp di sini..."
                    className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-y"
                  />
                </div>

                {/* Formatting Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-800/30 p-3 border border-slate-200 dark:border-slate-800 text-slate-500">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">*Teks Tebal*</strong> = Hasil: <strong>Teks Tebal</strong>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">_Teks Miring_</strong> = Hasil: <em>Teks Miring</em>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">~Teks Coret~</strong> = Hasil: <del>Teks Coret</del>
                  </div>
                </div>
                </>
                )}

              </>
            ) : (
              <div className="text-center py-20 text-slate-400 font-mono text-xs">
                Pilih salah satu template di panel kiri untuk mulai mengedit.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: LIVE SIMULATOR & TEST SEND */}
      {activeSubTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Configuration & Sample Data Selector (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                Pengaturan Pratinjau Simulator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih template pesan dan berkas contoh untuk melihat hasil parsing data secara nyata.
              </p>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">Pilih Template yang Diuji:</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans font-semibold text-xs"
              >
                {currentSettings.templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Sample Application Selector */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">Pilih Contoh Berkas Permohonan Riil:</label>
              <select
                value={previewAppId}
                onChange={(e) => setPreviewAppId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans text-xs"
              >
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.registerNumber} - {a.applicant.name} ({a.building.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Sample Application Details Snapshot */}
            {selectedApp && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block uppercase text-xs">
                  Ringkasan Data Pemohon Terpilih:
                </span>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Pemohon</span>
                  <span className="col-span-2 font-bold">: {selectedApp.applicant.name}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">No. WhatsApp</span>
                  <span className="col-span-2 font-bold text-emerald-600">: {selectedApp.applicant.phone}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Bangunan</span>
                  <span className="col-span-2">: {selectedApp.building.name}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Lokasi</span>
                  <span className="col-span-2">: Kec. {selectedApp.building.district}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Luas / Lantai</span>
                  <span className="col-span-2">: {selectedApp.building.buildingArea} m² ({selectedApp.building.floors} Lt)</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Status SIMBG</span>
                  <span className="col-span-2 font-bold text-indigo-600">: {selectedApp.status}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleTestSendWhatsApp}
                disabled={!selectedApp}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>Uji Kirim Pesan ke WhatsApp Web Pemohon</span>
              </button>

              <button
                onClick={handleCopyPreview}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition"
              >
                {copiedPreview ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPreview ? 'Berhasil Disalin!' : 'Salin Teks Pesan'}</span>
              </button>
            </div>

          </div>

          {/* Right: WhatsApp Smartphone Frame Live Simulator (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950 p-6 flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <div className="w-full max-w-md bg-[#0b141a] text-slate-100 rounded-none shadow-2xl border border-slate-700 overflow-hidden flex flex-col font-sans">
              
              {/* WhatsApp App Header */}
              <div className="bg-[#202c33] p-3 flex items-center justify-between text-white border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#00a884] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    SIMBG
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-none">
                      DPUPR Kab. Garut (SIMBG Layanan)
                    </h4>
                    <span className="text-[10px] text-[#8696a0]">
                      Official Service Notification // Online
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 border border-[#00a884]/30">
                  VERIFIED
                </div>
              </div>

              {/* Chat Canvas (WhatsApp Background) */}
              <div className="p-4 space-y-3 bg-[#0b141a] min-h-[380px] max-h-[460px] overflow-y-auto flex flex-col justify-end">
                
                {/* Date stamp pill */}
                <div className="flex justify-center">
                  <span className="text-[10px] bg-[#182229] text-[#8696a0] px-3 py-0.5 font-mono shadow-xs uppercase">
                    HARI INI // SISTEM OTOMATIS
                  </span>
                </div>

                {/* WhatsApp Message Bubble (Green DPUPR Outbox) */}
                <div className="self-end bg-[#005c4b] text-white p-3.5 max-w-[92%] rounded-none shadow-md space-y-2 text-xs leading-relaxed border-l-2 border-[#00a884]">
                  <div className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed select-text">
                    {previewRendered}
                  </div>

                  {/* Message Metadata & Ticks */}
                  <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] font-mono pt-1">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>

              </div>

              {/* Chat Input Placeholder Bar */}
              <div className="bg-[#202c33] p-2 flex items-center justify-between text-[#8696a0] text-xs font-mono border-t border-slate-700">
                <span className="px-2">Pesan otomatis terenkripsi end-to-end</span>
                <span className="text-[#00a884] font-bold">DPUPR GARUT</span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB: ASN PERSONNEL IDENTITIES */}
      {activeSubTab === 'ASN' && (
        <ASNPersonnelSettings />
      )}

      {/* TAB: DIGITAL SIGNATURE (TTE) & QR CODE CONVERSION */}
      {activeSubTab === 'SIGNATURE' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-2 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <PenTool className="w-4 h-4" />
              <span>PENGATURAN TANDA TANGAN DIGITAL (TTE) & KOLEKSI QR CODE VERIFIKASI</span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Buat goresan tanda tangan digital berbasis canvas atau unggah berkas gambar tanda tangan untuk Operator SIMBG, Pengawas SIMBG, dan Kepala Bidang Bangunan. Sistem secara otomatis mengonversi tanda tangan tersebut menjadi <strong>QR Code Terverifikasi</strong> yang dapat discan pada dokumen PDF (SKRD, BA Konsultasi, BA Visite, Surat Pemberitahuan Verifikasi).
            </p>
          </div>

          <div className="space-y-6">
            {/* Operator SIMBG Pad */}
            <SignatureCanvasPad
              roleTitle="OPERATOR TEKNIS SIMBG"
              signatureData={signaturesStore.operator}
              onSaveSignature={(updated) => handleUpdateRoleSignature('operator', updated)}
            />

            {/* Pengawas SIMBG Pad */}
            <SignatureCanvasPad
              roleTitle="PENGAWAS SIMBG DPUPR GARUT"
              signatureData={signaturesStore.pengawas}
              onSaveSignature={(updated) => handleUpdateRoleSignature('pengawas', updated)}
            />

            {/* Kepala Bidang Bangunan Pad */}
            <SignatureCanvasPad
              roleTitle="KEPALA BIDANG BANGUNAN (a.n. KEPALA DINAS PUPR)"
              signatureData={signaturesStore.kabid}
              onSaveSignature={(updated) => handleUpdateRoleSignature('kabid', updated)}
            />
          </div>
        </div>
      )}

      {/* TAB 5: PRICES SETTINGS */}
      {activeSubTab === 'PRICES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <PrasaranaSettings />
        </div>
      )}

      {/* TAB 6: GENERAL AGENCY & HELPDESK PARAMETERS */}
      {activeSubTab === 'GENERAL' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-w-4xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Parameter Instansi, Helpdesk & Format Tambahan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nilai parameter ini akan otomatis menggantikan tag seperti <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5">{`{kontak_helpdesk}`}</code> dan <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5">{`{link_simbg}`}</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono text-xs">
            
            {/* Agency Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Nama Instansi Resmi (Dinas):
              </label>
              <input
                type="text"
                value={currentSettings.agencyName}
                onChange={(e) => setCurrentSettings(prev => ({ ...prev, agencyName: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            {/* Helpdesk Phone */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Nomor WhatsApp Helpdesk / Call Center SIMBG Garut:
              </label>
              <input
                type="text"
                value={currentSettings.helpdeskPhone}
                onChange={(e) => setCurrentSettings(prev => ({ ...prev, helpdeskPhone: e.target.value }))}
                placeholder="e.g. 0811-2233-4455"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            {/* Portal URL */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Tautan Portal SIMBG Pusat:
              </label>
              <input
                type="text"
                value={currentSettings.portalUrl}
                onChange={(e) => setCurrentSettings(prev => ({ ...prev, portalUrl: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            {/* Header Greeting */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Format Salam Pembuka Standar:
              </label>
              <input
                type="text"
                value={currentSettings.headerGreeting}
                onChange={(e) => setCurrentSettings(prev => ({ ...prev, headerGreeting: e.target.value }))}
                placeholder="e.g. Yth. Bpk/Ibu"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            {/* Auto Append Footer Toggle */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white uppercase block">
                    Tambahkan Footer Instansi Otomatis di Akhir Pesan
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Menyisipkan nama dinas dan nomor helpdesk di setiap notifikasi keluar jika belum tercantum.
                  </span>
                </div>
                <button
                  onClick={() => setCurrentSettings(prev => ({ ...prev, autoAppendFooter: !prev.autoAppendFooter }))}
                  className={`text-xs font-mono font-bold px-3 py-1.5 border transition ${
                    currentSettings.autoAppendFooter
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-400 border-slate-300'
                  }`}
                >
                  {currentSettings.autoAppendFooter ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>

              {currentSettings.autoAppendFooter && (
                <textarea
                  rows={3}
                  value={currentSettings.customFooterText || ''}
                  onChange={(e) => setCurrentSettings(prev => ({ ...prev, customFooterText: e.target.value }))}
                  placeholder="Teks footer kustom..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs mt-2"
                />
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleSave()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase transition"
            >
              Simpan Parameter Instansi
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP, EXPORT & IMPORT */}
      {activeSubTab === 'BACKUP' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-w-4xl font-mono">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Cadangan, Ekspor & Pemulihan Template (JSON)
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Simpan konfigurasi seluruh narasi pesan WhatsApp ke dalam berkas JSON atau pulihkan dari cadangan sebelumnya.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Export Card */}
            <div className="border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs uppercase text-slate-900 dark:text-white">Ekspor Konfigurasi Template</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Unduh seluruh {currentSettings.templates.length} template dan parameter instansi sebagai berkas cadangan JSON lokal.
              </p>
              <button
                onClick={handleExportJson}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas JSON</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs uppercase text-slate-900 dark:text-white">Impor Berkas Cadangan</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Unggah berkas JSON yang sudah disiapkan untuk mengganti atau memulihkan susunan template pesan.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Berkas JSON</span>
              </button>
            </div>

          </div>

          {/* Reset Card */}
          <div className="border border-rose-200 dark:border-rose-900/40 p-5 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-xs uppercase text-rose-800 dark:text-rose-300">
                Kembalikan ke Standar Default DPUPR Garut
              </span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 font-sans">
              Tindakan ini akan menghapus kustomisasi template dan mengembalikan seluruh narasi pesan ke standar bawaan regulasi PP No. 16/2021.
            </p>
            <button
              onClick={handleResetAll}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase transition"
            >
              Reset Semua Template ke Bawaan
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: DATABASE SUPABASE HUB & CONNECTIVITY */}
      {activeSubTab === 'DATABASE' && (
        <div className="space-y-6">
          {/* Real-time Connectivity Module */}
          <DatabaseConnectivityModule onOpenDatabaseManager={onOpenDatabaseManager} />

          {/* Universal Database Import & Export Module with Templates */}
          <DatabaseImportExportModule
            applications={applications}
            onApplicationsImported={onApplicationsImported}
            onRefreshApplications={onRefreshApplications}
          />

          {/* Quick Hub Guides & Architecture Highlights */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
                    <Database className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Arsitektur Sinkronisasi & Migrasi PostgreSQL
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Integrasi Cloud Database PostgreSQL dengan Zero-Egress delta sync, skrip DDL SQL otomatis, dan migrasi sinkronisasi menyeluruh.
                    </p>
                  </div>
                </div>
              </div>

              {onOpenDatabaseManager && (
                <button
                  onClick={onOpenDatabaseManager}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <Database className="w-4 h-4" />
                  <span>Buka Dialog Migrasi & Schema SQL</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>1. Schema SQL & RLS</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Salin skrip DDL SQL 5 tabel (<code>applications</code>, <code>user_accounts</code>, <code>notification_logs</code>, dll) lalu jalankan di Supabase SQL Editor.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>2. Migrasi Menyeluruh</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Sinkronisasikan seluruh data berkas SIMBG, riwayat verifikasi teknis, presensi sidang, dan akun pengguna ke Supabase.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>3. Zero-Egress Protection</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Aplikasi dirancang dengan delta-sync dan metadata hashing agar hemat kuota network (egress) dan tahan terhadap koneksi lambat.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Buat Template Pesan Baru
                </h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Judul Template *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Pemberitahuan Dokumen Siap Diambil"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Kategori *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="VERIFIKASI">VERIFIKASI</option>
                    <option value="VISITE">VISITE</option>
                    <option value="KONSULTASI">KONSULTASI</option>
                    <option value="RETRIBUSI">RETRIBUSI</option>
                    <option value="PENERBITAN">PENERBITAN</option>
                    <option value="UMUM">UMUM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Status Trigger *
                  </label>
                  <input
                    type="text"
                    value={newTriggerStatus}
                    onChange={(e) => setNewTriggerStatus(e.target.value)}
                    placeholder="E.g. DOCUMENT_READY"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Keterangan singkat peruntukan template ini"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Isi Pesan WhatsApp (Dapat Menggunakan Variables/Tags) *
                </label>
                <textarea
                  rows={6}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Yth. Bpk/Ibu *{nama_pemohon}*,&#10;&#10;Permohonan {jenis_izin} Anda ({no_register}) telah..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase transition"
              >
                Batal
              </button>
              <button
                onClick={handleAddNewTemplate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition shadow-xs"
              >
                Simpan Template Baru
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
