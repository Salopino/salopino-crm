export const metadata = {
  title: "Salopino CRM",
  description: "CRM + talous + AI analytiikka",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(90,49,132,.25), transparent 30%), radial-gradient(circle at top right, rgba(180,143,72,.10), transparent 25%), linear-gradient(180deg,#07070b 0%,#0c0a12 100%)",
          color: "#f4f1e9",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
