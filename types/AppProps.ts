import { PageData } from './PageData'

export interface AppProps extends SearchResults {
  url: string
  origin: string
  status: number
  search?: string
  tag?: string
  page?: PageData
  newPage?: boolean
  initialTitle?: string
}

export interface SearchResults {
  pages?: PageData[]
  tags?: string[]
  totalCount?: number
  search?: string
}
