import { useEffect, useRef, useState } from 'react'
import {
  X,
  Pin,
  PinOff,
  Trash2,
  Bold,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Minus,
  Eye,
  Edit3,
  Copy,
  Pencil,
  CheckSquare,
} from 'lucide-react'
import useNotesStore from '../store/useNotesStore'
import { formatDate } from '../lib/utils'
import RenameTagModal from './RenameTagModal'

function Editor() {
  const {
    getActiveNote,
    updateNote,
    deleteNote,
    togglePin,
    duplicateNote,
    renameTag,
    addNote,
  } = useNotesStore()

  const note = getActiveNote()

  const textareaRef = useRef(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tagBeingRenamed, setTagBeingRenamed] = useState(null)

  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setContent(note.content || '')
      setTagInput('')
      setIsPreview(false)
      setShowDeleteModal(false)
      setTagBeingRenamed(null)
    }
  }, [note?.id])

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-cream-50 px-6">
        <div className="bg-cream-100 border border-warm-100 rounded-3xl shadow-sm p-8 max-w-sm w-full text-center">
          <p className="text-5xl mb-4">📓</p>

          <h1 className="text-warm-600 font-semibold text-xl mb-2">
            Bienvenido a Notala
          </h1>

          <p className="text-warm-300 text-sm leading-relaxed mb-5">
            Captura ideas, tareas, apuntes y notas profesionales en un espacio
            simple y fácil de usar.
          </p>

          <button
            onClick={addNote}
            className="bg-warm-300 text-cream-300 text-sm font-medium py-2.5 px-5 rounded-full hover:opacity-90"
          >
            Crear nueva nota
          </button>
        </div>
      </div>
    )
  }

  const tags = Array.isArray(note.tags) ? note.tags : []

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const handleTitleChange = (e) => {
    const value = e.target.value

    setTitle(value)
    updateNote(note.id, { title: value })
  }

  const handleContentChange = (e) => {
    const value = e.target.value

    setContent(value)
    updateNote(note.id, { content: value })
  }

  const updateContent = (value) => {
    setContent(value)
    updateNote(note.id, { content: value })
  }

  const insertText = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current

    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const selectedText = content.slice(start, end)
    const textToInsert = selectedText || placeholder

    const newContent =
      content.slice(0, start) +
      before +
      textToInsert +
      after +
      content.slice(end)

    updateContent(newContent)

    requestAnimationFrame(() => {
      textarea.focus()

      const cursorStart = start + before.length
      const cursorEnd = cursorStart + textToInsert.length

      textarea.setSelectionRange(cursorStart, cursorEnd)
    })
  }

  const insertLinePrefix = (prefix, placeholder = '') => {
    const textarea = textareaRef.current

    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const selectedText = content.slice(start, end)
    const textToInsert = selectedText || placeholder

    const needsLineBreakBefore =
      start > 0 && content[start - 1] !== '\n' ? '\n' : ''

    const needsLineBreakAfter =
      end < content.length && content[end] !== '\n' ? '\n' : ''

    const newText = `${needsLineBreakBefore}${prefix}${textToInsert}${needsLineBreakAfter}`

    const newContent = content.slice(0, start) + newText + content.slice(end)

    updateContent(newContent)

    requestAnimationFrame(() => {
      textarea.focus()

      const cursorStart = start + needsLineBreakBefore.length + prefix.length
      const cursorEnd = cursorStart + textToInsert.length

      textarea.setSelectionRange(cursorStart, cursorEnd)
    })
  }

  const handleAddTag = (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return

    e.preventDefault()

    const newTag = tagInput.trim().toLowerCase()

    if (!newTag) return

    if (!tags.includes(newTag)) {
      updateNote(note.id, {
        tags: [...tags, newTag],
      })
    }

    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove) => {
    updateNote(note.id, {
      tags: tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleRenameTag = (newTagName) => {
    if (!tagBeingRenamed) return

    renameTag(tagBeingRenamed, newTagName)
    setTagBeingRenamed(null)
  }

  const handleTextareaKeyDown = (e) => {
    const isBoldShortcut =
      (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b'

    if (isBoldShortcut) {
      e.preventDefault()
      insertText('**', '**', 'texto en negrita')
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      insertText('  ')
    }
  }

  const handleDuplicateNote = () => {
    duplicateNote(note.id)
  }

  const handleDeleteConfirm = () => {
    deleteNote(note.id)
    setShowDeleteModal(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-cream-50 relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-warm-100 bg-cream-50">
        <div className="flex gap-2">
          <button
            onClick={() => setIsPreview((current) => !current)}
            className="text-sm px-3 py-1 rounded-full border border-warm-100 text-warm-400 hover:text-warm-600 hover:border-warm-200 flex items-center gap-1"
          >
            {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
            {isPreview ? 'Editar' : 'Vista'}
          </button>

          <button
            onClick={() => togglePin(note.id)}
            className={`text-sm px-3 py-1 rounded-full border flex items-center gap-1 ${
              note.pinned
                ? 'border-warm-300 text-warm-300'
                : 'border-warm-100 text-warm-400 hover:text-warm-600 hover:border-warm-200'
            }`}
          >
            {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
            {note.pinned ? 'Fijada' : 'Fijar'}
          </button>

          <button
            onClick={handleDuplicateNote}
            className="text-sm px-3 py-1 rounded-full border border-warm-100 text-warm-400 hover:text-warm-600 hover:border-warm-200 flex items-center gap-1"
          >
            <Copy size={13} />
            Duplicar
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-sm px-3 py-1 rounded-full border border-warm-100 text-warm-400 hover:text-red-400 hover:border-red-300 flex items-center gap-1"
          >
            <Trash2 size={13} />
            Borrar
          </button>
        </div>

        <p className="text-xs text-warm-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
          Guardado {formatDate(note.updatedAt)}
        </p>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        <input
          type="text"
          placeholder="Título..."
          value={title}
          onChange={handleTitleChange}
          className="bg-transparent text-warm-600 text-2xl font-semibold outline-none placeholder-warm-200"
        />

        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-cream-300 text-warm-500 text-xs px-3 py-1 rounded-full"
            >
              {tag}

              <button
                onClick={() => setTagBeingRenamed(tag)}
                className="text-warm-400 hover:text-warm-600"
                title="Renombrar etiqueta"
              >
                <Pencil size={10} />
              </button>

              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-warm-400 hover:text-red-400"
                title="Quitar etiqueta de esta nota"
              >
                <X size={10} />
              </button>
            </span>
          ))}

          <input
            type="text"
            placeholder="+ etiqueta..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="bg-transparent text-warm-400 text-xs outline-none placeholder-warm-200 min-w-[120px]"
          />
        </div>

        {!isPreview && (
          <div className="flex flex-wrap gap-2 border-y border-warm-100 py-2">
            <ToolbarButton
              title="Título grande"
              onClick={() => insertLinePrefix('# ', 'Título grande')}
            >
              <Heading1 size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Título mediano"
              onClick={() => insertLinePrefix('## ', 'Título mediano')}
            >
              <Heading2 size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Negrita"
              onClick={() => insertText('**', '**', 'texto en negrita')}
            >
              <Bold size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Lista"
              onClick={() => insertLinePrefix('- ', 'Elemento de lista')}
            >
              <List size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Checklist"
              onClick={() => insertLinePrefix('- [ ] ', 'Tarea pendiente')}
            >
              <CheckSquare size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Lista numerada"
              onClick={() => insertLinePrefix('1. ', 'Elemento numerado')}
            >
              <ListOrdered size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Cita"
              onClick={() => insertLinePrefix('> ', 'Cita o idea importante')}
            >
              <Quote size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Separador"
              onClick={() => insertLinePrefix('---', '')}
            >
              <Minus size={14} />
            </ToolbarButton>
          </div>
        )}

        {isPreview ? (
          <div className="flex-1 overflow-y-auto bg-cream-100 border border-warm-100 rounded-2xl p-5">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            placeholder="Escribe aquí lo que quieras..."
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleTextareaKeyDown}
            className="flex-1 bg-transparent text-warm-500 text-sm leading-relaxed outline-none resize-none placeholder-warm-200"
          />
        )}
      </div>

      <div className="px-6 py-3 border-t border-warm-100 flex justify-between text-xs text-warm-300">
        <span>
          {wordCount} palabra{wordCount !== 1 ? 's' : ''}
        </span>
        <span>Markdown básico compatible</span>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-cream-100 border border-warm-100 rounded-2xl shadow-xl w-full max-w-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-warm-600">
                  Borrar nota
                </h2>

                <p className="text-xs text-warm-400 mt-1 leading-relaxed">
                  Esta acción eliminará la nota actual.
                </p>
              </div>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-warm-300 hover:text-warm-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-cream-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-warm-500 leading-relaxed">
                ¿Seguro que quieres borrar{' '}
                <span className="font-medium">
                  {title || 'esta nota sin título'}
                </span>
                ?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDeleteConfirm}
                className="w-full bg-red-100 text-red-600 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-red-200"
              >
                Sí, borrar nota
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full bg-cream-200 text-warm-400 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-cream-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {tagBeingRenamed && (
        <RenameTagModal
          tag={tagBeingRenamed}
          onCancel={() => setTagBeingRenamed(null)}
          onConfirm={handleRenameTag}
        />
      )}
    </div>
  )
}

function ToolbarButton({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-cream-200 border border-warm-100 text-warm-400 hover:text-warm-600 hover:bg-cream-300 flex items-center justify-center"
    >
      {children}
    </button>
  )
}

function MarkdownPreview({ content }) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-warm-300 italic">
        No hay contenido para previsualizar.
      </p>
    )
  }

  const lines = content.split('\n')

  return (
    <div className="space-y-2 text-warm-500 text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} className="h-3" />
        }

        if (trimmed === '---') {
          return <hr key={index} className="border-warm-100 my-4" />
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={index}
              className="text-2xl font-semibold text-warm-600 mt-4"
            >
              {renderInlineMarkdown(trimmed.replace('# ', ''))}
            </h1>
          )
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="text-xl font-semibold text-warm-600 mt-3"
            >
              {renderInlineMarkdown(trimmed.replace('## ', ''))}
            </h2>
          )
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-warm-200 pl-3 text-warm-400 italic"
            >
              {renderInlineMarkdown(trimmed.replace('> ', ''))}
            </blockquote>
          )
        }

        if (trimmed.startsWith('- [ ] ')) {
          return (
            <div key={index} className="flex items-start gap-2 ml-1">
              <input type="checkbox" disabled className="mt-1" />
              <span>{renderInlineMarkdown(trimmed.replace('- [ ] ', ''))}</span>
            </div>
          )
        }

        if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
          return (
            <div key={index} className="flex items-start gap-2 ml-1 text-warm-300">
              <input
                type="checkbox"
                checked
                disabled
                readOnly
                className="mt-1"
              />
              <span className="line-through">
                {renderInlineMarkdown(trimmed.replace(/- \[[xX]\] /, ''))}
              </span>
            </div>
          )
        }

        if (trimmed.startsWith('- ')) {
          return (
            <ul key={index} className="list-disc ml-5">
              <li>{renderInlineMarkdown(trimmed.replace('- ', ''))}</li>
            </ul>
          )
        }

        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <ol key={index} className="list-decimal ml-5">
              <li>{renderInlineMarkdown(trimmed.replace(/^\d+\.\s/, ''))}</li>
            </ol>
          )
        }

        return <p key={index}>{renderInlineMarkdown(trimmed)}</p>
      })}
    </div>
  )
}

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-warm-600">
          {part.slice(2, -2)}
        </strong>
      )
    }

    return <span key={index}>{part}</span>
  })
}

export default Editor