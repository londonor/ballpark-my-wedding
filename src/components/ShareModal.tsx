"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";

interface ShareModalProps {
  cityTitle: string;
  weddingYear: number;
  shareToken: string | null;
  onClose: () => void;
}

export function ShareModal({ cityTitle, weddingYear, shareToken, onClose }: ShareModalProps) {
  const [senderName, setSenderName]   = useState("");
  const [message, setMessage]         = useState("");
  const [inputValue, setInputValue]   = useState("");
  const [recipients, setRecipients]   = useState<string[]>([]);
  const [inputError, setInputError]   = useState<string | null>(null);
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [sendError, setSendError]     = useState<string | null>(null);

  const nameRef       = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const addRecipient = () => {
    const email = inputValue.trim().toLowerCase();
    if (!isValidEmail(email)) { setInputError("Enter a valid email address"); return; }
    if (recipients.includes(email)) { setInputError("Already added"); return; }
    setRecipients((prev) => [...prev, email]);
    setInputValue("");
    setInputError(null);
    emailInputRef.current?.focus();
  };

  const removeRecipient = (email: string) =>
    setRecipients((prev) => prev.filter((r) => r !== email));

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addRecipient(); }
  };

  const handleSend = async () => {
    let finalRecipients = recipients;
    if (inputValue.trim() && isValidEmail(inputValue.trim())) {
      const email = inputValue.trim().toLowerCase();
      if (!recipients.includes(email)) {
        finalRecipients = [...recipients, email];
        setRecipients(finalRecipients);
        setInputValue("");
      }
    }

    if (finalRecipients.length === 0) {
      setInputError("Add at least one email address");
      emailInputRef.current?.focus();
      return;
    }

    if (!senderName.trim()) {
      setSendError("Please enter your name so recipients know who sent this.");
      nameRef.current?.focus();
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareToken,
          senderName: senderName.trim(),
          message: message.trim() || undefined,
          recipients: finalRecipients,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-sand-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-sand-900 text-lg leading-tight">Share this estimate</h2>
            <p className="text-sand-600 text-sm mt-0.5">
              We&apos;ll email the PDF directly to them.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 text-sand-500 hover:text-sand-700 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✉️</div>
            <p className="font-semibold text-sand-900 text-base mb-1">Sent!</p>
            <p className="text-sand-600 text-sm">
              {recipients.length === 1
                ? `Emailed the estimate to ${recipients[0]}.`
                : `Emailed the estimate to ${recipients.length} people.`}
            </p>
            <button onClick={onClose} className="mt-5 text-sm text-sand-500 hover:text-sand-700 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1.5">Your name</label>
              <input
                ref={nameRef}
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sand-800 text-sm shadow-sm focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400/20"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1.5">
                Add a note <span className="font-normal text-sand-500">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Thinking about our wedding in ${cityTitle} — take a look at what it'll cost.`}
                rows={3}
                className="w-full rounded-xl border border-sand-300 px-4 py-2.5 text-sand-800 text-sm shadow-sm focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400/20 resize-none"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1.5">Recipient emails</label>
              <div className="flex gap-2">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); if (inputError) setInputError(null); }}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="partner@email.com"
                  className="flex-1 rounded-xl border border-sand-300 px-4 py-2.5 text-sand-800 text-sm shadow-sm focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400/20"
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  disabled={sending}
                  className="px-4 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-sand-700 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {inputError && <p className="text-coral-600 text-xs mt-1.5 pl-1">{inputError}</p>}
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1.5 bg-sage-50 border border-sage-200 text-sage-700 rounded-full px-3 py-1 text-sm">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="text-sage-500 hover:text-sage-700 transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {sendError && <p className="text-coral-600 text-sm">{sendError}</p>}

            <div className="flex gap-3 pt-1">
              <Button onClick={handleSend} disabled={sending} className="flex-1">
                {sending ? "Sending…" : "Send estimate"}
              </Button>
              <button onClick={onClose} className="px-4 text-sand-500 hover:text-sand-700 text-sm transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
