/**
 * Centralized business & domain constants for SabuyShip.
 * Always import from this module rather than hardcoding magic strings.
 */

export const LINE_OA_ID = "@516lqkcd" as const
export const LINE_OA_URL = "https://line.me/R/ti/p/@516lqkcd" as const

export const ORDER_STATUSES = {
  WAITING_PAYMENT: "WAITING_PAYMENT",
  PAYMENT_VERIFICATION: "PAYMENT_VERIFICATION",
  PAYMENT_REJECTED: "PAYMENT_REJECTED",
  ORDERED: "ORDERED",
  CHINA_WAREHOUSE: "CHINA_WAREHOUSE",
  SHIPPING: "SHIPPING",
  THAILAND_WAREHOUSE: "THAILAND_WAREHOUSE",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  CANCELLED: "CANCELLED",
} as const

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]

export const PAYMENT_ROUND_STATUSES = {
  PENDING: "PENDING",
  UPLOADED: "UPLOADED",
  PAID: "PAID",
  REJECTED: "REJECTED",
} as const

export type PaymentRoundStatus =
  (typeof PAYMENT_ROUND_STATUSES)[keyof typeof PAYMENT_ROUND_STATUSES]

export const TRANSPORT_MODES = {
  EK: "EK",
  SEA: "SEA",
} as const

export type TransportMode = (typeof TRANSPORT_MODES)[keyof typeof TRANSPORT_MODES]

