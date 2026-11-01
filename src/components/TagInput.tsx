import { useState } from 'react'

interface Props {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

/** Type a value and press Enter or comma to add it; click × to remove. */
export default function TagInput({ values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const value = raw.trim().replace(/,$/, '')
    if (value && !values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value])
    }
    setDraft('')
  }

  return (
    <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5">
      {values.map((v) => (
        <span key={v} className="chip gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {v}
          <button
            type="button"
            className="opacity-60 hover:opacity-100"
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`Remove ${v}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="min-w-[8rem] flex-1 bg-transparent outline-none"
        value={draft}
        placeholder={values.length === 0 ? placeholder : 'Add…'}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={() => draft && add(draft)}
      />
    </div>
  )
}
