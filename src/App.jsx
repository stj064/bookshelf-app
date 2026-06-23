import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from './supabase'

const ACCENT = '#a86b4c'

const STATUS_OPTIONS = [
  { value: 'want', label: '読みたい' },
  { value: 'reading', label: '読んでいる' },
  { value: 'done', label: '読了' },
]

const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'want', label: '読みたい' },
  { value: 'reading', label: '読んでいる' },
  { value: 'done', label: '読了' },
]

function App() {
  const [books, setBooks] = useState([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [filter, setFilter] = useState('all')
  const [addHover, setAddHover] = useState(false)
  const [snackbar, setSnackbar] = useState({ message: '', tone: 'neutral', visible: false, key: 0 })
  const snackbarTimer = useRef(null)

  const showSnackbar = (message, tone = 'neutral') => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current)
    setSnackbar(s => ({ message, tone, visible: true, key: s.key + 1 }))
    snackbarTimer.current = setTimeout(() => {
      setSnackbar(s => ({ ...s, visible: false }))
    }, 5000)
  }

  useEffect(() => { fetchBooks() }, [])

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    setBooks(data)
  }

  const addBook = async () => {
    const bookTitle = title.trim()
    if (!bookTitle) return
    const { error } = await supabase
      .from('books')
      .insert({ title: bookTitle, author: author.trim() || '著者不明', status: 'want' })
    if (error) { console.error(error); return }
    setTitle('')
    setAuthor('')
    fetchBooks()
    showSnackbar(`「${bookTitle}」を本棚に追加しました`, 'add')
  }

  const updateStatus = async (id, status) => {
    const book = books.find(b => b.id === id)
    const statusLabel = STATUS_OPTIONS.find(o => o.value === status)?.label ?? status
    const { error } = await supabase.from('books').update({ status }).eq('id', id)
    if (error) { console.error(error); return }
    fetchBooks()
    showSnackbar(`「${book?.title ?? ''}」を「${statusLabel}」に変更しました`, 'neutral')
  }

  const deleteBook = async (id) => {
    const book = books.find(b => b.id === id)
    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) { console.error(error); return }
    fetchBooks()
    showSnackbar(`「${book?.title ?? ''}」を削除しました`, 'delete')
  }

  const filteredBooks = filter === 'all' ? books : books.filter(b => b.status === filter)

  const counts = {
    all: books.length,
    want: books.filter(b => b.status === 'want').length,
    reading: books.filter(b => b.status === 'reading').length,
    done: books.filter(b => b.status === 'done').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f4f0', fontFamily: "'Noto Sans JP', sans-serif", color: '#2b2723', padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
      <Snackbar message={snackbar.message} tone={snackbar.tone} visible={snackbar.visible} animKey={snackbar.key} />
      <div style={{ width: '100%', maxWidth: '720px' }}>

        <header style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: '10px' }}>My Library</div>
          <h1 style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1.15, margin: '0 0 6px', color: '#221f1b' }}>本棚</h1>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#8a847b' }}>読みたい本も、読み終えた本も。静かに並べておく場所。</p>
        </header>

        <section style={{ background: '#ffffff', border: '1px solid #ebe7e0', borderRadius: '4px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <input
              type="text"
              placeholder="タイトル"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ flex: '2 1 220px', minWidth: '160px', height: '46px', padding: '0 14px', fontFamily: "'Noto Sans JP', sans-serif", fontSize: '14px', color: '#2b2723', background: '#faf9f6', border: '1px solid #e6e1d9', borderRadius: '3px' }}
            />
            <input
              type="text"
              placeholder="著者"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              style={{ flex: '1 1 140px', minWidth: '120px', height: '46px', padding: '0 14px', fontFamily: "'Noto Sans JP', sans-serif", fontSize: '14px', color: '#2b2723', background: '#faf9f6', border: '1px solid #e6e1d9', borderRadius: '3px' }}
            />
            <button
              onClick={addBook}
              onMouseEnter={() => setAddHover(true)}
              onMouseLeave={() => setAddHover(false)}
              style={{ flexShrink: 0, height: '46px', padding: '0 26px', fontFamily: "'Noto Sans JP', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', background: ACCENT, filter: addHover ? 'brightness(0.92)' : 'none', transition: 'filter .15s' }}
            >追加</button>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 14px', borderRadius: '3px', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif", fontSize: '13px', fontWeight: 500, transition: 'all .15s',
                  border: active ? `1px solid ${ACCENT}` : '1px solid #e6e1d9',
                  background: active ? ACCENT : '#fff',
                  color: active ? '#fff' : '#6f6961',
                }}
              >
                <span>{f.label}</span>
                <span style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums', padding: '1px 6px', borderRadius: '20px', background: active ? 'rgba(255,255,255,0.22)' : '#f1ede6', color: active ? '#fff' : '#a39c91' }}>
                  {counts[f.value]}
                </span>
              </button>
            )
          })}
        </div>

        <main>
          {filteredBooks.length === 0 && (
            <div style={{ padding: '64px 24px', textAlign: 'center', border: '1px dashed #e2ddd4', borderRadius: '4px', color: '#a8a298', fontSize: '14px', lineHeight: 1.8 }}>
              まだ本がありません。<br />上のフォームから一冊追加してみましょう。
            </div>
          )}
          {filteredBooks.map(book => (
            <BookRow
              key={book.id}
              book={book}
              onStatusChange={status => updateStatus(book.id, status)}
              onDelete={() => deleteBook(book.id)}
            />
          ))}
        </main>

        <footer style={{ marginTop: '36px', fontSize: '12px', color: '#b0a99e', textAlign: 'right' }}>
          全 {books.length} 冊
        </footer>

      </div>
    </div>
  )
}

const TONE_COLORS = { add: ACCENT, delete: '#b06a4c', neutral: '#7a7468' }

function Snackbar({ message, tone, visible, animKey }) {
  const dotColor = TONE_COLORS[tone] ?? TONE_COLORS.neutral
  return (
    <div style={{
      position: 'fixed', top: '24px', left: 0, right: 0, zIndex: 50,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div
        key={animKey}
        style={{
          pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: '11px',
          maxWidth: '440px', padding: '13px 20px',
          background: '#2b2723', color: '#f4f1ec',
          fontFamily: "'Noto Sans JP', sans-serif", fontSize: '13.5px', fontWeight: 500,
          borderRadius: '8px', boxShadow: '0 8px 28px rgba(43,39,35,0.22)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: visible ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
          animation: visible ? 'snackIn 0.2s ease' : 'none',
        }}
      >
        <span style={{ flexShrink: 0, width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
        <span style={{ flex: '1 1 auto' }}>{message}</span>
      </div>
    </div>
  )
}

function BookRow({ book, onStatusChange, onDelete }) {
  const [deleteHover, setDeleteHover] = useState(false)
  const dateStr = book.created_at ? format(new Date(book.created_at), 'yyyy.MM.dd') : ''

  return (
    <article style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '13px 4px', borderBottom: '1px solid #ebe7e0' }}>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 500, fontSize: '17px', lineHeight: 1.35, color: '#221f1b', marginBottom: '3px' }}>
          {book.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: '#8a847b' }}>
          <span>{book.author}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d4cec4', flexShrink: 0 }} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{dateStr}</span>
        </div>
      </div>
      <span style={{ flexShrink: 0, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={book.status}
          onChange={e => onStatusChange(e.target.value)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif", fontSize: '13px', color: '#4a453e', padding: '4px 20px 4px 6px' }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '9px', lineHeight: 1, color: '#9b948a' }}>▼</span>
      </span>
      <button
        onClick={onDelete}
        onMouseEnter={() => setDeleteHover(true)}
        onMouseLeave={() => setDeleteHover(false)}
        title="削除"
        style={{ flexShrink: 0, width: '34px', height: '34px', border: 'none', background: deleteHover ? '#f6efe9' : 'transparent', color: deleteHover ? '#b06a4c' : '#c2bbb0', fontSize: '18px', lineHeight: 1, borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
      >×</button>
    </article>
  )
}

export default App
