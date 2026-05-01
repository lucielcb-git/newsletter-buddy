import { useEffect, useState } from "react";
import { DEFAULT_COMPANY_NAME } from "./settings-api";

const STORAGE_KEY = "newsletter-studio:currentCompany";

type Listener = (name: string) => void;
const listeners = new Set<Listener>();

function read(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_COMPANY_NAME;
  } catch {
    return DEFAULT_COMPANY_NAME;
  }
}

export function getCurrentCompany(): string {
  return read();
}

export function setCurrentCompany(name: string) {
  const value = (name || "").trim() || DEFAULT_COMPANY_NAME;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(value));
}

export function useCurrentCompany(): [string, (name: string) => void] {
  const [name, setName] = useState<string>(() => read());
  useEffect(() => {
    const l: Listener = (n) => setName(n);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [name, setCurrentCompany];
}
