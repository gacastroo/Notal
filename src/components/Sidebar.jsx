import { useState, useCallback, useRef, useEffect } from 'react'
import useNotesStore from '../store/useNotesStore'
import {
  Trash2,
  Loader2,
  X,
  Search,
  Keyboard,
  ChevronDown,
  Tag,
  Pencil,
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import { searchNotesWithAI } from '../lib/ai'
import BackupActions from './BackupActions'
import DeleteNoteModal from './DeleteNoteModal'
import DeleteNotesModal from './DeleteNotesModal'
import RenameTagModal from './RenameTagModal'
import ThemeToggle from './ThemeToggle'


function Sidebar() {
  const {
    notes,
    activeNoteId,
    setActiveNote,
    addNote,
    lastDeletedNote,
    lastDeletedNotes,
    restoreLastDeletedNote,
    clearLastDeletedNote,
    renameTag,
    deleteNotes,
  } = useNotesStore()

  const [search, setSearch] = useState('')
  const [aiResults, setAiResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [selectedTag, setSelectedTag] = useState('')
  const [tagBeingRenamed, setTagBeingRenamed] = useState(null)
  const [sortMode, setSortMode] = useState('updated-desc')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)
  const searchInputRef = useRef(null)

  const selectedNoteIdsAsStrings = selectedNoteIds.map(String)

  const allTags = [
    ...new Set(
      notes.flatMap((note) => (Array.isArray(note.tags) ? note.tags : []))
    ),
  ].sort()

  const selectedNotes = notes.filter((note) =>
    selectedNoteIdsAsStrings.includes(String(note.id))
  )

  const deletedCount =
    Array.isArray(lastDeletedNotes) && lastDeletedNotes.length > 0
      ? lastDeletedNotes.length
      : lastDeletedNote
        ? 1
        : 0

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

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current)
    setSelectedNoteIds([])
  }

  const toggleNoteSelection = (id) => {
    setSelectedNoteIds((current) => {
      const currentAsStrings = current.map(String)
      const idAsString = String(id)

      if (currentAsStrings.includes(idAsString)) {
        return current.filter((noteId) => String(noteId) !== idAsString)
      }

      return [...current, id]
    })
  }

  const handleConfirmBulkDelete = () => {
    if (selectedNoteIds.length === 0) return

    deleteNotes(selectedNoteIds)

    setSelectedNoteIds([])
    setSelectionMode(false)
    setShowBulkDeleteModal(false)
  }

  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      const key = event.key.toLowerCase()

      const isSearchShortcut = (event.ctrlKey || event.metaKey) && key === 'k'
      const isNewNoteShortcut = event.altKey && key === 'n'
      const isEscape = event.key === 'Escape'

      if (isSearchShortcut) {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (isNewNoteShortcut) {
        event.preventDefault()
        addNote()
        return
      }

      if (isEscape && search) {
        event.preventDefault()
        clearSearch()
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [addNote, clearSearch, search])

  useEffect(() => {
    if (deletedCount === 0) return

    const timeoutId = setTimeout(() => {
      clearLastDeletedNote()
    }, 5000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [deletedCount, clearLastDeletedNote])

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

  const searchedNotes =
    aiResults !== null
      ? aiResults
      : notes.filter((note) => {
          const q = search.toLowerCase()

          return (
            (note.title || '').toLowerCase().includes(q) ||
            (note.content || '').toLowerCase().includes(q)
          )
        })

  const filtered = selectedTag
    ? searchedNotes.filter(
        (note) => Array.isArray(note.tags) && note.tags.includes(selectedTag)
      )
    : searchedNotes

  const sortNotes = (notesToSort) => {
    return [...notesToSort].sort((a, b) => {
      if (sortMode === 'updated-asc') {
        return new Date(a.updatedAt) - new Date(b.updatedAt)
      }

      if (sortMode === 'title-asc') {
        return (a.title || 'Sin título').localeCompare(
          b.title || 'Sin título',
          'es',
          { sensitivity: 'base' }
        )
      }

      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }

  const pinned = sortNotes(filtered.filter((note) => note.pinned))
  const unpinned = sortNotes(filtered.filter((note) => !note.pinned))

  const handleRenameTag = (newTagName) => {
    if (!tagBeingRenamed) return

    renameTag(tagBeingRenamed, newTagName)

    if (selectedTag === tagBeingRenamed) {
      setSelectedTag(newTagName)
    }

    setTagBeingRenamed(null)
  }

  return (
    <>
      <div className="w-56 min-h-screen bg-cream-100 border-r border-warm-100 flex flex-col">
        <div className="p-4 border-b border-warm-100">
          <p className="text-warm-600 font-medium text-base mb-3">
            <button onClick={() => setActiveNote(null)}>
              No<span className="text-warm-300">ta</span>la
            </button>
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
              ref={searchInputRef}
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

          {allTags.length > 0 && (
            <div className="mt-3 bg-cream-200 border border-warm-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowTags((current) => !current)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-warm-400 hover:bg-cream-300"
              >
                <span className="flex items-center gap-1 font-medium">
                  <Tag size={13} />
                  {selectedTag ? `Etiqueta: ${selectedTag}` : 'Etiquetas'}
                </span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showTags ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showTags && (
                <div className="px-3 pb-3 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedTag('')
                      setShowTags(false)
                    }}
                    className={`w-full text-left text-xs rounded-lg px-2 py-1.5 ${
                      !selectedTag
                        ? 'bg-cream-300 text-warm-600 font-medium'
                        : 'text-warm-400 hover:bg-cream-300'
                    }`}
                  >
                    Todas las notas
                  </button>

                  {allTags.map((tag) => (
                    <div
                      key={tag}
                      className={`flex items-center gap-1 rounded-lg ${
                        selectedTag === tag
                          ? 'bg-cream-300'
                          : 'hover:bg-cream-300'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedTag(tag)
                          setShowTags(false)
                        }}
                        className={`flex-1 text-left text-xs px-2 py-1.5 ${
                          selectedTag === tag
                            ? 'text-warm-600 font-medium'
                            : 'text-warm-400'
                        }`}
                      >
                        #{tag}
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          setTagBeingRenamed(tag)
                        }}
                        className="w-7 h-7 flex items-center justify-center text-warm-300 hover:text-warm-600"
                        title="Renombrar etiqueta"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 bg-cream-200 border border-warm-100 rounded-xl p-3">
            <label className="block text-[11px] text-warm-300 font-medium mb-1.5">
              Ordenar por
            </label>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="w-full bg-cream-100 text-warm-500 text-xs border border-warm-100 rounded-lg px-3 py-2.5 outline-none cursor-pointer"
            >
              <option value="updated-desc">Última actualización</option>
              <option value="updated-asc">Más antiguas primero</option>
              <option value="title-asc">Título A-Z</option>
            </select>
          </div>

          {notes.length > 0 && (
            <div className="mt-3 bg-cream-200 border border-warm-100 rounded-xl p-3 space-y-2">
              <button
                onClick={toggleSelectionMode}
                className="w-full text-xs bg-cream-100 text-warm-500 border border-warm-100 rounded-full py-2 px-2 hover:bg-cream-300"
              >
                {selectionMode ? 'Cancelar selección' : 'Seleccionar notas'}
              </button>

              {selectionMode && (
                <button
                  onClick={() => {
                    if (selectedNoteIds.length === 0) return
                    setShowBulkDeleteModal(true)
                  }}
                  disabled={selectedNoteIds.length === 0}
                  className="w-full text-xs bg-red-100 text-red-600 border border-red-100 rounded-full py-2 px-2 hover:bg-red-200 disabled:opacity-40"
                >
                  {selectedNoteIds.length > 0
                    ? `Eliminar seleccionadas (${selectedNoteIds.length})`
                    : 'Eliminar seleccionadas'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {(search || selectedTag) && filtered.length === 0 && !isSearching && (
            <p className="max-w-[180px] mx-auto text-sm leading-relaxed text-warm-400 text-center mt-8 px-4">
              {selectedTag
                ? 'No hay notas con esta etiqueta'
                : 'No hay notas relacionadas'}
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

          {search &&
            aiResults === null &&
            filtered.length > 0 &&
            !isSearching && (
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
                  selectionMode={selectionMode}
                  selected={selectedNoteIdsAsStrings.includes(String(note.id))}
                  onToggleSelect={() => toggleNoteSelection(note.id)}
                  onClick={() => setActiveNote(note.id)}
                />
              ))}
            </>
          )}

          {unpinned.length > 0 && (
            <>
              <p className="text-xs text-warm-400 uppercase tracking-wider px-2 py-2">
                {search || selectedTag ? 'Resultados' : 'Todas'}
              </p>

              {unpinned.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  active={note.id === activeNoteId}
                  selectionMode={selectionMode}
                  selected={selectedNoteIdsAsStrings.includes(String(note.id))}
                  onToggleSelect={() => toggleNoteSelection(note.id)}
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
          <ThemeToggle />

          <div className="bg-cream-200 border border-warm-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowShortcuts((current) => !current)}
              className="w-full px-3 py-2 flex items-center justify-between text-xs text-warm-400 hover:bg-cream-300"
            >
              <span className="flex items-center gap-1 font-medium">
                <Keyboard size={13} />
                Atajos rápidos
              </span>

              <ChevronDown
                size={14}
                className={`transition-transform ${
                  showShortcuts ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showShortcuts && (
              <div className="px-3 pb-3 pt-1 text-[11px] text-warm-300 space-y-1">
                <p className="flex justify-between gap-2">
                  <span>Buscar</span>
                  <span className="font-medium text-warm-400">Ctrl + K</span>
                </p>

                <p className="flex justify-between gap-2">
                  <span>Nueva nota</span>
                  <span className="font-medium text-warm-400">Alt + N</span>
                </p>

                <p className="flex justify-between gap-2">
                  <span>Limpiar búsqueda</span>
                  <span className="font-medium text-warm-400">Esc</span>
                </p>
              </div>
            )}
          </div>

          <BackupActions />

          <p className="text-xs text-warm-400 text-center">
            {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
          </p>
        </div>
      </div>

      {deletedCount > 0 && (
        <div className="fixed bottom-5 right-5 z-50 bg-warm-600 text-cream-100 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">
              {deletedCount === 1 ? 'Nota eliminada' : 'Notas eliminadas'}
            </p>

            <p className="text-xs text-cream-200 max-w-[180px] truncate">
              {deletedCount === 1
                ? lastDeletedNote?.title || 'Sin título'
                : `${deletedCount} notas eliminadas`}
            </p>
          </div>

          <button
            onClick={restoreLastDeletedNote}
            className="text-xs bg-cream-100 text-warm-600 px-3 py-1.5 rounded-full font-medium hover:bg-cream-200"
          >
            Deshacer
          </button>
        </div>
      )}

      {tagBeingRenamed && (
        <RenameTagModal
          tag={tagBeingRenamed}
          onCancel={() => setTagBeingRenamed(null)}
          onConfirm={handleRenameTag}
        />
      )}

      {showBulkDeleteModal && (
        <DeleteNotesModal
          notes={selectedNotes}
          count={selectedNoteIds.length}
          onCancel={() => setShowBulkDeleteModal(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      )}
    </>
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

function NoteItem({
  note,
  active,
  onClick,
  selectionMode,
  selected,
  onToggleSelect,
}) {
  const { deleteNote } = useNotesStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleItemClick = () => {
    if (selectionMode) {
      onToggleSelect()
      return
    }

    onClick()
  }

  const handleDeleteClick = (event) => {
    event.stopPropagation()
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
        onClick={handleItemClick}
        className={`group px-3 py-2 rounded-lg cursor-pointer mb-1 flex items-start gap-2 ${
          active
            ? 'bg-cream-300 text-warm-600'
            : 'text-warm-500 hover:bg-cream-200'
        } ${selected ? 'ring-1 ring-warm-300 bg-cream-300' : ''}`}
      >
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected}
            onClick={(event) => {
              event.stopPropagation()
            }}
            onChange={(event) => {
              event.stopPropagation()
              onToggleSelect()
            }}
            className="mt-1"
          />
        )}

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

        {!selectionMode && (
          <button
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 mt-0.5 flex-shrink-0 transition-opacity"
            title="Eliminar nota"
          >
            <Trash2 size={14} />
          </button>
        )}
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