import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import TagInput from '../components/TagInput'
import { api, type Profile, type RemotePreference } from '../lib/api'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const profile = useQuery({ queryKey: ['profile'], queryFn: api.getProfile })
  const [form, setForm] = useState<Profile | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (profile.data) setForm(profile.data)
  }, [profile.data])

  const save = useMutation({
    mutationFn: api.saveProfile,
    onSuccess: (saved) => {
      queryClient.setQueryData(['profile'], saved)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      setMessage('Saved. Match scores were recalculated. Click “Fetch jobs” to search with new keywords or locations.')
    },
    onError: (e: Error) => setMessage(`Could not save: ${e.message}`),
  })

  if (profile.isLoading || !form) return <p className="text-slate-500">Loading profile…</p>
  const set = (patch: Partial<Profile>) => {
    setForm({ ...form, ...patch })
    setMessage(null)
  }

  return (
    <form
      className="mx-auto max-w-3xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(form)
      }}
    >
      <div>
        <h1 className="text-xl font-semibold">Profile &amp; preferences</h1>
        <p className="text-sm text-slate-500">Used to search the job sources and to calculate each job’s match score.</p>
      </div>

      <section className="card space-y-4 p-5">
        <Field label="Name">
          <input className="input" value={form.fullName ?? ''} onChange={(e) => set({ fullName: e.target.value })} />
        </Field>
        <Field label="Your skills" hint="Each skill found in a job description raises the match score.">
          <TagInput values={form.skills} onChange={(skills) => set({ skills })} placeholder="Java, Spring Boot, AWS…" />
        </Field>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">What to search for</h2>
        <Field label="Search keywords" hint="Each keyword is searched separately on every source, e.g. “Java Developer”, “Spring Boot”.">
          <TagInput values={form.searchKeywords} onChange={(searchKeywords) => set({ searchKeywords })} />
        </Field>
        <Field label="Locations" hint="Cities to search. Add “Deutschland” to also search all of Germany.">
          <TagInput values={form.locations} onChange={(locations) => set({ locations })} placeholder="Berlin, Deutschland" />
        </Field>
        <Field label="Work mode" hint="Used for the match score, not as a filter.">
          <select
            className="input block sm:max-w-sm"
            value={form.remotePreference}
            onChange={(e) => set({ remotePreference: e.target.value as RemotePreference })}
          >
            <option value="ANY">Any (remote jobs score higher)</option>
            <option value="REMOTE">Remote only (non-remote jobs score lower)</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.englishOnly}
            onChange={(e) => set({ englishOnly: e.target.checked })}
          />
          <span>
            <span className="font-medium">I’m looking for English-speaking jobs</span>
            <span className="block text-slate-500">Jobs written in German or asking for fluent German get a lower score.</span>
          </span>
        </label>
        <Field label="Exclude jobs with these words in the title" hint="e.g. Werkstudent, Praktikum, Junior">
          <TagInput values={form.excludeKeywords} onChange={(excludeKeywords) => set({ excludeKeywords })} />
        </Field>
      </section>

      <section className="card space-y-2 p-5 text-sm">
        <h2 className="font-semibold">How your profile is used</h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
          <li>
            <b>Search keywords</b> and <b>Locations</b> decide which jobs are fetched from the job sites.
          </li>
          <li>
            <b>Skills</b>, <b>Work mode</b>, <b>English-speaking</b> and <b>Exclude words</b> only change each job’s{' '}
            <b>match score</b>. They don’t hide jobs.
          </li>
          <li>
            To hide jobs, use the filters on the Jobs page, e.g. <i>Any match → 70%+</i> or <i>No German required</i>.
          </li>
        </ul>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={save.isPending || form.searchKeywords.length === 0}>
          {save.isPending ? 'Saving…' : 'Save profile'}
        </button>
        {message && <span className="text-sm text-slate-600 dark:text-slate-400">{message}</span>}
      </div>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
