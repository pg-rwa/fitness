import "./globals.css";

export const metadata = {
  title: "Peqo",
  description: "Personal fitness tracking platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
