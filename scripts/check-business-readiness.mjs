import fs from "node:fs"
import dotenv from "dotenv"

const envFile = process.argv[2] || ".env.local"
const env = fs.existsSync(envFile)
  ? { ...process.env, ...dotenv.parse(fs.readFileSync(envFile)) }
  : process.env
const value = (key) => String(env[key] || "").trim()
const failures = []
const required = [
  "NEXT_PUBLIC_BUSINESS_LEGAL_NAME",
  "NEXT_PUBLIC_BUSINESS_ADDRESS",
  "NEXT_PUBLIC_BUSINESS_EMAIL",
]

for (const key of required) {
  if (!value(key)) failures.push(`${key} is missing`)
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

console.log("Business readiness: READY")
