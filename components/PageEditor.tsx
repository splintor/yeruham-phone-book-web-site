import React, { ReactElement, useEffect, useRef, useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import ReactQuill from 'react-quill'
import { useKeyPress } from '../hooks/useKeyPress'
import { PageData } from '../types/PageData'
import { getAllTags } from '../utils/api'
import { getTagUrl } from '../utils/url'

interface EditorProps {
  page: PageData
  onSave(pageData: PageData): Promise<void>
  onCancel(): void
}

export default function PageEditor({ page, onCancel, onSave }: EditorProps): ReactElement {
  const [title, setTitle] = useState(page.title)
  const [tags, setTags] = useState(page.tags)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [editorValue, setEditorValue] = useState(page.html)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<ReactQuill>()
  const allTagsRef = useRef<string[]>()
  const enterPressed = useKeyPress('Enter')
  const escapePressed = useKeyPress('Escape')

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

  const removeTag = tag => {
    const filterTags = tags.filter(t => t !== tag)
    setTags(filterTags.length === 0 ? null : filterTags)
  }

  const addTag = tag => {
    if (!tags?.includes(tag)) {
      setTags([...(tags || []), tag])
    }
    setShowAddTag(false)
  }

  function addNewTag() {
    if (newTag) {
      addTag(newTag)
      setNewTag('')
    }
  }

  if (showAddTag) {
    if (enterPressed) {
      addNewTag()
    } else if (escapePressed) {
      setShowAddTag(false)
    }
  }

  useEffect(() => {
    getAllTags().then(allTags => allTagsRef.current = allTags)
  }, [])

  const titleInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => titleInputRef.current?.select(), [titleInputRef])

  return <div className="results page-editor">
    <div className="buttons">
      <button className="OK" onClick={save} disabled={!title.trim() || !editorRef.current?.getEditor().getText().trim()}>
        {isSaving ? 'שומר...' : 'שמירה'}
      </button>
      <button className="delete" onClick={onCancel}>ביטול</button>
    </div>
    <input className="edit-title" value={title} onChange={e => setTitle(e.target.value)} ref={titleInputRef}/>
    <div className="editor-container" onClick={e => setTimeout(() => (e.target as HTMLElement)?.querySelector<HTMLElement>('[contenteditable]')?.focus(), 0)}>
      <ReactQuill ref={editorRef} theme="snow" value={editorValue} onChange={setEditorValue}/>
    </div>
    <div className="tags-footer">
      {
        tags?.map(t => <a className="titleLink tag" key={t} target="_blank" href={getTagUrl(t)}>
          <span className="tagName">{t}</span>
          <span className="delete" onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            removeTag(t)
          }}>X</span></a>)
      }
      <span className="titleLink tag addTag">
        <span onClick={() => setShowAddTag(!showAddTag)}>+ הוסף קטגוריה</span>
        {showAddTag && <>
        <div key="overlay" className="overlay" onClick={() => setShowAddTag(false)}/>
        <div key="addTagModal" className="modal addTagModal">
          {allTagsRef.current?.filter(t => !tags?.includes(t)).map(t => <div><span className="titleLink tag" key={t} onClick={() => addTag(t)}>{t}</span></div> )}
          <div className="newTag">
            <input autoFocus placeholder="קטגוריה חדשה" type="text" value={newTag} onChange={e => setNewTag(e.target.value)}/>
            <button onClick={addNewTag} disabled={!newTag}>הוסף</button>
          </div>
        </div>
        </>}
      </span>
    </div>
  </div>
}
