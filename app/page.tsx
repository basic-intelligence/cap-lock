export default function Home() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      <h1 style={{ color: "var(--amber)", fontSize: "2rem", letterSpacing: "0.2em" }}>
        CAP-LOCKS
      </h1>
      <p style={{ color: "var(--text-muted)" }}>Loading game...</p>
    </main>
  );
}
