"use client";
import { useState } from "react";

const STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo"]; // extend as needed

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", dob: "", nin: "", state: STATES[0] });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/citizens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }
      setStatus("done");
      setMessage(`Registered — internal ref ${data.id}`);
      setForm({ name: "", dob: "", nin: "", state: STATES[0] });
    } catch {
      setStatus("error");
      setMessage("Could not reach the server");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Register a Citizen</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          className="border rounded px-3 py-2"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={form.dob}
          onChange={(e) => update("dob", e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="National ID number"
          value={form.nin}
          onChange={(e) => update("nin", e.target.value)}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
        >
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Register"}
        </button>
      </form>
      {message && (
        <p className={status === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>
          {message}
        </p>
      )}
    </main>
  );
}