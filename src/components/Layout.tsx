import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { api } from '../lib/api'
import { timeAgo } from '../lib/format'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function Layout() {
  const queryClient = useQueryClient()
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: api.stats,
    // poll while a fetch is running so new jobs show up
    refetchInterval: (query) => (query.state.data?.fetchRunning ? 4000 : 60_000),
  })
  const refresh = useMutation({
    mutationFn: api.refresh,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stats'] }),
  })

  // When a fetch finishes, reload the job list
  const wasRunning = useRef(false)
  const running = stats.data?.fetchRunning ?? false
  useEffect(() => {
    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    }
    wasRunning.current = running
  }, [running, queryClient])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <NavLink to="/" className="mr-2 flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            JobHub
          </NavLink>
          <nav className="flex gap-1">
            <NavLink to="/" end className={navClass}>
              Jobs
            </NavLink>
            <NavLink to="/saved" className={navClass}>
              Saved{stats.data?.savedJobs ? ` (${stats.data.savedJobs})` : ''}
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {running
                ? 'Fetching new jobs…'
                : stats.data?.lastRunAt
                  ? `Updated ${timeAgo(stats.data.lastRunAt)}`
                  : stats.isError
                    ? 'Backend not reachable'
                    : ''}
            </span>
            <button
              className="btn-primary"
              onClick={() => refresh.mutate()}
              disabled={running || refresh.isPending}
              title="Fetch new jobs from all sources now"
            >
              <svg
                className={`h-4 w-4 ${running ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {running ? 'Fetching' : 'Fetch jobs'}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
