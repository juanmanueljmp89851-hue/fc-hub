"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { joinProdeByCode, getProdeByShareCode } from "@/lib/actions/prode";

function UnirseProdeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prodeName, setProdeName] = useState("");

  useEffect(() => {
    if (codeFromUrl) {
      loadProdeInfo(codeFromUrl);
    }
  }, [codeFromUrl]);

  async function loadProdeInfo(shareCode: string) {
    const prode = await getProdeByShareCode(shareCode);
    if (prode) {
      setProdeName(prode.name);
    }
  }

  async function handleJoin() {
    if (!code) return;
    setLoading(true);
    setError("");

    const result = await joinProdeByCode(code);

    if (result.error) {
      setError(result.error);
      if (result.prodeId) {
        router.push(`/prode/${result.prodeId}`);
        return;
      }
    } else if (result.prodeId) {
      router.push(`/prode/${result.prodeId}`);
      return;
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="text-center">
        <h1 className="text-2xl font-bold">Unirse a un Prode</h1>

        {prodeName && (
          <p className="mt-2 text-lg text-accent">{prodeName}</p>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código (8 caracteres)"
            className="w-full rounded-lg border border-surface-light bg-background px-4 py-3 text-center text-lg font-mono text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
            maxLength={8}
          />

          <button
            onClick={handleJoin}
            disabled={loading || code.length < 6}
            className="w-full rounded-lg bg-accent py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Uniéndote..." : "Unirme al Prode"}
          </button>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      </Card>
    </main>
  );
}

export default function UnirseProdePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Suspense
        fallback={
          <main className="mx-auto max-w-md px-4 py-16">
            <Card className="text-center">
              <div className="h-8 w-48 mx-auto animate-pulse rounded-lg bg-surface" />
              <div className="mt-6 h-12 animate-pulse rounded-lg bg-surface" />
              <div className="mt-4 h-12 animate-pulse rounded-lg bg-surface" />
            </Card>
          </main>
        }
      >
        <UnirseProdeContent />
      </Suspense>
    </div>
  );
}
