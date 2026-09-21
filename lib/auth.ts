import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const KEY_DIR = path.join(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'public.pem');

function loadOrCreateKeys() {
    if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
        fs.mkdirSync(KEY_DIR, { recursive: true });
        const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
            namedCurve: "P-256",
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
            publicKeyEncoding: { type: "spki", format: "pem" }
        });
        fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
        fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    }
    return {
        privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8'),
        publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8')
    }
}

export const { privateKey: PRIVATE_KEY, publicKey: PUBLIC_KEY } = loadOrCreateKeys();
export const JWT_ALGORITHM = "ES256" as const;
export const ISSUER = "ng-id-authority-mock";

export const QUESTIONS = {
  over18: "Is this person over 18?",
  over21: "Is this person over 21?",
  verified_human: "Is this a verified real person?",
  "state:Lagos": "Is this person resident in Lagos?",
  "state:Abuja (FCT)": "Is this person resident in Abuja (FCT)?",
} as const;

export type QuestionId = keyof typeof QUESTIONS;

export function isQuestionId(q: string): q is QuestionId {
  return q in QUESTIONS;
}

function ageFrom(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthday =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) age--;
  return age;
}

// Answers exactly one question. Never returns the underlying value —
// only the boolean the verifier asked for.
export function answerQuestion(
  citizen: { dob: Date; state: string },
  question: QuestionId
): boolean {
  if (question === "over18") return ageFrom(citizen.dob) >= 18;
  if (question === "over21") return ageFrom(citizen.dob) >= 21;
  if (question === "verified_human") return true;
  if (question.startsWith("state:")) return citizen.state === question.slice(6);
  return false;
}

const HOLDER_KEY_DIR = path.join(process.cwd(), "keys", "holders");

function loadOrCreateHolderKeys(citizenId: string) {
  const dir = path.join(HOLDER_KEY_DIR, citizenId);
  const privPath = path.join(dir, "private.pem");
  const pubPath = path.join(dir, "public.pem");

  if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
    fs.mkdirSync(dir, { recursive: true });
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    fs.writeFileSync(privPath, privateKey);
    fs.writeFileSync(pubPath, publicKey);
  }

  return {
    privateKey: fs.readFileSync(privPath, "utf8"),
    publicKey: fs.readFileSync(pubPath, "utf8"),
  };
}

export function getHolderKeys(citizenId: string) {
  return loadOrCreateHolderKeys(citizenId);
}