import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building, 
  FileCheck, 
  Calendar, 
  Calculator, 
  History, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  MessageSquare,
  QrCode,
  Printer,
  Sparkles,
  Zap,
  Award,
  FileText,
  CheckSquare,
  ArrowRight,
  RotateCcw,
  Check,
  Compass,
  Camera,
  CheckCircle,
  Layers,
  Users
} from 'lucide-react';
import { DocumentEngineHub } from './DocumentEngineHub';
import { 
  Application, ApplicationStatus,  
  DocumentStatus, 
  UserRole, 
  WorkflowStage, 
  ExistingImbStatus, 
  VerificationReview,
  BeritaAcaraLapangan,
  FieldVisitItem
} from '../types';
import { runDocumentVerification, MASTER_DOCUMENT_RULES } from '../lib/ruleEngine';
import { calculateRetribution } from '../lib/retributionEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';
import { generateSmartSchedule, MASTER_EXPERTS } from '../lib/schedulingEngine';
import { useAutoSaveForm } from '../hooks/useAutoSaveForm';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { 
  WORKFLOW_STEPS, 
  getApplicationWorkflowStage, 
  generateDefaultMultiVerifications,
  generateNoticeLetterDraft,
  generateBeritaAcaraKonsultasiDraft,
  generateBeritaAcaraPlenoDraft,
  generateBeritaAcaraLapanganDraft,
  generateDefaultFieldVisitItems,
  isSlfApplication
} from '../lib/workflowEngine';
import { getStoredWhatsAppSettings } from '../lib/storage';
import { compileWhatsAppMessage } from '../lib/notificationTemplateEngine';
import { 
  getTemplateForDoc, 
  VERIFICATION_NOTE_TEMPLATES, 
  VerificationNoteTemplate 
} from "../lib/templateEngine";
import { LampiranVerifikasiPrint } from './LampiranVerifikasiPrint';
import { InternalApprovalFormPrint } from './InternalApprovalFormPrint';
import { StatusAuditTrailView } from './StatusAuditTrailView';
import { logStatusChange } from '../lib/auditLogEngine';
import { SuratUndanganVisiteDocument } from './SuratUndanganVisiteDocument';
import { VisiteLapanganModule } from './VisiteLapanganModule';
import { NoticeLetterPrint } from './NoticeLetterPrint';

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
  onUpdateApplication: (updated: Application) => void;
  onSendWhatsApp: (phone: string, message: string, templateType: any) => void;
  onAskAiAboutThisApp: (app: Application) => void;
  currentRole: UserRole;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onUpdateApplication,
  onSendWhatsApp,
  onAskAiAboutThisApp,
  currentRole
}) => {
  const isSlf = isSlfApplication(application);
  const currentStage = getApplicationWorkflowStage(application);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'INFO' | 'DOCS' | 'VISITE' | 'SCHEDULE' | 'BA' | 'RETRIBUTION' | 'LOGS'>('PIPELINE');
  const [activeVerifTab, setActiveVerifTab] = useState<number | 'CURRENT'>('CURRENT');
  const [copied, setCopied] = useState(false);
  const [showDocumentHub, setShowDocumentHub] = useState(false);
  const [showInternalApprovalModal, setShowInternalApprovalModal] = useState(false);
  const [templateApplyMode, setTemplateApplyMode] = useState<'APPEND' | 'REPLACE'>('APPEND');

  // Stage 2B Visite Lapangan state (Khusus SLF)
  const [visiteNotes, setVisiteNotes] = useState(
    application.baLapangan?.locationNotes || 'Pemeriksaan fisik lapangan di lokasi bangunan berjalan lancar dan didampingi pemilik/pengelola gedung.'
  );
  const [visiteConformity, setVisiteConformity] = useState<'SESUAI_DOKUMEN' | 'PERLU_PENYESUAIAN_LAPORAN' | 'TIDAK_SESUAI'>(
    application.baLapangan?.conformityStatus || 'SESUAI_DOKUMEN'
  );
  const [visiteRecommendations, setVisiteRecommendations] = useState(
    application.baLapangan?.recommendations || 'Kondisi fisik bangunan eksisting laik fungsi dan sesuai dengan dokumen laporan kelaikan fungsi. Dapat dilanjutkan ke Sidang Konsultasi Teknis TPA/TPT.'
  );
  const [fieldItems, setFieldItems] = useState<FieldVisitItem[]>(
    application.baLapangan?.itemsChecked || generateDefaultFieldVisitItems(application)
  );

  // Stage 3 Letter state
  const [noticeDate, setNoticeDate] = useState(application.schedule?.scheduleDate || application.consultationNotice?.scheduledDate || '2026-08-22');
  const [noticeTime, setNoticeTime] = useState(application.schedule?.timeSlot || application.consultationNotice?.timeSlot || '08:30 - 09:15 WIB');
  const [noticeRoom, setNoticeRoom] = useState(application.schedule?.room || application.consultationNotice?.room || 'Ruang Sidang TPA Utama (Gedung DPUPR Garut Lt. 2)');
  const [assignedExperts, setAssignedExperts] = useState<{ name: string; expertise: string; role: 'KETUA' | 'ANGGOTA' | 'SEKRETARIAT' }[]>(() => {
    if (application.schedule?.assignedExperts) {
      return application.schedule.assignedExperts;
    }
    return [
      { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', expertise: 'Arsitektur', role: 'KETUA' as const },
      { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', expertise: 'Struktur', role: 'ANGGOTA' as const },
      { name: 'Rian Pratama, ST, M.Eng', expertise: 'MEP & Damkar', role: 'ANGGOTA' as const },
      { name: 'Dedi Kurniawan, S.AP', expertise: 'Sekretariat SIMBG Garut', role: 'SEKRETARIAT' as const }
    ];
  });

  const toggleExpertAssignment = (expert: typeof MASTER_EXPERTS[0]) => {
    const exists = assignedExperts.some(e => e.name === expert.name);
    if (exists) {
      setAssignedExperts(prev => prev.filter(e => e.name !== expert.name));
    } else {
      let role: 'KETUA' | 'ANGGOTA' | 'SEKRETARIAT' = 'ANGGOTA';
      if (expert.role === 'KETUA') role = 'KETUA';
      if (expert.role === 'SEKRETARIAT') role = 'SEKRETARIAT';
      setAssignedExperts(prev => [...prev, { name: expert.name, expertise: expert.expertise, role }]);
    }
  };

  // Stage 4 BA Konsultasi state
  const [baResult, setBaResult] = useState<'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG'>(
    application.baKonsultasi?.result || 'DISETUJUI'
  );
  const [baNotes, setBaNotes] = useState(
    application.baKonsultasi?.expertNotes || 'Gambar teknis arsitektur dan struktur telah memenuhi standar teknis PP 16/2021.'
  );
  const [baRevisions, setBaRevisions] = useState<string>(
    application.baKonsultasi?.revisionItems?.join('\n') || ''
  );

  // Stage 6 BA Pleno state
  const [plenoNotes, setPlenoNotes] = useState(
    application.baPleno?.notes || 'Sidang Pleno TPA menyetujui penerbitan Persetujuan Bangunan Gedung (PBG) / Sertifikat Laik Fungsi (SLF).'
  );

  // Visite Lapangan SubTab (Surat Undangan vs BA Lapangan)
  const [visiteSubTab, setVisiteSubTab] = useState<'UNDANGAN' | 'BA_LAPANGAN'>('UNDANGAN');

  // Auto-Save Form Progress (persists long consultation forms every 30 seconds)
  const modalFormData = {
    noticeDate,
    noticeTime,
    noticeRoom,
    baResult,
    baNotes,
    baRevisions,
    plenoNotes,
    visiteNotes,
    visiteRecommendations,
    fieldItems
  };

  const autoSaveModal = useAutoSaveForm({
    key: `simbg_draft_app_modal_${application.id}`,
    data: modalFormData,
    intervalMs: 30000,
    enabled: true
  });

  // Escape key handler to close this modal or its open nested submodals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDocumentHub) {
          e.stopPropagation();
          setShowDocumentHub(false);
        } else if (showInternalApprovalModal) {
          e.stopPropagation();
          setShowInternalApprovalModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => {
      window.removeEventListener('keydown', handleEscape, true);
    };
  }, [showDocumentHub, showInternalApprovalModal, onClose]);

  const handleRestoreModalDraft = () => {
    const draft = autoSaveModal.loadDraft();
    if (draft) {
      if (draft.noticeDate) setNoticeDate(draft.noticeDate);
      if (draft.noticeTime) setNoticeTime(draft.noticeTime);
      if (draft.noticeRoom) setNoticeRoom(draft.noticeRoom);
      if (draft.baResult) setBaResult(draft.baResult);
      if (draft.baNotes) setBaNotes(draft.baNotes);
      if (draft.baRevisions) setBaRevisions(draft.baRevisions);
      if (draft.plenoNotes) setPlenoNotes(draft.plenoNotes);
      if (draft.visiteNotes) setVisiteNotes(draft.visiteNotes);
      if (draft.visiteRecommendations) setVisiteRecommendations(draft.visiteRecommendations);
      if (draft.fieldItems) setFieldItems(draft.fieldItems);
    }
  };

  const verificationResult = runDocumentVerification(application);
  
  const currentStageIndex = WORKFLOW_STEPS.findIndex(s => s.id === application.currentStage) >= 0 
    ? WORKFLOW_STEPS.findIndex(s => s.id === application.currentStage)
    : 0;

  const isTabUnlocked = (tabName: string) => {
    switch (tabName) {
      case 'PIPELINE': return true;
      case 'INFO': return true;
      case 'DOCS': 
        return currentStageIndex >= WORKFLOW_STEPS.findIndex(s => s.id === 'STAGE_2_MULTI_VERIFIKASI');
      case 'VISITE':
        return currentStageIndex >= WORKFLOW_STEPS.findIndex(s => s.id === 'STAGE_VISITE_LAPANGAN_SLF');
      case 'SCHEDULE':
        return currentStageIndex >= WORKFLOW_STEPS.findIndex(s => s.id === 'STAGE_3_SURAT_PEMBERITAHUAN');
      case 'BA':
        return currentStageIndex >= WORKFLOW_STEPS.findIndex(s => s.id === 'STAGE_4_BA_KONSULTASI');
      case 'RETRIBUTION':
        return currentStageIndex >= WORKFLOW_STEPS.findIndex(s => s.id === 'STAGE_7_PERHITUNGAN_SKRD');
      default: return false;
    }
  };


  const handleDocumentStatusChange = (docCode: string, newStatus: DocumentStatus) => {
    let updatedDocs = [...application.documents];
    const existingDocIdx = updatedDocs.findIndex(d => d.code === docCode);
    
    if (existingDocIdx >= 0) {
      updatedDocs[existingDocIdx] = { ...updatedDocs[existingDocIdx], status: newStatus };
    } else {
      const rule = MASTER_DOCUMENT_RULES.find(r => r.code === docCode);
      if (rule) {
        updatedDocs.push({
          id: `DOC-${Date.now()}`,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          status: newStatus,
          notes: getTemplateForDoc(rule.code)
        });
      }
    }

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      lastUpdated: new Date().toISOString()
    };
    
    const evalRes = runDocumentVerification(updatedApp);
    if (evalRes.status === 'VALID') {
      updatedApp.status = 'READY_FOR_CONSULTATION';
      updatedApp.currentStage = isSlf ? 'STAGE_VISITE_LAPANGAN_SLF' : 'STAGE_3_SURAT_PEMBERITAHUAN';
    } else {
      updatedApp.status = 'INCOMPLETE';
      updatedApp.currentStage = 'STAGE_2_MULTI_VERIFIKASI';
    }

    onUpdateApplication(updatedApp);
  };

  const handleDocumentNotesChange = (docCode: string, notes: string) => {
    let updatedDocs = [...application.documents];
    const existingDocIdx = updatedDocs.findIndex(d => d.code === docCode);
    
    if (existingDocIdx >= 0) {
      updatedDocs[existingDocIdx] = { ...updatedDocs[existingDocIdx], notes };
    } else {
      const rule = MASTER_DOCUMENT_RULES.find(r => r.code === docCode);
      if (rule) {
        updatedDocs.push({
          id: `DOC-${Date.now()}`,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          status: 'BELUM_ADA',
          notes
        });
      }
    }

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // 1-Click Verification Note Template Handler (Mendukung mode Tambahkan / Append & Ganti / Replace)
  const handleApplyQuickTemplate = (
    docCode: string, 
    template: VerificationNoteTemplate, 
    forcedMode?: 'APPEND' | 'REPLACE'
  ) => {
    const mode = forcedMode || templateApplyMode;
    let updatedDocs = [...application.documents];
    const existingDocIdx = updatedDocs.findIndex(d => d.code === docCode);
    const rule = MASTER_DOCUMENT_RULES.find(r => r.code === docCode);
    
    let newNotes = template.text;
    const newStatus: DocumentStatus = template.suggestedStatus || 'TIDAK_SESUAI';

    if (existingDocIdx >= 0) {
      const currentNotes = (updatedDocs[existingDocIdx].notes || '').trim();
      
      if (template.suggestedStatus === 'VALID') {
        newNotes = template.text;
      } else if (mode === 'APPEND' && currentNotes.length > 0) {
        // Cek agar tidak menduplikasi teks yang persis sama
        if (currentNotes.includes(template.text)) {
          newNotes = currentNotes;
        } else {
          // Tambahkan ke catatan yang sudah ada dengan bullet point rapi
          if (currentNotes.startsWith('•') || currentNotes.startsWith('-') || currentNotes.includes('\n•')) {
            newNotes = `${currentNotes}\n• ${template.text}`;
          } else {
            newNotes = `• ${currentNotes}\n• ${template.text}`;
          }
        }
      } else {
        newNotes = template.text.startsWith('•') ? template.text : `• ${template.text}`;
      }

      updatedDocs[existingDocIdx] = { 
        ...updatedDocs[existingDocIdx], 
        notes: newNotes,
        status: newStatus
      };
    } else if (rule) {
      newNotes = template.suggestedStatus === 'VALID' ? template.text : `• ${template.text}`;
      updatedDocs.push({
        id: `DOC-${Date.now()}-${docCode}`,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        isMandatory: rule.isRequired(application),
        status: newStatus,
        notes: newNotes,
        includedInDaftarSimak: true
      });
    }

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      lastUpdated: new Date().toISOString()
    };
    
    const evalRes = runDocumentVerification(updatedApp);
    if (evalRes.status === 'VALID') {
      updatedApp.status = 'READY_FOR_CONSULTATION';
    } else {
      updatedApp.status = 'INCOMPLETE';
    }

    onUpdateApplication(updatedApp);
  };

  // Reset/Kosongkan Catatan Per Dokumen
  const handleClearDocumentNotes = (docCode: string) => {
    let updatedDocs = [...application.documents];
    const existingDocIdx = updatedDocs.findIndex(d => d.code === docCode);
    if (existingDocIdx >= 0) {
      updatedDocs[existingDocIdx] = {
        ...updatedDocs[existingDocIdx],
        notes: '',
        status: 'TIDAK_SESUAI'
      };
      const updatedApp: Application = {
        ...application,
        documents: updatedDocs,
        lastUpdated: new Date().toISOString()
      };
      onUpdateApplication(updatedApp);
    }
  };

  // Apply note template to multiple unverified/defective documents in 1 click (Append support)
  const handleApplyBatchTemplate = (templateId: string, forcedMode?: 'APPEND' | 'REPLACE') => {
    const mode = forcedMode || templateApplyMode;
    const template = VERIFICATION_NOTE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const applicableRules = MASTER_DOCUMENT_RULES.filter(r => r.isRequired(application));
    let updatedDocs = [...application.documents];

    applicableRules.forEach(rule => {
      // If template is category-specific, only apply to that category (or apply to all if ALL/VALID)
      if (template.category !== 'ALL' && template.category !== 'VALID' && rule.category !== template.category) {
        return;
      }

      const existingIdx = updatedDocs.findIndex(d => d.code === rule.code);
      if (existingIdx >= 0) {
        if (template.suggestedStatus === 'VALID') {
          updatedDocs[existingIdx] = {
            ...updatedDocs[existingIdx],
            notes: template.text,
            status: 'VALID'
          };
        } else {
          const currentNotes = (updatedDocs[existingIdx].notes || '').trim();
          let mergedNotes = template.text;

          if (mode === 'APPEND' && currentNotes.length > 0 && updatedDocs[existingIdx].status !== 'VALID') {
            if (currentNotes.includes(template.text)) {
              mergedNotes = currentNotes;
            } else if (currentNotes.startsWith('•') || currentNotes.startsWith('-') || currentNotes.includes('\n•')) {
              mergedNotes = `${currentNotes}\n• ${template.text}`;
            } else {
              mergedNotes = `• ${currentNotes}\n• ${template.text}`;
            }
          } else {
            mergedNotes = template.text.startsWith('•') ? template.text : `• ${template.text}`;
          }

          updatedDocs[existingIdx] = {
            ...updatedDocs[existingIdx],
            notes: mergedNotes,
            status: template.suggestedStatus || 'TIDAK_SESUAI'
          };
        }
      } else {
        const initialNotes = template.suggestedStatus === 'VALID' ? template.text : `• ${template.text}`;
        updatedDocs.push({
          id: `DOC-${Date.now()}-${rule.code}`,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          isMandatory: true,
          status: template.suggestedStatus || 'TIDAK_SESUAI',
          notes: initialNotes,
          includedInDaftarSimak: true
        });
      }
    });

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      lastUpdated: new Date().toISOString()
    };

    const evalRes = runDocumentVerification(updatedApp);
    if (evalRes.status === 'VALID') {
      updatedApp.status = 'READY_FOR_CONSULTATION';
    } else {
      updatedApp.status = 'INCOMPLETE';
    }

    onUpdateApplication(updatedApp);
  };

  const handleToggleDaftarSimak = (docCode: string, included: boolean) => {
    let updatedDocs = [...application.documents];
    const existingDocIdx = updatedDocs.findIndex(d => d.code === docCode);
    
    if (existingDocIdx >= 0) {
      updatedDocs[existingDocIdx] = { ...updatedDocs[existingDocIdx], includedInDaftarSimak: included };
    } else {
      const rule = MASTER_DOCUMENT_RULES.find(r => r.code === docCode);
      if (rule) {
        updatedDocs.push({
          id: `DOC-${Date.now()}-${docCode}`,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          isMandatory: rule.isRequired(application),
          status: 'BELUM_ADA',
          notes: getTemplateForDoc(rule.code),
          includedInDaftarSimak: included
        });
      }
    }

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  const handleToggleAllDaftarSimak = (included: boolean) => {
    const applicableRules = MASTER_DOCUMENT_RULES.filter(r => r.isRequired(application));
    let updatedDocs = [...application.documents];
    
    applicableRules.forEach(rule => {
      const existingIdx = updatedDocs.findIndex(d => d.code === rule.code);
      if (existingIdx >= 0) {
        updatedDocs[existingIdx] = { ...updatedDocs[existingIdx], includedInDaftarSimak: included };
      } else {
        updatedDocs.push({
          id: `DOC-${Date.now()}-${rule.code}`,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          isMandatory: rule.isRequired(application),
          status: 'BELUM_ADA',
          notes: getTemplateForDoc(rule.code),
          includedInDaftarSimak: included
        });
      }
    });

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  const handleGlobalStatusChange = (status: ApplicationStatus) => {
    const iterations = application.verificationIterations ? [...application.verificationIterations] : [];
    
    // Create snapshot for the current verification cycle
    if (status === 'READY_FOR_CONSULTATION' || status === 'REVISION_REQUESTED' || status === 'REJECTED') {
      iterations.push({
        iterationNumber: iterations.length + 1,
        date: new Date().toISOString(),
        result: status === 'READY_FOR_CONSULTATION' ? 'DITERIMA' : (status === 'REVISION_REQUESTED' ? 'PERBAIKAN' : 'DITOLAK'),
        documentsSnapshot: JSON.parse(JSON.stringify(application.documents))
      });
    }

    const updatedApp: Application = {
      ...application,
      status,
      verificationIterations: iterations,
      lastUpdated: new Date().toISOString()
    };
    
    if (status === 'READY_FOR_CONSULTATION') {
      updatedApp.currentStage = isSlf ? 'STAGE_VISITE_LAPANGAN_SLF' : 'STAGE_3_SURAT_PEMBERITAHUAN';
      setActiveTab(isSlf ? 'VISITE' : 'SCHEDULE'); // Lanjut ke tahap berikutnya
    } else if (status === 'REVISION_REQUESTED') {
      // Pemohon akan memperbaiki dokumen. Sementara ini, simulasi masuk tahap perbaikan.
      updatedApp.currentStage = 'STAGE_5_VERIFIKASI_PERBAIKAN'; // or stay in STAGE_2
      setActiveTab('PIPELINE'); // Balik ke pipeline untuk melihat status
    }
    onUpdateApplication(updatedApp);
  };

  const handleRunRetribution = () => {
    const calc = calculateRetribution(application);
    const updatedApp: Application = {
      ...application,
      retribution: calc,
      status: 'RETRIBUTION_READY',
      currentStage: 'STAGE_7_PERHITUNGAN_SKRD',
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // Step 2 Action: Run Multi-Verif
  const handleApproveMultiVerif = () => {
    const requiredRules = MASTER_DOCUMENT_RULES.filter(r => r.isRequired(application));
    
    // Create new array with all required documents set to VALID
    const updatedDocs = requiredRules.map(rule => {
      const existing = application.documents.find(d => d.code === rule.code);
      if (existing) {
        return { ...existing, status: 'VALID' as const };
      }
      return {
        id: `DOC-${Date.now()}-${rule.code}`,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        status: 'VALID' as const
      };
    });

    const nextStage: WorkflowStage = isSlf ? 'STAGE_VISITE_LAPANGAN_SLF' : 'STAGE_3_SURAT_PEMBERITAHUAN';

    const iterations = application.verificationIterations ? [...application.verificationIterations] : [];
    iterations.push({
      iterationNumber: iterations.length + 1,
      date: new Date().toISOString(),
      result: 'DITERIMA',
      documentsSnapshot: JSON.parse(JSON.stringify(updatedDocs))
    });

    const updatedApp: Application = {
      ...application,
      documents: updatedDocs,
      verificationIterations: iterations,
      multiVerifications: generateDefaultMultiVerifications(application),
      status: 'READY_FOR_CONSULTATION',
      currentStage: nextStage,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
    setActiveTab(isSlf ? 'VISITE' : 'SCHEDULE');
  };

  // Step 2B Action: Finalize BA Lapangan (Khusus SLF)
  const handleFinalizeBaLapangan = () => {
    const ba = generateBeritaAcaraLapanganDraft(application, visiteNotes, visiteConformity, visiteRecommendations);
    ba.itemsChecked = fieldItems;

    const updatedApp: Application = {
      ...application,
      baLapangan: ba,
      currentStage: 'STAGE_3_SURAT_PEMBERITAHUAN',
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // Step 3 Action: Issue Notice Letter
  const handleIssueNoticeLetter = () => {
    const letter = generateNoticeLetterDraft(application, noticeDate, noticeTime, noticeRoom);
    const [scheduledItem] = generateSmartSchedule([application]);
    
    const updatedSchedule = application.schedule ? {
      ...application.schedule,
      scheduleDate: noticeDate,
      timeSlot: noticeTime,
      room: noticeRoom,
      assignedExperts: assignedExperts
    } : (scheduledItem ? {
      ...scheduledItem.schedule,
      scheduleDate: noticeDate,
      timeSlot: noticeTime,
      room: noticeRoom,
      assignedExperts: assignedExperts
    } : {
      id: `SCH-${application.id}`,
      scheduleDate: noticeDate,
      timeSlot: noticeTime,
      room: noticeRoom,
      sessionType: 'SIDANG_TPA' as const,
      assignedExperts: assignedExperts,
      attendanceToken: `QR-ATT-${application.id.slice(-4)}-99`,
      applicantAttended: false
    });

    const updatedApp: Application = {
      ...application,
      consultationNotice: letter,
      schedule: updatedSchedule,
      status: 'SCHEDULED',
      currentStage: 'STAGE_4_BA_KONSULTASI',
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);

    // Prompt WhatsApp notification using customized template
    const waSettings = getStoredWhatsAppSettings();
    const scheduleTemplate = waSettings.templates.find(t => t.triggerStatus === 'SCHEDULED' && t.isActive);
    let waText = '';
    if (scheduleTemplate) {
      waText = compileWhatsAppMessage(
        scheduleTemplate.templateBody, 
        application, 
        {
          tanggal_sidang: noticeDate,
          jam_sidang: noticeTime,
          ruang_sidang: noticeRoom,
          nomor_ba: letter.letterNumber
        },
        waSettings
      );
    } else {
      waText = `Yth. ${application.applicant.name}, diberitahukan bahwa permohonan ${isSlf ? 'SLF' : 'PBG'} Anda (${application.registerNumber}) telah dijadwalkan untuk Sidang Konsultasi Teknis pada hari Jumat, ${noticeDate} pukul ${noticeTime} bertempat di ${noticeRoom}. Nomor Surat: ${letter.letterNumber}. Mohon hadir tepat waktu.`;
    }
    onSendWhatsApp(application.applicant.phone, waText, 'JADWAL_KONSULTASI');
  };

  // Step 4 Action: Submit BA Konsultasi
  const handleSubmitBaKonsultasi = () => {
    const revisionList = baRevisions.split('\n').map(s => s.trim()).filter(Boolean);
    const ba = generateBeritaAcaraKonsultasiDraft(application, baResult, baNotes, revisionList);
    
    let nextStage: WorkflowStage = 'STAGE_6_BA_PLENO';
    let nextStatus: Application['status'] = 'CONSULTATION_DONE';

    if (baResult === 'PERBAIKAN') {
      nextStage = 'STAGE_5_VERIFIKASI_PERBAIKAN';
      nextStatus = 'REVISION_REQUESTED';
    } else if (baResult === 'KONSULTASI_ULANG') {
      nextStage = 'STAGE_3_SURAT_PEMBERITAHUAN';
      nextStatus = 'SCHEDULED';
    }

    const updatedApp: Application = {
      ...application,
      baKonsultasi: ba,
      schedule: application.schedule ? {
        ...application.schedule,
        applicantAttended: true,
        attendanceTimestamp: new Date().toLocaleString('id-ID') + ' WIB',
        consultationResult: baResult,
        consultationNotes: baNotes
      } : undefined,
      currentStage: nextStage,
      status: nextStatus,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // Step 5 Action: Approve Verifikasi Perbaikan
  const handleApproveVerifikasiPerbaikan = () => {
    const reviews: VerificationReview[] = generateDefaultMultiVerifications(application).map(v => ({
      ...v,
      status: 'VALID' as const,
      notes: 'Perbaikan catatan BA Konsultasi telah diverifikasi dan sesuai spesifikasi.'
    }));

    const updatedApp: Application = {
      ...application,
      multiVerifikasiPerbaikan: reviews,
      currentStage: 'STAGE_6_BA_PLENO',
      status: 'CONSULTATION_DONE',
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // Step 6 Action: Finalize BA Pleno
  const handleFinalizeBaPleno = () => {
    const pleno = generateBeritaAcaraPlenoDraft(application, plenoNotes);
    const isNeedsSkrd = application.building.existingImbStatus === 'BELUM_MEMILIKI_IMB_PBG' || !application.building.existingImbStatus;

    const nextStage: WorkflowStage = isNeedsSkrd ? 'STAGE_7_PERHITUNGAN_SKRD' : 'STAGE_8_SELESAI';
    const nextStatus: Application['status'] = isNeedsSkrd ? 'RETRIBUTION_READY' : 'COMPLETED';

    const updatedApp: Application = {
      ...application,
      baPleno: pleno,
      currentStage: nextStage,
      status: nextStatus,
      lastUpdated: new Date().toISOString()
    };

    if (isNeedsSkrd && !application.retribution) {
      updatedApp.retribution = calculateRetribution(application);
    }

    onUpdateApplication(updatedApp);
  };

  // Step 7 Action: Finalize SKRD or Bypass
  const handleFinalizeSkrd = () => {
    const calc = application.retribution || calculateRetribution(application);
    calc.status = 'SKRD_ISSUED';
    calc.isVerified = true;

    const updatedApp: Application = {
      ...application,
      retribution: calc,
      currentStage: 'STAGE_8_SELESAI',
      status: 'COMPLETED',
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);

    // Send SKRD WhatsApp using customized template
    const waSettings = getStoredWhatsAppSettings();
    const skrdTemplate = waSettings.templates.find(t => t.triggerStatus === 'RETRIBUTION_READY' && t.isActive);
    let waText = '';
    if (skrdTemplate) {
      waText = compileWhatsAppMessage(
        skrdTemplate.templateBody, 
        application, 
        {
          nominal_retribusi: `Rp ${calc.finalRetribution.toLocaleString('id-ID')},-`,
          nomor_skrd: `SKRD/3205/DPUPR/${new Date().getFullYear()}/${application.id.slice(-4)}`
        },
        waSettings
      );
    } else {
      waText = `Yth. ${application.applicant.name}, Surat Ketetapan Retribusi Daerah (SKRD) untuk PBG ${application.registerNumber} telah terbit sebesar Rp ${calc.finalRetribution.toLocaleString('id-ID')}. Silakan lakukan pembayaran ke Kas Daerah Bank bjb Garut.`;
    }
    onSendWhatsApp(application.applicant.phone, waText, 'SKRD_TERBIT');
  };

  const handlePrintDocument = () => {
    triggerPdfPrint('printable-daftar-simak-area', `Daftar_Simak_${application.registerNumber}`);
  };

  return (
    <>
      {/* Printable verification document */}
      <div id="printable-daftar-simak-area" className="hidden print:block">
        <LampiranVerifikasiPrint application={application} />
      </div>

      {/* Printable notice letter (undangan) */}
      <div id="printable-notice-letter-wrapper" className="hidden print:block">
        <NoticeLetterPrint 
          application={application} 
          noticeDate={noticeDate} 
          noticeTime={noticeTime} 
          noticeRoom={noticeRoom} 
          assignedExperts={assignedExperts}
        />
      </div>

      {/* Main Modal (Hidden during print if on DOCS or SCHEDULE tab) */}
      <div className={`fixed inset-0 z-50 bg-white dark:bg-slate-900 md:bg-slate-900/70 md:backdrop-blur-xs flex md:items-center md:justify-center overflow-hidden font-sans ${activeTab === 'DOCS' || activeTab === 'SCHEDULE' ? 'print:hidden' : ''}`}>
        <div className="bg-white dark:bg-slate-900 border-0 md:border md:border-slate-200 dark:md:border-slate-800 rounded-none max-w-5xl w-full h-full md:h-auto md:max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header (Geometric Balance) */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex flex-col sm:flex-row items-start shrink-0 justify-between gap-3 border-b border-slate-800 font-mono">
          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs sm:text-sm text-indigo-400">
                {application.registerNumber}
              </span>
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-1.5 py-0.5 font-mono">
                {application.applicationNumber}
              </span>
              {isSlf && (
                <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-1.5 py-0.5 font-mono font-bold">
                  PERMOHONAN SLF
                </span>
              )}
              <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 border border-slate-700">
                SLA: {application.slaDays} Hr
              </span>
            </div>
            <h2 className="text-sm sm:text-lg font-bold text-white leading-snug font-sans">
              {application.building.name}
            </h2>
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>Pemohon: {application.applicant.name}</span>
              <span>•</span>
              <span>Kec. {application.building.district}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            <AutoSaveIndicator
              lastSavedTime={autoSaveModal.lastSavedTime}
              isSaving={autoSaveModal.isSaving}
              hasDraft={autoSaveModal.hasDraft}
              onLoadDraft={handleRestoreModalDraft}
              onClearDraft={autoSaveModal.clearDraft}
            />

            <button
              onClick={() => setShowInternalApprovalModal(true)}
              className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] sm:text-xs font-mono font-bold uppercase px-2.5 py-1.5 shadow-xs transition"
              title="Formulir Laporan Persetujuan Internal DPUPR Garut (PDF)"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-200" />
              <span>Approval PDF</span>
            </button>

            <button
              onClick={() => setShowDocumentHub(true)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-mono font-bold uppercase px-2.5 py-1.5 shadow-xs transition"
              title="Pusat Dokumen Engine SSOT (PDF / DOCX / XLSX)"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-100" />
              <span className="hidden sm:inline">Dokumen Hub</span>
            </button>

            <button
              onClick={() => onAskAiAboutThisApp(application)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-mono font-bold uppercase px-2.5 py-1.5 shadow-xs transition"
              title="Minta AI Meringkas & Menganalisis Permohonan Ini"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI</span>
            </button>

            <button
              onClick={handlePrintDocument}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-mono font-bold uppercase px-2.5 py-1.5 border border-slate-700 transition"
              title="Cetak Berkas / Berita Acara"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition font-mono text-xs ml-1"
            >
              [X]
            </button>
          </div>
        </div>

        {/* Tab Navigation (Geometric Balance) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 text-xs font-bold uppercase font-mono overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'PIPELINE'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>Alur Eksekusi PBG / SLF</span>
          </button>

          <button
            onClick={() => setActiveTab('INFO')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'INFO'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Info & Bangunan</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCS')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'DOCS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Multi Verif Dokumen ({application.documents.filter(d => d.status === 'VALID').length}/{application.documents.length})</span>
          </button>

          {/* VISITE LAPANGAN TAB (KHUSUS SLF) */}
          <button
            onClick={() => setActiveTab('VISITE')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'VISITE'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Visite & BA Lapangan {isSlf ? '(SLF)' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'SCHEDULE'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Surat & Jadwal Konsultasi</span>
          </button>

          <button
            onClick={() => setActiveTab('BA')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'BA'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>BA Konsultasi & Pleno</span>
          </button>

          <button
            onClick={() => setActiveTab('RETRIBUTION')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'RETRIBUTION'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>SKRD Retribusi PP 16</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'LOGS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Status ({application.statusAuditLogs?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 text-xs space-y-6 pb-36 md:pb-6">

          {/* TAB: PIPELINE (ALUR LENGKAP TERINTEGRASI) */}
          {activeTab === 'PIPELINE' && (
            <div className="space-y-6">
              
              {/* Stepper Header Matrix */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-xs">
                    Progress Alur Eksekusi Permohonan ({isSlf ? 'SLF Bangunan Eksisting' : 'PBG Bangunan Baru'})
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    TAHAP AKTIF: {WORKFLOW_STEPS.find(s => s.id === currentStage)?.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                  {WORKFLOW_STEPS.map((step) => {
                    const isPassed = WORKFLOW_STEPS.findIndex(s => s.id === step.id) < WORKFLOW_STEPS.findIndex(s => s.id === currentStage);
                    const isCurrent = step.id === currentStage;

                    return (
                      <div
                        key={step.id}
                        className={`p-2 border font-mono text-[10px] flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{step.stepCode}</span>
                          {isPassed ? <Check className="w-3 h-3" /> : isCurrent ? <Zap className="w-3 h-3" /> : null}
                        </div>
                        <div className="font-bold truncate mt-1">{step.shortTitle}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step-by-Step Action Cards */}
              <div className="space-y-4">
                
                {/* 1. INPUT DATA PERMOHONAN */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        1
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 1: Input Data Permohonan & Status IMB Eksisting
                      </h4>
                    </div>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                      ✓ DATA TERCATAT
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-300 font-mono">
                    <div>Pemohon: <span className="font-bold text-slate-900 dark:text-white">{application.applicant.name}</span></div>
                    <div>Fungsi: <span className="font-bold text-slate-900 dark:text-white">{application.building.functionType}</span></div>
                    <div>Luas: <span className="font-bold text-slate-900 dark:text-white">{application.building.buildingArea} m²</span></div>
                    <div>Status IMB: <span className="font-bold text-indigo-600">{application.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG'}</span></div>
                  </div>
                </div>

                {/* 2. VERIFIKASI PERMOHONAN (MULTI VERIF) */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        2
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 2: Verifikasi Permohonan (Multi Verif Disiplin Teknis)
                      </h4>
                    </div>
                    {application.multiVerifications?.every(v => v.status === 'VALID') || verificationResult.status === 'VALID' ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ MULTI VERIF VALID
                      </span>
                    ) : (
                      <button
                        onClick={handleApproveMultiVerif}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase"
                      >
                        Setujui Multi Verif Awal
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    Pemeriksaan berkas secara paralel oleh 5 tim verifikator: Administrasi, Arsitektur, Struktur, MEP & Proteksi Kebakaran, Lingkungan.
                  </p>
                </div>

                {/* 2B. VISITE LAPANGAN & BA LAPANGAN (KHUSUS PERMOHONAN SLF) */}
                <div className={`border p-4 space-y-3 ${
                  isSlf 
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 font-mono font-bold flex items-center justify-center text-xs ${
                        isSlf ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      }`}>
                        2B
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono flex items-center gap-2">
                        <span>Tahap 2B: Visite Lapangan & BA Lapangan</span>
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 font-bold">
                          KHUSUS SLF
                        </span>
                      </h4>
                    </div>

                    {application.baLapangan?.isCompleted ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ BA LAPANGAN TERCATAT ({application.baLapangan.conformityStatus})
                      </span>
                    ) : isSlf ? (
                      <button
                        onClick={() => setActiveTab('VISITE')}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[10px] uppercase flex items-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Input BA Lapangan SLF</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">
                        (Dilewati untuk Permohonan PBG Bangunan Baru)
                      </span>
                    )}
                  </div>
                  
                  {application.baLapangan?.isCompleted && (
                    <div className="bg-white dark:bg-slate-900 p-3 border border-amber-200 dark:border-amber-800 font-mono text-[11px] space-y-1">
                      <div>No. BA Lapangan: <span className="font-bold text-slate-900 dark:text-white">{application.baLapangan.baLapanganNumber}</span></div>
                      <div>Status Kesesuaian: <span className="font-bold text-emerald-600 dark:text-emerald-400">{application.baLapangan.conformityStatus}</span></div>
                      <div className="text-slate-500">{application.baLapangan.recommendations}</div>
                    </div>
                  )}
                </div>

                {/* 3. PEMBUAT SURAT PEMBERITAHUAN KONSULTASI TEKNIS */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        3
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 3: Pembuat Surat Pemberitahuan Konsultasi Teknis
                      </h4>
                    </div>
                    {application.consultationNotice?.isIssued ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ SURAT TERBIT ({application.consultationNotice.letterNumber})
                      </span>
                    ) : (
                      <button
                        onClick={handleIssueNoticeLetter}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase"
                      >
                        Terbitkan Surat & Notifikasi WA
                      </button>
                    )}
                  </div>
                  {application.consultationNotice?.isIssued && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-800 font-mono text-[11px] flex items-center justify-between">
                      <div>
                        <div>No. Surat: <span className="font-bold text-slate-900 dark:text-white">{application.consultationNotice.letterNumber}</span></div>
                        <div>Jadwal: {application.consultationNotice.scheduledDate} ({application.consultationNotice.timeSlot})</div>
                        <div>Tempat: {application.consultationNotice.room}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('SCHEDULE')}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Lihat Draf Surat →
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. BERITA ACARA (BA) KONSULTASI */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        4
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 4: Berita Acara (BA) Konsultasi Teknis TPA/TPT
                      </h4>
                    </div>
                    {application.baKonsultasi?.isFinalized ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ BA FINAL ({application.baKonsultasi.result})
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveTab('BA')}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase"
                      >
                        Catat BA Konsultasi
                      </button>
                    )}
                  </div>
                  {application.baKonsultasi && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
                      <div>No. BA: <span className="font-bold text-slate-900 dark:text-white">{application.baKonsultasi.baNumber}</span></div>
                      <div>Hasil: <span className="font-bold text-indigo-600">{application.baKonsultasi.result}</span></div>
                      <div className="text-slate-500">Catatan: {application.baKonsultasi.expertNotes}</div>
                    </div>
                  )}
                </div>

                {/* 5. VERIFIKASI PERBAIKAN (MULTI VERIF REVISI) */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        5
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 5: Verifikasi Perbaikan (Multi Verif Revisi Dokumen)
                      </h4>
                    </div>
                    {application.multiVerifikasiPerbaikan?.every(v => v.status === 'VALID') ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ REVISI DISETUJUI
                      </span>
                    ) : application.baKonsultasi?.result === 'PERBAIKAN' ? (
                      <button
                        onClick={handleApproveVerifikasiPerbaikan}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[10px] uppercase"
                      >
                        Verifikasi Perbaikan Berkas
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">
                        (Dilewati jika BA Konsultasi Disetujui Tanpa Perbaikan)
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. BA PLENO & SURAT REKOMENDASI TEKNIS */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        6
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 6: Berita Acara Sidang Pleno & Rekomendasi Teknis Akhir
                      </h4>
                    </div>
                    {application.baPleno?.isSigned ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ BA PLENO TERTANDATANGANI
                      </span>
                    ) : (
                      <button
                        onClick={handleFinalizeBaPleno}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase"
                      >
                        Sahkan BA Pleno & Rekomtek
                      </button>
                    )}
                  </div>
                </div>

                {/* 7. PERHITUNGAN SKRD RETRIBUSI (KONDISIONAL) */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        7
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 7: Perhitungan SKRD Retribusi (Kondisional IMB/PBG)
                      </h4>
                    </div>
                    {application.retribution?.status === 'SKRD_ISSUED' ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-300">
                        ✓ SKRD TERBIT (Rp {application.retribution.finalRetribution.toLocaleString('id-ID')})
                      </span>
                    ) : application.building.existingImbStatus === 'SUDAH_MEMILIKI_IMB' ? (
                      <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-mono px-2 py-0.5 border border-blue-300">
                        BEBAS RETRIBUSI (SUDAH ADA IMB)
                      </span>
                    ) : (
                      <button
                        onClick={handleFinalizeSkrd}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase"
                      >
                        Terbitkan SKRD Retribusi
                      </button>
                    )}
                  </div>
                </div>

                {/* 8. SELESAI */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
                        8
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase font-mono">
                        Tahap 8: Penerbitan Dokumen PBG / SLF & Selesai
                      </h4>
                    </div>
                    {application.status === 'COMPLETED' ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-mono px-2.5 py-0.5 font-bold">
                        ✓ SELESAI / DOKUMEN RESMI TERBIT
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">
                        Menunggu penyelesaian tahap sebelumnya
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: INFO (INFO & BANGUNAN) */}
          {activeTab === 'INFO' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
                  Informasi Detail Pemohon & Bangunan Gedung
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-indigo-600 uppercase text-xs block mb-1">Data Pemohon</span>
                    <div>Pemohon: <span className="font-bold text-slate-900 dark:text-white">{application.applicant.name}</span></div>
                    <div>NIK: <span>{application.applicant.nik || '-'}</span></div>
                    <div>Telepon: <span>{application.applicant.phone}</span></div>
                    <div>Email: <span>{application.applicant.email || '-'}</span></div>
                    <div>Alamat: <span>{application.applicant.address}</span></div>
                  </div>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-indigo-600 uppercase text-xs block mb-1">Data Bangunan Gedung</span>
                    <div>Nama Bangunan: <span className="font-bold text-slate-900 dark:text-white">{application.building.name}</span></div>
                    <div>Fungsi Bangunan: <span>{application.building.functionType}</span></div>
                    <div>Kompleksitas: <span>{application.building.complexity}</span></div>
                    <div>Luas Bangunan: <span>{application.building.buildingArea} m²</span></div>
                    <div>Jumlah Lantai: <span>{application.building.numberOfFloors} lantai</span></div>
                    <div>Lokasi: <span>{application.building.address}, {application.building.district}</span></div>
                    <div>Status IMB/PBG: <span className="font-bold text-indigo-600">{application.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCS (MULTI VERIFIKASI DOKUMEN) */}
          {activeTab === 'DOCS' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-xs block">
                    Daftar Dokumen Permohonan & Checklist Verifikator
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Gunakan tombol centang pada tiap dokumen untuk menentukan item yang tampil pada Cetak Daftar Simak (PDF).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeVerifTab === 'CURRENT' && (
                    <>
                      <button
                        onClick={() => handleToggleAllDaftarSimak(true)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono font-semibold text-[10px] uppercase"
                        title="Centang semua dokumen untuk ditampilkan di Cetak Daftar Simak"
                      >
                        ✓ Centang Semua
                      </button>
                      <button
                        onClick={() => handleToggleAllDaftarSimak(false)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono font-semibold text-[10px] uppercase"
                        title="Hapus semua centang"
                      >
                        ✗ Hapus Centang
                      </button>
                    </>
                  )}
                  <button
                    onClick={handlePrintDocument}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Daftar Simak (PDF)
                  </button>
                  <button
                    onClick={handleApproveMultiVerif}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase"
                  >
                    Setujui Semua Dokumen Valid
                  </button>
                </div>
              </div>

              {/* Riwayat Iterasi Verifikasi */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex space-x-2 overflow-x-auto shrink-0 pb-1">
                  {(application.verificationIterations || []).map((iter, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVerifTab(idx)}
                      className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition border ${activeVerifTab === idx ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                    >
                      Verif {iter.iterationNumber} ({iter.result})
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveVerifTab('CURRENT')}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition border ${activeVerifTab === 'CURRENT' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-400'}`}
                  >
                    Verif Saat Ini
                  </button>
                </div>
              </div>

              {/* Global Batch Template Toolbar */}
              {activeVerifTab === 'CURRENT' && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Template Catatan Cepat 1-Klik:</span>
                    </span>

                    {/* Mode Toggle: Tambahkan (Append) vs Ganti (Replace) */}
                    <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded overflow-hidden mr-1">
                      <button
                        type="button"
                        onClick={() => setTemplateApplyMode('APPEND')}
                        className={`px-2 py-0.5 text-[9px] font-bold transition flex items-center gap-1 ${
                          templateApplyMode === 'APPEND'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                        title="Mode Tambahkan: Template baru akan ditambahkan tanpa menghapus catatan yang sudah ada"
                      >
                        <span>➕ Tambahkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateApplyMode('REPLACE')}
                        className={`px-2 py-0.5 text-[9px] font-bold transition flex items-center gap-1 ${
                          templateApplyMode === 'REPLACE'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                        title="Mode Ganti: Template baru akan menggantikan seluruh teks catatan"
                      >
                        <span>↻ Ganti</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyBatchTemplate('TPL-LEGALISIR')}
                      className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-[10px] uppercase transition"
                      title="Terapkan 'Dokumen belum dilegalisasi' ke semua berkas yang belum valid"
                    >
                      {templateApplyMode === 'APPEND' ? '+ 📋 Belum Dilegalisasi' : '📋 Belum Dilegalisasi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchTemplate('TPL-TIDAK-SESUAI-SYARAT')}
                      className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-bold text-[10px] uppercase transition"
                      title="Terapkan 'Dokumen tidak sesuai persyaratan' ke semua berkas yang belum valid"
                    >
                      {templateApplyMode === 'APPEND' ? '+ ⚠️ Tidak Sesuai Syarat' : '⚠️ Tidak Sesuai Syarat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchTemplate('TPL-JUDUL-GAMBAR')}
                      className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800 font-bold text-[10px] uppercase transition"
                      title="Terapkan 'Judul gambar agar disesuaikan' ke semua berkas arsitektur"
                    >
                      {templateApplyMode === 'APPEND' ? '+ 📐 Judul Gambar' : '📐 Judul Gambar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchTemplate('TPL-SKK-TENAGA-AHLI')}
                      className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 hover:bg-indigo-200 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 font-bold text-[10px] uppercase transition"
                      title="Terapkan 'Nama Tenaga Ahli tidak sesuai SKK'"
                    >
                      {templateApplyMode === 'APPEND' ? '+ 👤 SKK Tenaga Ahli' : '👤 SKK Tenaga Ahli'}
                    </button>
                  </div>

                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      handleApplyBatchTemplate(e.target.value);
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-mono cursor-pointer"
                  >
                    <option value="">⚡ Terapkan Template Masal...</option>
                    <option value="TPL-LEGALISIR">📋 Masal: Dokumen belum dilegalisasi</option>
                    <option value="TPL-TIDAK-SESUAI-SYARAT">⚠️ Masal: Dokumen tidak sesuai persyaratan</option>
                    <option value="TPL-JUDUL-GAMBAR">📐 Masal: Judul gambar agar disesuaikan</option>
                    <option value="TPL-SKK-TENAGA-AHLI">👤 Masal: Nama Tenaga Ahli tidak sesuai SKK</option>
                    <option value="TPL-KOP-ETIKET">✏️ Masal: Kop/Etiket belum lengkap</option>
                    <option value="TPL-RESOLUSI-GAMBAR">🔍 Masal: Gambar buram / resolusi rendah</option>
                    <option value="TPL-STRUKTUR-GEMPA">🏢 Masal: Perhitungan gempa SNI 1726</option>
                    <option value="TPL-SONDIR-TANAH">🧪 Masal: Laporan uji tanah / sondir</option>
                    <option value="TPL-MEP-DAMKAR">🚒 Masal: Spesifikasi proteksi kebakaran & MEP</option>
                    <option value="TPL-SURAT-KUASA">📜 Masal: Surat Kuasa bermaterai</option>
                    <option value="TPL-VALID-LENGKAP">✓ Masal: Setujui Semua Berkas (Lengkap & Valid)</option>
                  </select>
                </div>
              )}

              {/* Daftar Berkas Dokumen */}
              <div className="border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {MASTER_DOCUMENT_RULES.filter(rule => {
                  const doc = application.documents.find(d => d.code === rule.code);
                  if (doc?.includedInDaftarSimak !== undefined) return true;
                  return rule.isRequired(application);
                }).map((rule) => {
                  let doc;
                  if (activeVerifTab === 'CURRENT') {
                    doc = application.documents.find(d => d.code === rule.code);
                  } else {
                    const iter = (application.verificationIterations || [])[activeVerifTab as number];
                    if (iter) {
                      doc = iter.documentsSnapshot.find(d => d.code === rule.code);
                    }
                  }
                  
                  const status = doc ? doc.status : 'BELUM_ADA';
                  const notes = doc?.notes || getTemplateForDoc(rule.code);
                  const isReadOnly = activeVerifTab !== 'CURRENT';
                  const isIncludedInPrint = doc?.includedInDaftarSimak !== undefined 
                    ? doc.includedInDaftarSimak 
                    : rule.isRequired(application);

                  return (
                    <div key={rule.code} className={`p-3 flex flex-col gap-2 ${isReadOnly ? 'opacity-80 bg-slate-50 dark:bg-slate-900/50' : ''} ${!isIncludedInPrint ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-75' : ''}`}>
                      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="space-y-0.5 flex-1 min-w-[240px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400">{rule.code}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{rule.name}</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0.2 font-mono">
                              {rule.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">{rule.description}</div>
                        </div>

                        {/* TOGGLE CEKLIS DAFTAR SIMAK & STATUS SELECTOR */}
                        <div className="flex items-center gap-2">
                          {/* Tombol Ceklis Cetak Daftar Simak */}
                          <label className={`flex items-center gap-1.5 px-2 py-1 border text-[11px] font-mono cursor-pointer rounded select-none transition ${isIncludedInPrint ? 'bg-indigo-50 border-indigo-300 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300 font-bold' : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
                            <input
                              type="checkbox"
                              disabled={isReadOnly}
                              checked={isIncludedInPrint}
                              onChange={(e) => handleToggleDaftarSimak(rule.code, e.target.checked)}
                              className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                            />
                            <span>{isIncludedInPrint ? "✓ Cetak di Daftar Simak" : "✗ Sembunyikan"}</span>
                          </label>

                          {/* Status Dropdown */}
                          <select
                            disabled={isReadOnly}
                            value={status}
                            onChange={(e) => handleDocumentStatusChange(rule.code, e.target.value as DocumentStatus)}
                            className={`px-2 py-1 border text-xs font-mono font-bold ${
                              status === 'VALID' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              status === 'TIDAK_SESUAI' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                              'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'
                            } ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {(status === 'BELUM_ADA' || status === 'TERUNGGAH' || status === 'PERLU_PERBAIKAN' || status === 'VALIDASI_ADMINISTRATIF') && (
                              <option value={status} disabled>-- PILIH STATUS --</option>
                            )}
                            <option value="VALID">SESUAI</option>
                            <option value="TIDAK_SESUAI">TIDAK SESUAI</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Notes / Keterangan Area */}
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Catatan Teknis / Isian Kekurangan Berkas:</span>
                          {!isReadOnly && notes && (
                            <button
                              type="button"
                              onClick={() => handleClearDocumentNotes(rule.code)}
                              className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5"
                              title="Hapus / Kosongkan catatan berkas ini"
                            >
                              <span>↺ Kosongkan</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          disabled={isReadOnly}
                          value={notes}
                          onChange={(e) => handleDocumentNotesChange(rule.code, e.target.value)}
                          placeholder="Catatan / Keterangan / Isian Khusus (Klik template di bawah untuk menambahkan poin catatan)..."
                          className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                          rows={notes.split('\n').length > 1 ? notes.split('\n').length : 2}
                        />
                      </div>

                      {/* 1-Click Verification Template Chips Bar */}
                      {!isReadOnly && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>1-Klik Template ({templateApplyMode === 'APPEND' ? 'Mode Tambah +' : 'Mode Ganti ↻'}):</span>
                          </span>

                          {/* 1. Dokumen belum dilegalisasi */}
                          <button
                            type="button"
                            onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-LEGALISIR')!)}
                            className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded font-medium transition text-[10px]"
                            title="Terapkan: Dokumen belum dilegalisasi oleh pihak berwenang"
                          >
                            {templateApplyMode === 'APPEND' ? '+ 📋 Belum Dilegalisasi' : '📋 Belum Dilegalisasi'}
                          </button>

                          {/* 2. Dokumen yang diunggah tidak sesuai dengan persyaratan di sistem */}
                          <button
                            type="button"
                            onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-TIDAK-SESUAI-SYARAT')!)}
                            className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded font-medium transition text-[10px]"
                            title="Terapkan: Dokumen yang diunggah tidak sesuai dengan persyaratan di sistem SIMBG"
                          >
                            {templateApplyMode === 'APPEND' ? '+ ⚠️ Tidak Sesuai Syarat' : '⚠️ Tidak Sesuai Syarat'}
                          </button>

                          {/* 3. Judul gambar agar disesuaikan */}
                          {(rule.category === 'ARSITEKTUR' || rule.category === 'STRUKTUR' || rule.category === 'MEP') && (
                            <button
                              type="button"
                              onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-JUDUL-GAMBAR')!)}
                              className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800 rounded font-medium transition text-[10px]"
                              title="Terapkan: Judul gambar agar disesuaikan"
                            >
                              {templateApplyMode === 'APPEND' ? '+ 📐 Judul Gambar' : '📐 Judul Gambar'}
                            </button>
                          )}

                          {/* 4. Nama Tenaga Ahli yang menandatangani dokumen tidak sesuai dengan SKK Tenaga Ahli yang diupload SIMBG */}
                          <button
                            type="button"
                            onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-SKK-TENAGA-AHLI')!)}
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 rounded font-medium transition text-[10px]"
                            title="Terapkan: Nama Tenaga Ahli yang menandatangani dokumen tidak sesuai dengan SKK Tenaga Ahli yang diupload SIMBG"
                          >
                            {templateApplyMode === 'APPEND' ? '+ 👤 SKK Tenaga Ahli' : '👤 SKK Tenaga Ahli'}
                          </button>

                          {/* Additional Relevant Contextual Chips */}
                          {rule.category === 'ARSITEKTUR' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-KOP-ETIKET')!)}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ ✏️ Kop / Etiket' : '✏️ Kop / Etiket'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-RESOLUSI-GAMBAR')!)}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ 🔍 Gambar Buram' : '🔍 Gambar Buram'}
                              </button>
                            </>
                          )}

                          {rule.category === 'STRUKTUR' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-STRUKTUR-GEMPA')!)}
                                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ 🏢 Gempa SNI 1726' : '🏢 Gempa SNI 1726'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-SONDIR-TANAH')!)}
                                className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ 🧪 Uji Sondir/Tanah' : '🧪 Uji Sondir/Tanah'}
                              </button>
                            </>
                          )}

                          {rule.category === 'MEP' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-MEP-DAMKAR')!)}
                                className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ 🚒 Proteksi Damkar' : '🚒 Proteksi Damkar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-SLD-LISTRIK')!)}
                                className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 text-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ ⚡ SLD Listrik' : '⚡ SLD Listrik'}
                              </button>
                            </>
                          )}

                          {(rule.category === 'TANAH' || rule.category === 'UMUM') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-SURAT-KUASA')!)}
                                className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ 📜 Surat Kuasa' : '📜 Surat Kuasa'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-SERTIFIKAT-TANAH')!)}
                                className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded font-medium transition text-[10px]"
                              >
                                {templateApplyMode === 'APPEND' ? '+ 🏞️ Sertifikat Tanah' : '🏞️ Sertifikat Tanah'}
                              </button>
                            </>
                          )}

                          {/* Sesuai / Lengkap */}
                          <button
                            type="button"
                            onClick={() => handleApplyQuickTemplate(rule.code, VERIFICATION_NOTE_TEMPLATES.find(t => t.id === 'TPL-VALID-LENGKAP')!)}
                            className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded font-bold transition text-[10px]"
                          >
                            ✓ Lengkap & Sesuai
                          </button>

                          {/* Dropdown Selector for All Templates */}
                          <select
                            value=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const selectedTpl = VERIFICATION_NOTE_TEMPLATES.find(t => t.id === e.target.value);
                              if (selectedTpl) {
                                handleApplyQuickTemplate(rule.code, selectedTpl);
                              }
                            }}
                            className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded text-[9px] font-mono cursor-pointer"
                          >
                            <option value="">⚡ Pilihan Template Lengkap...</option>
                            <optgroup label="Permintaan Khusus & Umum">
                              <option value="TPL-LEGALISIR">📋 Dokumen belum dilegalisasi</option>
                              <option value="TPL-TIDAK-SESUAI-SYARAT">⚠️ Dokumen tidak sesuai persyaratan sistem</option>
                              <option value="TPL-JUDUL-GAMBAR">📐 Judul gambar agar disesuaikan</option>
                              <option value="TPL-SKK-TENAGA-AHLI">👤 Nama Tenaga Ahli tidak sesuai SKK SIMBG</option>
                            </optgroup>
                            <optgroup label="Arsitektur & Gambar">
                              <option value="TPL-KOP-ETIKET">✏️ Kop gambar / etiket belum lengkap</option>
                              <option value="TPL-RESOLUSI-GAMBAR">🔍 Gambar buram / resolusi rendah</option>
                            </optgroup>
                            <optgroup label="Struktur & Tanah">
                              <option value="TPL-STRUKTUR-GEMPA">🏢 Perhitungan gempa SNI 1726:2019</option>
                              <option value="TPL-SONDIR-TANAH">🧪 Laporan penyelidikan tanah / Sondir</option>
                              <option value="TPL-DETAIL-PENULANGAN">📐 Detail pembesian balok/kolom/pondasi</option>
                            </optgroup>
                            <optgroup label="MEP & Sanitasi">
                              <option value="TPL-MEP-DAMKAR">🚒 Sistem proteksi kebakaran & MEP</option>
                              <option value="TPL-SLD-LISTRIK">⚡ Diagram kelistrikan (SLD)</option>
                              <option value="TPL-SEPTIC-TANK">🚽 Detail sanitasi & septic tank biofilter</option>
                            </optgroup>
                            <optgroup label="Tanah & Perizinan">
                              <option value="TPL-SURAT-KUASA">📜 Surat Kuasa bermaterai</option>
                              <option value="TPL-SERTIFIKAT-TANAH">🏞️ Bukti sertifikat tanah / legalisir</option>
                              <option value="TPL-KRK-KKPR">📋 Dokumen KRK / KKPR</option>
                            </optgroup>
                            <optgroup label="Persetujuan">
                              <option value="TPL-VALID-LENGKAP">✓ Dokumen lengkap & sesuai (VALID)</option>
                            </optgroup>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {activeVerifTab === 'CURRENT' && (
                <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-xs">
                      Kesimpulan & Keputusan Verifikasi Global
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGlobalStatusChange('READY_FOR_CONSULTATION')}
                      className={`flex-1 py-2 font-mono font-bold text-xs uppercase border ${application.status === 'READY_FOR_CONSULTATION' || application.status === 'SCHEDULED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      DITERIMA (Lanjut Konsultasi)
                    </button>
                    <button
                      onClick={() => handleGlobalStatusChange('REVISION_REQUESTED')}
                      className={`flex-1 py-2 font-mono font-bold text-xs uppercase border ${application.status === 'REVISION_REQUESTED' || application.status === 'INCOMPLETE' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      PERBAIKAN DOKUMEN (Lanjut Perbaikan)
                    </button>
                    <button
                      onClick={() => handleGlobalStatusChange('REJECTED')}
                      className={`flex-1 py-2 font-mono font-bold text-xs uppercase border ${application.status === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      DITOLAK
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: VISITE & BA LAPANGAN (KHUSUS SLF & PBG) */}
          {activeTab === 'VISITE' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600 animate-spin" />
                  <span className="font-bold text-amber-900 dark:text-amber-300 uppercase">
                    Sinkronisasi Penuh // Modul Visite Lapangan & BA Lapangan
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  ID: {application.registerNumber}
                </span>
              </div>

              <VisiteLapanganModule
                applications={[application]}
                onUpdateApplication={(updated) => {
                  onUpdateApplication(updated);
                }}
                onSelectApplication={(app) => {
                  // already selected
                }}
                onSendWhatsApp={onSendWhatsApp}
                currentRole={currentRole}
                singleApplication={true}
              />
            </div>
          )}

          {/* TAB: SCHEDULE (SURAT & JADWAL KONSULTASI) */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm">
                      Draf Surat Pemberitahuan Sidang Konsultasi Teknis TPA/TPT
                    </h3>
                    <span className="text-[10px] text-slate-400">PEMERINTAH KABUPATEN GARUT - DINAS PUPR</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => triggerPdfPrint('printable-notice-letter-wrapper', `Surat_Undangan_Konsultasi_${application.registerNumber.replace(/[^a-zA-Z0-9]/g, '_')}`)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
                      title="Cetak surat undangan fisik format kedinasan A4"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span>Cetak Undangan (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleIssueNoticeLetter}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase transition w-full sm:w-auto"
                    >
                      Terbitkan & Kirim Notifikasi
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-500 block text-[10px] mb-1">Tanggal Sidang Jumat</label>
                    <input
                      type="date"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10px] mb-1">Waktu / Jam Sesi</label>
                    <input
                      type="text"
                      value={noticeTime}
                      onChange={(e) => setNoticeTime(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10px] mb-1">Ruangan Sidang</label>
                    <input
                      type="text"
                      value={noticeRoom}
                      onChange={(e) => setNoticeRoom(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                {/* Interactive TPA/TPT Assignment Checklist Section */}
                <div className="border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-sm space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs">
                      Penugasan Tim Penilai Teknis / Tim Profesi Ahli (TPA)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {MASTER_EXPERTS.map((expert) => {
                      const isAssigned = assignedExperts.some(e => e.name === expert.name);
                      return (
                        <label
                          key={expert.name}
                          className={`flex items-start gap-2.5 p-2 border cursor-pointer transition ${
                            isAssigned 
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => toggleExpertAssignment(expert)}
                            className="mt-1 h-3.5 w-3.5 rounded-xs border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold block text-slate-900 dark:text-slate-100">{expert.name}</span>
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px] mt-0.5">
                              {expert.expertise} • <span className="font-semibold text-indigo-600 dark:text-indigo-400">({expert.role})</span>
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Active Panel Members Badge Summary */}
                  <div className="flex flex-wrap gap-1.5 items-center pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Anggota Terpilih:</span>
                    {assignedExperts.length === 0 ? (
                      <span className="text-[10px] font-bold text-amber-600 uppercase">Belum ada tim yang ditugaskan</span>
                    ) : (
                      assignedExperts.map((exp) => (
                        <span 
                          key={exp.name} 
                          className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 rounded-sm font-bold text-[9px] uppercase border border-indigo-200 dark:border-indigo-900"
                        >
                          {exp.name.split(',')[0]} ({exp.role})
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Formal Letter Preview */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-[11px] font-mono leading-relaxed space-y-2">
                  <div className="text-center font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
                    PEMERINTAH KABUPATEN GARUT<br />
                    DINAS PEKERJAAN UMUM DAN PENATAAN RUANG<br />
                    <span className="text-[10px] font-normal text-slate-500">Jl. Raya Samarang No. 115, Tarogong Kidul, Garut</span>
                  </div>
                  <div>Nomor: {application.consultationNotice?.letterNumber || '600.1.15/DPUPR-PBG/2026'}</div>
                  <div>Lampiran: 1 (satu) Berkas</div>
                  <div>Perihal: <span className="font-bold">Pemberitahuan Jadwal Sidang Konsultasi Teknis PBG/SLF</span></div>
                  <div className="pt-2">
                    Kepada Yth. <strong>{application.applicant.name}</strong><br />
                    di Tempat
                  </div>
                  <p className="pt-1">
                    Sehubungan dengan permohonan {isSlf ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'} nomor register <strong>{application.registerNumber}</strong> untuk bangunan gedung <strong>"{application.building.name}"</strong>, dengan ini kami mengundang Saudara/i untuk hadir pada:
                  </p>
                  <div className="pl-4 space-y-0.5">
                    <div>• Hari / Tanggal: <strong>Jumat, {noticeDate}</strong></div>
                    <div>• Waktu: <strong>{noticeTime}</strong></div>
                    <div>• Tempat: <strong>{noticeRoom}</strong></div>
                    {assignedExperts.length > 0 && (
                      <div>• Tim Ahli / TPA: <strong>{assignedExperts.map(e => e.name.split(',')[0]).join(', ')}</strong></div>
                    )}
                  </div>
                  <p>
                    Demikian surat pemberitahuan ini disampaikan untuk diketahui dan dihadiri tepat pada waktunya.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BA (BA KONSULTASI & PLENO) */}
          {activeTab === 'BA' && (
            <div className="space-y-6 font-mono text-xs">
              
              {/* Berita Acara Konsultasi */}
              <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm">
                    Formulir Berita Acara (BA) Konsultasi Teknis TPA/TPT
                  </h3>
                  <button
                    onClick={handleSubmitBaKonsultasi}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase"
                  >
                    Simpan Berita Acara
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-500 block text-[10px] mb-1 uppercase font-bold">Hasil Keputusan Sidang Konsultasi</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBaResult('DISETUJUI')}
                        className={`px-3 py-1.5 font-bold border transition ${
                          baResult === 'DISETUJUI'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        ✓ Disetujui (Lanjut ke BA Pleno)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaResult('PERBAIKAN')}
                        className={`px-3 py-1.5 font-bold border transition ${
                          baResult === 'PERBAIKAN'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        ⚠ Perlu Perbaikan (Revisi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaResult('KONSULTASI_ULANG')}
                        className={`px-3 py-1.5 font-bold border transition ${
                          baResult === 'KONSULTASI_ULANG'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        ✕ Konsultasi Ulang
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block text-[10px] mb-1 uppercase font-bold">Catatan Teknis Tim Ahli (TPA/TPT)</label>
                    <textarea
                      rows={3}
                      value={baNotes}
                      onChange={(e) => setBaNotes(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  {baResult === 'PERBAIKAN' && (
                    <div>
                      <label className="text-slate-500 block text-[10px] mb-1 uppercase font-bold">Daftar Item Revisi Dokumen (Satu per baris)</label>
                      <textarea
                        rows={3}
                        value={baRevisions}
                        onChange={(e) => setBaRevisions(e.target.value)}
                        placeholder="Contoh: Tambahkan notasi dimensi tangga darurat&#10;Lengkapi perhitungan beban gempa SAP2000"
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Berita Acara Pleno */}
              <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm">
                    Berita Acara Sidang Pleno & Rekomendasi Teknis (Rekomtek)
                  </h3>
                  <button
                    onClick={handleFinalizeBaPleno}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
                  >
                    Sahkan BA Pleno
                  </button>
                </div>

                <div>
                  <label className="text-slate-500 block text-[10px] mb-1 uppercase font-bold">Kesimpulan Rekomendasi Teknis Akhir</label>
                  <textarea
                    rows={2}
                    value={plenoNotes}
                    onChange={(e) => setPlenoNotes(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB: RETRIBUTION */}
          {activeTab === 'RETRIBUTION' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-slate-900 text-white p-5 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                    Kalkulasi Retribusi PBG (PP 16/2021)
                  </span>
                  <div className="text-2xl font-bold text-emerald-400">
                    {application.retribution ? `Rp ${application.retribution.finalRetribution.toLocaleString('id-ID')}` : 'Belum Dihitung'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunRetribution}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 uppercase"
                  >
                    Hitung Ulang
                  </button>
                  <button
                    onClick={handleFinalizeSkrd}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase"
                  >
                    Terbitkan SKRD
                  </button>
                </div>
              </div>

              {application.retribution && (
                <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Indeks Fungsi</span>
                      <span className="font-bold">{application.retribution.indexFungsi}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Kompleksitas</span>
                      <span className="font-bold">{application.retribution.indexKompleksitas}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Jumlah Lantai</span>
                      <span className="font-bold">{application.retribution.indexJumlahLantai}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Lokalitas</span>
                      <span className="font-bold">{application.retribution.indeksLokalitas}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: LOG RIWAYAT & AUDIT TRAIL */}
          {activeTab === 'LOGS' && (
            <StatusAuditTrailView application={application} />
          )}

        </div>

        {/* Sticky Mobile Bottom Verification Action & Navigation Bar (Active on viewport < 768px) */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-700/80 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] p-2.5 space-y-2 font-mono">
          
          {/* Row 1: Contextual Instant Verification Action Button */}
          <div className="flex items-center gap-1.5">
            {activeTab === 'DOCS' && (
              <>
                <button
                  type="button"
                  onClick={handleApproveMultiVerif}
                  className="flex-1 py-2 px-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui Semua Valid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocumentHub(true)}
                  className="py-2 px-2.5 bg-slate-800 active:bg-slate-700 text-white font-bold text-xs uppercase border border-slate-700 flex items-center justify-center gap-1"
                  title="Dokumen Hub SSOT"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hub</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="py-2 px-2.5 bg-slate-800 active:bg-slate-700 text-slate-200 font-bold text-xs uppercase border border-slate-700 flex items-center justify-center gap-1"
                  title="Cetak Daftar Simak"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </>
            )}

            {activeTab === 'VISITE' && (
              <>
                <button
                  type="button"
                  onClick={handleFinalizeBaLapangan}
                  className="flex-1 py-2 px-3 bg-amber-600 active:bg-amber-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <Compass className="w-4 h-4" />
                  <span>Sahkan BA Lapangan SLF</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerPdfPrint('printable-ba-lapangan-area', `BA_LAPANGAN_${application.registerNumber}`)}
                  className="py-2 px-3 bg-slate-800 text-slate-200 font-bold text-xs uppercase border border-slate-700 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </>
            )}

            {activeTab === 'SCHEDULE' && (
              <>
                <button
                  type="button"
                  onClick={handleIssueNoticeLetter}
                  className="flex-1 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Terbitkan Surat & Jadwalkan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const waText = `Yth. ${application.applicant.name}, jadwal Sidang Konsultasi PBG ${application.registerNumber} adalah ${noticeDate} pukul ${noticeTime} di ${noticeRoom}.`;
                    onSendWhatsApp(application.applicant.phone, waText, 'JADWAL_KONSULTASI');
                  }}
                  className="py-2 px-3 bg-emerald-700 text-white font-bold text-xs uppercase flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WA</span>
                </button>
              </>
            )}

            {activeTab === 'BA' && (
              <>
                {application.currentStage === 'STAGE_6_BA_PLENO' ? (
                  <button
                    type="button"
                    onClick={handleFinalizeBaPleno}
                    className="flex-1 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    <Award className="w-4 h-4" />
                    <span>Sahkan BA Pleno & Rekomtek</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitBaKonsultasi}
                    className="flex-1 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    <Award className="w-4 h-4" />
                    <span>Catat Hasil BA ({baResult})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => triggerPdfPrint('printable-ba-konsultasi-area', `BA_KONSULTASI_${application.registerNumber}`)}
                  className="py-2 px-3 bg-slate-800 text-slate-200 font-bold text-xs uppercase border border-slate-700 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </>
            )}

            {activeTab === 'RETRIBUTION' && (
              <button
                type="button"
                onClick={handleFinalizeSkrd}
                className="flex-1 py-2 px-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <Calculator className="w-4 h-4" />
                <span>Terbitkan SKRD Retribusi</span>
              </button>
            )}

            {activeTab === 'PIPELINE' && (
              <button
                type="button"
                onClick={() => setActiveTab('DOCS')}
                className="flex-1 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <FileCheck className="w-4 h-4" />
                <span>Buka Verifikasi Dokumen ({application.documents.filter(d => d.status === 'VALID').length}/{application.documents.length})</span>
              </button>
            )}

            {activeTab === 'INFO' && (
              <button
                type="button"
                onClick={() => setActiveTab('DOCS')}
                className="flex-1 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Mulai Multi Verifikasi Dokumen</span>
              </button>
            )}

            {activeTab === 'LOGS' && (
              <button
                type="button"
                onClick={() => setActiveTab('DOCS')}
                className="flex-1 py-2 px-3 bg-slate-800 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 border border-slate-700 transition"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Kembali ke Dokumen</span>
              </button>
            )}

            {/* Quick AI Trigger */}
            <button
              type="button"
              onClick={() => onAskAiAboutThisApp(application)}
              className="py-2 px-2.5 bg-indigo-900/90 text-indigo-200 border border-indigo-500 font-bold text-xs uppercase flex items-center justify-center"
              title="Tanya AI Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          {/* Row 2: Sticky Bottom Horizontal Navigation Tabs */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-1 text-[9px] overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('PIPELINE')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition ${
                activeTab === 'PIPELINE' ? 'text-indigo-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Alur</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DOCS')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition relative ${
                activeTab === 'DOCS' ? 'text-indigo-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Dokumen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('VISITE')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition ${
                activeTab === 'VISITE' ? 'text-amber-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Visite</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SCHEDULE')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition ${
                activeTab === 'SCHEDULE' ? 'text-indigo-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Surat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BA')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition ${
                activeTab === 'BA' ? 'text-indigo-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>BA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RETRIBUTION')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition ${
                activeTab === 'RETRIBUTION' ? 'text-indigo-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>SKRD</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`flex flex-col items-center py-1 px-1.5 rounded transition ${
                activeTab === 'INFO' ? 'text-indigo-400 font-bold bg-white/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Info</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex flex-col items-center py-1 px-1.5 text-rose-400 hover:text-rose-300 font-bold ml-auto"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Desktop Footer (Hidden on mobile) */}
        <div className="hidden md:flex bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 p-4 items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Terakhir diperbarui: {new Date(application.lastUpdated).toLocaleString('id-ID')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold uppercase transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>

    {/* Document Engine SSOT Hub Modal */}
    {showDocumentHub && (
      <DocumentEngineHub
        application={application}
        onClose={() => setShowDocumentHub(false)}
      />
    )}

    {/* Internal Approval Form PDF Modal */}
    {showInternalApprovalModal && (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono">
          <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-white">
                Pratinjau Laporan Persetujuan Internal DPUPR Garut (PDF)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerPdfPrint('printable-internal-approval-area', `APPROVAL_${application.registerNumber}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Unduh PDF</span>
              </button>
              <button
                onClick={() => setShowInternalApprovalModal(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                [X]
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-100 dark:bg-slate-950/80 flex justify-center">
            <InternalApprovalFormPrint application={application} />
          </div>
        </div>
      </div>
    )}
  </>
  );
};
