"use client";

import { RouteError } from "@/components/layout/RouteError";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <RouteError sectionName="Jugadores" reset={reset} />;
}
