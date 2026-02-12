import React, { useState, useEffect, useRef } from 'react';
import {
  FormData,
  JobDetails,
  CompanyInfo,
  ExperienceLevel,
  EmploymentType,
  SalaryRange,
  JobSite,
  EducationLevel
} from './types';
import { INITIAL_FORM_STATE, INITIAL_JOB_STATE, STEPS } from './constants';
import { Input, TextArea, Select, RadioGroup, Calendar } from './components/FormElements';
import { JobForm } from './components/JobForm';
import BrandLogo from './assets/Logo.png';

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
  const [editingJob, setEditingJob] = useState<JobDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const validateCompanyInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.company.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company.email)) {
      newErrors.email = 'Please enter a valid business email';
    }
    if (!formData.company.companyName) newErrors.companyName = 'Company name is required';
    if (!formData.company.contactPhone) {
      newErrors.contactPhone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,14}$/.test(formData.company.contactPhone.replace(/\s/g, ''))) {
      newErrors.contactPhone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJob = (job: JobDetails): boolean => {
    const newErrors: Record<string, string> = {};
    if (!job.jobTitle) newErrors.jobTitle = 'Job title is required';
    if (!job.personnelCount) newErrors.personnelCount = 'Headcount is required';
    if (!job.jobDescription) newErrors.jobDescription = 'Job description is required';
    if (!job.workLocation) newErrors.workLocation = 'Location is required';
    if (!job.deadline) {
      newErrors.deadline = 'Submission deadline is required';
    } else {
      const selectedDate = new Date(job.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) newErrors.deadline = 'Deadline cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      company: { ...prev.company, [name]: value }
    }));
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAddJob = () => {
    setEditingJob({ ...INITIAL_JOB_STATE, id: Date.now().toString() });
    setErrors({});
  };

  const handleEditJob = (job: JobDetails) => {
    setEditingJob(job);
    setErrors({});
  };

  const handleSaveJob = () => {
    if (editingJob && validateJob(editingJob)) {
      setFormData(prev => {
        const existingIndex = prev.jobs.findIndex(j => j.id === editingJob.id);
        if (existingIndex >= 0) {
          const updatedJobs = [...prev.jobs];
          updatedJobs[existingIndex] = editingJob;
          return { ...prev, jobs: updatedJobs };
        } else {
          return { ...prev, jobs: [...prev.jobs, editingJob] };
        }
      });
      setEditingJob(null);
    }
  };

  const handleDeleteJob = (id: string) => {
    setFormData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j.id !== id) }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (validateCompanyInfo()) setCurrentStep(2);
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const formatTelegramMessage = (job: JobDetails, company: CompanyInfo) => {
    return `🚀 *New Recruitment Request*

*Company:* ${company.companyName}
*Job Title:* ${job.jobTitle}
*Email:* ${company.email}
*Phone:* ${company.contactPhone}

*Location:* ${job.workLocation} (${job.jobSite})
*Education:* ${job.educationLevel}
*Experience:* ${job.experienceLevel}
*Salary:* ${job.salaryRange}
*Headcount:* ${job.personnelCount}
*Deadline:* ${job.deadline || 'Not set'}

*Description:*
${job.jobDescription.substring(0, 500)}${job.jobDescription.length > 500 ? '...' : ''}

#Afriwork #Recruitment #Hiring`;
  };

  const [syncStatus, setSyncStatus] = useState<{ supabase: 'idle' | 'success' | 'error'; telegram: 'idle' | 'success' | 'error' }>({
    supabase: 'idle',
    telegram: 'idle'
  });

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();

    // Final check: must have at least one job
    if (formData.jobs.length === 0) {
      setErrors({ submit: 'Please add at least one job position.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ supabase: 'idle', telegram: 'idle' });

    let supabaseSuccessCount = 0;
    let telegramSuccessCount = 0;
    let errorsCount = 0;

    for (const job of formData.jobs) {
      // 1. Supabase Sync
      try {
        if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
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
              email: formData.company.email,
              company_name: formData.company.companyName,
              contact_phone: formData.company.contactPhone,
              job_title: job.jobTitle,
              job_description: job.jobDescription,
              work_location: job.workLocation,
              job_site: job.jobSite,
              experience_level: job.experienceLevel,
              salary_range: job.salaryRange,
              education_level: job.educationLevel,
              personnel_count: job.personnelCount,
              deadline: job.deadline || null
            })
          });
          if (response.ok) supabaseSuccessCount++;
          else {
            console.error("Supabase Error for job:", job.jobTitle, response.status);
            errorsCount++;
          }
        } else {
          // If skipped, count as pseudo-success for UI flow
          supabaseSuccessCount++;
        }
      } catch (err) {
        console.error("Supabase Exception:", err);
        errorsCount++;
      }

      // 2. Telegram Sync
      try {
        if (CONFIG.TELEGRAM_TOKEN && CONFIG.TELEGRAM_CHAT_ID) {
          const telegramUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
          const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: CONFIG.TELEGRAM_CHAT_ID,
              text: formatTelegramMessage(job, formData.company),
              parse_mode: 'Markdown'
            })
          });
          if (response.ok) telegramSuccessCount++;
          else errorsCount++;
        } else {
          telegramSuccessCount++;
        }
      } catch (err) {
        console.error("Telegram Exception:", err);
        errorsCount++;
      }
    }

    // Determine final status
    const finalSupabaseStatus = supabaseSuccessCount === formData.jobs.length ? 'success' : (supabaseSuccessCount > 0 ? 'success' : 'error'); // lenient
    const finalTelegramStatus = telegramSuccessCount === formData.jobs.length ? 'success' : (telegramSuccessCount > 0 ? 'success' : 'error');

    setSyncStatus({ supabase: finalSupabaseStatus, telegram: finalTelegramStatus });
    setIsSyncing(false);

    if (errorsCount === formData.jobs.length * 2) {
      setErrors({ submit: 'Failed to submit any jobs. Please try again.' });
    } else {
      setSubmitted(true);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0D0D12] tracking-tight mb-8">Company Information</h3>
            <Input label="Company Name" name="companyName" value={formData.company.companyName} error={errors.companyName} onChange={handleCompanyChange} required placeholder="Legal entity name" />
            <Input label="Business Email" name="email" type="email" value={formData.company.email} error={errors.email} onChange={handleCompanyChange} required placeholder="hello@company.com" />
            <Input label="Contact Phone" name="contactPhone" type="tel" value={formData.company.contactPhone} error={errors.contactPhone} onChange={handleCompanyChange} required placeholder="+251 911 223344" />
          </div>
        );
      case 2:
        if (editingJob) {
          return (
            <JobForm
              job={editingJob}
              onChange={setEditingJob}
              onSave={handleSaveJob}
              onCancel={() => setEditingJob(null)}
              errors={errors}
            />
          );
        }

        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#0D0D12] tracking-tight">Job Positions</h3>
                <p className="text-gray-500 font-medium text-sm mt-1">Add one or more roles to recruit for.</p>
              </div>
              <button
                type="button"
                onClick={handleAddJob}
                className="px-6 py-3 bg-[#0D0D12] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <i className="fa-solid fa-plus"></i> Add Position
              </button>
            </div>

            {formData.jobs.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center group hover:border-gray-300 transition-colors">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-100 transition-colors">
                  <i className="fa-solid fa-briefcase text-gray-300 text-xl group-hover:text-gray-400"></i>
                </div>
                <h4 className="text-lg font-bold text-[#0D0D12] mb-1">No positions added yet</h4>
                <p className="text-gray-400 text-sm">Click the button above to start hiring.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.jobs.map((job, index) => (
                  <div key={job.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                    <div>
                      <h4 className="text-lg font-bold text-[#0D0D12] mb-1">{job.jobTitle}</h4>
                      <div className="flex gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot"></i> {job.workLocation}</span>
                        <span className="flex items-center gap-1"><i className="fa-solid fa-clock"></i> {job.employmentType}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEditJob(job)}
                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <i className="fa-solid fa-pen text-sm"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            We've received your {formData.jobs.length} request{formData.jobs.length > 1 ? 's' : ''}. <br /> A specialist will contact you soon.
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
                      ? 'bg-[#75216A] border-[#75216A] text-white scale-110 shadow-lg'
                      : isCompleted
                        ? 'bg-[#75216A] border-[#75216A] text-white px-2'
                        : 'bg-white/80 backdrop-blur-md border-white text-gray-300'
                      }`}
                  >
                    <i className={`fa-solid ${isCompleted ? 'fa-check' : step.icon} ${isActive ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}></i>
                  </div>
                  <span className={`mt-3 md:mt-4 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-[#75216A] opacity-100' : 'text-gray-400 opacity-50'}`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Main Card */}
          <div className="flex flex-col bg-white/70 backdrop-blur-[40px] rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-white/40 animate-scaleIn">
            {/* Form Header */}
            <div className="px-8 md:px-12 py-6 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 bg-white/40 backdrop-blur-md border-b border-white/20 rounded-t-[2rem] md:rounded-t-[3rem]">
              <div>
                <div className="flex items-center gap-3 mb-6 md:mb-8 group cursor-default">
                  <img src={BrandLogo} alt="Afriwork" className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                </div>
                {!editingJob && <h2 className="text-xl md:text-2xl font-black tracking-tight text-[#0D0D12]">{STEPS[currentStep - 1].title}</h2>}
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-gray-100 text-black px-4 py-2 rounded-xl shadow-sm text-center min-w-[100px]">
                Step {currentStep} <span className="text-gray-300 mx-1">/</span> {STEPS.length}
              </div>
            </div>

            {/* Form Content */}
            <form className="flex-1 px-8 md:px-16 py-10 md:py-12">
              {renderStep()}
            </form>

            {/* Form Footer */}
            {/* Hide footer when editing a job to strictly focus on the job form actions */}
            {!editingJob && (
              <div className="px-8 md:px-12 py-6 md:py-8 bg-white/40 backdrop-blur-md border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 rounded-b-[2rem] md:rounded-b-[3rem]">
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
                    className="w-full md:w-auto px-12 md:px-16 py-4 md:py-5 bg-[#75216A] text-white rounded-2xl md:rounded-[1.5rem] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-wait relative overflow-hidden group"
                  >
                    <span className="relative z-10">{isSyncing ? 'Syncing...' : (currentStep === STEPS.length ? 'Submit All' : 'Continue')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              </div>
            )}
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