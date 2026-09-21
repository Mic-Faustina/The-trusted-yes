import crypto from "crypto";
import type { QuestionId } from "@/lib/auth";

type ChallengeRecord = { issuedAt: number; used: boolean; question: QuestionId };

const challenges = new Map<string, ChallengeRecord>();
const CHALLENGE_TTL_MS = 2 * 60 * 1000;

export function issueChallenge(question: QuestionId): string {
  const nonce = crypto.randomBytes(16).toString("base64url");
  challenges.set(nonce, { issuedAt: Date.now(), used: false, question });
  return nonce;
}

export function consumeChallenge(
  nonce: string
): { ok: true; question: QuestionId } | { ok: false; reason: string } {
  const record = challenges.get(nonce);
  if (!record) return { ok: false, reason: "Unknown challenge" };
  if (record.used) return { ok: false, reason: "Challenge already used" };
  if (Date.now() - record.issuedAt > CHALLENGE_TTL_MS)
    return { ok: false, reason: "Challenge expired" };
  record.used = true;
  return { ok: true, question: record.question };
}

export function peekQuestion(nonce: string): QuestionId | null {
  return challenges.get(nonce)?.question ?? null;
}