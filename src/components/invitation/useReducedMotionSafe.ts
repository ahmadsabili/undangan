"use client";

import { useEffect, useState } from "react";

/**
 * Preferensi reduced motion yang aman untuk SSR: render pertama selalu `false`
 * (sama dengan server), lalu diperbarui setelah mount. Menghindari hydration mismatch.
 */
export function useReducedMotionSafe() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}
