import "./globals.css";

export const metadata = {
  title: "Atelier — hourly",
  description: "A small public studio. Write privately. Hang work on the wall when you mean it.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
