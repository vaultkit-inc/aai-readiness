import type { Metadata } from "next"
import SharedResultClient from "@/components/readiness/SharedResultClient"

export const metadata: Metadata = {
  title: "Shared result",
  description:
    "Someone shared their Agent Readiness Index result. Take the assessment yourself to see how your organization compares.",
  robots: { index: false, follow: false },
}

export default async function SharedResultPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string }>
}) {
  const { a = "" } = await searchParams
  return <SharedResultClient encoded={a} />
}
