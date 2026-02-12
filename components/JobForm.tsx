import React, { useState, useRef, useEffect } from 'react';
import { JobDetails, ExperienceLevel, EmploymentType, SalaryRange, JobSite, EducationLevel } from '../types';
import { Input, TextArea, Select, RadioGroup, Calendar } from './FormElements';

interface JobFormProps {
    job: JobDetails;
    onChange: (job: JobDetails) => void;
    onSave: () => void;
    onCancel: () => void;
    errors: Record<string, string>;
}

export const JobForm: React.FC<JobFormProps> = ({ job, onChange, onSave, onCancel, errors }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange({ ...job, [name]: value });
    };

    const handleRadioChange = (name: string, value: string) => {
        onChange({ ...job, [name]: value });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#0D0D12] tracking-tight">Job Details</h3>
            </div>

            <Input label="Job Title" name="jobTitle" value={job.jobTitle} error={errors.jobTitle} onChange={handleChange} required placeholder="e.g. Senior Visual Designer" />

            <TextArea
                label="Job Description" name="jobDescription" value={job.jobDescription} error={errors.jobDescription} onChange={handleChange}
                required rows={8} placeholder="Explain the responsibilities, expectations, and goals for this position..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Location" name="workLocation" value={job.workLocation} error={errors.workLocation} onChange={handleChange} required placeholder="Addis Ababa" />
                <Input label="Headcount" name="personnelCount" type="number" value={job.personnelCount} error={errors.personnelCount} onChange={handleChange} required placeholder="e.g. 1" min={1} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Seniority" name="experienceLevel" value={job.experienceLevel} onChange={handleChange}
                    options={Object.values(ExperienceLevel).map(v => ({ label: v, value: v }))} required
                />
                <Select
                    label="Salary Budget" name="salaryRange" value={job.salaryRange} onChange={handleChange}
                    options={Object.values(SalaryRange).map(v => ({ label: v, value: v }))} required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <RadioGroup
                        label="Work Style" options={[{ label: 'On-Site', value: JobSite.ON_SITE }, { label: 'Remote', value: JobSite.REMOTE }]}
                        value={job.jobSite} onChange={(val) => handleRadioChange('jobSite', val)} required
                    />
                    <Select
                        label="Education BG" name="educationLevel" value={job.educationLevel} onChange={handleChange}
                        options={Object.values(EducationLevel).map(v => ({ label: v, value: v }))} required
                    />
                </div>
                <div className="relative" ref={calendarRef}>
                    <Input
                        label="Deadline"
                        name="deadline"
                        value={job.deadline || "Select a date..."}
                        error={errors.deadline}
                        readOnly
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        style={{ cursor: 'pointer' }}
                        required
                    />
                    {isCalendarOpen && (
                        <div className="absolute z-50 bottom-full left-0 right-0 mb-4 animate-fadeIn">
                            <Calendar
                                label=""
                                value={job.deadline}
                                onChange={(date) => {
                                    onChange({ ...job, deadline: date });
                                    setIsCalendarOpen(false);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    className="flex-1 py-4 bg-[#0D0D12] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
                >
                    Save Job
                </button>
            </div>
        </div>
    );
};
