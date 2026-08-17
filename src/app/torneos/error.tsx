"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/layout/RouteError";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[Torneos Error]", error?.message, error?.stack);
  }, [error]);

  return <RouteError sectionName="Torneos" reset={reset} errorDetail={error?.message} />;
}
