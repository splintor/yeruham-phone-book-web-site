import React, { type ReactElement } from 'react'
import { copyPageLink } from '../utils/url'
import { PageData } from '../types/PageData'
import { ToastOptions } from './App'

export interface CopyToClipboardProps {
  page?: PageData
  search: string
  tag?: string
  setToast(toastOptions: ToastOptions): void
}

export function CopyToClipboard(props: CopyToClipboardProps): ReactElement {
  const copyToClipboard = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault()
    void copyPageLink(props.page, props.search, props.tag, props.setToast)
  }

  return <a href="#" className="copy" onClick={copyToClipboard}>&#10697;</a>
}