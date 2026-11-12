import { URLForm } from "@/components/formData";
import { ModeToggle } from "@/components/themeToggle";

export const runtime = "edge";

export default function Home() {
  // Read the site key on the server and pass it down as a prop. This keeps the
  // server-rendered markup and the hydrated client tree identical even when the
  // environment variable is supplied at runtime rather than build time
  // (NEXT_PUBLIC_* values are normally inlined when the client bundle is built).
  const turnstileSiteKey =
    process.env.TURNSTILE_SITE_KEY ??
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <URLForm turnstileSiteKey={turnstileSiteKey} />
    </main>
  );
}
