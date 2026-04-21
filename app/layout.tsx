import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn to See Again",
  description: "A perceptual training exercise by Castro Lab",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{
          position: "fixed", inset: 0, zIndex: -1,
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(1.05)",
          transform: "scale(1.1)",
          opacity: 0.2,
        }} />
        {children}
      </body>
    </html>
  );
}
