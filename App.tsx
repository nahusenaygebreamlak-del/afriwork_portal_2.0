import React, { useState, useEffect, useRef } from 'react';
import {
  FormData,
  ExperienceLevel,
  EmploymentType,
  SalaryRange,
  JobSite
} from './types';
import { INITIAL_FORM_STATE, STEPS } from './constants';
import { Input, TextArea, Select, RadioGroup, Calendar } from './components/FormElements';

// CONFIG: Using import.meta.env is required for local Vite development.
const CONFIG = {
  SUPABASE_URL: (import.meta as any).env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: (import.meta as any).env.VITE_SUPABASE_KEY || '',
  SUPABASE_TABLE: 'job_requests',
  TELEGRAM_TOKEN: (import.meta as any).env.VITE_TELEGRAM_TOKEN || '',
  TELEGRAM_CHAT_ID: (import.meta as any).env.VITE_TELEGRAM_CHAT_ID || ''
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid business email';
      }
      if (!formData.companyName) newErrors.companyName = 'Company name is required';
      if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required';
    }

    if (step === 2) {
      if (!formData.jobDescription) newErrors.jobDescription = 'Please provide a job description';
    }

    if (step === 3) {
      if (!formData.contactPhone) {
        newErrors.contactPhone = 'Phone number is required';
      } else if (!/^\+?[0-9]{10,14}$/.test(formData.contactPhone.replace(/\s/g, ''))) {
        newErrors.contactPhone = 'Enter a valid phone number (e.g. +251 911...)';
      }

      if (!formData.deadline) {
        newErrors.deadline = 'Submission deadline is required';
      } else {
        const selectedDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          newErrors.deadline = 'Deadline cannot be in the past';
        }
      }

      if (!formData.workLocation) newErrors.workLocation = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const formatTelegramMessage = (data: FormData) => {
    return `🚀 *New Recruitment Request*

*Company:* ${data.companyName}
*Job Title:* ${data.jobTitle}
*Email:* ${data.email}
*Phone:* ${data.contactPhone}

*Location:* ${data.workLocation} (${data.jobSite})
*Experience:* ${data.experienceLevel}
*Salary:* ${data.salaryRange}
*Deadline:* ${data.deadline || 'Not set'}

*Description:*
${data.jobDescription.substring(0, 500)}${data.jobDescription.length > 500 ? '...' : ''}

#Afriwork #Recruitment #Hiring`;
  };

  const [syncStatus, setSyncStatus] = useState<{ supabase: 'idle' | 'success' | 'error'; telegram: 'idle' | 'success' | 'error' }>({
    supabase: 'idle',
    telegram: 'idle'
  });

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSyncing(true);
    setSyncStatus({ supabase: 'idle', telegram: 'idle' });

    // 1. Supabase Sync
    const syncSupabase = async () => {
      if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) return 'idle';
      try {
        const supabaseEndpoint = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.SUPABASE_TABLE}`;
        const response = await fetch(supabaseEndpoint, {
          method: 'POST',
          headers: {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            email: formData.email,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription,
            work_location: formData.workLocation,
            job_site: formData.jobSite,
            experience_level: formData.experienceLevel,
            salary_range: formData.salaryRange,
            contact_phone: formData.contactPhone,
            deadline: formData.deadline || null
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return 'success';
      } catch (err) {
        console.error("Supabase Sync Error:", err);
        return 'error';
      }
    };

    // 2. Telegram Sync
    const syncTelegram = async () => {
      if (!CONFIG.TELEGRAM_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) return 'idle';
      try {
        const telegramUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CONFIG.TELEGRAM_CHAT_ID,
            text: formatTelegramMessage(formData),
            parse_mode: 'Markdown'
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return 'success';
      } catch (err) {
        console.error("Telegram Sync Error:", err);
        return 'error';
      }
    };

    const [supabaseResult, telegramResult] = await Promise.all([
      syncSupabase(),
      syncTelegram()
    ]);

    setSyncStatus({ supabase: supabaseResult as any, telegram: telegramResult as any });
    setIsSyncing(false);

    // If at least one succeeded OR both were skipped (no config), consider it "sent"
    // If both return error, show an error state instead of success screen
    if (supabaseResult === 'error' && telegramResult === 'error') {
      setErrors({ submit: 'We encountered an error while saving your request. Please try again or contact support.' });
    } else {
      setSubmitted(true);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0D0D12] tracking-tight mb-8">Base Information</h3>
            <Input label="Business Email" name="email" type="email" value={formData.email} error={errors.email} onChange={handleInputChange} required placeholder="hello@company.com" />
            <Input label="Company Name" name="companyName" value={formData.companyName} error={errors.companyName} onChange={handleInputChange} required placeholder="Legal entity name" />
            <Input label="Job Title" name="jobTitle" value={formData.jobTitle} error={errors.jobTitle} onChange={handleInputChange} required placeholder="e.g. Senior Visual Designer" />
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0D0D12] tracking-tight mb-8">Role Details</h3>
            <TextArea
              label="Job Description" name="jobDescription" value={formData.jobDescription} error={errors.jobDescription} onChange={handleInputChange}
              required rows={12} placeholder="Explain the responsibilities, expectations, and goals for this position..."
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0D0D12] tracking-tight mb-8">Logistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Location" name="workLocation" value={formData.workLocation} error={errors.workLocation} onChange={handleInputChange} required placeholder="Addis Ababa" />
              <Input label="Contact Phone" name="contactPhone" type="tel" value={formData.contactPhone} error={errors.contactPhone} onChange={handleInputChange} required placeholder="+251 911 223344" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <Select
                  label="Seniority" name="experienceLevel" value={formData.experienceLevel} onChange={handleInputChange}
                  options={Object.values(ExperienceLevel).map(v => ({ label: v, value: v }))} required
                />
                <RadioGroup
                  label="Work Style" options={[{ label: 'On-Site', value: JobSite.ON_SITE }, { label: 'Remote', value: JobSite.REMOTE }]}
                  value={formData.jobSite} onChange={(val) => handleRadioChange('jobSite', val)} required
                />
                <Select
                  label="Salary Budget" name="salaryRange" value={formData.salaryRange} onChange={handleInputChange}
                  options={Object.values(SalaryRange).map(v => ({ label: v, value: v }))} required
                />
              </div>
              <div className="relative" ref={calendarRef}>
                <Input
                  label="Deadline"
                  name="deadline"
                  value={formData.deadline || "Select a date..."}
                  error={errors.deadline}
                  readOnly
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  style={{ cursor: 'pointer' }}
                  required
                />
                {isCalendarOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-2 animate-fadeIn">
                    <Calendar
                      label=""
                      value={formData.deadline}
                      onChange={(date) => {
                        setFormData(prev => ({ ...prev, deadline: date }));
                        setIsCalendarOpen(false);
                        if (errors.deadline) {
                          setErrors(prev => {
                            const updated = { ...prev };
                            delete updated.deadline;
                            return updated;
                          });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-6">
        <div className="max-w-md w-full text-center animate-scaleIn">
          <div className="w-24 h-24 bg-[#0D0D12] text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <i className="fa-solid fa-check text-3xl"></i>
          </div>
          <h2 className="text-5xl font-black text-[#0D0D12] tracking-tighter mb-6">Sent</h2>
          <p className="text-gray-600 text-lg font-medium mb-4 leading-relaxed tracking-tight">
            We've received your request. <br /> A specialist will contact you soon.
          </p>
          <div className="flex flex-col items-center gap-2 mb-12">
            {syncStatus.supabase !== 'idle' && (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${syncStatus.supabase === 'success' ? 'text-blue-600' : 'text-amber-500'}`}>
                <i className={`fa-solid ${syncStatus.supabase === 'success' ? 'fa-database' : 'fa-triangle-exclamation'} mr-2`}></i>
                {syncStatus.supabase === 'success' ? 'Synced to Cloud' : 'Cloud Sync Failed'}
              </p>
            )}
            {syncStatus.telegram !== 'idle' && (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${syncStatus.telegram === 'success' ? 'text-sky-500' : 'text-amber-500'}`}>
                <i className={`fa-solid ${syncStatus.telegram === 'success' ? 'fa-paper-plane' : 'fa-triangle-exclamation'} mr-2`}></i>
                {syncStatus.telegram === 'success' ? 'Sent to Admin' : 'Admin Alert Failed'}
              </p>
            )}
          </div>
          <button
            onClick={() => { setSubmitted(false); setFormData(INITIAL_FORM_STATE); setCurrentStep(1); setErrors({}); }}
            className="w-full py-6 bg-[#0D0D12] text-white rounded-full text-sm font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-95"
          >
            New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] selection:bg-[#0D0D12] selection:text-white font-['Plus_Jakarta_Sans']">
      <main className="relative py-12 md:py-20 px-4 md:px-6 min-h-screen flex items-center justify-center overflow-x-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[5%] right-[-10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] organic-shape -z-10 animate-float opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-15%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] organic-shape -z-10 animate-float opacity-40" style={{ animationDelay: '5s', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2))' }}></div>

        <div className="max-w-3xl w-full mx-auto relative z-10 w-full">
          {/* Stepper */}
          <div className="mb-12 px-4 md:px-10 flex justify-between relative max-w-xl mx-auto">
            <div className="absolute top-6 md:top-7 left-10 right-10 h-[1.5px] bg-gray-200/50 -z-10">
              <div
                className="h-full bg-black transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              ></div>
            </div>
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex flex-col items-center group">
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-[1.25rem] flex items-center justify-center transition-all duration-700 shadow-sm border-2 ${isActive
                      ? 'bg-black border-black text-white scale-110 shadow-lg'
                      : isCompleted
                        ? 'bg-black border-black text-white px-2'
                        : 'bg-white/80 backdrop-blur-md border-white text-gray-300'
                      }`}
                  >
                    <i className={`fa-solid ${isCompleted ? 'fa-check' : step.icon} ${isActive ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}></i>
                  </div>
                  <span className={`mt-3 md:mt-4 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-black opacity-100' : 'text-gray-400 opacity-50'}`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Main Card */}
          <div className="flex flex-col bg-white/70 backdrop-blur-[40px] rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-white/40 overflow-hidden animate-scaleIn">
            {/* Form Header */}
            <div className="px-8 md:px-12 py-6 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 bg-white/40 backdrop-blur-md border-b border-white/20">
              <div>
                <div className="flex items-center gap-2 mb-2 group cursor-default">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                    <div className="w-2.5 h-[1.5px] bg-white rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-black transition-colors">afriwork</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-[#0D0D12]">{STEPS[currentStep - 1].title}</h2>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-gray-100 text-black px-4 py-2 rounded-xl shadow-sm text-center min-w-[100px]">
                Step {currentStep} <span className="text-gray-300 mx-1">/</span> {STEPS.length}
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 px-8 md:px-16 py-10 md:py-12">
              {renderStep()}
            </form>

            {/* Form Footer */}
            <div className="px-8 md:px-12 py-6 md:py-8 bg-white/40 backdrop-blur-md border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
              <button
                type="button" onClick={prevStep} disabled={currentStep === 1}
                className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all active:scale-90 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-black'}`}
              >
                <i className="fa-solid fa-arrow-left-long"></i> Back
              </button>

              <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
                {errors.submit && (
                  <p className="text-[10px] text-red-500 font-bold animate-fadeIn text-center md:text-right">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i>{errors.submit}
                  </p>
                )}
                <button
                  type="button" onClick={currentStep === STEPS.length ? handleSubmit : nextStep}
                  disabled={isSyncing}
                  className="w-full md:w-auto px-12 md:px-16 py-4 md:py-5 bg-[#0D0D12] text-white rounded-2xl md:rounded-[1.5rem] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-wait relative overflow-hidden group"
                >
                  <span className="relative z-10">{isSyncing ? 'Syncing...' : (currentStep === STEPS.length ? 'Finalize' : 'Continue')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 md:mt-12 text-center opacity-30 hover:opacity-100 transition-opacity">
            <p className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-[0.8em]">© 2024 Afriwork Services • Built for Scale</p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        body { overflow-x: hidden; }
      `}</style>
    </div>
  );
};

export default App;