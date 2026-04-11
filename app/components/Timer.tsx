"use client";

interface TimerProps {
  remainingMs: number;
}

export default function Timer({ remainingMs }: TimerProps) {
  const seconds = Math.ceil(remainingMs / 1000);
  const isUrgent = seconds <= 10;

  return (
    <div
      style={{
        fontSize: "1.5rem",
        fontWeight: "bold",
        fontFamily: "inherit",
        letterSpacing: "0.1em",
        color: isUrgent ? "var(--danger)" : "var(--amber)",
        textAlign: "center",
        transition: "color 0.3s ease, transform 0.3s ease",
        transform: isUrgent ? "scale(1.1)" : "scale(1)",
      }}
    >
      {seconds}s
    </div>
  );
}
