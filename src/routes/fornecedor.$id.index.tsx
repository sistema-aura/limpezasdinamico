import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ESTADO_CLASSE, dadosLinha, useDadosFornecedor, type Linha } from "@/lib/dados";
import { usePeriodo } from "./fornecedor.$id";
import { euro, guardarLimpeza, obterNota, type Pagamento } from "@/lib/limpezas";

export const Route = createFileRoute("/fornecedor/$id/")({
  head: () => ({
    meta: [
      { title: "Limpezas do mês — Limpeza Dinâmico" },
      {
        name: "description",
        content: "Marque as limpezas pagas e em falta, com valores e observações por prédio.",
      },
      { property: "og:title", content: "Limpezas do mês — Limpeza Dinâmico" },
      { property: "og:description", content: "Limpezas pagas e em falta, mês a mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Limpezas,
});

function Limpezas() {
  const { id } = Route.useParams();
  const { ano, mes } = usePeriodo();
  const queryClient = useQueryClient();
  const { linhas, totais } = useDadosFornecedor(id, ano, mes);

  const { data: nota = "" } = useQuery({
    queryKey: ["nota", id, ano, mes],
    queryFn: () => obterNota(id, ano, mes),
  });

  const gravar = useMutation({
    mutationFn: (v: { l: Linha; m: Parameters<typeof dadosLinha>[1] }) =>
      guardarLimpeza({ fornecedor_id: id, ano, mes, ...dadosLinha(v.l, v.m) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["limpezas", id, ano] }),
  });

  return (
    <div className="space-y-8">
      {nota.trim() && (
        <Link
          to="/fornecedor/$id/observacoes"
          params={{ id }}
          search={{ ano, mes }}
          className="block rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm hover:bg-brand/10"
        >
          <span className="font-semibold">📝 Há observações neste mês:</span>{" "}
          <span className="text-muted-foreground">
            {nota.length > 140 ? nota.slice(0, 140) + "…" : nota}
          </span>
        </Link>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total Mês</p>
          <p className="mt-1 text-2xl font-bold">{euro(totais.total)}</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-transfer bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Transferência</p>
          <p className="mt-1 text-2xl font-bold">{euro(totais.transferencia)}</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-cash bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Numerário</p>
          <p className="mt-1 text-2xl font-bold">{euro(totais.numerario)}</p>
        </div>
        <div className="rounded-xl border border-unpaid/20 border-l-4 border-l-unpaid bg-unpaid-soft p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-unpaid-strong">Por Pagar</p>
          <p className="mt-1 text-2xl font-bold text-unpaid-strong">{euro(totais.falta)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-secondary font-medium text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Cód</th>
              <th className="px-6 py-4">Morada</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4">Pagamento (este mês)</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linhas.map((l) => (
              <tr key={l.predio.id} className="group hover:bg-secondary/40">
                <td className="px-6 py-4 font-bold text-muted-foreground">{l.predio.codigo}</td>
                <td className="px-6 py-4 font-medium">{l.predio.morada}</td>
                <td className="px-6 py-4 text-right">
                  <input
                    defaultValue={l.valor}
                    key={`val-${l.predio.id}-${ano}-${mes}-${l.valor}`}
                    onBlur={(e) => {
                      const v = Number(e.target.value.replace(",", ".")) || 0;
                      if (v !== l.valor)
gravar.mutate({ l, m: { valor: v } });
                    }}
                    className="w-24 rounded-md border border-transparent bg-transparent px-2 py-1 text-right outline-none hover:border-border focus:border-border focus:ring-2 focus:ring-brand/20"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={l.pagamento}
                    onChange={(e) =>
                      gravar.mutate({ l, m: { pagamento: e.target.value as Pagamento } })

                    }
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium outline-none ${ESTADO_CLASSE[l.pagamento]}`}
                  >
                    <option value="transferencia">Transferência</option>
                    <option value="numerario">Numerário</option>
                  </select>
                  {l.pagamento !== l.habitual && (
                    <span className="ml-2 text-[10px] uppercase text-muted-foreground">só este mês</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() =>
gravar.mutate({ l, m: { pago: !l.pago } })
                    }
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${
                      l.pago ? ESTADO_CLASSE[l.pagamento] : ESTADO_CLASSE.pendente
                    }`}
                  >
                    {l.pago ? "Pago" : "Falta pagar"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                  {l.observacoes.trim() && (
                    <span title="Tem observações" className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                  )}
                  <input
                    defaultValue={l.observacoes}
                    key={`obs-${l.predio.id}-${ano}-${mes}-${l.observacoes}`}
                    placeholder="—"
                    onBlur={(e) => {
                      if (e.target.value !== l.observacoes)
gravar.mutate({ l, m: { observacoes: e.target.value } });
                    }}
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-muted-foreground outline-none hover:border-border focus:border-border focus:ring-2 focus:ring-brand/20"
                  />
                  </div>
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  Ainda não há prédios. Adicione na secção "Prédios".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
