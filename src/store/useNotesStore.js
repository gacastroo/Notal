import { create } from "zustand";
import { persist } from "zustand/middleware";

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyNote = () => {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: "",
    content: "",
    tags: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
};

const normalizeNote = (note) => {
  const now = new Date().toISOString();

  return {
    id: String(note.id || generateId()),
    title: typeof note.title === "string" ? note.title : "",
    content: typeof note.content === "string" ? note.content : "",
    tags: Array.isArray(note.tags)
      ? note.tags.filter((tag) => typeof tag === "string")
      : [],
    pinned: Boolean(note.pinned),
    createdAt: note.createdAt || now,
    updatedAt: note.updatedAt || now,
  };
};

const useNotesStore = create(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,
      lastDeletedNote: null,

      addNote: () => {
        const newNote = createEmptyNote();

        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }));

        return newNote.id;
      },

      updateNote: (id, changes) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...changes,
                  updatedAt: new Date().toISOString(),
                }
              : note,
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => {
          const noteToDelete = state.notes.find((note) => note.id === id);
          const remainingNotes = state.notes.filter((note) => note.id !== id);

          let nextActiveNoteId = state.activeNoteId;

          if (state.activeNoteId === id) {
            nextActiveNoteId = remainingNotes[0]?.id || null;
          }

          return {
            notes: remainingNotes,
            activeNoteId: nextActiveNoteId,
            lastDeletedNote: noteToDelete || null,
          };
        });
      },

      restoreLastDeletedNote: () => {
        const { lastDeletedNote } = get();

        if (!lastDeletedNote) return;

        set((state) => ({
          notes: [lastDeletedNote, ...state.notes],
          activeNoteId: lastDeletedNote.id,
          lastDeletedNote: null,
        }));
      },

      importNotes: (importedNotes, mode = "replace") => {
        if (!Array.isArray(importedNotes)) return;

        const normalizedImportedNotes = importedNotes.map(normalizeNote);

        set((state) => {
          if (mode === "merge") {
            const existingIds = new Set(
              state.notes.map((note) => String(note.id)),
            );

            const safeImportedNotes = normalizedImportedNotes.map((note) => {
              if (existingIds.has(String(note.id))) {
                return {
                  ...note,
                  id: generateId(),
                  updatedAt: new Date().toISOString(),
                };
              }

              return note;
            });

            return {
              notes: [...safeImportedNotes, ...state.notes],
              activeNoteId: safeImportedNotes[0]?.id || state.activeNoteId,
            };
          }

          return {
            notes: normalizedImportedNotes,
            activeNoteId: normalizedImportedNotes[0]?.id || null,
            lastDeletedNote: null,
          };
        });
      },

      togglePin: (id) => {
        const note = get().notes.find((n) => n.id === id);

        if (!note) return;

        get().updateNote(id, {
          pinned: !note.pinned,
        });
      },

      setActiveNote: (id) => {
        set({ activeNoteId: id });
      },

      getActiveNote: () => {
        const { notes, activeNoteId } = get();

        return notes.find((note) => note.id === activeNoteId) || null;
      },

      addTagToNote: (id, tag) => {
        const cleanTag = String(tag || "")
          .trim()
          .toLowerCase();

        if (!cleanTag) return;

        const note = get().notes.find((n) => n.id === id);

        if (!note) return;

        const currentTags = Array.isArray(note.tags) ? note.tags : [];

        if (currentTags.includes(cleanTag)) return;

        get().updateNote(id, {
          tags: [...currentTags, cleanTag],
        });
      },

      removeTagFromNote: (id, tag) => {
        const note = get().notes.find((n) => n.id === id);

        if (!note) return;

        const currentTags = Array.isArray(note.tags) ? note.tags : [];

        get().updateNote(id, {
          tags: currentTags.filter((t) => t !== tag),
        });
      },

      renameTag: (oldTag, newTag) => {
        const cleanOldTag = String(oldTag || "")
          .trim()
          .toLowerCase();
        const cleanNewTag = String(newTag || "")
          .trim()
          .toLowerCase();

        if (!cleanOldTag || !cleanNewTag) return;

        set((state) => ({
          notes: state.notes.map((note) => {
            const tags = Array.isArray(note.tags) ? note.tags : [];

            if (!tags.includes(cleanOldTag)) return note;

            const updatedTags = tags.map((tag) =>
              tag === cleanOldTag ? cleanNewTag : tag,
            );

            return {
              ...note,
              tags: [...new Set(updatedTags)],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      getAllTags: () => {
        const { notes } = get();

        const tags = notes.flatMap((note) =>
          Array.isArray(note.tags) ? note.tags : [],
        );

        return [...new Set(tags)].sort();
      },

      duplicateNote: (id) => {
        const note = get().notes.find((n) => n.id === id);

        if (!note) return null;

        const now = new Date().toISOString();

        const duplicatedNote = {
          ...note,
          id: generateId(),
          title: note.title ? `${note.title} copia` : "Nota copia",
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          notes: [duplicatedNote, ...state.notes],
          activeNoteId: duplicatedNote.id,
        }));

        return duplicatedNote.id;
      },

      clearLastDeletedNote: () => {
        set({
          lastDeletedNote: null,
        });
      },

      clearAllNotes: () => {
        set({
          notes: [],
          activeNoteId: null,
          lastDeletedNote: null,
        });
      },
    }),
    {
      name: "notala-storage",
    },
  ),
);

export default useNotesStore;
