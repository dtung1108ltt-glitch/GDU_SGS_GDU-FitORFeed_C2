import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Mode selection
 * --------------
 * LIVE mode  : `public/tidecloak.json` (the adapter JSON exported from your TideCloak realm) exists.
 *              The app is wrapped in the official `TideCloakContextProvider` from `@tidecloak/react`
 *              and every identity / role comes from a real TideCloak session.
 * SIMULATION : no adapter JSON found (e.g. a fresh clone with no TideCloak server). The original
 *              offline storytelling demo runs instead and is clearly labelled as a simulation.
 *
 * The adapter is fetched at runtime (not imported) so `npm run build` works on a clean clone.
 */
async function loadTideConfig(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch('/tidecloak.json', { cache: 'no-store' })
    if (!res.ok) return null
    const cfg = await res.json()
    // A real adapter export always carries these keys.
    if (cfg && typeof cfg === 'object' && cfg.realm && cfg['auth-server-url'] && cfg.resource) return cfg
    return null
  } catch {
    return null // 404 served as index.html -> JSON parse error -> simulation mode
  }
}

const root = createRoot(document.getElementById('root')!)

loadTideConfig().then(async (cfg) => {
  if (cfg && new URLSearchParams(window.location.search).get('mode') !== 'simulation') {
    const { TideCloakContextProvider } = await import('@tidecloak/react')
    const { LiveRoot } = await import('./tide/LiveRoot.tsx')
    root.render(
      <StrictMode>
        {/* Same provider usage as the official Tide `react-vite-internal-dashboard` template:
            useDPoP goes inside the config object. */}
        <TideCloakContextProvider config={{ ...cfg, useDPoP: { mode: 'strict', alg: 'ES256' } }}>
          <LiveRoot />
        </TideCloakContextProvider>
      </StrictMode>,
    )
  } else {
    root.render(
      <StrictMode>
        <App liveAvailable={!!cfg} />
      </StrictMode>,
    )
  }
})
