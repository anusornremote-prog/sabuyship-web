const clean = (value: string | undefined) => value?.trim() || ""
const normalizePersonName = (value: string) => value
  .toLocaleLowerCase("th-TH")
  .replace(/^(นาย|นางสาว|นาง|mr\.?|mrs\.?|miss)\s*/i, "")
  .replace(/[^\p{L}\p{N}]/gu, "")

export const publicBusinessConfig = {
  brandName: "Sabuy Ship Express",
  operatorType: "บุคคลธรรมดา" as const,
  legalName: clean(process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME),
  address: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
  phone: clean(process.env.NEXT_PUBLIC_BUSINESS_PHONE),
  email: clean(process.env.NEXT_PUBLIC_BUSINESS_EMAIL) || "sabuyship.express@gmail.com",
  commercialRegistrationNo: clean(process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION_NO),
  vatRegistered: process.env.NEXT_PUBLIC_BUSINESS_VAT_REGISTERED === "true",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  bankName: clean(process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME),
  bankAccountName: clean(process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME),
  bankAccountNumber: clean(process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER),
  promptPayId: clean(process.env.NEXT_PUBLIC_PAYMENT_PROMPTPAY_ID).replace(/\D/g, ""),
}

export const hasLegalIdentity = Boolean(
  publicBusinessConfig.legalName &&
  publicBusinessConfig.address &&
  publicBusinessConfig.email,
)

export const canAcceptBusiness = hasLegalIdentity

export const paymentAccountMatchesOperator = Boolean(
  publicBusinessConfig.legalName &&
  publicBusinessConfig.bankAccountName &&
  normalizePersonName(publicBusinessConfig.legalName) === normalizePersonName(publicBusinessConfig.bankAccountName),
)

export const hasBankTransfer = Boolean(
  publicBusinessConfig.bankName &&
  publicBusinessConfig.bankAccountName &&
  publicBusinessConfig.bankAccountNumber &&
  paymentAccountMatchesOperator,
)

export const hasPromptPay = Boolean(
  publicBusinessConfig.bankAccountName &&
  paymentAccountMatchesOperator &&
  /^\d{10}$/.test(publicBusinessConfig.promptPayId),
)

export const isPaymentConfigured = hasLegalIdentity && (hasBankTransfer || hasPromptPay)
