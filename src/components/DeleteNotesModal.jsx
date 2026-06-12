import { X, Trash2, AlertTriangle } from 'lucide-react'

function DeleteNotesModal({ notes = [], count, onCancel, onConfirm }) {
  const total = typeof count === 'number' ? count : notes.length

  if (total === 0) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-cream-100 border border-warm-100 rounded-2xl shadow-xl w-full max-w-sm p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-warm-600">
                Eliminar notas
              </h2>

              <p className="text-xs text-warm-400 mt-1 leading-relaxed">
                Vas a eliminar {total} nota{total !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="text-warm-300 hover:text-warm-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-cream-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-warm-500 leading-relaxed mb-2">
            ¿Seguro que quieres eliminar las notas seleccionadas?
          </p>

          {notes.length > 0 && (
            <div className="max-h-28 overflow-y-auto space-y-1">
              {notes.slice(0, 5).map((note) => (
                <p key={note.id} className="text-xs text-warm-300 truncate">
                  · {note.title || 'Sin título'}
                </p>
              ))}

              {total > 5 && (
                <p className="text-xs text-warm-300">
                  · y {total - 5} más...
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full bg-red-100 text-red-600 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-red-200 flex items-center justify-center gap-1"
          >
            <Trash2 size={13} />
            Sí, eliminar seleccionadas
          </button>

          <button
            onClick={onCancel}
            className="w-full bg-cream-200 text-warm-400 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-cream-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteNotesModal