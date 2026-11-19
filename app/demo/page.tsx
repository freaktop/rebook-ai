"use client";
import { useState } from "react";

export default function DemoPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) { setError("Something went wrong. Please try again."); return; }
    setSent(true);
  }

  if (sent) return <main className="min-h-screen flex items-center justify-center"><p>Thanks! We'll be in touch.</p></main>;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={onSubmit} className="max-w-md w-full space-y-4 bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Request a Demo</h1>
        <input name="businessName" placeholder="Business name" required className="w-full border p-2 rounded" />
        <input name="contactName" placeholder="Contact name" required className="w-full border p-2 rounded" />
        <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
        <input name="phone" placeholder="Phone (optional)" className="w-full border p-2 rounded" />
        <input name="bookingSystem" placeholder="Current booking system" className="w-full border p-2 rounded" />
        <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-semibold">
          {loading ? "Sending..." : "Request Demo"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </main>
  );
}