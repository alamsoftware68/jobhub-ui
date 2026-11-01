// Types and calls for the Spring Boot REST API (see backend/src/main/java/com/jobsearch/web)

export interface SourceLink {
  source: string
  sourceName: string
  url: string
}

export interface JobSummary {
  id: number
  source: string
  sourceName: string
  title: string
  company: string | null
  location: string | null
  country: string | null
  remote: boolean | null
  snippet: string | null
  url: string
  postedAt: string | null
  /** Calendar day posted, "2026-10-29" */
  postedDay: string | null
  matchScore: number
  matchedSkills: string[]
  salary: string | null
  employmentType: string | null
  language: string | null
  germanRequired: boolean
  saved: boolean
  hidden: boolean
  otherSources: SourceLink[]
}

export interface JobDetail {
  summary: JobSummary
  description: string | null
  missingSkills: string[]
  tags: string[]
  fetchedAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Stats {
  totalJobs: number
  newLast24h: number
  savedJobs: number
  perSource: Record<string, number>
  lastRunAt: string | null
  fetchRunning: boolean
}

export interface SourceStatus {
  id: string
  name: string
  enabled: boolean
  lastRunAt: string | null
  fetched: number
  newJobs: number
  duplicates: number
  lastError: string | null
}

export type RemotePreference = 'ANY' | 'REMOTE' | 'HYBRID' | 'ONSITE'

export interface Profile {
  fullName: string | null
  skills: string[]
  searchKeywords: string[]
  locations: string[]
  radiusKm: number
  remotePreference: RemotePreference
  englishOnly: boolean
  excludeKeywords: string[]
}

/** One-off search on the job sources for a specific place */
export interface LocationSearch {
  city?: string
  country?: string
  keyword?: string
}

/** Suggestions for the Country field (the backend also understands German names and codes like "DE") */
export const COUNTRY_SUGGESTIONS = [
  'Germany', 'Austria', 'Switzerland', 'Netherlands', 'United Kingdom', 'France', 'Spain', 'Italy',
  'Poland', 'Belgium', 'Luxembourg', 'Ireland', 'Denmark', 'Sweden', 'Portugal', 'Czech Republic',
  'United States', 'Canada', 'India',
]

export interface JobFilters {
  q?: string
  source?: string
  location?: string
  country?: string
  remoteOnly?: boolean
  minScore?: number
  savedOnly?: boolean
  postedWithinDays?: number
  englishOnly?: boolean
  sort?: 'score' | 'newest'
  page?: number
  size?: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      message = body.message ?? body.detail ?? body.error ?? message
    } catch {
      /* no JSON body */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

function toQuery(filters: JobFilters): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false && value !== 0) {
      params.set(key, String(value))
    }
  })
  return params.toString()
}

export const api = {
  searchJobs: (filters: JobFilters) => request<PageResponse<JobSummary>>(`/api/jobs?${toQuery(filters)}`),
  getJob: (id: number) => request<JobDetail>(`/api/jobs/${id}`),
  updateJob: (id: number, patch: { saved?: boolean; hidden?: boolean }) =>
    request<JobSummary>(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  stats: () => request<Stats>('/api/jobs/stats'),
  sources: () => request<SourceStatus[]>('/api/sources'),
  refresh: (search?: LocationSearch) =>
    request<{ started: boolean; message: string }>('/api/sources/refresh', {
      method: 'POST',
      body: search ? JSON.stringify(search) : undefined,
    }),
  countries: () => request<string[]>('/api/jobs/countries'),
  getProfile: () => request<Profile>('/api/profile'),
  saveProfile: (profile: Profile) =>
    request<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }),
}
