import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useNotesStore = create(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,

      addNote: () => {
        const newNote = {
          id: Date.now().toString(),
          title: '',
          content: '',
          tags: [],
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }))
        return newNote.id
      },

      updateNote: (id, changes) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...changes, updatedAt: new Date().toISOString() }
              : note
          ),
        }))
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId:
            state.activeNoteId === id ? null : state.activeNoteId,
        }))
      },

      togglePin: (id) => {
        const note = get().notes.find((n) => n.id === id)
        if (note) get().updateNote(id, { pinned: !note.pinned })
      },

      setActiveNote: (id) => set({ activeNoteId: id }),

      getActiveNote: () => {
        const { notes, activeNoteId } = get()
        return notes.find((n) => n.id === activeNoteId) || null
      },
    }),
    {
      name: 'notara-storage',
    }
  )
)

export default useNotesStore