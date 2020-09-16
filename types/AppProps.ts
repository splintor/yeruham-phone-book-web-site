import { PageData } from './PageData'

export interface AppProps {
  url: string
  origin: string
  status: number
  search?: string
  tag?: string
  page?: PageData
  pages?: PageData[]
}
