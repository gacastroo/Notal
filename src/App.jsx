import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'

const COMPACT_SIDEBAR_WIDTH = 72
const DEFAULT_SIDEBAR_WIDTH = 280
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 420

const getInitialSidebarMode = () => {
  return localStorage.getItem('notala-sidebar-mode') === 'compact'
    ? 'compact'
    : 'expanded'
}

const getInitialSidebarWidth = () => {
  const savedWidth = Number(localStorage.getItem('notala-sidebar-width'))

  if (
    Number.isFinite(savedWidth) &&
    savedWidth >= MIN_SIDEBAR_WIDTH &&
    savedWidth <= MAX_SIDEBAR_WIDTH
  ) {
    return savedWidth
  }

  return DEFAULT_SIDEBAR_WIDTH
}

function App() {
  const [sidebarMode, setSidebarMode] = useState(getInitialSidebarMode)
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('notala-sidebar-mode', sidebarMode)
  }, [sidebarMode])

  useEffect(() => {
    localStorage.setItem('notala-sidebar-width', String(sidebarWidth))
  }, [sidebarWidth])

  return (
    <div className="flex min-h-screen bg-cream-50 overflow-x-hidden">
      {!isMobileSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-cream-100 border border-warm-100 text-warm-500 shadow-sm flex items-center justify-center"
          title="Abrir notas"
        >
          <Menu size={18} />
        </button>
      )}

      <Sidebar
        mode={sidebarMode}
        width={sidebarWidth}
        compactWidth={COMPACT_SIDEBAR_WIDTH}
        minWidth={MIN_SIDEBAR_WIDTH}
        maxWidth={MAX_SIDEBAR_WIDTH}
        defaultWidth={DEFAULT_SIDEBAR_WIDTH}
        isMobileOpen={isMobileSidebarOpen}
        onResize={setSidebarWidth}
        onModeChange={setSidebarMode}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <Editor />
    </div>
  )
}

export default App