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