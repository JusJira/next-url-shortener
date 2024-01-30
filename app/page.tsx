import { URLForm } from "@/components/formData";
import { ModeToggle } from "@/components/themeToggle";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <URLForm />
    </main>
  );
}
