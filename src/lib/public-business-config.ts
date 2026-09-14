const clean = (value: string | undefined) => value?.trim() || ""
const normalizePersonName = (value: string) => value
  .toLocaleLowerCase("th-TH")
  .replace(/^(นาย|นางสาว|นาง|mr\.?|mrs\.?|miss)\s*/i, "")
  .replace(/[^\p{L}\p{N}]/gu, "")

const parseBangkokDateEnd = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T23:59:59.999+07:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const parseBangkokDateStart = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000+07:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const publicBusinessConfig = {
  brandName: "Sabuy Ship Express",
  operatorType: "บุคคลธรรมดา" as const,
  legalName: clean(process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME),
  address: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
  phone: clean(process.env.NEXT_PUBLIC_BUSINESS_PHONE),
  email: clean(process.env.NEXT_PUBLIC_BUSINESS_EMAIL) || "sabuyship.express@gmail.com",
  commercialRegistrationNo: clean(process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION_NO),
  vatRegistered: process.env.NEXT_PUBLIC_BUSINESS_VAT_REGISTERED === "true",
  preRegistrationPilot: process.env.NEXT_PUBLIC_PRE_REGISTRATION_PILOT === "true",
  businessStartDate: clean(process.env.NEXT_PUBLIC_BUSINESS_START_DATE),
  registrationCutoffDate: clean(process.env.NEXT_PUBLIC_REGISTRATION_CUTOFF_DATE),
  bankName: clean(process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME),
  bankAccountName: clean(process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME),
  bankAccountNumber: clean(process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER),
  promptPayId: clean(process.env.NEXT_PUBLIC_PAYMENT_PROMPTPAY_ID).replace(/\D/g, ""),
}

export const hasLegalIdentity = Boolean(
  publicBusinessConfig.legalName &&
  publicBusinessConfig.address &&
  publicBusinessConfig.phone,
)

const businessStart = parseBangkokDateStart(publicBusinessConfig.businessStartDate)
const registrationCutoff = parseBangkokDateEnd(publicBusinessConfig.registrationCutoffDate)
const maximumPilotCutoff = businessStart
  ? businessStart.getTime() + (30 * 24 * 60 * 60 * 1000)
  : 0
export const isPreRegistrationPilotActive = Boolean(
  publicBusinessConfig.preRegistrationPilot &&
  businessStart &&
  registrationCutoff &&
  Date.now() >= businessStart.getTime() &&
  Date.now() <= registrationCutoff.getTime() &&
  registrationCutoff.getTime() <= maximumPilotCutoff,
)

export const canAcceptBusiness = Boolean(
  hasLegalIdentity &&
  (publicBusinessConfig.commercialRegistrationNo || isPreRegistrationPilotActive),
)

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

// Existing orders must still be serviceable after the pilot cutoff. The cutoff
// blocks new business, while valid operator-owned payment channels remain usable.
export const isPaymentConfigured = hasLegalIdentity && (hasBankTransfer || hasPromptPay)
