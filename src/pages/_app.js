import '@/styles/globals.css'
import { GoogleMapsProvider } from '@/utils/googleMapsLoader'

export default function App({ Component, pageProps }) {
  return (
    <GoogleMapsProvider>
      <Component {...pageProps} />
    </GoogleMapsProvider>
  )
}
