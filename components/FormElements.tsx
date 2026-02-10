
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, required, ...props }) => (
  <div className="mb-5 group">
    <label className="block text-sm font-bold text-[#0D0D12]/60 group-focus-within:text-[#0D0D12] mb-2 px-1 transition-colors">
      {label} {required && <span className="text-gray-400 font-normal">*</span>}
    </label>
    <div className="relative group/field">
      <input
        {...props}
        className={`w-full px-5 py-3.5 border border-gray-200/60 rounded-xl md:rounded-2xl bg-white/50 backdrop-blur-sm shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] focus:shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus:border-[#0D0D12] focus:bg-white outline-none transition-all font-semibold text-sm md:text-base placeholder:text-gray-400 ${error ? 'border-red-400 bg-red-50/10' : 'hover:border-gray-300'
          }`}
      />
      <div className={`absolute inset-0 rounded-[1.5rem] border-2 border-black/5 opacity-0 pointer-events-none group-focus-within:opacity-100 transition-opacity`}></div>
    </div>
    {error && <p className="text-[11px] text-red-500 mt-2.5 px-5 font-bold animate-fadeIn">{error}</p>}
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, required, rows = 4, ...props }) => (
  <div className="mb-6 group">
    <label className="block text-sm font-bold text-[#0D0D12]/60 group-focus-within:text-[#0D0D12] mb-2 px-1 transition-colors">
      {label} {required && <span className="text-gray-400 font-normal">*</span>}
    </label>
    <div className="relative">
      <textarea
        {...props}
        rows={rows}
        className={`w-full px-5 md:px-6 py-4 md:py-5 border border-gray-200/60 rounded-[1.5rem] md:rounded-[2rem] bg-white/50 backdrop-blur-sm shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] focus:shadow-[0_8px_40px_rgba(0,0,0,0.06)] focus:border-[#0D0D12] focus:bg-white outline-none transition-all resize-none font-semibold text-sm md:text-base leading-relaxed placeholder:text-gray-400 ${error ? 'border-red-400 bg-red-50/10' : 'hover:border-gray-300'
          }`}
      />
    </div>
    {error && <p className="text-[11px] text-red-500 mt-2.5 px-5 font-bold animate-fadeIn">{error}</p>}
  </div>
);

export const Select: React.FC<{
  label: string;
  options: { label: string; value: string }[];
  required?: boolean;
  value: string;
  onChange: any;
  name: string;
}> = ({ label, options, required, ...props }) => (
  <div className="mb-5 group">
    <label className="block text-sm font-bold text-[#0D0D12]/60 group-focus-within:text-[#0D0D12] mb-2 px-1 transition-colors">
      {label} {required && <span className="text-gray-400 font-normal">*</span>}
    </label>
    <div className="relative group/field">
      <select
        {...props}
        className="w-full px-5 py-3.5 border border-gray-200/60 bg-white/50 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-sm focus:border-[#0D0D12] focus:bg-white outline-none appearance-none font-semibold text-sm md:text-base cursor-pointer hover:border-gray-300 transition-all text-[#0D0D12]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-[#0D0D12] transition-transform group-focus-within:rotate-180 duration-300">
        <i className="fa-solid fa-chevron-down text-[10px]"></i>
      </div>
    </div>
  </div>
);

export const RadioGroup: React.FC<{
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: any) => void;
  required?: boolean;
}> = ({ label, options, value, onChange, required }) => (
  <div className="mb-8">
    <label className="block text-sm font-bold text-[#0D0D12]/60 mb-4 px-1">
      {label} {required && <span className="text-gray-400 font-normal">*</span>}
    </label>
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-6 md:px-10 py-3 md:py-3.5 rounded-full border text-[11px] md:text-sm font-black transition-all shadow-sm active:scale-95 ${isSelected
              ? 'bg-[#0D0D12] border-[#0D0D12] text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

export const Calendar: React.FC<{
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
}> = ({ label, value, onChange, error }) => {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSelected = (d: number) => {
    if (!value) return false;
    const selected = new Date(value);
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;
  };

  const isPast = (d: number) => {
    const checkDate = new Date(year, month, d);
    return checkDate < today;
  };

  const handleDateClick = (d: number) => {
    if (isPast(d)) return;
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];
    onChange(dateStr);
  };

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);

  return (
    <div className="mb-0">
      {label && <label className="block text-sm font-bold text-[#0D0D12]/60 mb-3 px-1 tracking-tight">{label}</label>}
      <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-7 shadow-[0_20px_40px_rgba(0,0,0,0.05)] md:shadow-[0_40px_80px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center mb-8 px-2">
          <button type="button" onClick={prevMonth} className="w-11 h-11 rounded-2xl hover:bg-gray-50 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-gray-100">
            <i className="fa-solid fa-chevron-left text-[12px] text-gray-400"></i>
          </button>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0D0D12]">{monthName} {year}</span>
          <button type="button" onClick={nextMonth} className="w-11 h-11 rounded-2xl hover:bg-gray-50 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-gray-100">
            <i className="fa-solid fa-chevron-right text-[12px] text-gray-400"></i>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-gray-300 py-3 uppercase tracking-tighter">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth(year, month) }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth(year, month) }).map((_, i) => {
            const day = i + 1;
            const past = isPast(day);
            const selected = isSelected(day);
            return (
              <button
                key={day}
                type="button"
                disabled={past}
                onClick={() => handleDateClick(day)}
                className={`aspect-square text-[12px] font-black rounded-xl flex items-center justify-center transition-all active:scale-95 ${selected
                  ? 'bg-black text-white shadow-xl scale-110'
                  : past
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-3 px-5 font-bold animate-fadeIn">{error}</p>}
    </div>
  );
};
