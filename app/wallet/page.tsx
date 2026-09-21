"use client";
import { useState } from "react";
import QRCode from "qrcode";

type Citizen = { id: string; name: string };

export default function WalletPage() {
  const [nin, setNin] = useState("");
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  const [challengeInput, setChallengeInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    setLoadingLookup(true);
    setLookupError(null);
    setCitizen(null);
    try {
      const res = await fetch(`/api/citizens?nin=${encodeURIComponent(nin.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setCitizen(data);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoadingLookup(false);
    }
  }

  async function handleCheckChallenge() {
    setError(null);
    setPendingQuestion(null);
    if (!challengeInput.trim()) return;
    try {
      const res = await fetch(`/api/challenge/${encodeURIComponent(challengeInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown challenge");
      setPendingQuestion(data.questionText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not look up that challenge");
    }
  }

  async function handleProve() {
    if (!citizen) {
      setError("Look up your record first.");
      return;
    }
    if (!challengeInput.trim() || !pendingQuestion) {
      setError("Check the challenge code first so you know what's being asked.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const credRes = await fetch("/api/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId: citizen.id, question: (await peekQuestionId()) }),
      });
      if (!credRes.ok) throw new Error((await credRes.json()).error || "Could not get credential");
      const { token: credentialToken } = await credRes.json();

      const bindRes = await fetch("/api/present", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId: citizen.id, nonce: challengeInput.trim() }),
      });
      if (!bindRes.ok) throw new Error((await bindRes.json()).error || "Could not sign the challenge");
      const { bindingToken } = await bindRes.json();

      const combined = JSON.stringify({ credentialToken, bindingToken });
      setPresentation(combined);
      setQrDataUrl(await QRCode.toDataURL(combined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch the question id (not just its label) right before issuing,
  // so /api/issue gets "over18" rather than the display string.
  async function peekQuestionId(): Promise<string> {
    const res = await fetch(`/api/challenge/${encodeURIComponent(challengeInput.trim())}`);
    const data = await res.json();
    return data.question;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Citizen Wallet</h1>

      <div className="flex gap-2 w-72">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Your National ID number"
          value={nin}
          onChange={(e) => setNin(e.target.value)}
        />
        <button
          onClick={handleLookup}
          disabled={loadingLookup || !nin.trim()}
          className="bg-gray-800 text-white px-3 py-2 rounded disabled:opacity-50"
        >
          {loadingLookup ? "…" : "Load"}
        </button>
      </div>
      {lookupError && <p className="text-red-600 text-sm">{lookupError}</p>}
      {citizen && <p className="text-sm text-gray-600">Signed in as {citizen.name}</p>}

      {citizen && (
        <>
          <div className="flex gap-2 w-72">
            <input
              className="border rounded px-3 py-2 flex-1 text-sm"
              placeholder="Challenge code from the counter"
              value={challengeInput}
              onChange={(e) => {
                setChallengeInput(e.target.value);
                setPendingQuestion(null);
                setPresentation(null);
                setQrDataUrl(null);
              }}
            />
            <button
              onClick={handleCheckChallenge}
              className="bg-gray-200 px-3 py-2 rounded text-sm"
            >
              Check
            </button>
          </div>

          {pendingQuestion && (
            <p className="text-sm text-gray-700">They're asking: <strong>{pendingQuestion}</strong></p>
          )}

          <button
            onClick={handleProve}
            disabled={loading || !pendingQuestion}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Proving…" : "Answer this question"}
          </button>
        </>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {qrDataUrl && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <img src={qrDataUrl} alt="Proof QR code" width={220} height={220} />
          <p className="text-xs text-gray-500 max-w-xs text-center break-all">{presentation}</p>
        </div>
      )}
    </main>
  );
}