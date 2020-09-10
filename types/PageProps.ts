import { PageData } from './PageData';

export interface PageProps {
  url: string
  origin: string
  status: number
  pages: PageData[]
}
