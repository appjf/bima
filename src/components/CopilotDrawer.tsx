import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  FileCheck, 
  Calculator, 
  Calendar, 
  AlertCircle,
  MessageSquare,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Application, UserRole, CopilotMessage } from '../types';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  currentRole: UserRole;
  initialPrompt?: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  applications,
  currentRole,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Halo! Saya adalah **AI Copilot SIMBG DPUPR Garut**.
Saya siap membantu Anda memvalidasi dokumen teknis, menghitung retribusi sesuai PP 16/2021, menyusun jadwal sidang TPA, atau merumuskan draf notifikasi WhatsApp untuk pemohon.

Silakan ajukan pertanyaan atau pilih salah satu prompt cepat di bawah.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputPrompt;
    if (!messageText.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build relevant context from active dossiers
      const contextSummary = {
        totalApplications: applications.length,
        readyForConsultation: applications.filter(a => a.status === 'READY_FOR_CONSULTATION').length,
        scheduled: applications.filter(a => a.status === 'SCHEDULED').length,
        incomplete: applications.filter(a => a.status === 'INCOMPLETE').length,
        recentDossiers: applications.slice(0, 5).map(a => ({
          reg: a.registerNumber,
          applicant: a.applicant.name,
          building: a.building.name,
          status: a.status,
          area: a.building.buildingArea,
          district: a.building.district
        }))
      };

      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          currentRole,
          contextData: contextSummary
        })
      });

      const data = await response.json();
      const reply = data.text || 'Maaf, terjadi kendala saat menghubungi asisten AI.';

      const botMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: CopilotMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: 'Terjadi kegagalan koneksi ke server AI. Mohon coba sesaat lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Jelaskan syarat gambar struktur untuk ruko 3 lantai di Garut',
    'Bagaimana rumus retribusi bangunan fungsi usaha sesuai PP 16/2021?',
    'Buatkan draf WA sopan untuk pemohon yang belum mengunggah KRK',
    'Berapa batas waktu SLA permohonan PBG sederhana vs tidak sederhana?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col font-sans">
      
      {/* Header (Geometric Balance) */}
      <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-none flex items-center justify-center text-white font-bold text-xs">
            Σ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wider uppercase">AI COPILOT // SIMBG</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 border border-emerald-800">
                ONLINE
              </span>
            </div>
            <span className="text-[10px] text-slate-400">PP 16/2021 REGULATORY ASSISTANT</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-mono"
        >
          [ESC / CLOSE]
        </button>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap space-x-2">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp)}
            className="inline-block text-[11px] px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-600 transition font-mono"
          >
            {qp.slice(0, 34)}...
          </button>
        ))}
      </div>

      {/* Message Chat List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-900/40">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mb-1">
                <span>{isUser ? 'OPERATOR' : 'AI_COPILOT'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div 
                className={`p-3.5 text-xs max-w-[90%] font-sans whitespace-pre-wrap leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span>Menganalisis regulasi & menghitung data...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 font-sans">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan regulasi atau evaluasi berkas..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-600 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs uppercase disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
