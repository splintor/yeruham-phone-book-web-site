import TagManager from 'react-gtm-module'
import { AppProps } from '../types/AppProps'

interface GTMDataLayer extends Partial<AppProps> {
  event: string
  authTitle: string
}

export function initTagManager(url: string, authTitle: string): void {
  TagManager.initialize({ gtmId: 'GTM-TCN5G8S', dataLayer: { event: 'load', url, status, authTitle } })
}

export function logToGTM(dataLayer: GTMDataLayer): void {
  TagManager.dataLayer({ dataLayer })
}
