import { useRef, useState } from "react";
import { Download, Upload, Loader2, X, FileText } from 'lucide-react'
import useNotesStore from "../store/useNotesStore";
import { exportNotesToJson, importNotesFromJsonFile } from "../lib/backup";
import { exportNotesToMarkdown, exportNotesToPdf } from "../lib/exportNotes";


function BackupActions() {
  const fileInputRef = useRef(null);

  const { notes, importNotes } = useNotesStore();
  const handleExportMarkdown = () => {
    if (notes.length === 0) {
      setMessage("No hay notas para exportar.");
      return;
    }

    exportNotesToMarkdown(notes);
    setMessage("Notas exportadas en Markdown.");
  };

  const handleExportPdf = () => {
    if (notes.length === 0) {
      setMessage("No hay notas para exportar.");
      return;
    }

    exportNotesToPdf(notes);
    setMessage("Se ha abierto la exportación a PDF.");
  };

  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingNotes, setPendingNotes] = useState([]);

  const handleExport = () => {
    if (notes.length === 0) {
      setMessage("No hay notas para exportar.");
      return;
    }

    exportNotesToJson(notes);
    setMessage("Backup exportado correctamente.");
  };

  const handleImportClick = () => {
    setMessage("");
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsImporting(true);
    setMessage("");

    try {
      const importedNotes = await importNotesFromJsonFile(file);

      setPendingNotes(importedNotes);
      setShowModal(true);
    } catch (error) {
      console.error("Error importando notas:", error);
      setMessage("No se pudo importar el archivo.");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const handleReplaceNotes = () => {
    importNotes(pendingNotes, "replace");

    setMessage(`${pendingNotes.length} notas importadas correctamente.`);
    setPendingNotes([]);
    setShowModal(false);
  };

  const handleMergeNotes = () => {
    importNotes(pendingNotes, "merge");

    setMessage(`${pendingNotes.length} notas añadidas correctamente.`);
    setPendingNotes([]);
    setShowModal(false);
  };

  const handleCancelImport = () => {
    setPendingNotes([]);
    setShowModal(false);
    setMessage("Importación cancelada.");
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 text-xs bg-cream-200 text-warm-500 border border-warm-100 rounded-full py-2 px-2 flex items-center justify-center gap-1 hover:bg-cream-300"
          >
            <Download size={13} />
            Exportar
          </button>

          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex-1 text-xs bg-cream-200 text-warm-500 border border-warm-100 rounded-full py-2 px-2 flex items-center justify-center gap-1 hover:bg-cream-300 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            Importar
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />

        {message && (
          <p className="text-xs text-warm-300 text-center leading-snug">
            {message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleExportMarkdown}
          className="flex-1 text-xs bg-cream-200 text-warm-500 border border-warm-100 rounded-full py-2 px-2 flex items-center justify-center gap-1 hover:bg-cream-300"
        >
          <FileText size={13} />
          .md
        </button>

        <button
          onClick={handleExportPdf}
          className="flex-1 text-xs bg-cream-200 text-warm-500 border border-warm-100 rounded-full py-2 px-2 flex items-center justify-center gap-1 hover:bg-cream-300"
        >
          <Download size={13} />
          PDF
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-cream-100 border border-warm-100 rounded-2xl shadow-xl w-full max-w-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-warm-600">
                  Importar notas
                </h2>

                <p className="text-xs text-warm-400 mt-1 leading-relaxed">
                  El archivo contiene{" "}
                  <span className="font-medium text-warm-500">
                    {pendingNotes.length}
                  </span>{" "}
                  nota{pendingNotes.length !== 1 ? "s" : ""}.
                </p>
              </div>

              <button
                onClick={handleCancelImport}
                className="text-warm-300 hover:text-warm-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-cream-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-warm-500 leading-relaxed">
                ¿Qué quieres hacer con tus notas actuales?
              </p>

              <p className="text-xs text-warm-300 mt-2 leading-relaxed">
                Si reemplazas, se borrarán las notas actuales y se cargarán las
                del archivo. Si añades, conservarás las actuales y sumarás las
                importadas.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleReplaceNotes}
                className="w-full bg-red-100 text-red-600 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-red-200"
              >
                Reemplazar notas actuales
              </button>

              <button
                onClick={handleMergeNotes}
                className="w-full bg-warm-300 text-cream-300 text-xs font-medium py-2.5 px-3 rounded-full hover:opacity-90"
              >
                Añadir a mis notas actuales
              </button>

              <button
                onClick={handleCancelImport}
                className="w-full bg-cream-200 text-warm-400 text-xs font-medium py-2.5 px-3 rounded-full hover:bg-cream-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BackupActions;
