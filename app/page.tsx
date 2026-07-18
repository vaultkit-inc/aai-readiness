import type { Metadata } from "next"
import AssessmentClient from "@/components/readiness/AssessmentClient"

export const metadata: Metadata = {
  title: "Agent Readiness Index",
  description:
    "Twenty questions across five dimensions of agent governance: identity, data protection, auditability, operations, and autonomy. Get a score, a maturity level, and the three gaps to close first.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Agent Readiness Index",
    description:
      "Can your AI agents safely touch production? Find out in ten minutes.",
    url: "https://readiness.vaultkit.io",
    siteName: "Agent Readiness Index",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Readiness Index",
    description:
      "Can your AI agents safely touch production? Find out in ten minutes.",
  },
}

export default function Home() {
  return <AssessmentClient />
}
