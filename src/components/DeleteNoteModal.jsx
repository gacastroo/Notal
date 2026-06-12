import { X, Trash2, AlertTriangle } from 'lucide-react'

function DeleteNoteModal({ note, onCancel, onConfirm }) {
  if (!note) return null

  const title = note.title?.trim() || 'esta nota sin título'

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
                Eliminar nota
              </h2>

              <p className="text-xs text-warm-400 mt-1 leading-relaxed">
                Esta acción eliminará la nota seleccionada.
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
          <p className="text-xs text-warm-500 leading-relaxed">
            ¿Seguro que quieres eliminar{' '}
            <span className="font-medium text-warm-600">
              {title}
            </span>
            ?
          </p>

          <p className="text-xs text-warm-300 mt-2 leading-relaxed">
            Para evitar borrados accidentales, la nota solo se eliminará al
            confirmar esta ventana.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full bg-red-100 text-red-600 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-red-200 flex items-center justify-center gap-1"
          >
            <Trash2 size={13} />
            Sí, eliminar nota
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

export default DeleteNoteModal