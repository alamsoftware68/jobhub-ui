import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { placeLabel, ScoreBadge, SourceBadge } from '../components/JobCard'
import { api } from '../lib/api'
import { timeAgo } from '../lib/format'

export default function JobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const job = useQuery({ queryKey: ['job', jobId], queryFn: () => api.getJob(jobId), enabled: !Number.isNaN(jobId) })

  const update = useMutation({
    mutationFn: (patch: { saved?: boolean; hidden?: boolean }) => api.updateJob(jobId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  if (job.isLoading) return <p className="text-slate-500">Loading job…</p>
  if (job.isError || !job.data) return <p className="text-red-600">Could not load this job.</p>

  const { summary: s, description, missingSkills, tags } = job.data

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        ← Back to jobs
      </button>

      <section className="card flex flex-col gap-4 p-5 sm:flex-row">
        <ScoreBadge score={s.matchScore} large />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={s.source} name={s.sourceName} />
            {s.remote && <span className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">Remote</span>}
            {s.germanRequired && (
              <span className="chip bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">German required</span>
            )}
            <span className="text-xs text-slate-500">Posted {timeAgo(s.postedAt)}</span>
          </div>
          <h1 className="text-xl font-semibold">{s.title}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {[s.company, placeLabel(s.location, s.country), s.employmentType, s.salary].filter(Boolean).join(' · ')}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href={s.url} target="_blank" rel="noreferrer" className="btn-primary">
              Apply on {s.sourceName} ↗
            </a>
            {s.otherSources.map((o) => (
              <a key={o.source} href={o.url} target="_blank" rel="noreferrer" className="btn-ghost">
                Open on {o.sourceName} ↗
              </a>
            ))}
            <button className="btn-ghost" onClick={() => update.mutate({ saved: !s.saved })}>
              {s.saved ? '★ Saved' : '☆ Save'}
            </button>
            <button
              className="btn-ghost text-slate-500"
              onClick={() => update.mutate({ hidden: !s.hidden }, { onSuccess: () => !s.hidden && navigate('/') })}
            >
              {s.hidden ? 'Unhide' : 'Hide'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Job description</h2>
          {description ? (
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{description}</div>
          ) : (
            <p className="text-sm text-slate-500">
              The full description is only available on the original site.{' '}
              <a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                Open it on {s.sourceName}
              </a>
              .
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-2 text-sm font-semibold">Your skills in this job</h2>
            <div className="flex flex-wrap gap-1">
              {s.matchedSkills.length === 0 && <span className="text-sm text-slate-500">None found in the text</span>}
              {s.matchedSkills.map((k) => (
                <span key={k} className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  ✓ {k}
                </span>
              ))}
            </div>
            {missingSkills.length > 0 && (
              <>
                <h3 className="mb-2 mt-4 text-xs font-medium text-slate-500">Not mentioned in the job</h3>
                <div className="flex flex-wrap gap-1">
                  {missingSkills.map((k) => (
                    <span key={k} className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {k}
                    </span>
                  ))}
                </div>
              </>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Score is based on your <Link to="/profile" className="underline">profile</Link> skills, keywords, location and language.
            </p>
          </section>

          {tags.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-sm font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span key={t} className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
