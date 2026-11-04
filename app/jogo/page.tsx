import Link from "next/link";
import PlatformerCanvas from "@/components/Game/PlatformerCanvas";

export default function JogoPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[800px] flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-rose-400 transition"
        >
          ← Voltar ao Início
        </Link>
        <h1 className="text-lg font-semibold text-rose-500">
          A Nossa Aventura 2D
        </h1>
      </div>

      <PlatformerCanvas />
    </main>
  );
}