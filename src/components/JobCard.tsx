import { Link } from 'react-router-dom'
import type { JobSummary } from '../lib/api'
import { scoreClasses, sourceClasses, timeAgo } from '../lib/format'

interface Props {
  job: JobSummary
  onToggleSave: (job: JobSummary) => void
  onHide: (job: JobSummary) => void
}

/** "Berlin · Germany" without repeating the country when the location already contains it */
export function placeLabel(location: string | null, country: string | null): string | null {
  if (!location) return country
  if (!country || location.toLowerCase().includes(country.toLowerCase())) return location
  return `${location}, ${country}`
}

export function SourceBadge({ source, name }: { source: string; name: string }) {
  return <span className={`chip ring-1 ring-inset ${sourceClasses(source)}`}>{name}</span>
}

export function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 flex-col items-center justify-center rounded-lg font-semibold tabular-nums ${scoreClasses(score)} ${
        large ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-base'
      }`}
      title="Match score against your profile"
    >
      {score}%
      <span className="text-[10px] font-medium opacity-75">match</span>
    </span>
  )
}

export default function JobCard({ job, onToggleSave, onHide }: Props) {
  return (
    <article className="card flex gap-4 p-4 transition-shadow hover:shadow-md">
      <ScoreBadge score={job.matchScore} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={job.source} name={job.sourceName} />
          {job.otherSources.map((s) => (
            <SourceBadge key={s.source} source={s.source} name={`also ${s.sourceName}`} />
          ))}
          {job.remote && <span className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">Remote</span>}
          {job.germanRequired && (
            <span className="chip bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">German</span>
          )}
          <span className="ml-auto text-xs text-slate-500">{timeAgo(job.postedAt)}</span>
        </div>

        <Link to={`/jobs/${job.id}`} className="mt-1.5 block text-base font-semibold hover:text-indigo-600 dark:hover:text-indigo-400">
          {job.title}
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {[job.company, placeLabel(job.location, job.country), job.salary].filter(Boolean).join(' · ')}
        </p>

        {job.snippet && <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{job.snippet}</p>}

        {job.matchedSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.matchedSkills.map((s) => (
              <span key={s} className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                ✓ {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <a href={job.url} target="_blank" rel="noreferrer" className="btn-primary">
            Apply on {job.sourceName} ↗
          </a>
          <Link to={`/jobs/${job.id}`} className="btn-ghost">
            Details
          </Link>
          <button className="btn-ghost" onClick={() => onToggleSave(job)}>
            {job.saved ? '★ Saved' : '☆ Save'}
          </button>
          <button className="btn-ghost text-slate-500" onClick={() => onHide(job)} title="Hide this job">
            Hide
          </button>
        </div>
      </div>
    </article>
  )
}
