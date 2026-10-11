import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MentorMatch",
  description: "Connect founders and mentors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-[100dvh] flex flex-col">
        {children}
      </body>
    </html>
  );
}
