import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";

// Configurando as fontes
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

const lora = Lora({ 
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Carta para Tuany",
  description: "Uma mensagem especial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* Aplicamos bg-black no body para o fundo preto global */}
      <body className={`${playfair.variable} ${lora.variable} bg-black antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}