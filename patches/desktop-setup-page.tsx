/**
 * Desktop setup page — choose between offline and online mode.
 *
 * USAGE: Copied to kllapp/src/app/(auth)/desktop-setup/page.tsx by setup script.
 */

"use client";

import { useTransition } from "react";
import { KllappLogo } from "@/components/ui/kllapp-logo";
import { setupLocalMode, setupRemoteMode } from "./actions";

export default function DesktopSetupPage() {
  const [isPending, startTransition] = useTransition();

  function handleLocalMode() {
    startTransition(async () => {
      await setupLocalMode();
    });
  }

  function handleRemoteMode() {
    startTransition(async () => {
      await setupRemoteMode();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="flex flex-col items-center gap-3">
          <KllappLogo className="h-8 w-auto" color="#111827" />
          <p className="text-sm text-gray-500">
            Choisissez votre mode de fonctionnement
          </p>
        </div>

        <div className="space-y-3">
          {/* Offline card */}
          <button
            onClick={handleLocalMode}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-200 bg-white p-5 text-left transition hover:border-gray-400 hover:shadow-sm disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Mode local</div>
                <div className="mt-1 text-xs text-gray-500">
                  Travaillez hors ligne. Vos données restent sur votre machine.
                  Aucune connexion internet requise.
                </div>
              </div>
            </div>
          </button>

          {/* Online card */}
          <button
            onClick={handleRemoteMode}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-200 bg-white p-5 text-left transition hover:border-gray-400 hover:shadow-sm disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.73-3.557" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Se connecter à kllapp.com</div>
                <div className="mt-1 text-xs text-gray-500">
                  Accédez à votre organisation en ligne.
                  Connexion via Google ou lien magique.
                </div>
              </div>
            </div>
          </button>
        </div>

        {isPending && (
          <div className="text-center text-sm text-gray-400">
            Chargement...
          </div>
        )}
      </div>
    </div>
  );
}
