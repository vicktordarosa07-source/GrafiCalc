import type { Metadata } from "next";
import { connection } from "next/server";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = { title: "GrafiCalc | Orçamento Gráfico", description: "Precificação e gestão para gráficas." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="pt-BR"><body className={`${sans.variable} ${display.variable}`}>{children}</body></html>;
}
