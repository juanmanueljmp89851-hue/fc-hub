"use client";

import { RouteError } from "@/components/layout/RouteError";

export default function Error({ reset }: { reset: () => void }) {
  return <RouteError sectionName="notificaciones" reset={reset} />;
}
