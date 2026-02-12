
import { FormData, ExperienceLevel, EmploymentType, SalaryRange, JobSite, EducationLevel } from './types';

export const INITIAL_COMPANY_STATE = {
  email: '',
  companyName: '',
  contactPhone: '',
};

export const INITIAL_JOB_STATE = {
  id: '',
  jobTitle: '',
  jobDescription: '',
  workLocation: '',
  jobSite: JobSite.ON_SITE,
  experienceLevel: ExperienceLevel.JUNIOR,
  employmentType: EmploymentType.FULL_TIME,
  educationLevel: EducationLevel.NOT_REQUIRED,
  salaryRange: SalaryRange.NEGOTIABLE,
  deadline: '',
  personnelCount: '',
};

export const INITIAL_FORM_STATE: FormData = {
  company: INITIAL_COMPANY_STATE,
  jobs: [],
};

export const STEPS = [
  { id: 1, title: 'Company Info', icon: 'fa-building' },
  { id: 2, title: 'Job Positions', icon: 'fa-briefcase' },
];
