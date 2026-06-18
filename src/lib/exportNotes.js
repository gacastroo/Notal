const sanitizeFilename = (value) => {
  return String(value || 'nota')
    .trim()
    .toLowerCase()
    .replace(/[^\wáéíóúüñç\s-]/gi, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'nota'
}

const formatDate = (date) => {
  if (!date) return ''

  try {
    return new Date(date).toLocaleString()
  } catch {
    return ''
  }
}

const downloadTextFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], {
    type,
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const escapeHtml = (value) => {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const renderInlineMarkdown = (text) => {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

const markdownToHtml = (markdown) => {
  const lines = String(markdown || '').split('\n')

  return lines
    .map((line) => {
      const trimmed = line.trim()

      if (!trimmed) return '<br />'

      if (trimmed === '---') {
        return '<hr />'
      }

      if (trimmed.startsWith('# ')) {
        return `<h1>${renderInlineMarkdown(trimmed.replace('# ', ''))}</h1>`
      }

      if (trimmed.startsWith('## ')) {
        return `<h2>${renderInlineMarkdown(trimmed.replace('## ', ''))}</h2>`
      }

      if (trimmed.startsWith('> ')) {
        return `<blockquote>${renderInlineMarkdown(
          trimmed.replace('> ', '')
        )}</blockquote>`
      }

      if (trimmed.startsWith('- ')) {
        return `<ul><li>${renderInlineMarkdown(
          trimmed.replace('- ', '')
        )}</li></ul>`
      }

      if (/^\d+\.\s/.test(trimmed)) {
        return `<ol><li>${renderInlineMarkdown(
          trimmed.replace(/^\d+\.\s/, '')
        )}</li></ol>`
      }

      return `<p>${renderInlineMarkdown(trimmed)}</p>`
    })
    .join('\n')
}

const noteToMarkdown = (note) => {
  const title = note.title?.trim() || 'Sin título'
  const content = note.content?.trim() || ''
  const tags = Array.isArray(note.tags) ? note.tags : []

  return `# ${title}

${tags.length > 0 ? `Etiquetas: ${tags.map((tag) => `#${tag}`).join(' ')}\n` : ''}${
    note.createdAt ? `Creada: ${formatDate(note.createdAt)}\n` : ''
  }${note.updatedAt ? `Actualizada: ${formatDate(note.updatedAt)}\n` : ''}

---

${content}
`
}

const notesToMarkdown = (notes) => {
  return notes
    .map((note, index) => {
      const separator = index === 0 ? '' : '\n\n---\n\n'
      return `${separator}${noteToMarkdown(note)}`
    })
    .join('')
}

const openPrintableDocument = (title, htmlContent) => {
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    alert('El navegador ha bloqueado la ventana de impresión.')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #3f3328;
            background: #ffffff;
            padding: 48px;
            line-height: 1.6;
          }

          article {
            max-width: 800px;
            margin: 0 auto;
            page-break-after: always;
          }

          article:last-child {
            page-break-after: auto;
          }

          h1 {
            font-size: 28px;
            margin-bottom: 12px;
          }

          h2 {
            font-size: 22px;
            margin-top: 28px;
          }

          p {
            font-size: 14px;
            margin: 8px 0;
          }

          ul, ol {
            margin-top: 8px;
            margin-bottom: 8px;
          }

          blockquote {
            border-left: 4px solid #d6c3b3;
            padding-left: 12px;
            color: #6f5a47;
            font-style: italic;
          }

          hr {
            border: none;
            border-top: 1px solid #e5d8cc;
            margin: 24px 0;
          }

          .meta {
            font-size: 12px;
            color: #8a7461;
            margin-bottom: 24px;
          }

          .tags {
            font-size: 12px;
            color: #8a7461;
            margin-bottom: 8px;
          }

          @media print {
            body {
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}

const noteToPrintableHtml = (note) => {
  const title = note.title?.trim() || 'Sin título'
  const tags = Array.isArray(note.tags) ? note.tags : []

  return `
    <article>
      <h1>${escapeHtml(title)}</h1>

      ${
        tags.length > 0
          ? `<div class="tags">${tags
              .map((tag) => `#${escapeHtml(tag)}`)
              .join(' ')}</div>`
          : ''
      }

      <div class="meta">
        ${
          note.createdAt
            ? `<div>Creada: ${escapeHtml(formatDate(note.createdAt))}</div>`
            : ''
        }
        ${
          note.updatedAt
            ? `<div>Actualizada: ${escapeHtml(formatDate(note.updatedAt))}</div>`
            : ''
        }
      </div>

      ${markdownToHtml(note.content)}
    </article>
  `
}

export const exportNoteToMarkdown = (note) => {
  const filename = `${sanitizeFilename(note.title || 'nota')}.md`
  downloadTextFile(noteToMarkdown(note), filename, 'text/markdown')
}

export const exportSheetToCsv = (note) => {
  const filename = `${sanitizeFilename(note.title || 'hoja')}.csv`
  downloadTextFile(sheetToCsv(note), filename, 'text/csv;charset=utf-8')
}

export const exportSheetToXlsx = (note) => {
  const filename = `${sanitizeFilename(note.title || 'hoja')}.xlsx`
  downloadBlob(sheetToXlsxBlob(note), filename)
}

export const exportNotesToMarkdown = (notes) => {
  const filename = `notala-notas-${new Date().toISOString().slice(0, 10)}.md`
  downloadTextFile(notesToMarkdown(notes), filename, 'text/markdown')
}

export const exportNoteToPdf = (note) => {
  const title = note.title?.trim() || 'Nota de Notala'
  openPrintableDocument(title, noteToPrintableHtml(note))
}

export const exportNotesToPdf = (notes) => {
  const html = notes.map(noteToPrintableHtml).join('')
  openPrintableDocument('Notas de Notala', html)
}

const getColumnName = (index) => {
  let name = ''
  let current = index + 1

  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }

  return name
}

const getColumnIndex = (columnName) => {
  return (
    String(columnName)
      .split('')
      .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1
  )
}

const getCellId = (rowIndex, colIndex) => {
  return `${getColumnName(colIndex)}${rowIndex + 1}`
}

const getRangeCellIds = (range) => {
  const match = String(range)
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)

  if (!match) return []

  const [, startColumnName, startRow, endColumnName, endRow] = match
  const startCol = getColumnIndex(startColumnName)
  const endCol = getColumnIndex(endColumnName)
  const startRowIndex = Number(startRow) - 1
  const endRowIndex = Number(endRow) - 1
  const ids = []

  for (
    let row = Math.min(startRowIndex, endRowIndex);
    row <= Math.max(startRowIndex, endRowIndex);
    row += 1
  ) {
    for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col += 1) {
      ids.push(getCellId(row, col))
    }
  }

  return ids
}

const formatSheetResult = (value) => {
  if (typeof value !== 'number') return value
  if (Number.isInteger(value)) return String(value)

  return String(Number(value.toFixed(4)))
}

const evaluateSheetCellValue = (cellId, cells, visitedCells = new Set()) => {
  const cleanCellId = String(cellId).toUpperCase()

  if (visitedCells.has(cleanCellId)) return '#CIRC'

  visitedCells.add(cleanCellId)

  const rawValue = String(cells[cleanCellId] ?? '')

  if (!rawValue.startsWith('=')) return rawValue

  const formula = rawValue.slice(1).trim()

  if (!formula) return ''

  const functionResult = evaluateSheetFunctionFormula(formula, cells, visitedCells)

  if (functionResult !== null) {
    return formatSheetResult(functionResult)
  }

  return formatSheetResult(evaluateSheetMathFormula(formula, cells, visitedCells))
}

const getSheetCellValueAsNumber = (cellId, cells, visitedCells = new Set()) => {
  const value = evaluateSheetCellValue(cellId, cells, visitedCells)
  const number = Number(String(value).replace(',', '.'))

  return Number.isFinite(number) ? number : 0
}

const getSheetFormulaValues = (formulaContent, cells, visitedCells) => {
  return formulaContent.split(/[;,]/).flatMap((part) => {
    const cleanPart = part.trim().toUpperCase()
    const rangeCellIds = getRangeCellIds(cleanPart)

    if (rangeCellIds.length > 0) {
      return rangeCellIds.map((cellId) =>
        getSheetCellValueAsNumber(cellId, cells, new Set(visitedCells))
      )
    }

    if (/^[A-Z]+\d+$/.test(cleanPart)) {
      return [getSheetCellValueAsNumber(cleanPart, cells, new Set(visitedCells))]
    }

    const number = Number(cleanPart.replace(',', '.'))
    return Number.isFinite(number) ? [number] : []
  })
}

function evaluateSheetFunctionFormula(formula, cells, visitedCells) {
  const match = formula.match(/^(SUM|AVG|MIN|MAX|COUNT)\((.*)\)$/i)

  if (!match) return null

  const [, functionName, formulaContent] = match
  const values = getSheetFormulaValues(formulaContent, cells, visitedCells)

  if (values.length === 0) return ''

  if (functionName.toUpperCase() === 'SUM') {
    return values.reduce((total, value) => total + value, 0)
  }

  if (functionName.toUpperCase() === 'AVG') {
    return values.reduce((total, value) => total + value, 0) / values.length
  }

  if (functionName.toUpperCase() === 'MIN') {
    return Math.min(...values)
  }

  if (functionName.toUpperCase() === 'MAX') {
    return Math.max(...values)
  }

  if (functionName.toUpperCase() === 'COUNT') {
    return values.filter((value) => Number.isFinite(value)).length
  }

  return null
}

function evaluateSheetMathFormula(formula, cells, visitedCells) {
  const expression = formula.replace(/[A-Z]+\d+/gi, (cellId) => {
    return String(
      getSheetCellValueAsNumber(cellId.toUpperCase(), cells, new Set(visitedCells))
    )
  })

  if (!/^[\d+\-*/().\s,]+$/.test(expression)) return '#ERROR'

  try {
    const result = Function(`"use strict"; return (${expression.replaceAll(',', '.')})`)()

    if (!Number.isFinite(result)) return '#ERROR'

    return result
  } catch {
    return '#ERROR'
  }
}

const csvEscape = (value) => {
  const text = String(value ?? '')

  if (/[",\n\r;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

const sheetToCsv = (note) => {
  const rows = note.sheet?.rows || 20
  const cols = note.sheet?.cols || 8
  const cells = note.sheet?.cells || {}

  return Array.from({ length: rows })
    .map((_, rowIndex) =>
      Array.from({ length: cols })
        .map((__, colIndex) => {
          const cellId = getCellId(rowIndex, colIndex)
          return csvEscape(evaluateSheetCellValue(cellId, cells))
        })
        .join(',')
    )
    .join('\n')
}

const xmlEscape = (value) => {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const normalizeFormulaForExcel = (formula) => {
  return String(formula)
    .replace(/^=/, '')
    .replace(/\bAVG\s*\(/gi, 'AVERAGE(')
    .replaceAll(';', ',')
}

const sheetToWorksheetXml = (note) => {
  const rows = note.sheet?.rows || 20
  const cols = note.sheet?.cols || 8
  const cells = note.sheet?.cells || {}
  const lastCell = getCellId(rows - 1, cols - 1)
  const colWidthXml = `<cols><col min="1" max="${cols}" width="16" customWidth="1"/></cols>`
  const rowXml = []

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const cellXml = []

    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const cellId = getCellId(rowIndex, colIndex)
      const rawValue = String(cells[cellId] ?? '')

      if (!rawValue) continue

      if (rawValue.startsWith('=')) {
        cellXml.push(
          `<c r="${cellId}"><f>${xmlEscape(normalizeFormulaForExcel(rawValue))}</f></c>`
        )
        continue
      }

      const numericValue = Number(rawValue.replace(',', '.'))

      if (Number.isFinite(numericValue)) {
        cellXml.push(`<c r="${cellId}"><v>${numericValue}</v></c>`)
        continue
      }

      cellXml.push(
        `<c r="${cellId}" t="inlineStr"><is><t>${xmlEscape(rawValue)}</t></is></c>`
      )
    }

    if (cellXml.length > 0) {
      rowXml.push(`<row r="${rowIndex + 1}">${cellXml.join('')}</row>`)
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  ${colWidthXml}
  <sheetData>${rowXml.join('')}</sheetData>
</worksheet>`
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let current = index

  for (let bit = 0; bit < 8; bit += 1) {
    current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1
  }

  return current >>> 0
})

const crc32 = (bytes) => {
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

const writeUint16 = (bytes, value) => {
  bytes.push(value & 0xff, (value >>> 8) & 0xff)
}

const writeUint32 = (bytes, value) => {
  bytes.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  )
}

const createZip = (files) => {
  const encoder = new TextEncoder()
  const bytes = []
  const centralDirectory = []

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name)
    const contentBytes = encoder.encode(file.content)
    const fileCrc = crc32(contentBytes)
    const localHeaderOffset = bytes.length

    writeUint32(bytes, 0x04034b50)
    writeUint16(bytes, 20)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint32(bytes, fileCrc)
    writeUint32(bytes, contentBytes.length)
    writeUint32(bytes, contentBytes.length)
    writeUint16(bytes, nameBytes.length)
    writeUint16(bytes, 0)
    bytes.push(...nameBytes, ...contentBytes)

    writeUint32(centralDirectory, 0x02014b50)
    writeUint16(centralDirectory, 20)
    writeUint16(centralDirectory, 20)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint32(centralDirectory, fileCrc)
    writeUint32(centralDirectory, contentBytes.length)
    writeUint32(centralDirectory, contentBytes.length)
    writeUint16(centralDirectory, nameBytes.length)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint32(centralDirectory, 0)
    writeUint32(centralDirectory, localHeaderOffset)
    centralDirectory.push(...nameBytes)
  })

  const centralDirectoryOffset = bytes.length
  bytes.push(...centralDirectory)

  writeUint32(bytes, 0x06054b50)
  writeUint16(bytes, 0)
  writeUint16(bytes, 0)
  writeUint16(bytes, files.length)
  writeUint16(bytes, files.length)
  writeUint32(bytes, centralDirectory.length)
  writeUint32(bytes, centralDirectoryOffset)
  writeUint16(bytes, 0)

  return new Uint8Array(bytes)
}

const sheetToXlsxBlob = (note) => {
  const worksheetXml = sheetToWorksheetXml(note)
  const title = xmlEscape(note.title?.trim() || 'Hoja')

  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${title.slice(0, 31) || 'Hoja'}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheetXml,
    },
    {
      name: 'docProps/core.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>${title}</dc:title>
</cp:coreProperties>`,
    },
    {
      name: 'docProps/app.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Notala</Application>
</Properties>`,
    },
  ]

  const zipBytes = createZip(files)

  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
