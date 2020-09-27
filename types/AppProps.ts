import { PageData } from './PageData'

export interface AppProps extends SearchResults {
  url: string
  origin: string
  status: number
  search?: string
  tag?: string
  page?: PageData
}

export interface SearchResults {
  pages?: PageData[]
  totalCount?: number
}
