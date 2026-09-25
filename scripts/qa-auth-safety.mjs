import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  buildAuthErrorRedirectUrl,
  getAuthCallbackErrorCode,
  getFriendlyAuthErrorMessage,
} from "../src/lib/auth-errors.ts"

assert.equal(getAuthCallbackErrorCode("access_denied"), "AuthCancelled")
assert.equal(getAuthCallbackErrorCode("provider_failure: internal details"), "AuthFailed")

const rawDescription = "internal_stack_trace_leak"
const redirectUrl = buildAuthErrorRedirectUrl("https://www.sabuyship.com", rawDescription)
assert.equal(redirectUrl, "https://www.sabuyship.com/login?error=AuthFailed")
assert.equal(redirectUrl.includes(rawDescription), false)

const friendlyMessage = getFriendlyAuthErrorMessage(rawDescription)
assert.equal(friendlyMessage, "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่")
assert.equal(friendlyMessage.includes(rawDescription), false)

const loginSource = await readFile(new URL("../src/app/(auth)/login/page.tsx", import.meta.url), "utf8")
assert.match(loginSource, />อีเมล \*<\/label>/)
assert.match(loginSource, /type="email"/)
assert.doesNotMatch(loginSource, /อีเมล หรือ เบอร์โทรศัพท์/)

const callbackSource = await readFile(new URL("../src/app/api/auth/callback/route.ts", import.meta.url), "utf8")
assert.doesNotMatch(callbackSource, /error_description/)

console.log("Auth safety checks passed")
