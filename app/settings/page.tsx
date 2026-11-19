"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setForm(d.business || {});
      setLoading(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        bookingUrl: form.bookingUrl,
        brandingColor: form.brandingColor,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        reminderInterval: form.reminderInterval,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
  }

  if (loading) return <main className="p-8">Loading...</main>;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-8 rounded-xl shadow-sm border">
        <label className="block">
          <span className="text-sm text-gray-600">Business name</span>
          <input className="w-full border p-2 rounded mt-1" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Booking URL</span>
          <input className="w-full border p-2 rounded mt-1" value={form.bookingUrl || ""} onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Reminder interval (days)</span>
          <input type="number" className="w-full border p-2 rounded mt-1" value={form.reminderInterval ?? 21} onChange={(e) => setForm({ ...form, reminderInterval: Number(e.target.value) })} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Branding color</span>
          <input className="w-full border p-2 rounded mt-1" value={form.brandingColor || "#2563eb"} onChange={(e) => setForm({ ...form, brandingColor: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Contact email</span>
          <input className="w-full border p-2 rounded mt-1" value={form.contactEmail || ""} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Contact phone</span>
          <input className="w-full border p-2 rounded mt-1" value={form.contactPhone || ""} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        </label>
        <button disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold">
          {saving ? "Saving..." : "Save"}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </form>
    </main>
  );
}