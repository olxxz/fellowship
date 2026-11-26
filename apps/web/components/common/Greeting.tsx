"use client";

import { useDemo } from "@/lib/demo/store";

export function Greeting({ className }: { className?: string }) {
  const { me } = useDemo();
  return <h2 className={className}>Boa noite, {me.name}</h2>;
}
