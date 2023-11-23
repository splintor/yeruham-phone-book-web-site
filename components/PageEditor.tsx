import React, { FormEvent, ReactElement, useEffect, useRef, useState } from 'react'
import 'quill/dist/quill.snow.css'
import { Quill } from 'quill'
import { useQuill } from 'react-quilljs'
import { useKeyPress } from '../hooks/useKeyPress'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { getAllTags } from '../utils/api'
import { publicTagName } from '../utils/consts'
import { htmlPrettify } from '../utils/html-prettify'
import { editedPageCacheKey, ToastOptions } from './App'
import { TagLink } from './TagLink'

// TODO: Learn how to show modal for various types of links (start point - https://github.com/zenoamaro/react-quill/issues/471 and https://stackoverflow.com/a/65663934/46635)

interface EditorProps {
  page: PageData
  onSave(pageData: PageData): Promise<void>
  onCancel(e: React.MouseEvent): void
  pushState(url: string, state: Partial<AppProps>): void
  setToast(toastOptions: ToastOptions): void
}

const editorFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'background', 'color',
]

const CustomToolbar = () =>
  <div id="toolbar">
    <span className="ql-formats">
      <select className="ql-header" defaultValue="">
        <option value="1">כותרת 1</option>
        <option value="2">כותרת 2</option>
        <option value="3">כותרת 3</option>
        <option value="">טקסט</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered"/>
      <button className="ql-list" value="bullet"/>
      <button className="ql-bold" />
    </span>
    <span className="ql-formats">
      <select className="ql-color" />
    </span>
    <span className="ql-formats">
      <select className="ql-background" />
    </span>
    <span className="ql-formats">
      <button className="ql-mobile" title="הוסף מספר נייד">
        <div className="unicode-icon">&#128241;</div>
      </button>
      <button className="ql-phone" title="הוסף מספר טלפון">
        <div className="unicode-icon">&#128222;</div>
      </button>
      <button className="ql-email" title="הוסף כתובת מייל">
        <div className="unicode-icon">&#64;</div>
      </button>
    </span>
    <span className="ql-formats">
      <button className="ql-link"/>
    </span>
    <span className="ql-formats">
      <button className="ql-instagram" title="הוסף קישור לאינסטגרם">
        <img src="/instagram.jpg" alt="Instagram icon"/>
      </button>
      <button className="ql-twitter" title="הוסף קישור לטוויטר">
        <img src="/twitter.png" alt="Twitter icon"/>
      </button>
      <button className="ql-facebook" title="הוסף קישור לפייסבוק">
        <img src="/facebook.png" alt="Facebook Icon"/>
      </button>
    </span>
    <span className="ql-formats">
      <button className="ql-viewSource" title="עריכת קוד מקור">
        <svg viewBox="0 0 18 18">
          <polyline className="ql-even ql-stroke" points="5 7 3 9 5 11"/>
          <polyline className="ql-even ql-stroke" points="13 7 15 9 13 11"/>
          <line className="ql-stroke" x1="10" x2="8" y1="5" y2="13"/>
        </svg>
      </button>
    </span>
  </div>

const detailsPromptText = {
  Email: 'הכנס כתובת מייל:',
  Phone: 'הכנס מספר טלפון:',
  Mobile: 'הכנס מספר נייד:',
} as const

const detailsPrefix = {
  Email: 'email: ',
  Phone: 'טלפון: ',
  Mobile: 'נייד: ',
} as const

function getDetailsPrefix(action: keyof typeof detailsPromptText, title: string, quill: Quill): string {
  if (action === 'Mobile') {
    const titleWords = title.split(' ')
    if (titleWords.length === 3 && titleWords[1].startsWith('ו')) {
      return (quill.getText().includes(titleWords[0] + ':') ? titleWords[1].substring(1) : titleWords[0]) + ': '
    }
  }

  return detailsPrefix[action]
}

const sanitizeMail = (email: string): string => {
  if (!email.includes('@')) {
    throw email + ' לא נראה כמו כתובת אימייל תקינה.'
  }
  return email.replace(/^mailto:/, '').trim()
}

const sanitizePhone = (phone: string): string => {
  if (!phone.match(/^[\d-+*\s\u2066\u2069\u200e\u200f]+$/)) {
    throw phone + ' לא נראה כמו מספר טלפון תקין.'
  }
  return phone
    .replace(/[-\s\u2066\u2069\u200e\u200f]/g, '')
    .replace(/^\+972/, '')
    .replace(/^([1-9])/, '0$1')
}

const detailsSanitation = {
  Email: sanitizeMail,
  Phone: sanitizePhone,
  Mobile: sanitizePhone,
}

export default function PageEditor({ page, onCancel, onSave, pushState, setToast }: EditorProps): ReactElement {
  const initialPage = JSON.parse(localStorage.getItem(editedPageCacheKey(page.title)) || null) as PageData || page
  const [title, setTitle] = useState(initialPage.title)
  const [tags, setTags] = useState(initialPage.tags)
  const [newTag, setNewTag] = useState('')
  const [editorValue, setEditorValue] = useState(initialPage.html)
  const [viewSource, setViewSource] = useState(false)
  const [viewSourceLTR, setViewSourceLTR] = useState(true)
  const [editedSource, setEditedSource] = useState(editorValue)
  const [isSaving, setIsSaving] = useState(false)
  const [allTags, setAllTags] = useState<string[]>()
  const quillObj = useRef<Quill>()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const sPressed = useKeyPress('s')
  const enterPressed = useKeyPress('Enter')

  if (sPressed && (sPressed.ctrlKey || sPressed.metaKey)) {
    sPressed.preventDefault()
  } else if (enterPressed && (enterPressed.ctrlKey || enterPressed.metaKey)) {
    enterPressed.preventDefault()
  }

  useEffect(() => {
    if (sPressed && (sPressed.ctrlKey || sPressed.metaKey)) {
      void save(sPressed)
    } else if (enterPressed && (enterPressed.ctrlKey || enterPressed.metaKey)) {
      void save(enterPressed)
    }
  }, [sPressed, enterPressed])

  const detailsHandler = (action: keyof typeof detailsPromptText) => {
    const quill = quillObj.current
    const range = quill.getSelection(true)
    let value = prompt(detailsPromptText[action])
    if (!value) {
      return
    }

    const sanitize = detailsSanitation[action]
    try {
      value = sanitize(value)
    } catch(e) {
      setToast({ content: e, type: 'fail', position: 'bottom' })
      return
    }
    const prefix = getDetailsPrefix(action, titleInputRef.current?.value, quill)
    const text = prefix + value + '\n\n'

    if (action === 'Email') {
      quill.insertText(range.index, text, 'link', `mailto:${value}`, 'user')
    } else {
      quill.insertText(range.index, text, 'user')
    }
    quill.setSelection(range.index + text.length, 0, 'user')
  }

  const addSocialNetworkIcon = (imageSrc: string) => {
    const quill = quillObj.current
    const range = quill.getSelection(true)
    quill.insertEmbed(range.index, 'image', imageSrc, 'user')
    quill.setSelection(range.index, 1, 'user')
    quill.theme.tooltip.edit('link', '}קישור לפרופיל{')
  }

  // noinspection JSUnusedGlobalSymbols
  const editorModules = {
    toolbar: {
      container: "#toolbar",
      handlers: {
        facebook: () => addSocialNetworkIcon('/facebook.png'),
        twitter: () => addSocialNetworkIcon('/twitter.png'),
        instagram: () => addSocialNetworkIcon('/instagram.jpg'),
        phone: () => detailsHandler('Phone'),
        mobile: () => detailsHandler('Mobile'),
        email: () => detailsHandler('Email'),
        viewSource: () => setViewSource(true),
      }
    },
  }

  const { Quill, quill, quillRef } = useQuill({ theme: 'snow', modules: editorModules, formats: editorFormats })

  useEffect(() => {
    if (!quill) {
      return
    }
    window['quill'] = quill
    const LinkBlot = Quill.import('formats/link')

    class MyLink extends LinkBlot {
      static create(value) {
        const node = super.create(value)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value = (this as any).sanitize(value)
        node.setAttribute('href', value.replace(location.origin, ''))
        node.removeAttribute('target')
        return node
      }
    }

    Quill.register(MyLink)

    quill.on('selection-change', (range, oldRange, source) => {
      if (range?.length === 1 && source === 'user') {
        const [link, offset] = quill.scroll.descendant(LinkBlot, range.index)
        if (link && link.children.head?.domNode.tagName === 'IMG') {
          const { tooltip } = quill.theme
          const preview = LinkBlot.formats(link.domNode)
          tooltip.preview.textContent = preview
          tooltip.preview.setAttribute('href', preview)
          tooltip.show()
          tooltip.position(quill.getBounds(range.index - offset, range.length))
        }
      }
    })

    quill.clipboard.dangerouslyPasteHTML(editorValue)
    quill.on('text-change', () => {
      setEditorValue(quill.root.innerHTML)
      setEditedSource(quill.root.innerHTML)
    })
    quillObj.current = quill
  }, [quill])

  const htmlToSave = viewSource ? editedSource : editorValue
  const getDataToSave = () => ({ ...page, title: title.trim(), html: htmlToSave.trim(), tags })

  async function save(event: Event | React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    try {
      const tagsWereUpdated = page.tags !== tags
      setIsSaving(true)
      await onSave(getDataToSave())
      if (tagsWereUpdated) {
        await getAllTags(true)
      }
    }
    finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (title) {
      localStorage.setItem(editedPageCacheKey(page.title), JSON.stringify(getDataToSave()))
    }
  }, [title, tags, htmlToSave])

  const removeTag = (tag: string) => {
    const filterTags = tags.filter(t => t !== tag)
    setTags(filterTags.length === 0 ? null : filterTags)
  }

  const addTag = tag => {
    if (!tags?.includes(tag)) {
      const newTags = [...(tags || []), tag]
      const newTagsWithoutPublic = newTags.filter(t => t !== publicTagName)
      setTags(newTagsWithoutPublic.length < newTags.length ? [...newTagsWithoutPublic, publicTagName] : newTags)
    }
  }

  function addNewTag() {
    if (newTag) {
      addTag(newTag)
      setNewTag('')
    }
  }

  useEffect(() => void getAllTags().then(setAllTags), [])

  useEffect(() => {
    setTimeout(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }, 10)
  }, [titleInputRef])

  return <div className="results page-editor m-1">
    <form className="row g-1 mb-1">
      <span className="col-auto flex-grow-1">
        <input className="form-control" value={title} onChange={e => setTitle(e.target.value.replace(/\//g, '-'))} ref={titleInputRef}/>
      </span>
      <span className="col-auto">
        <button className="btn btn-primary me-1" onClick={save} disabled={!title.trim() || !htmlToSave.trim()}>
          {isSaving ? 'שומר...' : 'שמירה'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
      </span>
    </form>
    {viewSource &&
      <div className="viewSource-container">
        <div className="mt-2">
          <button className="btn btn-outline-primary me-2"
                  onClick={() => setViewSourceLTR(!viewSourceLTR)}>
            {viewSourceLTR ? <svg viewBox="0 0 18 18" width="24px">
              <polygon className="ql-stroke ql-fill" points="3 11 5 9 3 7 3 11"/>
              <line className="ql-stroke ql-fill" x1="15" x2="11" y1="4" y2="4"/>
              <path className="ql-fill" d="M11,3a3,3,0,0,0,0,6h1V3H11Z"/>
              <rect className="ql-fill" height="11" width="1" x="11" y="4"/>
              <rect className="ql-fill" height="11" width="1" x="13" y="4"/>
            </svg> : <svg viewBox="0 0 18 18" width="24px">
              <polygon className="ql-stroke ql-fill" points="15 12 13 10 15 8 15 12"/>
              <line className="ql-stroke ql-fill" x1="9" x2="5" y1="4" y2="4"/>
              <path className="ql-fill" d="M5,3A3,3,0,0,0,5,9H6V3H5Z"/>
              <rect className="ql-fill" height="11" width="1" x="5" y="4"/>
              <rect className="ql-fill" height="11" width="1" x="7" y="4"/>
            </svg>}
          </button>
          <button className="btn btn-outline-primary" onClick={() => {
            setEditorValue(editedSource)
            quill.clipboard.dangerouslyPasteHTML(editedSource)
            setViewSource(false)
          }}>חזרה לעורך</button>
        </div>
        <pre contentEditable suppressContentEditableWarning className={`viewSource ${viewSourceLTR ? 'ltr' : 'rtl'}`} onInput={(event: FormEvent) => setEditedSource((event.target as HTMLElement).innerText)}>{htmlPrettify(editorValue)}</pre>
      </div>}
    <div className="editor-container" onClick={e => setTimeout(() => (e.target as HTMLElement)?.querySelector<HTMLElement>('[contenteditable]')?.focus(), 0)}>
      <CustomToolbar/>
      <div ref={quillRef} />
    </div>
    <div className="d-flex align-items-center flex-wrap mt-2">
      {tags?.map(t => <TagLink key={t} tag={t} pushState={pushState} removeTag={removeTag} target="_blank" kind="small"/>)}

      <div className="dropdown">
      <a className="btn badge rounded-pill mb-2 me-1 text-decoration-none bg-light border border-secondary link-secondary dropdown-toggle" data-bs-toggle="dropdown" href="#">+ הוסף קטגוריה</a>
      <ul className="dropdown-menu border border-primary px-2">
        {allTags ? allTags.filter(t => !tags?.includes(t)).map(t =>
          <li key={t}><TagLink key={t} tag={t} pushState={pushState} kind="small" onClick={addTag}/></li>
        ) : <li className="link-secondary"><span className="spinner-border spinner-border-sm me-2"/>טוען...</li>}
        <div className="d-flex">
          <input value={newTag} onChange={e=>setNewTag(e.target.value)}/>
          <button className="btn btn-secondary" disabled={!newTag.trim()} onClick={addNewTag}>הוסף</button>
        </div>
      </ul>
        </div>
    </div>
  </div>
}
