import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from "y-monaco"
import * as Y from 'yjs'
import { SocketIOProvider } from 'y-socket.io'

function App() {

  const editorRef = useRef(null)

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor
  }

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setUsername(e.target.username.value);
    window.history.pushState({}, "", "?username=" + e.target.username.value)
  }

  // show all user 
  const [user, setUser] = useState([])

  useEffect(() => {
    if (username && editorRef.current) {
      const provider = new SocketIOProvider("http://localhost:3000", "monaco", ydoc, {
        autoConnect: true
      })

      provider.awareness.setLocalStateField("user",{username})


      const states = Array.from(provider.awareness.getStates().values())
      setUser(states.filter(user => user && username).map(state=> state.user))


      provider.awareness.on("change", ()=>{ 
        const states = Array.from(provider.awareness.getStates().values())
        setUser(states.filter(user => user && user.username).map(state => state.user))
      })

      function handleBeforeUnload (){
        provider.awareness.setLocalStateField("user", null)
      }

      window.addEventListener("beforeUnload", handleBeforeUnload)

      const monacoBinding = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness
      )

      return ()=>{
        monacoBinding.destroy()
        provider.disconnect()
        window.addEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [editorRef.current, username])

  if (!username) {
    return (
      <main className='h-screen w-full bg-gray-900 flex gap-3 p-2 items-center justify-center'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input type="text" name="username" id="" placeholder='Enter username'
            className='p-2 rounded-lg bg-gray-800 text-white' />
          <button className='p-2 rounded-lg bg-amber-50 text-black'>
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <>
      <main className='h-screen w-full bg-gray-900 flex gap-3 p-2'>
        <aside className='h-full w-1/5 bg-neutral-800 rounded-lg'>

        <h2 className='text-2xl font-bold p-4 border-b border-gray-300'>user</h2>
        <ul className='p-4'>
          {user.map((user, index)=>(
            <li key={index} className='p-2 bg-gray-800 text-white mb-2 rounded-sm'>
              {user.username}
            </li>
          ))}
        </ul>
        </aside>

        <section className='w-3/3 bg-neutral-800 rounded-lg overflow-hidden'>
          <Editor
            height="100%"
            defaultLanguage='javascript'
            defaultValue='// some comment'
            theme='vs-dark'
            onMount={handleMount}
          >
          </Editor>
        </section>
      </main>
    </>
  )
}

export default App
