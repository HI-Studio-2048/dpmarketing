import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daniel Philip",
  description: "Power in Simplicity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
