export const formatDate = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date

  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}