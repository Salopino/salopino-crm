export const metadata = {
  title: "Salopino CRM",
  description: "CRM + AI talousohjaus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <body style={{ margin: 0, background: "#08070d", color: "#f4f1e9" }}>
        {children}
      </body>
    </html>
  );
}
