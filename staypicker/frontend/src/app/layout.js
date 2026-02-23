import './globals.css';

export const metadata = {
  title: 'StayPicker — AI Travel Concierge',
  description: 'Find your perfect stay with AI-powered search. Advanced filters for hot pools, accessibility, pet-friendly, work-from-home setups, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
