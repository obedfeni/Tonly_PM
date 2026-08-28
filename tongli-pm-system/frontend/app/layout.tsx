import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Tongli EV PM System",
  description: "AI-powered predictive maintenance for EV mining trucks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <LangProvider>
          <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            <Sidebar />
            <main style={{ flex: 1, overflowY: "auto", backgroundColor: "#0a0a0f" }}>
              {children}
            </main>
          </div>
        </LangProvider>
      </body>
    </html>
  );
}
