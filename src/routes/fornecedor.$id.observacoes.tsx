import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePeriodo } from "./fornecedor.$id";
import { MESES, guardarNota, obterNota } from "@/lib/limpezas";

export const Route = createFileRoute("/fornecedor/$id/observacoes")({
  head: () => ({
    meta: [
      { title: "Observações — Limpeza Dinâmico" },
      {
        name: "description",
        content: "Notas do mês sobre pagamentos, retiradas e outros detalhes do fornecedor.",
      },
      { property: "og:title", content: "Observações — Limpeza Dinâmico" },
      { property: "og:description", content: "Notas mensais por fornecedor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Observacoes,
});

function Observacoes() {
  const { id } = Route.useParams();
  const { ano, mes } = usePeriodo();
  const queryClient = useQueryClient();

  const { data: notaGuardada = "" } = useQuery({
    queryKey: ["nota", id, ano, mes],
    queryFn: () => obterNota(id, ano, mes),
  });

  const [nota, setNota] = useState("");
  useEffect(() => setNota(notaGuardada), [notaGuardada, id, ano, mes]);

  const guardar = useMutation({
    mutationFn: () => guardarNota(id, ano, mes, nota),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nota", id, ano, mes] }),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-lg font-bold">
        Observações de {MESES[mes - 1]} {ano}
      </h1>
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        onBlur={() => {
          if (nota !== notaGuardada) guardar.mutate();
        }}
        placeholder="Notas sobre pagamentos, retiradas, garagens..."
        className="mt-3 min-h-[220px] w-full rounded-lg border border-border bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-brand/20"
      />
      <p className="mt-2 text-xs text-muted-foreground">Guarda automaticamente ao sair do campo.</p>
    </div>
  );
}
