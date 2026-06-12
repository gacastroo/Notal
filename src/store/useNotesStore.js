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
      lastDeletedNotes: [],

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
            String(note.id) === String(id)
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
          const noteToDelete = state.notes.find(
            (note) => String(note.id) === String(id),
          );

          const remainingNotes = state.notes.filter(
            (note) => String(note.id) !== String(id),
          );

          const activeNoteWasDeleted =
            String(state.activeNoteId) === String(id);

          return {
            notes: remainingNotes,
            activeNoteId: activeNoteWasDeleted
              ? remainingNotes[0]?.id || null
              : state.activeNoteId,
            lastDeletedNote: noteToDelete || null,
            lastDeletedNotes: noteToDelete ? [noteToDelete] : [],
          };
        });
      },

      deleteNotes: (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) return;

        set((state) => {
          const idsToDelete = new Set(ids.map(String));

          const deletedNotes = state.notes.filter((note) =>
            idsToDelete.has(String(note.id)),
          );

          const remainingNotes = state.notes.filter(
            (note) => !idsToDelete.has(String(note.id)),
          );

          if (deletedNotes.length === 0) return state;

          const activeNoteWasDeleted = idsToDelete.has(
            String(state.activeNoteId),
          );

          return {
            notes: remainingNotes,
            activeNoteId: activeNoteWasDeleted
              ? remainingNotes[0]?.id || null
              : state.activeNoteId,
            lastDeletedNote: deletedNotes[0],
            lastDeletedNotes: deletedNotes,
          };
        });
      },

      restoreLastDeletedNote: () => {
        const { lastDeletedNote, lastDeletedNotes } = get();

        const notesToRestore =
          Array.isArray(lastDeletedNotes) && lastDeletedNotes.length > 0
            ? lastDeletedNotes
            : lastDeletedNote
              ? [lastDeletedNote]
              : [];

        if (notesToRestore.length === 0) return;

        set((state) => ({
          notes: [...notesToRestore, ...state.notes],
          activeNoteId: notesToRestore[0].id,
          lastDeletedNote: null,
          lastDeletedNotes: [],
        }));
      },

      clearLastDeletedNote: () => {
        set({
          lastDeletedNote: null,
          lastDeletedNotes: [],
        });
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
            lastDeletedNotes: [],
          };
        });
      },

      togglePin: (id) => {
        const note = get().notes.find((n) => String(n.id) === String(id));

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

        return (
          notes.find((note) => String(note.id) === String(activeNoteId)) || null
        );
      },

      addTagToNote: (id, tag) => {
        const cleanTag = String(tag || "")
          .trim()
          .toLowerCase();

        if (!cleanTag) return;

        const note = get().notes.find((n) => String(n.id) === String(id));

        if (!note) return;

        const currentTags = Array.isArray(note.tags) ? note.tags : [];

        if (currentTags.includes(cleanTag)) return;

        get().updateNote(id, {
          tags: [...currentTags, cleanTag],
        });
      },

      removeTagFromNote: (id, tag) => {
        const note = get().notes.find((n) => String(n.id) === String(id));

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
        const note = get().notes.find((n) => String(n.id) === String(id));

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

      clearAllNotes: () => {
        set({
          notes: [],
          activeNoteId: null,
          lastDeletedNote: null,
          lastDeletedNotes: [],
        });
      },
    }),
    {
      name: "notala-storage",
    },
  ),
);

export default useNotesStore;