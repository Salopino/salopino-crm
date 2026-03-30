export const metadata = {
  title: "Salopino CRM"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <body style={{ margin: 0, background: "#0b0b10", color: "#f4f1e9" }}>
        {children}
      </body>
    </html>
  );
}
