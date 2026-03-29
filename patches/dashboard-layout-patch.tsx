import { FloatingNav } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoOnlineButton } from "@/components/ui/go-online-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Electron titlebar safe area — draggable zone for window movement */}
      {process.env.KLLAPP_DESKTOP && (
        <div
          className="relative h-10 w-full shrink-0 bg-gray-50"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <GoOnlineButton />
        </div>
      )}
      <main className="h-full overflow-auto bg-gray-50">{children}</main>
      <FloatingNav />
    </div>
  );
}
