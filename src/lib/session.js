"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "heliport.mahasiswa";

export function getMahasiswa() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMahasiswa(data) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("mahasiswa-changed"));
}

export function isMahasiswaComplete(data) {
  return Boolean(data?.nama?.trim());
}

export function clearMahasiswa() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event("mahasiswa-changed"));
}

// React hook that stays in sync with the session value across components.
export function useMahasiswa() {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getMahasiswa());
    const sync = () => setData(getMahasiswa());
    window.addEventListener("mahasiswa-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mahasiswa-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((d) => setMahasiswa(d), []);
  const clear = useCallback(() => clearMahasiswa(), []);

  return { mahasiswa: data, save, clear };
}
