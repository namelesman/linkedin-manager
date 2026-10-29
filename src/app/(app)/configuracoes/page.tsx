import { requireUser } from "@/lib/session";
import { VoiceToneForm } from "./voice-tone-form";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <section>
        <VoiceToneForm initial={user.voiceTone} />
      </section>
    </div>
  );
}
