import { URLForm } from "@/components/formData";
import { ModeToggle } from "@/components/themeToggle";

export const runtime = "edge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <URLForm />
    </main>
  );
}
