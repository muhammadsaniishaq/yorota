// src/components/SignaturePanel.jsx
import React from 'react';
import { Trash2, Upload } from 'lucide-react';

/**
 * SignaturePanel component encapsulates the signature handling UI.
 * It supports three modes:
 *   - 'draw'   : user draws on a canvas
 *   - 'type'   : displays typed name as cursive signature
 *   - 'upload' : user uploads an image file
 * For the Commander General signature, the parent can set `presetMode="preset"`
 * which will hide the mode toggle and only display the provided `signatureImage`.
 */
export default function SignaturePanel({
  mode,
  setMode,
  canvasRef,
  isDrawing,
  setIsDrawing,
  signatureImage,
  setSignatureImage,
  hasDrawn,
  setHasDrawn,
  clearCanvas,
  handleSignatureUpload,
  name,
  presetMode, // optional, when "preset" the component shows only the preset image
}) {
  // Canvas drawing helpers (identical to parent implementation)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
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
    ctx.strokeStyle = '#0f172a';
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
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  // Render mode toggle only when not in preset mode
  const renderToggle = () => {
    if (presetMode === 'preset') return null;
    return (
      <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850 text-[9px] font-black">
        <button
          type="button"
          onClick={() => { setMode('draw'); clearCanvas(); }}
          className={`px-2.5 py-1 rounded-md transition ${mode === 'draw' ? 'bg-[#F5C800] text-slate-950' : 'text-slate-400'}`}
        >
          DRAW
        </button>
        <button
          type="button"
          onClick={() => setMode('type')}
          className={`px-2.5 py-1 rounded-md transition ${mode === 'type' ? 'bg-[#F5C800] text-slate-950' : 'text-slate-400'}`}
        >
          TYPE
        </button>
        <label className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-0.5 ${mode === 'upload' ? 'bg-[#F5C800] text-slate-950' : 'text-slate-400'}`}>
          FILE
          <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
        </label>
      </div>
    );
  };

  return (
    <div className="border-t border-slate-850/60 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">
          {presetMode === 'preset' ? 'Commander General Signature *' : "Holder's Signature Seal *"}
        </label>
        {renderToggle()}
      </div>

      {presetMode === 'preset' ? (
        <div className="flex items-center justify-center py-2 bg-white rounded-xl border border-slate-800 px-4 select-none">
          {signatureImage ? (
            <img src={signatureImage} alt="Preset CG Signature" className="h-8 object-contain" />
          ) : (
            <span className="text-[10px] text-slate-400">Loading Preset Signature...</span>
          )}
        </div>
      ) : mode === 'draw' ? (
        <div className="space-y-2">
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
      ) : mode === 'type' ? (
        <div>
          <span className="text-[10px] font-black text-slate-100 block italic py-3 bg-slate-950 rounded-xl text-center border border-slate-850 px-4 font-mono select-none">
            {name || 'Staff Signature'}
          </span>
          <span className="text-[8px] text-slate-500 font-bold tracking-wide block mt-1 uppercase text-right">Cursive Autograph pre-render</span>
        </div>
      ) : null}
    </div>
  );
}
