import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import JobCard from '../components/JobCard'
import { api, COUNTRY_SUGGESTIONS, type JobFilters, type JobSummary } from '../lib/api'
import { dayLabel, timeAgo } from '../lib/format'

const PAGE_SIZE = 20

export default function JobsPage({ savedOnly = false }: { savedOnly?: boolean }) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [filters, setFilters] = useState<JobFilters>({ sort: 'newest', page: 0 })

  // Debounce the free-text search, city and country
  useEffect(() => {
    const t = setTimeout(
      () =>
        setFilters((f) => ({
          ...f,
          q: text.trim() || undefined,
          location: city.trim() || undefined,
          country: country.trim() || undefined,
          page: 0,
        })),
      350,
    )
    return () => clearTimeout(t)
  }, [text, city, country])

  const effective: JobFilters = { ...filters, savedOnly, size: PAGE_SIZE }
  const jobs = useQuery({
    queryKey: ['jobs', effective],
    queryFn: () => api.searchJobs(effective),
    placeholderData: keepPreviousData,
  })
  const sources = useQuery({ queryKey: ['sources'], queryFn: api.sources })
  const countries = useQuery({ queryKey: ['countries'], queryFn: api.countries })
  const countryOptions = [...new Set([...(countries.data ?? []), ...COUNTRY_SUGGESTIONS])]

  // Ask the job sites for jobs in this place (runs in the background on the server)
  const searchPlace = useMutation({
    mutationFn: () =>
      api.refresh({ city: city.trim() || undefined, country: country.trim() || undefined, keyword: text.trim() || undefined }),
    onSuccess: (r) => {
      setNotice(
        r.started
          ? `Searching job sites for ${[text.trim() || 'your keywords', [city.trim(), country.trim()].filter(Boolean).join(', ')].join(' in ')}… new jobs appear here in a minute.`
          : r.message,
      )
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => setNotice(`Could not start search: ${e.message}`),
  })
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { saved?: boolean; hidden?: boolean } }) =>
      api.updateJob(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const set = (patch: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }))
  const page = jobs.data
  const enabledSources = sources.data?.filter((s) => s.enabled) ?? []

  return (
    <div className="space-y-5">
      {!savedOnly && stats.data && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Jobs found" value={stats.data.totalJobs} />
          <Stat label="New in last 24 h" value={stats.data.newLast24h} />
          <Stat label="Saved" value={stats.data.savedJobs} />
          <Stat label="Active sources" value={enabledSources.length} hint={enabledSources.map((s) => s.name).join(', ')} />
        </section>
      )}

      <section className="card space-y-3 p-4">
        <input
          className="input text-base"
          placeholder="Search title, company or description… e.g. Spring Boot, Kafka, Berlin"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-slate-500 sm:w-14">Where</span>
          <input className="input sm:flex-1" placeholder="City, e.g. Munich" value={city} onChange={(e) => setCity(e.target.value)} />
          <input
            className="input sm:flex-1"
            placeholder="Country, e.g. Germany"
            list="country-options"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <datalist id="country-options">
            {countryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button
            type="button"
            className="btn-ghost whitespace-nowrap"
            disabled={(!city.trim() && !country.trim()) || searchPlace.isPending || stats.data?.fetchRunning}
            onClick={() => searchPlace.mutate()}
            title="Ask the job sites for new jobs in this city / country (uses the search text as keyword, or your profile keywords)"
          >
            Search job sites here
          </button>
        </div>
        {notice && <p className="text-xs text-indigo-600 dark:text-indigo-300">{notice}</p>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <select className="input" value={filters.source ?? ''} onChange={(e) => set({ source: e.target.value || undefined })}>
            <option value="">All sources</option>
            {sources.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.minScore ?? 0}
            onChange={(e) => set({ minScore: Number(e.target.value) || undefined })}
          >
            <option value={0}>Any match</option>
            <option value={50}>50%+ match</option>
            <option value={70}>70%+ match</option>
            <option value={85}>85%+ match</option>
          </select>
          <select
            className="input"
            value={filters.postedWithinDays ?? ''}
            onChange={(e) => set({ postedWithinDays: Number(e.target.value) || undefined })}
          >
            <option value="">Any date</option>
            <option value={1}>Last 24 h</option>
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
          </select>
          <select className="input" value={filters.sort} onChange={(e) => set({ sort: e.target.value as 'score' | 'newest' })}>
            <option value="newest">Newest first</option>
            <option value="score">Best match</option>
          </select>
          <div className="col-span-2 flex flex-wrap items-center gap-4 text-sm md:col-span-1 md:flex-col md:items-start md:gap-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!filters.remoteOnly} onChange={(e) => set({ remoteOnly: e.target.checked })} />
              Remote only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!filters.englishOnly} onChange={(e) => set({ englishOnly: e.target.checked })} />
              No German required
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {page ? `${page.totalElements} jobs` : ''}
          {jobs.isFetching && ' · loading…'}
        </span>
        {page && page.totalPages > 1 && (
          <Pager page={page.page} totalPages={page.totalPages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        )}
      </div>

      {jobs.isError && (
        <div className="card border-red-200 p-4 text-sm text-red-700 dark:border-red-900 dark:text-red-300">
          Could not load jobs: {(jobs.error as Error).message}. Is the backend running on port 8080?
        </div>
      )}

      {page && page.content.length === 0 && (
        <div className="card p-10 text-center text-slate-500">
          {savedOnly
            ? 'No saved jobs yet. Click ☆ Save on a job to keep it here.'
            : stats.data?.fetchRunning
              ? 'Fetching jobs from all sources… this takes a minute on the first run.'
              : 'No jobs match these filters. Try clearing filters or click “Fetch jobs”.'}
        </div>
      )}

      <div className="space-y-3">
        {page?.content.map((job: JobSummary, i: number) => {
          // With "Newest first", show a heading whenever the day changes
          const showDay = filters.sort !== 'score' && (i === 0 || page.content[i - 1].postedDay !== job.postedDay)
          return (
            <div key={job.id} className="space-y-3">
              {showDay && (
                <h2 className="flex items-center gap-3 pt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {dayLabel(job.postedDay)}
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </h2>
              )}
              <JobCard
                job={job}
                onToggleSave={(j) => update.mutate({ id: j.id, patch: { saved: !j.saved } })}
                onHide={(j) => update.mutate({ id: j.id, patch: { hidden: true } })}
              />
            </div>
          )
        })}
      </div>

      {page && page.totalPages > 1 && (
        <div className="flex justify-center">
          <Pager page={page.page} totalPages={page.totalPages} onChange={(p) => { setFilters((f) => ({ ...f, page: p })); window.scrollTo(0, 0) }} />
        </div>
      )}

      {!savedOnly && sources.data && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Sources</h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {sources.data.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${!s.enabled ? 'bg-slate-300' : s.lastError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="font-medium">{s.name}</span>
                <span className="text-slate-500">
                  {!s.enabled
                    ? 'off — add an API key to enable'
                    : s.lastRunAt
                      ? `${s.fetched} found, ${s.newJobs} new · ${timeAgo(s.lastRunAt)}`
                      : 'waiting for first run'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="card p-4" title={hint}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost px-2 py-1" disabled={page === 0} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span className="tabular-nums">
        {page + 1} / {totalPages}
      </span>
      <button className="btn-ghost px-2 py-1" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  )
}
