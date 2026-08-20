export enum EUserRoles {
  ADMIN = 'ADMIN',
  COMPANY = 'COMPANY',
  SEEKER = 'SEEKER',
}

export interface IUser {
  _id: string
  name: string
  email: string
  phoneNumber?: string | {
    isoCode?: string
    countryCode?: string
    internationalNumber?: string
  }
  role: EUserRoles
  status?: {
    status: boolean
    timestamp: string
  }
  accountConfimation?: {
    status: boolean
    timestamp?: string
  }
  consent: boolean
  subscriptionStatus?: 'UNPAID' | 'PAID'
  subscriptionPaidAt?: string | null
  authProvider?: 'local' | 'google'
  googleId?: string
  profilePicture?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: boolean
  statusCode: number
  message: string
  data: null
  trace?: any
}

export interface IPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ================= SEEKER PROFILE =================

export interface IExperience {
  _id?: string
  company: string
  position: string
  startDate: string
  endDate?: string | null
  description?: string
}

export interface IEducation {
  _id?: string
  institution: string
  degree: string
  startDate: string
  endDate?: string | null
}

export interface ISeekerProfile {
  _id?: string
  userId: string
  headline?: string
  bio?: string
  location?: string
  skills?: string[]
  experience?: IExperience[]
  education?: IEducation[]
  createdAt?: string
  updatedAt?: string
}

// ================= COMPANY PROFILE =================

export interface ICompanyProfile {
  _id?: string
  userId: string
  companyName: string
  description?: string
  website?: string
  industry?: string
  location?: string
  phone?: string
  logoUrl?: string
  createdAt?: string
  updatedAt?: string
}

// ================= RESUMES & CV ANALYSIS =================

export interface IResume {
  _id: string
  seekerId: string
  originalFileName: string
  storageKey: string
  mimeType: string
  fileSize: number
  fileExtension: string
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ICVAnalysis {
  _id?: string
  resumeId: string
  seekerId: string
  extractedSkills: string[]
  experienceSummary: string
  educationSummary: string
  estimatedExperienceLevel: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | string
  suggestions: string[]
  status: 'PENDING' | 'COMPLETE' | 'FAILED'
  createdAt?: string
  updatedAt?: string
}

// ================= JOBS =================

export enum EJobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export enum EPaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

export enum EEmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
  FREELANCE = 'FREELANCE',
}

export enum EExperienceLevel {
  ENTRY = 'ENTRY',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}

export enum EWorkplaceType {
  ONSITE = 'ONSITE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}

export interface IJobLocation {
  city: string
  country: string
}

export interface IJobSalary {
  min: number
  max: number
  currency: string
  period: string
}

export interface IJob {
  _id: string
  companyId: string | { _id: string; name?: string; email?: string }
  title: string
  description: string
  responsibilities: string[]
  requirements: string[]
  skills: string[]
  employmentType: EEmploymentType
  experienceLevel: EExperienceLevel
  location: IJobLocation
  workplaceType: EWorkplaceType
  salary: IJobSalary
  status: EJobStatus
  paymentStatus: EPaymentStatus
  createdAt: string
  updatedAt: string
}

export interface IJobsResponse {
  jobs: IJob[]
  pagination: IPagination
}

// ================= PAYMENTS =================

export interface IPayment {
  _id?: string
  jobId?: string | null
  companyId: string
  stripeSessionId: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  type?: 'SUBSCRIPTION' | 'JOB_POSTING'
  createdAt?: string
  updatedAt?: string
}

export interface ISubscriptionStatusResponse {
  subscriptionStatus: 'UNPAID' | 'PAID'
  subscriptionPaidAt?: string | null
}

export interface IJobPaymentResponse {
  paymentStatus: EPaymentStatus
  payment: IPayment | null
}

export interface ICheckoutResponse {
  checkoutUrl: string
  sessionId?: string
}

// ================= APPLICATIONS & MATCH SCORE =================

export enum EApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface IApplication {
  _id: string
  jobId: string | IJob
  seekerId: string | IUser | { _id: string; name?: string; email?: string }
  resumeId: string | IResume | { _id: string; originalFileName?: string; version?: number; isActive?: boolean; createdAt?: string }
  coverLetter?: string
  status: EApplicationStatus
  appliedAt: string
  autoScreeningStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED' | 'SKIPPED'
  autoScreeningScore?: number | null
  autoScreeningRationale?: string | null
  advancedBy?: 'SYSTEM_AI' | 'COMPANY' | null
  createdAt?: string
  updatedAt?: string
}

export interface IApplicationsResponse {
  applications: IApplication[]
  pagination: IPagination
}

export interface IJobMatchScore {
  _id?: string
  applicationId: string
  resumeId: string
  jobId: string
  score: number
  rationale: string
  generatedAt: string
}

export interface ICompanyApplicationDetailResponse {
  application: IApplication
  seekerProfile: ISeekerProfile | null
}

export interface ICompanyAnalysisResponse {
  analysis: ICVAnalysis | null
  matchScore: IJobMatchScore | null
}

export interface ITestResponseItem {
  question: string
  answer: string
}

export interface ITestInvite {
  _id?: string
  applicationId: string
  jobId: string
  seekerId: string
  token: string
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'EXPIRED'
  startedAt?: string | null
  completedAt?: string | null
  expiresAt: string
  responses?: ITestResponseItem[]
  assessmentScore?: number | null
  assessmentFeedback?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface IPublicTestContext {
  jobTitle: string
  companyName: string
  candidateFirstName: string
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'EXPIRED'
  expiresAt: string
}

export interface IInterviewInvite {
  _id?: string
  applicationId: string
  jobId: string
  seekerId: string
  token: string
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'EXPIRED'
  vapiCallId?: string | null
  transcript?: string | null
  interviewScore?: number | null
  interviewFeedback?: string | null
  endedReason?: string | null
  tabSwitchCount?: number
  tabSwitchDuration?: number
  startedAt?: string | null
  completedAt?: string | null
  expiresAt: string
  createdAt?: string
  updatedAt?: string
}

export interface IPublicInterviewContext {
  candidateName: string
  jobTitle: string
  companyName: string
  jobRequirements: string
  candidateSkills: string
  experienceLevel: string
  experienceSummary: string
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'EXPIRED'
  expiresAt: string
  applicationId: string
  token: string
}


