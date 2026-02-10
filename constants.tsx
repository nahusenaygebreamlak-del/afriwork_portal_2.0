
import { FormData, ExperienceLevel, EmploymentType, SalaryRange, JobSite } from './types';

export const INITIAL_FORM_STATE: FormData = {
  email: '',
  companyName: '',
  jobTitle: '',
  jobDescription: '',
  workLocation: '',
  jobSite: JobSite.ON_SITE,
  experienceLevel: ExperienceLevel.JUNIOR,
  employmentType: EmploymentType.FULL_TIME,
  salaryRange: SalaryRange.NEGOTIABLE,
  deadline: '',
  contactPhone: '',
};

export const STEPS = [
  { id: 1, title: 'Company & Role', icon: 'fa-building' },
  { id: 2, title: 'Description', icon: 'fa-align-left' },
  { id: 3, title: 'Logistics', icon: 'fa-truck-fast' },
];
