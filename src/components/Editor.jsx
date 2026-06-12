import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useNotesStore from "../store/useNotesStore";
import { formatDate } from "../lib/utils";

function Editor() {
  const { getActiveNote, updateNote, deleteNote, togglePin } = useNotesStore();
  const note = getActiveNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTagInput("");
    }
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-cream-50 gap-3">
        <p className="text-4xl">📓</p>
        <p className="text-warm-500 font-medium">Bienvenido a Notala</p>
        <p className="text-warm-300 text-sm text-center max-w-xs">
          Captura tus ideas, tareas y notas profesionales en un solo lugar.
        </p>
      </div>
    );
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    updateNote(note.id, { title: e.target.value });
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    updateNote(note.id, { content: e.target.value });
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const newTag =
        tagInput.trim().charAt(0).toUpperCase() +
        tagInput.trim().slice(1).toLowerCase();
      if (!note.tags.includes(newTag)) {
        updateNote(note.id, { tags: [...note.tags, newTag] });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    updateNote(note.id, { tags: note.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="flex-1 flex flex-col bg-cream-50">
      <div className="flex items-center justify-between px-6 py-3 border-b border-warm-100">
        <p className="text-xs text-warm-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
          Guardado {formatDate(note.updatedAt)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => togglePin(note.id)}
            className={`text-sm px-3 py-1 rounded-full border ${
              note.pinned
                ? "border-warm-300 text-warm-300"
                : "border-warm-100 text-warm-400"
            }`}
          >
            {note.pinned ? "Fijada" : "Fijar"}
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className="text-sm px-3 py-1 rounded-full border border-warm-100 text-warm-400 hover:text-red-400 hover:border-red-300"
          >
            Borrar
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-4">
        <input
          type="text"
          placeholder="Título..."
          value={title}
          onChange={handleTitleChange}
          className="bg-transparent text-warm-600 text-xl font-medium outline-none placeholder-warm-200"
        />

        <div className="flex flex-wrap gap-2 items-center">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-cream-300 text-warm-500 text-xs px-3 py-1 rounded-full"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-warm-400 hover:text-red-400"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="+ Añadir etiqueta..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="bg-transparent text-warm-400 text-xs outline-none placeholder-warm-200 min-w-0"
          />
        </div>

        <textarea
          placeholder="Escribe aquí lo que quieras..."
          value={content}
          onChange={handleContentChange}
          className="flex-1 bg-transparent text-warm-500 text-sm leading-relaxed outline-none resize-none placeholder-warm-200"
        />
      </div>
    </div>
  );
}

export default Editor;
