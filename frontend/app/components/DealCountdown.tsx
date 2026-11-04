"use client";

import { useEffect, useState } from "react";
import { timeLeft } from "@/lib/format";

/** "Ends in 5h 20m", updated every minute. Renders nothing until mounted to avoid hydration mismatch. */
export default function DealCountdown({ endsAt, className = "" }: { endsAt: string; className?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(timeLeft(endsAt));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!label) return null;
  return <span className={className}>{label}</span>;
}
