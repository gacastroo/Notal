const BACKUP_VERSION = 1

const generateId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`

const normalizeNote = (note) => {
  const now = new Date().toISOString()

  return {
    id: String(note.id || generateId()),
    title: typeof note.title === 'string' ? note.title : '',
    content: typeof note.content === 'string' ? note.content : '',
    tags: Array.isArray(note.tags)
      ? note.tags.filter((tag) => typeof tag === 'string')
      : [],
    pinned: Boolean(note.pinned),
    createdAt: note.createdAt || now,
    updatedAt: note.updatedAt || now,
  }
}

export const exportNotesToJson = (notes) => {
  const safeNotes = Array.isArray(notes) ? notes.map(normalizeNote) : []

  const backup = {
    app: 'Notala',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    notes: safeNotes,
  }

  const json = JSON.stringify(backup, null, 2)

  const blob = new Blob([json], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `notala-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export const importNotesFromJsonFile = async (file) => {
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo')
  }

  const text = await file.text()

  let data

  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido')
  }

  let rawNotes = []

  if (Array.isArray(data)) {
    rawNotes = data
  } else if (data && Array.isArray(data.notes)) {
    rawNotes = data.notes
  } else {
    throw new Error('El archivo no tiene un formato válido de Notala')
  }

  return rawNotes.map(normalizeNote)
}