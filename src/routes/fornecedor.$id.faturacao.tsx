import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDadosFornecedor } from "@/lib/dados";
import { usePeriodo } from "./fornecedor.$id";
import {
  MESES_CURTOS,
  apagarFaturacao,
  euro,
  guardarFaturacao,
  listarFaturacao,
} from "@/lib/limpezas";

export const Route = createFileRoute("/fornecedor/$id/faturacao")({
  head: () => ({
    meta: [
      { title: "Resumo de faturação — Limpeza Dinâmico" },
      {
        name: "description",
        content: "Faturação mês a mês ao longo do ano para cada fornecedor de limpezas.",
      },
      { property: "og:title", content: "Resumo de faturação — Limpeza Dinâmico" },
      { property: "og:description", content: "Faturação mensal do ano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Faturacao,
});

function Faturacao() {
  const { id } = Route.useParams();
  const { ano, mes } = usePeriodo();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [editar, setEditar] = useState(false);
  const { limpezas, predios } = useDadosFornecedor(id, ano, mes);

  const { data: manuais = [] } = useQuery({
    queryKey: ["faturacao", id, ano],
    queryFn: () => listarFaturacao(id, ano),
  });

  const gravar = useMutation({
    mutationFn: ({ m, valor }: { m: number; valor: number | null }) =>
      valor === null ? apagarFaturacao(id, ano, m) : guardarFaturacao(id, ano, m, valor),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faturacao", id, ano] }),
  });

  const porMes = useMemo(
    () =>
      MESES_CURTOS.map((_, i) => {
        const manual = manuais.find((f) => f.mes === i + 1);
        if (manual) return manual.valor;
        const doMes = limpezas.filter((l) => l.mes === i + 1);
        if (doMes.length === 0) return null;
        // Total faturado do mês: todos os prédios, pagos ou não.
        const total = predios.reduce((s, p) => {
          const l = doMes.find((x) => x.predio_id === p.id);
          return s + (l ? l.valor : p.valor);
        }, 0);
        const extra = doMes
          .filter((l) => !predios.some((p) => p.id === l.predio_id))
          .reduce((s, l) => s + l.valor, 0);
        return total + extra;
      }),
    [limpezas, predios, manuais],
  );

  const totalAno = porMes.reduce<number>((s, v) => s + (v ?? 0), 0);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-lg font-bold">Resumo de Faturação Mensal ({ano})</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Total do ano: <span className="font-bold text-foreground">{euro(totalAno)}</span>
          </p>
          <button
            onClick={() => setEditar((v) => !v)}
            className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
          >
            {editar ? "Concluir" : "Editar totais"}
          </button>
        </div>
      </div>

      {editar && (
        <p className="mb-4 text-sm text-muted-foreground">
          Escreva o total faturado de cada mês. Deixe em branco para voltar ao valor calculado
          pelos prédios.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {MESES_CURTOS.map((m, i) => {
          const v = porMes[i] ?? null;
          const atual = mes === i + 1;

          if (editar) {
            return (
              <div
                key={m}
                className="rounded-lg border border-border bg-card p-4 text-center"
              >
                <div className="text-[10px] font-bold uppercase text-muted-foreground">{m}</div>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={v ?? ""}
                  key={`${m}-${v ?? "vazio"}`}
                  onBlur={(e) => {
                    const t = e.target.value.trim();
                    const novo = t === "" ? null : Number(t);
                    if (novo === v) return;
                    gravar.mutate({ m: i + 1, valor: novo });
                  }}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-center font-bold outline-none focus:border-brand"
                  placeholder="—"
                />
              </div>
            );
          }

          return (
            <button
              key={m}
              onClick={() => navigate({ search: { ano, mes: i + 1 } })}
              className={
                atual
                  ? "cursor-pointer rounded-lg border border-brand/20 bg-brand/5 p-4 text-center ring-2 ring-brand/20 ring-offset-1"
                  : v === null
                    ? "cursor-pointer rounded-lg border border-border bg-secondary p-4 text-center opacity-50"
                    : "cursor-pointer rounded-lg border border-border bg-card p-4 text-center"
              }
            >
              <div
                className={
                  atual
                    ? "text-[10px] font-bold uppercase text-brand"
                    : "text-[10px] font-bold uppercase text-muted-foreground"
                }
              >
                {m}
              </div>
              <div className={atual ? "mt-1 font-bold text-brand" : "mt-1 font-bold"}>
                {v === null ? "—" : euro(v)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
