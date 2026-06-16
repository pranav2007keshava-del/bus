import "./globals.css";

export const metadata = {
  title: "RFID Attendance System — PESCE",
  description: "Real-time RFID attendance tracking dashboard for PESCE",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bg text-[#e6e9f4] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
