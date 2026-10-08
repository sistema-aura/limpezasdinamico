import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import {
  MESES,
  euro,
  listarLimpezasDoMes,
  listarTodosPredios,
} from "@/lib/limpezas";
import { periodoPorDefeito } from "@/lib/limpezas";

export const Route = createFileRoute("/em-falta")({
  head: () => ({
    meta: [
      { title: "Pagamentos em falta — Limpeza Dinâmico" },
      {
        name: "description",
        content:
          "Veja todos os prédios de todos os fornecedores que ainda estão por pagar no mês escolhido.",
      },
      { property: "og:title", content: "Pagamentos em falta — Limpeza Dinâmico" },
      {
        property: "og:description",
        content: "Todos os prédios por pagar no mês escolhido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmFalta,
});

function EmFalta() {
  const hoje = new Date();
  const [ano, setAno] = useState(periodoPorDefeito().ano);
  const [mes, setMes] = useState(periodoPorDefeito().mes);

  const { data: predios = [] } = useQuery({
    queryKey: ["predios-todos"],
    queryFn: listarTodosPredios,
  });
  const { data: limpezas = [] } = useQuery({
    queryKey: ["limpezas-mes", ano, mes],
    queryFn: () => listarLimpezasDoMes(ano, mes),
  });

  const grupos = useMemo(() => {
    const emFalta = predios
      .map((p) => {
        const l = limpezas.find((x) => x.predio_id === p.id);
        return {
          predio: p,
          valor: l ? l.valor : p.valor,
          pago: (l?.estado ?? "pendente") !== "pendente",
          pagamento: l?.pagamento ?? p.pagamento_padrao,
        };
      })
      .filter((l) => !l.pago);

    const mapa = new Map<string, typeof emFalta>();
    for (const l of emFalta) {
      const chave = l.predio.fornecedor_nome;
      const lista = mapa.get(chave) ?? [];
      lista.push(l);
      mapa.set(chave, lista);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [predios, limpezas]);

  const total = grupos.reduce(
    (s, [, linhas]) => s + linhas.reduce((x, l) => x + l.valor, 0),
    0,
  );

  const anos = [hoje.getFullYear() + 1, hoje.getFullYear(), hoje.getFullYear() - 1];

  return (
    <Shell>
      <div className="overflow-y-auto p-8">
        <section className="rounded-xl border border-unpaid/30 bg-card p-6 shadow-sm print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold">
                Pagamentos em falta — {MESES[mes - 1]} {ano}
              </h1>
              <p className="text-sm text-muted-foreground">
                Todos os prédios por pagar, de todos os fornecedores.
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="cursor-pointer rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none"
              >
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="cursor-pointer rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
              >
                Imprimir / PDF
              </button>
            </div>
          </div>

          {grupos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Não há pagamentos em falta neste mês.
            </p>
          ) : (
            <>
              {grupos.map(([nome, linhas]) => (
                <div key={nome} className="mt-6">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    {nome}
                  </h2>
                  <table className="mt-2 w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">Cód</th>
                        <th className="py-2">Morada</th>
                        <th className="py-2">Pagamento habitual</th>
                        <th className="py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {linhas.map((l) => (
                        <tr key={l.predio.id}>
                          <td className="py-2 font-bold text-muted-foreground">
                            {l.predio.codigo}
                          </td>
                          <td className="py-2">{l.predio.morada}</td>
                          <td className="py-2 text-muted-foreground">
                            {l.pagamento === "transferencia"
                              ? "Transferência"
                              : "Numerário"}
                          </td>
                          <td className="py-2 text-right font-semibold">{euro(l.valor)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-2 font-semibold" colSpan={3}>
                          Subtotal
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {euro(linhas.reduce((s, l) => s + l.valor, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
              <p className="mt-6 border-t border-border pt-3 text-right text-base font-bold">
                Total em falta: {euro(total)}
              </p>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
