import { useEffect, useState } from 'react'
import { X, Tag } from 'lucide-react'

function RenameTagModal({ tag, onCancel, onConfirm }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(tag || '')
  }, [tag])

  if (!tag) return null

  const cleanValue = value.trim().toLowerCase()
  const isDisabled = !cleanValue || cleanValue === tag

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isDisabled) return

    onConfirm(cleanValue)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-cream-100 border border-warm-100 rounded-2xl shadow-xl w-full max-w-sm p-4"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-cream-200 text-warm-500 flex items-center justify-center flex-shrink-0">
              <Tag size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-warm-600">
                Renombrar etiqueta
              </h2>

              <p className="text-xs text-warm-400 mt-1 leading-relaxed">
                Se cambiará esta etiqueta en todas las notas donde aparezca.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-warm-300 hover:text-warm-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-cream-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-warm-400 mb-2">
            Etiqueta actual:
          </p>

          <p className="text-sm text-warm-600 font-medium mb-3">
            #{tag}
          </p>

          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nuevo nombre..."
            className="w-full bg-cream-100 border border-warm-100 rounded-lg px-3 py-2 text-sm text-warm-500 outline-none placeholder-warm-200"
          />
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-warm-300 text-cream-300 text-xs font-medium py-2.5 px-3 rounded-full hover:opacity-90 disabled:opacity-40"
          >
            Guardar cambio
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-cream-200 text-warm-400 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-cream-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default RenameTagModal