"use client";
import { useState } from "react";

const QUESTIONS: Record<string, string> = {
  over18: "Is this person over 18?",
  over21: "Is this person over 21?",
  verified_human: "Is this a verified real person?",
  "state:Lagos": "Is this person resident in Lagos?",
  "state:Abuja (FCT)": "Is this person resident in Abuja (FCT)?",
};

export default function CounterPage() {
  const [question, setQuestion] = useState(Object.keys(QUESTIONS)[0]);
  const [nonce, setNonce] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<null | {
    ok: boolean; outcome?: string; answer?: boolean; questionText?: string; sub?: string; reason?: string;
  }>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestChallenge() {
    setLoadingChallenge(true);
    setError(null);
    setResult(null);
    setPasted("");
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not get a challenge");
      setNonce(data.nonce);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the challenge endpoint.");
    } finally {
      setLoadingChallenge(false);
    }
  }

  async function checkProof() {
    if (!nonce) {
      setError("Ask a question first — that generates the challenge code.");
      return;
    }
    let parsed: { credentialToken?: string; bindingToken?: string };
    try {
      parsed = JSON.parse(pasted);
    } catch {
      setError("That doesn't look like a valid proof — paste the exact text from the wallet.");
      return;
    }
    if (!parsed.credentialToken || !parsed.bindingToken) {
      setError("Missing credentialToken or bindingToken in the pasted proof.");
      return;
    }

    setLoadingVerify(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialToken: parsed.credentialToken,
          bindingToken: parsed.bindingToken,
          nonce,
        }),
      });
      setResult(await res.json());
    } catch {
      setError("Could not reach the verify endpoint.");
    } finally {
      setLoadingVerify(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Business Counter</h1>

      <select
        className="border rounded px-3 py-2"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value);
          setNonce(null);
          setResult(null);
          setPasted("");
        }}
      >
        {Object.entries(QUESTIONS).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>

      <button
        onClick={requestChallenge}
        disabled={loadingChallenge}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loadingChallenge ? "Asking…" : "Ask this question"}
      </button>

      {nonce && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Challenge code — give this to the citizen's wallet:</p>
          <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded mt-1 select-all">{nonce}</p>
        </div>
      )}

      <textarea
        className="border rounded px-3 py-2 w-full max-w-md h-28 text-xs font-mono"
        placeholder="Paste the proof text from the wallet here"
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
      />

      <button
        onClick={checkProof}
        disabled={loadingVerify || !nonce}
        className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loadingVerify ? "Checking…" : "Check answer"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-gray-500">{result.questionText}</p>
          <div className={`text-3xl font-bold ${
            result.ok ? (result.answer ? "text-green-600" : "text-red-600") : "text-amber-600"
          }`}>
            {result.ok ? (result.answer ? "YES" : "NO") : `REJECTED — ${result.reason ?? result.outcome}`}
          </div>
        </div>
      )}
    </main>
  );
}