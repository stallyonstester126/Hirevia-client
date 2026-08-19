import React, { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  label?: string
  helperText?: string
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Type a skill and press Enter...',
  label = 'Skills',
  helperText = 'Press Enter or comma to add a skill tag',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const addTag = () => {
    const trimmed = inputValue.trim().replace(/,/g, '')
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInputValue('')
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      <div className="min-h-[46px] p-2 bg-white border border-slate-200 rounded-xl focus-within:border-[#146BFF] focus-within:ring-4 focus-within:ring-blue-50 transition flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#146BFF] border border-blue-200 rounded-lg text-xs font-semibold"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="w-3.5 h-3.5 rounded-full hover:bg-blue-200 flex items-center justify-center text-blue-700 transition"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[140px] px-2 py-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder-slate-400"
        />
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  )
}
