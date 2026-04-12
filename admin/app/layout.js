import "./globals.css";

export const metadata = {
  title: "Peqo Admin",
  description: "Admin dashboard for Peqo platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-200 min-h-screen">{children}</body>
    </html>
  );
}
