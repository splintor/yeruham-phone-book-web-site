import React, { FormEvent, ReactElement, useEffect, useRef, useState } from 'react'
import 'quill/dist/quill.snow.css'
import { Quill } from 'quill'
import { useQuill } from 'react-quilljs'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { getAllTags } from '../utils/api'
import { publicTagName } from '../utils/consts'
import { htmlPrettify } from '../utils/html-prettify'
import { TagLink } from './TagLink'

// TODO: Add SO answer to https://stackoverflow.com/q/58943180/46635 (based on https://codepen.io/alexkrolick/pen/gmroPj?editors=0010 or https://codesandbox.io/s/6x93pk4rp3?file=/index.js)
// TODO: Learn how to show modal for various types of links (start point - https://github.com/zenoamaro/react-quill/issues/471 and https://stackoverflow.com/a/65663934/46635)

interface EditorProps {
  page: PageData
  onSave(pageData: PageData): Promise<void>
  onCancel(): void
  pushState(url: string, state: Partial<AppProps>)
}

const editorFormats = [
  'header', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image'
]

const CustomToolbar = () => (
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
      <select className="ql-size" defaultValue="">
        <option value="small">קטן</option>
        <option value="">רגיל</option>
        <option value="large">גדול</option>
        <option value="huge">ענק</option>
      </select>
    </span>
    <span className="ql-formats">
      <select className="ql-align" />
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered"/>
      <button className="ql-list" value="bullet"/>
    </span>
    <span className="ql-formats">
      <select className="ql-color" />
    </span>
    <span className="ql-formats">
      <select className="ql-background" />
    </span>
    <span className="ql-formats">
      <select className="ql-custom links">
        <option value="insertPhonebookLink">הוסף קישור לדף בספר הטלפונים</option>
        <option value="insertFacebookLink">הוסף קישור לפייסבוק</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-viewSource">&lt;קוד מקור&gt;</button>
    </span>
  </div>
)

export default function PageEditor({ page, onCancel, onSave, pushState }: EditorProps): ReactElement {
  const [title, setTitle] = useState(page.title)
  const [tags, setTags] = useState(page.tags)
  const [newTag, setNewTag] = useState('')
  const [editorValue, setEditorValue] = useState(page.html)
  const [viewSource, setViewSource] = useState(false)
  const [editedSource, setEditedSource] = useState(editorValue)
  const [isSaving, setIsSaving] = useState(false)
  const [allTags, setAllTags] = useState<string[]>()
  const quillObj = useRef<Quill>()

  const customToolbarHandler = (action: string) => {
    console.log('custom action', action)
    const quill = quillObj.current
    console.log('quill.theme.tooltip', quill?.theme.tooltip)
    quill?.theme.tooltip.edit()
    // https://github.com/quilljs/quill/blob/master/themes/snow.js
    // TODO: Implement link
  }

  // noinspection JSUnusedGlobalSymbols
  const editorModules = {
    toolbar: {
      container: "#toolbar",
      handlers: {
        custom: customToolbarHandler,
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
    quill.on('selection-change', (range, oldRange, source) => {
      if (range?.length === 1 && source === 'user') {
        const [link] = quill.scroll.descendant(LinkBlot, range.index)
        if (link && link.children.head?.domNode.tagName === 'IMG') {
          const { tooltip } = quill.theme
          const preview = LinkBlot.formats(link.domNode)
          tooltip.preview.textContent = preview
          tooltip.preview.setAttribute('href', preview)
          tooltip.show()
          tooltip.position(quill.selection.getBounds(range.index, range.length))
        }
      }
    })
  }, [quill])

  React.useEffect(() => {
    if (quill) {
      quill.clipboard.dangerouslyPasteHTML(editorValue)
      quill.on('text-change', () => setEditorValue(quill.root.innerHTML))
      quillObj.current = quill
    }
  }, [quill])

  async function save(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    const html = viewSource ? editedSource : editorValue
    try {
      const tagsWereUpdated = page.tags !== tags
      setIsSaving(true)
      await onSave({ ...page, title: title.trim(), html, tags })
      if (tagsWereUpdated) {
        await getAllTags(true)
      }
    }
    finally {
      setIsSaving(false)
    }
  }

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

  const titleInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => titleInputRef.current?.select(), [titleInputRef])

  return <div className="results page-editor m-1">
    <form className="row g-1 mb-1">
      <span className="col-auto flex-grow-1">
        <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} ref={titleInputRef}/>
      </span>
      <span className="col-auto">
        <button className="btn btn-primary me-1" onClick={save} disabled={!title.trim() || !quill?.getText().trim()}>
          {isSaving ? 'שומר...' : 'שמירה'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
      </span>
    </form>
    {viewSource &&
      <div className="viewSource-container">
        <div>
          <button className="btn btn-outline-primary" onClick={() => {
            setEditorValue(editedSource)
            quill.clipboard.dangerouslyPasteHTML(editedSource)
            setViewSource(false)
          }}>חזרה לעורך</button>
        </div>
        <pre contentEditable className="viewSource" onInput={(event: FormEvent) => setEditedSource((event.target as HTMLElement).innerText)}>{htmlPrettify(editorValue)}</pre>
      </div>}
    <div className="editor-container" onClick={e => setTimeout(() => (e.target as HTMLElement)?.querySelector<HTMLElement>('[contenteditable]')?.focus(), 0)}>
      <CustomToolbar/>
      <div ref={quillRef} />
    </div>
    <div className="d-flex align-items-center flex-wrap mt-2">
      {tags?.map(t => <TagLink key={t} tag={t} pushState={pushState} removeTag={removeTag} kind="small"/>)}

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
