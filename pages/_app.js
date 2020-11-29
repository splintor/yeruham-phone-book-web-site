import './style.scss'
import 'draft-js/dist/Draft.css'

// this dummy component is needed to load global CSS files
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}
