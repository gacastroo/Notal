import { useState, useCallback, useRef } from 'react'
import useNotesStore from '../store/useNotesStore'
import { Trash2, Loader2, X, Search } from 'lucide-react'
import { formatDate } from '../lib/utils'
import { searchNotesWithAI } from '../lib/ai'
import BackupActions from './BackupActions'
import DeleteNoteModal from './DeleteNoteModal'

function Sidebar() {
  const { notes, activeNoteId, setActiveNote, addNote } = useNotesStore()

  const [search, setSearch] = useState('')
  const [aiResults, setAiResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [aiError, setAiError] = useState('')

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const handleSearchChange = useCallback((value) => {
    setSearch(value)
    setAiResults(null)
    setAiError('')

    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  const clearSearch = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    requestIdRef.current += 1

    setSearch('')
    setAiResults(null)
    setIsSearching(false)
    setAiError('')
  }, [])

  const runAISearch = useCallback(async () => {
    const query = search.trim()

    if (!query || query.length < 3) {
      return
    }

    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsSearching(true)
    setAiError('')

    try {
      const results = await searchNotesWithAI(query, notes, {
        signal: controller.signal,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      setAiResults(results)
    } catch (error) {
      if (error.name === 'AbortError') {
        return
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      console.error('Error en búsqueda IA:', error)

      const message = String(error.message || '')

      if (message.includes('429')) {
        setAiError(
          'Límite gratuito de IA alcanzado. Prueba de nuevo más tarde.'
        )
      } else {
        setAiError(
          'No se pudo buscar con IA. Se mantiene la búsqueda por texto.'
        )
      }

      setAiResults(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false)
      }
    }
  }, [search, notes])

  const filtered =
    aiResults !== null
      ? aiResults
      : notes.filter((note) => {
          const q = search.toLowerCase()

          return (
            (note.title || '').toLowerCase().includes(q) ||
            (note.content || '').toLowerCase().includes(q)
          )
        })

  const pinned = filtered.filter((note) => note.pinned)
  const unpinned = filtered.filter((note) => !note.pinned)

  return (
    <div className="w-56 min-h-screen bg-cream-100 border-r border-warm-100 flex flex-col">
      <div className="p-4 border-b border-warm-100">
        <p className="text-warm-600 font-medium text-base mb-3">
          No<span className="text-warm-300">ta</span>la
        </p>

        <button
          onClick={addNote}
          className="w-full bg-warm-300 text-cream-300 text-sm font-medium py-2 px-3 rounded-full flex items-center gap-2 mb-3"
        >
          <span className="text-lg leading-none">+</span>
          Captura rápida
        </button>

        <div className="relative">
          <input
            type="text"
            placeholder="Buscar con IA..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                runAISearch()
              }
            }}
            className="w-full bg-cream-200 text-warm-500 text-sm px-3 py-2 rounded-full outline-none placeholder-warm-200 border border-warm-100 pr-16"
          />

          {search && !isSearching && (
            <button
              onClick={clearSearch}
              className="absolute right-10 top-2.5 text-warm-300 hover:text-warm-500"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}

          <button
            onClick={runAISearch}
            disabled={isSearching || search.trim().length < 3}
            className="absolute right-3 top-2.5 text-warm-300 hover:text-warm-500 disabled:opacity-40"
            title="Buscar con IA"
          >
            {isSearching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-red-400 mt-2 leading-snug">
            {aiError}
          </p>
        )}

        {search.trim().length >= 3 && aiResults === null && !isSearching && (
          <p className="text-xs text-warm-300 mt-2 leading-snug">
            Pulsa Enter o el icono de búsqueda para usar IA.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {search && filtered.length === 0 && !isSearching && (
          <p className="max-w-[180px] mx-auto text-sm leading-relaxed text-warm-400 text-center mt-8 px-4">
            No hay notas relacionadas
          </p>
        )}

        {isSearching && (
          <p className="text-xs text-warm-300 px-2 py-2 flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            Buscando con IA...
          </p>
        )}

        {aiResults !== null && filtered.length > 0 && !isSearching && (
          <p className="text-xs text-warm-300 px-2 py-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} con
            IA
          </p>
        )}

        {search && aiResults === null && filtered.length > 0 && !isSearching && (
          <p className="text-xs text-warm-300 px-2 py-2">
            Resultados por texto
          </p>
        )}

        {pinned.length > 0 && (
          <>
            <p className="text-xs text-warm-400 uppercase tracking-wider px-2 py-2">
              Fijadas
            </p>

            {pinned.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                active={note.id === activeNoteId}
                onClick={() => setActiveNote(note.id)}
              />
            ))}
          </>
        )}

        {unpinned.length > 0 && (
          <>
            <p className="text-xs text-warm-400 uppercase tracking-wider px-2 py-2">
              {search ? 'Resultados' : 'Todas'}
            </p>

            {unpinned.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                active={note.id === activeNoteId}
                onClick={() => setActiveNote(note.id)}
              />
            ))}
          </>
        )}

        {notes.length === 0 && (
          <p className="max-w-[180px] mx-auto text-sm leading-relaxed text-warm-400 text-center mt-8 px-4">
            Aún no tienes notas.
            <br />
            ¡Crea una!
          </p>
        )}
      </div>

      <div className="p-3 border-t border-warm-100 space-y-3">
        <BackupActions />

        <p className="text-xs text-warm-400 text-center">
          {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
        </p>
      </div>
    </div>
  )
}

const TAG_COLORS = [
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
]

const getTagColor = (tag) => {
  const safeTag = String(tag || 'nota')
  const index = safeTag.charCodeAt(0) % TAG_COLORS.length

  return TAG_COLORS[index]
}

function NoteItem({ note, active, onClick }) {
  const { deleteNote } = useNotesStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  const handleConfirmDelete = () => {
    deleteNote(note.id)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div
        onClick={onClick}
        className={`group px-3 py-2 rounded-lg cursor-pointer mb-1 flex items-start justify-between gap-1 ${
          active
            ? 'bg-cream-300 text-warm-600'
            : 'text-warm-500 hover:bg-cream-200'
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {note.title || 'Sin título'}
          </p>

          <p className="text-xs text-warm-400 truncate mt-0.5">
            {note.content || 'Nota vacía'}
          </p>

          <p className="text-xs text-warm-200 mt-0.5">
            {formatDate(note.updatedAt)}
          </p>

          {Array.isArray(note.tags) && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(
                    tag
                  )}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleDeleteClick}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 mt-0.5 flex-shrink-0 transition-opacity"
          title="Eliminar nota"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showDeleteModal && (
        <DeleteNoteModal
          note={note}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}

export default Sidebar