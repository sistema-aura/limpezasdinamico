import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useDadosFornecedor } from "@/lib/dados";
import { usePeriodo } from "./fornecedor.$id";
import { MESES_CURTOS, euro } from "@/lib/limpezas";

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
  const { limpezas } = useDadosFornecedor(id, ano, mes);

  const porMes = useMemo(
    () =>
      MESES_CURTOS.map((_, i) => {
        const doMes = limpezas.filter((l) => l.mes === i + 1);
        if (doMes.length === 0) return null;
        return doMes.reduce((s, l) => s + l.valor, 0);
      }),
    [limpezas],
  );

  const totalAno = porMes.reduce<number>((s, v) => s + (v ?? 0), 0);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-lg font-bold">Resumo de Faturação Mensal ({ano})</h1>
        <p className="text-sm text-muted-foreground">
          Total do ano: <span className="font-bold text-foreground">{euro(totalAno)}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {MESES_CURTOS.map((m, i) => {
          const v = porMes[i] ?? null;
          const atual = mes === i + 1;
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
