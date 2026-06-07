// src/components/SelectField.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable select dropdown component.
 * Props:
 *  - id: element id
 *  - label: field label
 *  - options: array of {value, label}
 *  - value: selected value
 *  - onChange: handler receiving new value
 *  - required: boolean (optional)
 */
export default function SelectField({
  id,
  label,
  options = [],
  value,
  onChange,
  required = false,
}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1" htmlFor={id}>
        {label}{required && ' *'}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          required={required}
          className="w-full bg-[#070a13] border border-slate-850 rounded-xl py-3 pl-4 pr-10 text-xs text-slate-150 focus:outline-none focus:border-[#F5C800] transition font-black cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
