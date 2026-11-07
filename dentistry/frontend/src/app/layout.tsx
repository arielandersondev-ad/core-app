import type { Metadata } from "next";
import { Inter, Work_Sans, DM_Mono } from "next/font/google";
import { DevPersonaSwitcherServer } from "@/features/dev-auth/components/DevPersonaSwitcherServer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Dentistry",
  description: "Sistema de gestión dental",
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${workSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <head>
        {
//        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        }
      </head>
      <body className="h-full flex flex-col overflow-hidden">
        {children}
        <DevPersonaSwitcherServer />
      </body>
    </html>
  );
}
