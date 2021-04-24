import React, { ReactElement, useEffect, useRef, useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import ReactQuill from 'react-quill'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { getAllTags } from '../utils/api'
import { publicTagName } from '../utils/consts'
import { TagLink } from './TagLink'

interface EditorProps {
  page: PageData
  onSave(pageData: PageData): Promise<void>
  onCancel(): void
  pushState(url: string, state: Partial<AppProps>)
}

export default function PageEditor({ page, onCancel, onSave, pushState }: EditorProps): ReactElement {
  const [title, setTitle] = useState(page.title)
  const [tags, setTags] = useState(page.tags)
  const [newTag, setNewTag] = useState('')
  const [editorValue, setEditorValue] = useState(page.html)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<ReactQuill>()
  const [allTags, setAllTags] = useState<string[]>()

  async function save() {
    try {
      const tagsWereUpdated = page.tags !== tags
      setIsSaving(true)
      await onSave({ ...page, title: title.trim(), html: editorValue, tags })
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

  return <div className="results page-editor">
    <div className="d-flex justify-content-between my-1">
      <input className="edit-title" value={title} onChange={e => setTitle(e.target.value)} ref={titleInputRef}/>
      <span>
        <button className="btn btn-primary me-1" onClick={save} disabled={!title.trim() || !editorRef.current?.getEditor().getText().trim()}>
          {isSaving ? 'שומר...' : 'שמירה'}
        </button>
        <button className="btn btn-secondary me-1" onClick={onCancel}>ביטול</button>
      </span>
    </div>
    <div className="editor-container" onClick={e => setTimeout(() => (e.target as HTMLElement)?.querySelector<HTMLElement>('[contenteditable]')?.focus(), 0)}>
      <ReactQuill ref={editorRef} theme="snow" value={editorValue} onChange={setEditorValue}/>
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
