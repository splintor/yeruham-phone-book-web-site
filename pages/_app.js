import './style.scss'
import 'draft-js/dist/Draft.css'

export default function DummyComponentToLoadGlobalCSSFiles({ Component, pageProps }) {
  return <Component {...pageProps} />
}
