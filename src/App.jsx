import Sidebar from './components/Sidebar'
import Editor from './components/Editor'

function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Editor />
    </div>
  )
}

export default App