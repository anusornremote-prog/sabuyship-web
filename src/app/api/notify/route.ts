import { NextResponse } from "next/server"

// Notifications are emitted by the server route that commits each business event.
// Keeping this endpoint closed prevents clients from spoofing or replaying alerts.
export async function POST() {
  return NextResponse.json(
    { error: "Direct notification requests are no longer supported" },
    { status: 410 },
  )
}
