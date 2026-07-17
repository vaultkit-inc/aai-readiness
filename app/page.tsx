import type { Metadata } from "next"
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"
import AssessmentClient from "@/components/readiness/AssessmentClient"

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Agent Readiness Index",
  description:
    "Twenty questions across five dimensions of agent governance: identity, data protection, auditability, operations, and autonomy. Get a score, a maturity level, and the three gaps to close first.",
  openGraph: {
    title: "Agent Readiness Index",
    description:
      "Can your AI agents safely touch production? Find out in ten minutes.",
    url: "https://vaultkit.io/readiness",
    siteName: "VaultKit",
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
  const fontClassNames = [
    archivo.variable,
    ibmPlexMono.variable,
    ibmPlexSans.variable,
  ].join(" ")

  return <AssessmentClient fontClassNames={fontClassNames} />
}
