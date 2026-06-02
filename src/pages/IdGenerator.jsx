// YOROTA Smart Office - Marshal Identity Card Generator System
import React, { useState, useRef, useEffect } from 'react';
import { 
  Contact, 
  User, 
  Shield, 
  Droplet, 
  CreditCard, 
  Trash2, 
  Upload, 
  Signature, 
  RefreshCw, 
  FileText, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { pdfGenerator } from '../services/pdfGenerator';

export default function IdGenerator({ currentUser, setGlobalNotification }) {
  // Creator Form States
  const [name, setName] = useState('Muhammad Sani Isyaku');
  const [rank, setRank] = useState('MARSHAL');
  const [serviceNo, setServiceNo] = useState('A/YB/ST/YOR/RNO/356');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [issuedDate, setIssuedDate] = useState('2021-10-01');

  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Dynamically generate QR code when state changes
  useEffect(() => {
    const generateQR = async () => {
      try {
        const payload = `YOROTA OFFICIAL STAFF ID\nName: ${name}\nRank: ${rank}\nService No: ${serviceNo}\nBlood Group: ${bloodGroup}\nIssued: ${issuedDate}`;
        const url = await QRCode.toDataURL(payload, {
          margin: 1,
          width: 150,
          color: {
            dark: '#090d16',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR Code', err);
      }
    };
    generateQR();
  }, [name, rank, serviceNo, bloodGroup, issuedDate]);

  // Images and drawing states
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  
  // Toggle: Canvas Drawing vs Cursive typed signature
  const [sigMode, setSigMode] = useState('draw'); // 'draw' or 'type'
  const [typedSigFont, setTypedSigFont] = useState('Pacifico'); // Cursive styles

  // Canvas drawing references
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Loaders
  const [generating, setGenerating] = useState(false);

  // File explorer upload helpers
  const handlePassportUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setGlobalNotification({ message: 'Passport photo must be smaller than 2MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPassportPhoto(reader.result);
      setGlobalNotification({ message: 'Passport photo loaded into card frame!', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  // Signature canvas drawing capture methods
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support touch and mouse coordinates
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // Deep slate blue signature ink
    
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Capture canvas base64 image data and update state
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
    setHasDrawn(false);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSignatureImage(reader.result);
      setSigMode('upload');
      setGlobalNotification({ message: 'Handwritten signature image loaded!', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      let finalSignature = signatureImage;
      
      // If typing signature, render custom text cursive style on canvas first to base64
      if (sigMode === 'type') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 150;
        tempCanvas.height = 50;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 150, 50);
        ctx.font = 'bolditalic 16px "Times New Roman", cursive';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(name.substring(0, 15), 10, 30);
        finalSignature = tempCanvas.toDataURL('image/png');
      }

      await pdfGenerator.generateMarshalIdCard({
        name: name.trim() || 'Marshal Staff',
        rank,
        serviceNo: serviceNo.trim() || 'A/YB/ST/YOR/RNO/356',
        bloodGroup,
        issuedDate,
        passportPhoto,
        signature: finalSignature
      });

      setGlobalNotification({ message: 'Official Marshal ID printable PDF created!', type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error generating PDF card layout.', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 px-1 sm:px-4 pb-8 max-w-7xl mx-auto">
      
      {/* Top Gold & Emerald Stripe Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-[#F5C800] to-emerald-500 rounded-full" />

      {/* Zebra Crossing Divider & Flowing Highway Line */}
      <div className="space-y-1.5 my-2 select-none">
        <div className="zebra-crossing-line opacity-95" />
        <div className="animate-road-flow" />
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <Contact className="w-6 h-6 text-[#F5C800]" /> YOROTA Staff ID Generator
          </h1>
          <p className="text-[10px] sm:text-sm text-slate-450 mt-1 leading-relaxed">
            Generate official printable double-sided YOROTA Marshal Staff Identity Cards matching agency physical standards.
          </p>
        </div>
      </div>

      {/* Main Form & Preview Dual Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        
        {/* LEFT COLUMN: Input form details (xl:2 cols) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
            
            <div className="flex items-center gap-2 pb-4 border-b border-slate-850/60 mb-4 select-none">
              <Contact className="w-4 h-4 text-[#F5C800]" />
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Marshal Profile Credentials</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-350">
              
              {/* Full Name */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Staff Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MUHAMMAD SANI ISYAKU"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                  />
                </div>
              </div>

              {/* Service Number */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Service Registration No *</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={serviceNo}
                    onChange={(e) => setServiceNo(e.target.value)}
                    placeholder="e.g. A/YB/ST/YOR/RNO/356"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Rank Selector */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Agency Rank *</label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full bg-[#070a13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-150 focus:outline-none focus:border-[#F5C800] transition font-black cursor-pointer"
                  >
                    <option value="MARSHAL">MARSHAL</option>
                    <option value="SECTOR COMMANDER">SECTOR COMMANDER</option>
                    <option value="DESK OFFICER">DESK OFFICER</option>
                    <option value="DIRECTOR">DIRECTOR</option>
                    <option value="COMMANDER GENERAL">COMMANDER GENERAL</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Blood Group *</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-[#070a13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-150 focus:outline-none focus:border-[#F5C800] transition font-black cursor-pointer"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Issued Date */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">ID Issued Date *</label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-400 focus:outline-none focus:border-[#F5C800] transition cursor-pointer"
                />
              </div>

              {/* Passport Photo Upload */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Passport Photograph *</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {passportPhoto ? (
                      <img src={passportPhoto} alt="Passport photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-700" />
                    )}
                  </div>
                  <label className="flex-1 flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700 transition cursor-pointer text-slate-400 hover:text-[#F5C800]">
                    <Upload className="w-4.5 h-4.5 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Upload Passport Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePassportUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Holder's Signature Panel */}
              <div className="border-t border-slate-850/60 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Holder's Signature Seal *</label>
                  
                  {/* Signature Mode Toggle */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850 text-[9px] font-black">
                    <button
                      type="button"
                      onClick={() => { setSigMode('draw'); clearCanvas(); }}
                      className={`px-2.5 py-1 rounded-md transition ${sigMode === 'draw' ? 'bg-[#F5C800] text-slate-950' : 'text-slate-400'}`}
                    >
                      DRAW
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigMode('type')}
                      className={`px-2.5 py-1 rounded-md transition ${sigMode === 'type' ? 'bg-[#F5C800] text-slate-950' : 'text-slate-400'}`}
                    >
                      TYPE
                    </button>
                    <label className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-0.5 ${sigMode === 'upload' ? 'bg-[#F5C800] text-slate-950' : 'text-slate-400'}`}>
                      FILE
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {sigMode === 'draw' && (
                  <div className="space-y-2">
                    {/* Live Signature Canvas Pad */}
                    <div className="relative rounded-xl border border-slate-800 bg-white overflow-hidden shadow-inner cursor-crosshair">
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={90}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[90px] block"
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 pointer-events-none uppercase tracking-wider">
                          Sign directly inside this panel...
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Sign
                      </button>
                    </div>
                  </div>
                )}

                {sigMode === 'type' && (
                  <div>
                    <span className="text-[10px] font-black text-slate-100 block italic py-3 bg-slate-950 rounded-xl text-center border border-slate-850 px-4 font-mono select-none">
                      {name || 'Staff Signature'}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold tracking-wide block mt-1 uppercase text-right">Cursive Autograph pre-render</span>
                  </div>
                )}

              </div>

              {/* Generate PDF Trigger Button */}
              <div className="pt-4 border-t border-slate-850/60">
                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg shadow-[#F5C800]/10 disabled:opacity-50 select-none"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'COMPILING OFFICIAL SLIPS...' : 'GENERATE PRINTABLE PDF ID CARD'}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Double Sided Print Preview Card (xl:3 cols) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-850/60 mb-6 select-none">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-[#F5C800]" />
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Double-Sided Live Print Preview</h3>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase animate-pulse select-none">LIVE VIEW</span>
            </div>

            {/* Print preview cards stacked side-by-side or wrapped */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center w-full max-w-2xl select-none">
              
              {/* ==================================================== */}
              {/* 1. CARD FRONT PREVIEW PANEL (Scaled CR80: 54mm x 85.6mm) */}
              {/* ==================================================== */}
              <div className="w-[245px] h-[388px] bg-white border border-slate-300 rounded-2xl relative shadow-2xl p-4 overflow-hidden select-none shrink-0">
                
                {/* Specular spec border lines */}
                <div className="absolute inset-1.5 border border-[#F5C800] rounded-xl pointer-events-none" />

                {/* Top Right Solid Gold Triangular flag */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[80px] border-t-[#F5C800] border-l-[80px] border-l-transparent pointer-events-none" />
                {/* Secondary black triangular slice */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[80px] border-t-transparent border-r-[45px] border-r-slate-950 pointer-events-none" />

                {/* Top Right Yobe State Logo emblem placement */}
                <div className="absolute top-2 right-2.5 w-11 h-11 bg-white rounded-md flex items-center justify-center p-0.5 border border-slate-100 shadow-sm z-10">
                  <img src="/logo.png" alt="YOROTA Seal" className="w-full h-full object-contain" />
                </div>

                {/* Card Front Top Headings */}
                <div className="space-y-0.5 pl-1">
                  <h3 className="text-[12px] font-black text-slate-900 tracking-tight leading-none">YOBE STATE</h3>
                  <h4 className="text-[6.5px] font-black text-slate-900 tracking-tighter leading-none pt-0.5">ROAD TRAFFIC MANAGEMENT</h4>
                  <h5 className="text-[8px] font-black text-slate-900 tracking-normal leading-none pt-0.5">AGENCY</h5>
                </div>

                {/* Center visual: vertical staff label & Gold photo box */}
                <div className="mt-4 flex gap-2 pl-0.5">
                  {/* Vertical Identity Card Label Box */}
                  <div className="w-[18px] h-[155px] bg-[#374151] rounded-sm flex items-center justify-center relative overflow-hidden select-none shrink-0">
                    <span className="text-[7.2px] font-black text-white uppercase tracking-widest block whitespace-nowrap -rotate-90 select-none">
                      STAFF IDENTITY CARD
                    </span>
                  </div>

                  {/* Gold frame box for Photo */}
                  <div className="w-[114px] h-[155px] border-2 border-[#F5C800] bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                    {passportPhoto ? (
                      <img src={passportPhoto} alt="Passport photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center text-[7px] text-slate-400 font-extrabold uppercase select-none">
                        <User className="w-6 h-6 text-slate-350" />
                        PASSPORT
                      </div>
                    )}
                  </div>
                </div>

                {/* Details list sections - scaled for CR80 card dimensions */}
                <div className="mt-4 space-y-1.5 pl-0.5 font-bold text-[7.5px] text-slate-800 leading-none">
                  
                  {/* Name field */}
                  <div className="flex gap-1.5 items-baseline">
                    <span className="text-slate-500 font-bold shrink-0">NAME:</span>
                    <span className="font-black text-slate-900 truncate uppercase text-[8px]">{name || '---'}</span>
                  </div>

                  {/* Rank field */}
                  <div className="flex gap-1.5 items-baseline">
                    <span className="text-slate-500 font-bold shrink-0">RANK:</span>
                    <span className="font-black text-slate-950 uppercase">{rank || '---'}</span>
                  </div>

                  {/* Service Number field */}
                  <div className="flex gap-1.5 items-baseline">
                    <span className="text-slate-500 font-bold shrink-0">SERVICE NO:</span>
                    <span className="font-black text-slate-900 uppercase font-mono">{serviceNo || '---'}</span>
                  </div>

                  {/* Blood Group field */}
                  <div className="flex gap-1.5 items-baseline">
                    <span className="text-slate-500 font-bold shrink-0">BLOOD GROUP:</span>
                    <span className="font-black text-red-600 uppercase text-[8px]">{bloodGroup || '---'}</span>
                  </div>

                  {/* Signature field */}
                  <div className="flex gap-1.5 items-center">
                    <span className="text-slate-500 font-bold shrink-0">HOLDER'S SIGN:</span>
                    {sigMode === 'draw' && signatureImage ? (
                      <img src={signatureImage} alt="Live signature" className="h-6 w-16 object-contain shrink-0" />
                    ) : sigMode === 'type' ? (
                      <span className="font-serif italic font-bold text-slate-900 pl-1 shrink-0 text-[8.5px] select-none">{name.substring(0, 15)}</span>
                    ) : sigMode === 'upload' && signatureImage ? (
                      <img src={signatureImage} alt="Uploaded signature" className="h-6 w-16 object-contain shrink-0" />
                    ) : (
                      <span className="h-4 w-16 border-b border-dashed border-slate-350 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Bottom Right QR Code layout */}
                <div className="absolute bottom-[23px] right-4 w-11 h-11 bg-white border border-slate-900 rounded-sm flex items-center justify-center p-0.5 select-none">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-100" />
                  )}
                </div>

                {/* Warning Hazard Safety stripes at front bottom */}
                <div className="absolute bottom-2.5 inset-x-2.5 h-[9px] bg-[#F5C800] rounded-sm overflow-hidden select-none pointer-events-none">
                  <div className="w-[120%] h-full bg-repeating bg-gradient-to-r from-slate-950 from-0 to-slate-950 to-1.5 transparent to-1.5 transparent to-3.5 transform -skew-x-12 select-none" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #090d16, #090d16 6px, #F5C800 6px, #F5C800 12px)' }} />
                </div>

              </div>

              {/* ==================================================== */}
              {/* 2. CARD BACK PREVIEW PANEL (Scaled CR80: 54mm x 85.6mm) */}
              {/* ==================================================== */}
              <div className="w-[245px] h-[388px] bg-white border border-slate-300 rounded-2xl relative shadow-2xl p-4 overflow-hidden select-none shrink-0">
                
                {/* Specular border lines */}
                <div className="absolute inset-1.5 border border-[#F5C800] rounded-xl pointer-events-none" />

                {/* Top Right Solid Gold Triangular flag */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[80px] border-t-[#F5C800] border-l-[80px] border-l-transparent pointer-events-none" />
                {/* Secondary black triangular slice */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[80px] border-t-transparent border-r-[45px] border-r-slate-950 pointer-events-none" />

                {/* Nigerian Coat of Arms Graphic inside top right triangle */}
                <div className="absolute top-3.5 right-3 w-8 h-8 rounded-full flex items-center justify-center p-0.5 z-10 pointer-events-none select-none">
                  {/* Visual Coat of arms shield representation */}
                  <div className="relative w-full h-full rounded-full border border-emerald-600/35 bg-white flex items-center justify-center shadow-xs select-none">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <Droplet className="w-2.5 h-2.5 text-red-500 absolute top-1" />
                  </div>
                </div>

                {/* Back card bearer conditions policies */}
                <div className="mt-8 text-center space-y-0.5 text-[7.5px] font-bold text-slate-650 leading-relaxed pr-10">
                  <p>The bearer whose Name,</p>
                  <p>Signature and Photograph</p>
                  <p>appears overleaf is a Staff of</p>
                </div>

                {/* Dark Banner with bold White Agency Headers */}
                <div className="mt-6 bg-slate-950 py-2.5 px-3 rounded-md flex flex-col items-center justify-center text-center shadow-md select-none">
                  <h3 className="text-[12px] font-black text-white tracking-wide leading-none">YOBE STATE</h3>
                  <h4 className="text-[6.5px] font-black text-white tracking-tighter leading-none pt-1">ROAD TRAFFIC MANAGEMENT AGENCY</h4>
                </div>

                {/* Lost & Found Instructions Notice */}
                <div className="mt-6 text-center space-y-1 text-slate-900 font-extrabold text-[8.5px] leading-tight">
                  <p>If lost but found please</p>
                  <p>return to the YOROTA office</p>
                </div>

                {/* Dynamic Issued Date field */}
                <div className="mt-6 text-center text-slate-500 font-black text-[7.5px] select-none tracking-wide uppercase">
                  ISSUED DATE: {issuedDate 
                    ? new Date(issuedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '1ST, OCTOBER, 2021'}
                </div>

                {/* Footer section: Left QR code, Right Commander General Sign */}
                <div className="absolute bottom-[23px] left-4 w-11 h-11 bg-white border border-slate-900 rounded-sm flex items-center justify-center p-0.5 select-none">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-100" />
                  )}
                </div>

                {/* Commander General Signature block */}
                <div className="absolute bottom-[20px] right-4 flex flex-col items-center">
                  {/* Dynamic signature curve mockup */}
                  <span className="font-serif italic font-extrabold text-[8px] text-slate-800 border-b border-slate-900 w-24 text-center pb-0.5 select-none leading-none">
                    CG YOROTA
                  </span>
                  <span className="text-[6.5px] font-black text-slate-900 pt-1 tracking-wider leading-none uppercase">Commander General</span>
                </div>

                {/* Warning stripes at back bottom */}
                <div className="absolute bottom-2.5 inset-x-2.5 h-[9px] bg-[#F5C800] rounded-sm overflow-hidden select-none pointer-events-none">
                  <div className="w-[120%] h-full bg-repeating transform -skew-x-12 select-none" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #090d16, #090d16 6px, #F5C800 6px, #F5C800 12px)' }} />
                </div>

              </div>

            </div>

            {/* Visual Help Tips Banner */}
            <div className="w-full bg-[#F5C800]/5 border border-[#F5C800]/15 rounded-2xl p-4 mt-6 flex items-start gap-3 text-xs leading-relaxed text-slate-400 font-semibold shadow-inner select-none">
              <HelpCircle className="w-5 h-5 text-[#F5C800] shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-slate-205 uppercase block mb-0.5 tracking-wider">Printing & Laminating Guideline:</span>
                Print the generated PDF on a dual-sided PVC plastic card or heavy cardstock, cut along dotted guides, fold both card halves together, and seal inside a vertical ID card laminate pouch.
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
