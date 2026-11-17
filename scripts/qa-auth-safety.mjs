import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  buildAuthErrorRedirectUrl,
  getAuthCallbackErrorCode,
  getFriendlyAuthErrorMessage,
} from "../src/lib/auth-errors.ts"
import {
  buildExternalBrowserUrl,
  detectBrowserEnvironment,
  hasExternalBrowserParam,
  shouldOpenExternalBrowserForLineOAuth,
} from "../src/lib/in-app-browser.ts"

assert.equal(getAuthCallbackErrorCode("access_denied"), "AuthCancelled")
assert.equal(getAuthCallbackErrorCode("provider_failure: internal details"), "AuthFailed")

const rawDescription = "internal_stack_trace_leak"
const redirectUrl = buildAuthErrorRedirectUrl("https://www.sabuyship.com", rawDescription)
assert.equal(redirectUrl, "https://www.sabuyship.com/login?error=AuthFailed")
assert.equal(redirectUrl.includes(rawDescription), false)

const friendlyMessage = getFriendlyAuthErrorMessage(rawDescription)
assert.equal(friendlyMessage, "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่")
assert.equal(friendlyMessage.includes(rawDescription), false)

const manualLinkingMessage = getFriendlyAuthErrorMessage("Manual linking is disabled")
assert.match(manualLinkingMessage, /LINE OA/)
const duplicateIdentityMessage = getFriendlyAuthErrorMessage("identity_already_exists")
assert.match(duplicateIdentityMessage, /ถูกผูกกับบัญชีอื่นในระบบแล้ว/)

const loginSource = await readFile(new URL("../src/app/(auth)/login/page.tsx", import.meta.url), "utf8")
assert.match(loginSource, />อีเมล \*<\/label>/)
assert.match(loginSource, /type="email"/)
assert.doesNotMatch(loginSource, /อีเมล หรือ เบอร์โทรศัพท์/)

const callbackSource = await readFile(new URL("../src/app/api/auth/callback/route.ts", import.meta.url), "utf8")
assert.doesNotMatch(callbackSource, /error_description/)

const lineUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 Line/14.7.0"
const fbUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 [FBAN/FBIOS;FBAV/465.0.0.48.107]"
const iosChromeUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1"
const iosSafariUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"

assert.equal(detectBrowserEnvironment(lineUa), "line-in-app")
assert.equal(detectBrowserEnvironment(fbUa), "other-in-app")
assert.equal(detectBrowserEnvironment(iosChromeUa), "ios-non-safari")
assert.equal(detectBrowserEnvironment(iosSafariUa), "normal")

assert.equal(hasExternalBrowserParam("?openExternalBrowser=1"), true)
assert.equal(hasExternalBrowserParam("?error=AuthFailed"), false)
assert.equal(
  buildExternalBrowserUrl("https://www.sabuyship.com/login?error=AuthFailed"),
  "https://www.sabuyship.com/login?error=AuthFailed&openExternalBrowser=1"
)
assert.equal(shouldOpenExternalBrowserForLineOAuth(lineUa, ""), true)
assert.equal(shouldOpenExternalBrowserForLineOAuth(lineUa, "?openExternalBrowser=1"), false)
assert.equal(shouldOpenExternalBrowserForLineOAuth(iosSafariUa, ""), false)

console.log("Auth safety checks passed")
