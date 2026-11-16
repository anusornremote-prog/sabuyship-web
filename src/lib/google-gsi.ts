export interface RenderGoogleGsiOptions {
  container: HTMLDivElement | null
  callback: (response: { credential?: string }) => void
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
}

const DEFAULT_GOOGLE_CLIENT_ID =
  "449039415658-57snl0en8sa78c0pp0l2ttc9ld54q89d.apps.googleusercontent.com"

/**
 * Renders the Google Identity Services button sized to the container's exact inner pixel width
 * so the cross-origin iframe border is never clipped on narrow mobile viewports.
 */
export function renderGoogleGsiButton({
  container,
  callback,
  text = "signin_with",
}: RenderGoogleGsiOptions): (() => void) | undefined {
  if (typeof window === "undefined" || !container) return undefined

  let lastRenderedWidth = 0

  const renderAtMeasuredWidth = () => {
    const googleAccounts = (window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize: (cfg: Record<string, unknown>) => void
            renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void
          }
        }
      }
    }).google?.accounts?.id

    if (!googleAccounts) return

    const measuredWidth = Math.floor(container.getBoundingClientRect().width)
    if (!measuredWidth) return

    const targetWidth = Math.min(Math.max(measuredWidth, 220), 400)
    if (targetWidth === lastRenderedWidth && container.childElementCount > 0) return

    lastRenderedWidth = targetWidth
    googleAccounts.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID,
      callback,
    })

    container.replaceChildren()
    googleAccounts.renderButton(container, {
      theme: "outline",
      size: "large",
      text,
      shape: "pill",
      width: targetWidth,
      logo_alignment: "left",
    })
  }

  renderAtMeasuredWidth()

  if (typeof ResizeObserver === "undefined") return undefined

  const observer = new ResizeObserver(() => {
    renderAtMeasuredWidth()
  })
  observer.observe(container)

  return () => observer.disconnect()
}
