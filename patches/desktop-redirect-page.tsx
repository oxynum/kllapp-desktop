"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { KllappLogo } from "@/components/ui/kllapp-logo";

export default function DesktopRedirectPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  useEffect(() => {
    if (url) {
      window.location.href = url;
    }
  }, [url]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <KllappLogo className="h-8 w-auto" color="#111827" />
        <p className="text-sm text-gray-400">Connexion à {url ?? "kllapp.com"}...</p>
      </div>
    </div>
  );
}
