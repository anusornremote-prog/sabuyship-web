export type AuthErrorCode = "AuthCancelled" | "AuthFailed"

export function getAuthCallbackErrorCode(providerError?: string | null): AuthErrorCode {
  const normalizedError = providerError?.toLowerCase() ?? ""

  if (
    normalizedError.includes("access_denied") ||
    normalizedError.includes("user_cancelled") ||
    normalizedError.includes("cancelled")
  ) {
    return "AuthCancelled"
  }

  return "AuthFailed"
}

export function buildAuthErrorRedirectUrl(origin: string, providerError?: string | null): string {
  const redirectUrl = new URL("/login", origin)
  redirectUrl.searchParams.set("error", getAuthCallbackErrorCode(providerError))
  return redirectUrl.toString()
}

export function getFriendlyAuthErrorMessage(message?: string | null): string {
  if (!message) return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง"

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage === "authfailed") {
    return "การเข้าสู่ระบบผ่านผู้ให้บริการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน"
  }

  if (
    normalizedMessage === "authcancelled" ||
    normalizedMessage.includes("access_denied") ||
    normalizedMessage.includes("user_cancelled") ||
    normalizedMessage.includes("cancelled")
  ) {
    return "การเข้าสู่ระบบถูกยกเลิก กรุณาลองใหม่อีกครั้ง"
  }

  if (
    normalizedMessage.includes("provider is not enabled") ||
    normalizedMessage.includes("unsupported provider") ||
    normalizedMessage.includes("invalid provider") ||
    normalizedMessage.includes("provider_not_found") ||
    normalizedMessage.includes("provider") ||
    normalizedMessage.includes("issuer") ||
    normalizedMessage.includes("oauth")
  ) {
    return "ระบบเข้าสู่ระบบนี้ยังไม่พร้อมใช้งานในขณะนี้ กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน หรือติดต่อเจ้าหน้าที่"
  }

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid_credentials")
  ) {
    return "อีเมล หรือ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "อีเมลนี้ยังไม่ได้ยืนยันตัวตน กรุณาตรวจสอบกล่องจดหมายของคุณ"
  }

  if (normalizedMessage.includes("database trigger failed") || normalizedMessage.includes("trigger")) {
    return "เกิดข้อผิดพลาดจากระบบฐานข้อมูล กรุณาติดต่อผู้ดูแลระบบ"
  }

  return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่"
}
