export interface PageData {
  title: string
  html: string
  oldUrl?: string
  oldName?: string
  tags?: string[]
  isDeleted?: boolean
  _id?: string
  _updatedDate?: string
}

export interface PageHistoryEntry {
  _id: string
  pageId: string
  changedBy: string
  oldTitle: string
  oldHtml: string
  oldTags?: string[]
  _createdDate: string
}
