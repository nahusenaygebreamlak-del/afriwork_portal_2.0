
export enum ExperienceLevel {
  INTERNSHIP = 'Internship',
  FRESH_GRADUATE = 'Fresh Graduate',
  JUNIOR = 'Junior (0-2 Years)',
  INTERMEDIATE = 'Intermediate (2-4 Years)',
  SENIOR = 'Senior (4+ Years)',
  MANAGEMENT = 'Management',
}

export enum EmploymentType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
}

export enum SalaryRange {
  BELOW_20K = 'Below 20,000 Birr',
  TWENTY_TO_FIFTY = '20,000 - 50,000 Birr',
  FIFTY_TO_HUNDRED = '50,000 - 100,000 Birr',
  NEGOTIABLE = 'Negotiable',
}

export enum JobSite {
  ON_SITE = 'On-Site',
  REMOTE = 'Remote'
}

export enum EducationLevel {
  MASTERS = 'Masters Degree',
  NOT_REQUIRED = 'Not Required',
  TVET = 'Tvet',
  SECONDARY = 'Secondary School',
  CERTIFICATE = 'Certificate',
  DIPLOMA = 'Diploma',
  BACHELORS = 'Bachelors Degree',
  PHD = 'Phd',
}

export interface JobDetails {
  id: string; // Unique ID for UI management
  jobTitle: string;
  jobDescription: string;
  workLocation: string;
  jobSite: JobSite;
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  educationLevel: EducationLevel;
  salaryRange: SalaryRange;
  deadline: string;
  personnelCount: string;
}

export interface CompanyInfo {
  email: string;
  companyName: string;
  contactPhone: string;
}

export interface FormData {
  company: CompanyInfo;
  jobs: JobDetails[];
}
