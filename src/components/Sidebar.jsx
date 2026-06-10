import { useState } from "react";
import useNotesStore from "../store/useNotesStore";
import { Trash2 } from "lucide-react";
import { formatDate } from "../lib/utils";

function Sidebar() {
  const { notes, activeNoteId, setActiveNote, addNote } = useNotesStore();
  const [search, setSearch] = useState("");

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  });

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <div className="w-56 min-h-screen bg-cream-100 border-r border-warm-100 flex flex-col">
      <div className="p-4 border-b border-warm-100">
        <p className="text-warm-600 font-medium text-base mb-3">
          No<span className="text-warm-300">ta</span>ra
        </p>
        <button
          onClick={addNote}
          className="w-full bg-warm-300 text-cream-300 text-sm font-medium py-2 px-3 rounded-full flex items-center gap-2 mb-3"
        >
          <span className="text-lg leading-none">+</span>
          Captura rápida
        </button>
        <input
          type="text"
          placeholder="Buscar notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-cream-200 text-warm-500 text-sm px-3 py-2 rounded-full outline-none placeholder-warm-200 border border-warm-100"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {search && filtered.length === 0 && (
          <p className="text-sm text-warm-400 text-center mt-8 px-4">
            No hay notas con ese texto
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
              {search ? "Resultados" : "Todas"}
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
          <p className="text-sm text-warm-400 text-center mt-8 px-4">
            Aún no tienes notas. ¡Crea una!
          </p>
        )}
      </div>

      <div className="p-3 border-t border-warm-100">
        <p className="text-xs text-warm-400 text-center">
          {notes.length} {notes.length === 1 ? "nota" : "notas"}
        </p>
      </div>
    </div>
  );
}

const TAG_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
];

const getTagColor = (tag) => {
  const index = tag.charCodeAt(0) % TAG_COLORS.length;
  return TAG_COLORS[index];
};

function NoteItem({ note, active, onClick }) {
  const { deleteNote } = useNotesStore();

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNote(note.id);
  };

  return (
    <div
      onClick={onClick}
      className={`group px-3 py-2 rounded-lg cursor-pointer mb-1 flex items-start justify-between gap-1 ${
        active
          ? "bg-cream-300 text-warm-600"
          : "text-warm-500 hover:bg-cream-200"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {note.title || "Sin título"}
        </p>
        <p className="text-xs text-warm-400 truncate mt-0.5">
          {note.content || "Nota vacía"}
        </p>
        <p className="text-xs text-warm-200 mt-0.5">
          {formatDate(note.updatedAt)}
        </p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 mt-0.5 flex-shrink-0 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
export default Sidebar;
