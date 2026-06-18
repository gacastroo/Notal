import { useState } from "react";
import useNotesStore from "../store/useNotesStore";

const getColumnName = (index) => {
  let name = "";
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
};

const getColumnIndex = (columnName) => {
  return columnName.split("").reduce((total, letter) => {
    return total * 26 + letter.charCodeAt(0) - 64;
  }, 0) - 1;
};

const getCellId = (rowIndex, colIndex) => {
  return `${getColumnName(colIndex)}${rowIndex + 1}`;
};

const getCellValueAsNumber = (cellId, cells, visitedCells = new Set()) => {
  const value = evaluateCellValue(cellId, cells, visitedCells);
  const normalizedValue = String(value).replace(",", ".");
  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : 0;
};

const getRangeCellIds = (range) => {
  const match = String(range)
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);

  if (!match) return [];

  const [, startColumnName, startRow, endColumnName, endRow] = match;
  const startCol = getColumnIndex(startColumnName);
  const endCol = getColumnIndex(endColumnName);
  const startRowIndex = Number(startRow) - 1;
  const endRowIndex = Number(endRow) - 1;

  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRowIndex, endRowIndex);
  const maxRow = Math.max(startRowIndex, endRowIndex);
  const ids = [];

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      ids.push(getCellId(row, col));
    }
  }

  return ids;
};

const getFormulaValues = (formulaContent, cells, visitedCells) => {
  return formulaContent
    .split(/[;,]/)
    .flatMap((part) => {
      const cleanPart = part.trim().toUpperCase();
      const rangeCellIds = getRangeCellIds(cleanPart);

      if (rangeCellIds.length > 0) {
        return rangeCellIds.map((cellId) =>
          getCellValueAsNumber(cellId, cells, new Set(visitedCells)),
        );
      }

      if (/^[A-Z]+\d+$/.test(cleanPart)) {
        return [getCellValueAsNumber(cleanPart, cells, new Set(visitedCells))];
      }

      const number = Number(cleanPart.replace(",", "."));
      return Number.isFinite(number) ? [number] : [];
    });
};

const evaluateFunctionFormula = (formula, cells, visitedCells) => {
  const match = formula.match(/^(SUM|AVG|MIN|MAX|COUNT)\((.*)\)$/i);

  if (!match) return null;

  const [, functionName, formulaContent] = match;
  const values = getFormulaValues(formulaContent, cells, visitedCells);

  if (values.length === 0) return "";

  if (functionName.toUpperCase() === "SUM") {
    return values.reduce((total, value) => total + value, 0);
  }

  if (functionName.toUpperCase() === "AVG") {
    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  if (functionName.toUpperCase() === "MIN") {
    return Math.min(...values);
  }

  if (functionName.toUpperCase() === "MAX") {
    return Math.max(...values);
  }

  if (functionName.toUpperCase() === "COUNT") {
    return values.filter((value) => Number.isFinite(value)).length;
  }

  return null;
};

const evaluateMathFormula = (formula, cells, visitedCells) => {
  const expression = formula.replace(/[A-Z]+\d+/gi, (cellId) => {
    return String(
      getCellValueAsNumber(cellId.toUpperCase(), cells, new Set(visitedCells)),
    );
  });

  if (!/^[\d+\-*/().\s,]+$/.test(expression)) return "#ERROR";

  try {
    const normalizedExpression = expression.replaceAll(",", ".");
    const result = Function(`"use strict"; return (${normalizedExpression})`)();

    if (!Number.isFinite(result)) return "#ERROR";

    return result;
  } catch {
    return "#ERROR";
  }
};

const formatResult = (value) => {
  if (typeof value !== "number") return value;

  if (Number.isInteger(value)) return String(value);

  return String(Number(value.toFixed(4)));
};

const evaluateCellValue = (cellId, cells, visitedCells = new Set()) => {
  const cleanCellId = String(cellId).toUpperCase();

  if (visitedCells.has(cleanCellId)) return "#CIRC";

  visitedCells.add(cleanCellId);

  const rawValue = String(cells[cleanCellId] ?? "");

  if (!rawValue.startsWith("=")) return rawValue;

  const formula = rawValue.slice(1).trim();

  if (!formula) return "";

  const functionResult = evaluateFunctionFormula(formula, cells, visitedCells);

  if (functionResult !== null) {
    return formatResult(functionResult);
  }

  return formatResult(evaluateMathFormula(formula, cells, visitedCells));
};

const FORMULA_EXAMPLES = [
  {
    formula: "=A1+B1",
    description: "Suma dos celdas.",
  },
  {
    formula: "=A1-B1",
    description: "Resta una celda a otra.",
  },
  {
    formula: "=A1*B1",
    description: "Multiplica dos celdas.",
  },
  {
    formula: "=A1/B1",
    description: "Divide una celda entre otra.",
  },
  {
    formula: "=SUM(A1:A5)",
    description: "Suma un rango de celdas.",
  },
  {
    formula: "=AVG(A1:A5)",
    description: "Calcula la media de un rango.",
  },
  {
    formula: "=MIN(A1:A5)",
    description: "Devuelve el número más pequeño.",
  },
  {
    formula: "=MAX(A1:A5)",
    description: "Devuelve el número más grande.",
  },
  {
    formula: "=COUNT(A1:A5)",
    description: "Cuenta cuántos valores numéricos hay.",
  },
];

function SheetEditor({ note }) {
  const { updateSheetCell } = useNotesStore();
  const [activeCellId, setActiveCellId] = useState(null);
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);

  const rows = note.sheet?.rows || 20;
  const cols = note.sheet?.cols || 8;
  const cells = note.sheet?.cells || {};

  return (
    <div className="flex-1 min-h-0 rounded-2xl border border-warm-100 bg-cream-100 overflow-hidden">
      <div className="border-b border-warm-100 bg-cream-200 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-warm-600">Hoja de cálculo</p>
            <p className="text-xs text-warm-300">
              Escribe texto, números o fórmulas empezando por =
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream-100 border border-warm-100 px-3 py-1.5 text-xs text-warm-400">
              Ejemplo: =SUM(A1:A5)
            </span>

            <button
              type="button"
              onClick={() => setShowFormulaHelp((current) => !current)}
              className="rounded-full bg-warm-300 px-3 py-1.5 text-xs font-medium text-cream-300 hover:opacity-90"
            >
              {showFormulaHelp ? "Ocultar ayuda" : "Ver fórmulas"}
            </button>
          </div>
        </div>

        {showFormulaHelp && (
          <div className="mt-3 rounded-2xl border border-warm-100 bg-cream-100 p-3">
            <p className="text-xs text-warm-500 leading-relaxed">
              Para calcular algo, escribe una fórmula en una celda empezando por{" "}
              <span className="font-semibold text-warm-600">=</span>. Puedes
              usar celdas individuales como{" "}
              <span className="font-semibold text-warm-600">A1</span> o rangos
              como <span className="font-semibold text-warm-600">A1:A5</span>.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {FORMULA_EXAMPLES.map((example) => (
                <button
                  key={example.formula}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (!activeCellId) return;
                    updateSheetCell(note.id, activeCellId, example.formula);
                  }}
                  className="rounded-xl border border-warm-100 bg-cream-200 p-3 text-left hover:bg-cream-300"
                  title={
                    activeCellId
                      ? `Insertar en ${activeCellId}`
                      : "Selecciona una celda para insertar"
                  }
                >
                  <span className="block text-xs font-semibold text-warm-600">
                    {example.formula}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-warm-300">
                    {example.description}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-warm-300">
              Consejo: si seleccionas una celda y pulsas una fórmula de la lista,
              se insertará automáticamente en esa celda.
            </p>
          </div>
        )}
      </div>

      <div className="h-full overflow-auto">
        <table className="min-w-[760px] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 w-12 bg-cream-200 border-r border-b border-warm-100 text-xs text-warm-300 font-medium" />

              {Array.from({ length: cols }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="h-9 min-w-24 bg-cream-200 border-r border-b border-warm-100 text-xs text-warm-400 font-medium"
                >
                  {getColumnName(colIndex)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <th className="sticky left-0 z-10 w-12 bg-cream-200 border-r border-b border-warm-100 text-xs text-warm-300 font-medium">
                  {rowIndex + 1}
                </th>

                {Array.from({ length: cols }).map((__, colIndex) => {
                  const cellId = getCellId(rowIndex, colIndex);
                  const rawValue = cells[cellId] || "";
                  const visibleValue =
                    activeCellId === cellId
                      ? rawValue
                      : evaluateCellValue(cellId, cells);

                  return (
                    <td
                      key={cellId}
                      className="h-10 min-w-24 border-r border-b border-warm-100 bg-cream-100"
                    >
                      <input
                        value={visibleValue}
                        onFocus={() => setActiveCellId(cellId)}
                        onBlur={() => setActiveCellId(null)}
                        onChange={(event) =>
                          updateSheetCell(note.id, cellId, event.target.value)
                        }
                        className="w-full h-10 bg-transparent px-2 text-sm text-warm-500 outline-none focus:bg-cream-50 focus:ring-1 focus:ring-warm-300"
                        title={cellId}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SheetEditor;
