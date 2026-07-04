import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "diafram — AI whiteboard explainer videos",
  description: "Describe a topic and get an animated, hand-drawn whiteboard explainer video.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
