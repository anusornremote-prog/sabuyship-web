import fs from "node:fs"
import dotenv from "dotenv"

const env = fs.existsSync(".env.local")
  ? { ...process.env, ...dotenv.parse(fs.readFileSync(".env.local")) }
  : process.env
const value = (key) => String(env[key] || "").trim()
const failures = []
const required = [
  "NEXT_PUBLIC_BUSINESS_LEGAL_NAME",
  "NEXT_PUBLIC_BUSINESS_ADDRESS",
  "NEXT_PUBLIC_BUSINESS_PHONE",
  "NEXT_PUBLIC_BUSINESS_EMAIL",
]

for (const key of required) {
  if (!value(key)) failures.push(`${key} is missing`)
}

const registered = Boolean(value("NEXT_PUBLIC_BUSINESS_REGISTRATION_NO"))
const pilot = value("NEXT_PUBLIC_PRE_REGISTRATION_PILOT") === "true"
if (!registered && !pilot) failures.push("Set a registration number or enable the pre-registration pilot")

if (!registered && pilot) {
  const startText = value("NEXT_PUBLIC_BUSINESS_START_DATE")
  const cutoffText = value("NEXT_PUBLIC_REGISTRATION_CUTOFF_DATE")
  const start = /^\d{4}-\d{2}-\d{2}$/.test(startText) ? new Date(`${startText}T00:00:00+07:00`) : null
  const cutoff = /^\d{4}-\d{2}-\d{2}$/.test(cutoffText) ? new Date(`${cutoffText}T23:59:59.999+07:00`) : null
  if (!start || Number.isNaN(start.getTime())) failures.push("NEXT_PUBLIC_BUSINESS_START_DATE must be YYYY-MM-DD")
  if (!cutoff || Number.isNaN(cutoff.getTime())) failures.push("NEXT_PUBLIC_REGISTRATION_CUTOFF_DATE must be YYYY-MM-DD")
  if (start && cutoff && cutoff.getTime() > start.getTime() + (30 * 24 * 60 * 60 * 1000)) {
    failures.push("Pilot cutoff exceeds the system's conservative 30-day limit")
  }
  if (cutoff && Date.now() > cutoff.getTime()) failures.push("Pilot cutoff has expired")
}

const normalizeName = (text) => text.toLocaleLowerCase("th-TH")
  .replace(/^(นาย|นางสาว|นาง|mr\.?|mrs\.?|miss)\s*/i, "")
  .replace(/[^\p{L}\p{N}]/gu, "")
const legalName = value("NEXT_PUBLIC_BUSINESS_LEGAL_NAME")
const accountName = value("NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME")
if (!accountName) failures.push("NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME is missing")
if (legalName && accountName && normalizeName(legalName) !== normalizeName(accountName)) {
  failures.push("Payment account holder must match the individual operator")
}

const bankReady = value("NEXT_PUBLIC_PAYMENT_BANK_NAME") && value("NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER")
const promptPayReady = /^\d{10}$/.test(value("NEXT_PUBLIC_PAYMENT_PROMPTPAY_ID").replace(/\D/g, ""))
if (!bankReady && !promptPayReady) failures.push("Configure an operator-owned bank account or 10-digit PromptPay phone")

if (failures.length) {
  console.error("Business readiness: NOT READY")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Business readiness: READY (${registered ? "registered" : "pre-registration pilot"})`)
