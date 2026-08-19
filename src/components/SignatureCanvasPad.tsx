import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, Download, Upload, CheckCircle2, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import { DigitalSignatureData, generateSignatureQrPayload } from '../lib/signatureEngine';

interface SignatureCanvasPadProps {
  roleTitle: string;
  signatureData: DigitalSignatureData;
  onSaveSignature: (updated: DigitalSignatureData) => void;
}

export const SignatureCanvasPad: React.FC<SignatureCanvasPadProps> = ({
  roleTitle,
  signatureData,
  onSaveSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1e1b4b'); // Default dark navy
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [name, setName] = useState(signatureData.name || '');
  const [nip, setNip] = useState(signatureData.nip || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState(signatureData.signatureDataUrl || '');
  const [currentQrUrl, setCurrentQrUrl] = useState(
    signatureData.qrCodeUrl || generateSignatureQrPayload(signatureData)
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [penColor, strokeWidth]);

  // Drawing helper methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to Data URL
    const dataUrl = canvas.toDataURL('image/png');
    setCurrentSignatureUrl(dataUrl);

    const updatedData: DigitalSignatureData = {
      ...signatureData,
      name,
      nip,
      signatureDataUrl: dataUrl,
      updatedAt: new Date().toISOString()
    };

    // Generate fresh QR Code
    const freshQr = generateSignatureQrPayload(updatedData);
    updatedData.qrCodeUrl = freshQr;
    setCurrentQrUrl(freshQr);

    onSaveSignature(updatedData);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCurrentSignatureUrl(result);
        const updatedData: DigitalSignatureData = {
          ...signatureData,
          name,
          nip,
          signatureDataUrl: result,
          updatedAt: new Date().toISOString()
        };
        const freshQr = generateSignatureQrPayload(updatedData);
        updatedData.qrCodeUrl = freshQr;
        setCurrentQrUrl(freshQr);

        onSaveSignature(updatedData);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateNewQr = () => {
    const updatedData: DigitalSignatureData = {
      ...signatureData,
      name,
      nip,
      signatureDataUrl: currentSignatureUrl,
      updatedAt: new Date().toISOString()
    };
    const freshQr = generateSignatureQrPayload(updatedData);
    updatedData.qrCodeUrl = freshQr;
    setCurrentQrUrl(freshQr);
    onSaveSignature(updatedData);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            Tanda Tangan Digital & QR Code // {roleTitle}
          </h3>
        </div>
        {savedSuccess && (
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200 flex items-center gap-1 animate-pulse">
            <CheckCircle2 className="w-3 h-3" />
            <span>Tersimpan Otomatis!</span>
          </span>
        )}
      </div>

      {/* Inputs: Nama & NIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
        <div>
          <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
            Nama Pejabat / Penandatangan:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. DEDI KURNIAWAN, S.ST, MT"
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
            NIP Resmi:
          </label>
          <input
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            placeholder="E.g. 19820315 200801 1 009"
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main Canvas Pad & Preview Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Left: Interactive Draw Canvas (7 Cols) */}
        <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-indigo-600" />
              <span>Goreskan Tanda Tangan pada Pad (Touch / Mouse):</span>
            </span>

            {/* Controls Palette */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {['#1e1b4b', '#020617', '#1d4ed8'].map(color => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-4 h-4 rounded-full border ${penColor === color ? 'ring-2 ring-indigo-500 scale-110' : 'border-slate-300'}`}
                    title="Pilih Warna Tinta"
                  />
                ))}
              </div>
              <select
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="text-[9px] p-0.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value={2}>Ketebalan 2px</option>
                <option value={3}>Ketebalan 3px</option>
                <option value={4}>Ketebalan 4px</option>
              </select>
            </div>
          </div>

          {/* HTML5 Canvas */}
          <div className="relative bg-white border border-dashed border-slate-300 dark:border-slate-700 rounded overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[150px] cursor-crosshair touch-none bg-white"
            />
            <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none select-none">
              [ AREA TANDA TANGAN DIGITAL ]
            </div>
          </div>

          {/* Buttons: Clear, Upload File, Save */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={clearCanvas}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase flex items-center gap-1 transition"
              >
                <Eraser className="w-3 h-3" />
                <span>Bersihkan</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase flex items-center gap-1 transition"
              >
                <Upload className="w-3 h-3" />
                <span>Unggah Gambar</span>
              </button>
            </div>

            <button
              onClick={handleSaveCanvasSignature}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase flex items-center gap-1 transition shadow-2xs"
            >
              <Download className="w-3 h-3" />
              <span>Simpan Goresan</span>
            </button>
          </div>
        </div>

        {/* Right: Live Preview TTE Signature & Automatic QR Code (5 Cols) */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hasil Konversi QR & Preview TTE:</span>
            </span>
            <button
              onClick={handleGenerateNewQr}
              className="text-[9px] text-indigo-600 hover:underline flex items-center gap-0.5"
              title="Perbarui Hash & QR Code"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerasi QR</span>
            </button>
          </div>

          {/* Signature & QR Preview Card */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-around gap-2 text-center">
            
            {/* Signature Image Preview */}
            <div className="flex flex-col items-center space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-mono">Tanda Tangan</span>
              <div className="w-28 h-16 border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 p-1">
                {currentSignatureUrl ? (
                  <img src={currentSignatureUrl} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[9px] text-slate-400 italic">Belum dibuat</span>
                )}
              </div>
            </div>

            {/* Auto Converted QR Code */}
            <div className="flex flex-col items-center space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-mono">Verifikasi QR Code</span>
              <div className="w-16 h-16 border border-slate-300 dark:border-slate-700 bg-white p-0.5 flex items-center justify-center">
                {currentQrUrl ? (
                  <img src={currentQrUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-10 h-10 text-slate-300" />
                )}
              </div>
            </div>

          </div>

          {/* Verification Badge Description */}
          <div className="text-[10px] text-slate-500 font-sans leading-tight bg-emerald-50/60 dark:bg-emerald-950/30 p-2 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
            <strong className="block font-mono text-[9px] uppercase text-emerald-700 dark:text-emerald-400">
              ✓ TERVERIFIKASI SISTEM ELEKTRONIK SIMBG DPUPR GARUT
            </strong>
            QR Code di atas secara otomatis disematkan pada seluruh dokumen cetak (SKRD, BA Konsultasi, BA Visite, Surat Verifikasi) untuk keperluan verifikasi keaslian dokumen secara online.
          </div>

        </div>

      </div>
    </div>
  );
};
