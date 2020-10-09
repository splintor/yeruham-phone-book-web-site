import React, { useEffect, useRef, useState } from 'react'
import { Editor, EditorState } from 'draft-js'
import { stateFromHTML } from 'draft-js-import-html'
import { stateToHTML } from 'draft-js-export-html'
import { useKeyPress } from '../hooks/useKeyPress';
import { PageData } from '../types/PageData'
import { getAllTags } from '../utils/api'

interface EditorProps {
  page: PageData
  onSave(newPage: PageData): Promise<void>
  onCancel(): void
}

export default function PageEditor({ page, onCancel, onSave }: EditorProps) {
  const [title, setTitle] = useState(page.title)
  const [tags, setTags] = useState(page.tags)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [editorState, setEditorState] = useState(() => EditorState.createWithContent(stateFromHTML(page.html)))
  const [isSaving, setIsSaving] = useState(false)
  const allTagsRef = useRef<string[]>()
  const enterPressed = useKeyPress('Enter');
  const escapePressed = useKeyPress('Escape');

  async function save() {
    try {
      setIsSaving(true)
      await onSave({ ...page, title, html: stateToHTML(editorState.getCurrentContent()), tags })
    }
    finally {
      setIsSaving(false)
    }
  }
  const removeTag = tag => setTags(tags.filter(t => t !== tag))
  const addTag = tag => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
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
      addNewTag();
    } else if (escapePressed) {
      setShowAddTag(false)
    }
  }

  useEffect(() => {
    getAllTags().then(allTags => allTagsRef.current = allTags)
  }, [])

  return <div className="results page-editor">
    <div className="buttons">
      <button className="OK" onClick={save}>{isSaving ? 'שומר...' : 'שמירה'}</button>
      <button className="Cancel" onClick={onCancel}>ביטול</button>
    </div>
    <input className="edit-title" value={title} onChange={e => setTitle(e.target.value)} />
    <div className="editor-container">
      <Editor editorState={editorState} onChange={setEditorState} textDirectionality="RTL"/>
    </div>
    <div className="tags-footer">
      {
        tags?.map(t => <a className="titleLink tag" key={t} target="_blank" href={`/tag/${t}`}>
          <span className="tagName">{t}</span>
          <span className="removeTag" onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            removeTag(t)
          }}>X</span></a>)
      }
      <span className="titleLink tag addTag">
        <span onClick={() => setShowAddTag(!showAddTag)}>+ הוסף קטגוריה</span>
        {showAddTag && <>
        <div key="overlay" className="overlay" onClick={() => setShowAddTag(false)}/>
        <div key="addTagModal" className="addTagModal">
          {allTagsRef.current?.filter(t => !tags.includes(t)).map(t => <div><span className="titleLink tag" key={t} onClick={() => addTag(t)}>{t}</span></div> )}
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
