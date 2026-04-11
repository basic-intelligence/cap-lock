"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";

interface GuessInputProps {
  targetLength: number;
  onSubmit: (guess: string) => void;
  disabled: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function GuessInput({
  targetLength,
  onSubmit,
  disabled,
  error,
  onClearError,
}: GuessInputProps) {
  const [value, setValue] = useState("");
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when not disabled
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Clear error on keystroke
  useEffect(() => {
    if (error && value.length > 0) {
      onClearError();
    }
  }, [value, error, onClearError]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = value.toUpperCase().replace(/[^A-Z]/g, "");

    if (cleaned.length !== targetLength) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }

    onSubmit(cleaned);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "320px" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={targetLength}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, ""))}
          disabled={disabled}
          placeholder={`${targetLength} letters...`}
          className={shaking ? "shake" : ""}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "1.2rem",
            fontFamily: "inherit",
            letterSpacing: "0.15em",
            background: "var(--panel-bg)",
            border: `2px solid ${error ? "var(--danger)" : "var(--panel-border)"}`,
            borderRadius: "8px",
            color: "var(--text)",
            outline: "none",
            textTransform: "uppercase",
            transition: "border-color 0.2s ease",
          }}
        />
      </div>
      {error && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: "0.8rem",
            marginTop: "4px",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
