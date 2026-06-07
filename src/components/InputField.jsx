// src/components/InputField.jsx
import React from 'react';

/**
 * Reusable input component supporting text, date, and file types.
 * For file inputs it can show a preview image or a custom preview component.
 */
export default function InputField({
  id,
  label,
  icon,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  accept,
  preview,
  previewComponent,
  uppercase = false,
}) {
  const handleChange = (e) => {
    if (type === 'file') {
      // Pass the raw event to the parent handler (e.g., handlePassportUpload)
      onChange(e);
    } else {
      const val = e.target.value;
      onChange(uppercase ? val.toUpperCase() : val);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1" htmlFor={id}>
        {label}{required && ' *'}
      </label>
      {type === 'file' ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden shrink-0 relative">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              previewComponent || <span className="text-slate-500 text-xs">No file</span>
            )}
          </div>
          <label className="flex-1 flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700 transition cursor-pointer text-slate-400 hover:text-[#F5C800]">
            {icon && React.cloneElement(icon, { className: 'w-4.5 h-4.5 mb-1' })}
            <span className="text-[10px] font-bold uppercase">{placeholder}</span>
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {React.cloneElement(icon, { className: 'w-4 h-4 text-slate-500' })}
            </div>
          )}
          <input
            id={id}
            type={type}
            className={`w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 ${icon ? 'pl-11' : 'pl-4'} pr-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold`}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            required={required}
            accept={accept}
          />
        </div>
      )}
    </div>
  );
}
