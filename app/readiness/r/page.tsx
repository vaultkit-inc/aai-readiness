import type { Metadata } from "next"
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"
import SharedResultClient from "@/components/readiness/SharedResultClient"

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
  title: "Agent Readiness Index — Shared Result",
  description:
    "View a shared Agent Readiness Index result. Take the assessment yourself to see how your organization compares.",
}

export default async function SharedResultPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string }>
}) {
  const { a = "" } = await searchParams

  const fontClassNames = [
    archivo.variable,
    ibmPlexMono.variable,
    ibmPlexSans.variable,
  ].join(" ")

  return <SharedResultClient encoded={a} fontClassNames={fontClassNames} />
}
