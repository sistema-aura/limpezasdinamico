import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDadosFornecedor } from "@/lib/dados";
import { usePeriodo } from "./fornecedor.$id";
import {
  MESES,
  MESES_CURTOS,
  apagarFaturacao,
  euro,
  guardarFaturacao,
  listarFaturacao,
  obterContasCertas,
  guardarContasCertas,
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

  const { data: certas } = useQuery({
    queryKey: ["contas-certas", id, ano],
    queryFn: () => obterContasCertas(id, ano),
  });

  const [ateMes, setAteMes] = useState(0);
  const [valorCertas, setValorCertas] = useState("");
  const [notaCertas, setNotaCertas] = useState("");

  useEffect(() => {
    setAteMes(certas?.ate_mes ?? 0);
    setValorCertas(certas?.valor ? String(certas.valor) : "");
    setNotaCertas(certas?.nota ?? "");
  }, [certas, ano, id]);

  const gravarCertas = useMutation({
    mutationFn: (dados: { ate_mes: number; valor: number; nota: string }) =>
      guardarContasCertas(id, ano, dados),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contas-certas", id, ano] }),
  });

  const guardar = () =>
    gravarCertas.mutate({
      ate_mes: ateMes,
      valor: valorCertas.trim() === "" ? 0 : Number(valorCertas),
      nota: notaCertas,
    });

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

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase text-muted-foreground">
              Contas certas até
            </div>
            <select
              value={ateMes}
              onChange={(e) => setAteMes(Number(e.target.value))}
              className="mt-1 cursor-pointer rounded-md border border-border bg-background px-2 py-1.5 text-sm font-semibold outline-none focus:border-brand"
            >
              <option value={0}>Nenhum mês</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-muted-foreground">
              Valor devolvido
            </div>
            <input
              type="number"
              step="0.01"
              value={valorCertas}
              onChange={(e) => setValorCertas(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-semibold outline-none focus:border-brand"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="text-[11px] font-bold uppercase text-muted-foreground">Nota</div>
            <input
              value={notaCertas}
              onChange={(e) => setNotaCertas(e.target.value)}
              placeholder="Ex.: percentagem devolvida de Jan a Abr"
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={guardar}
            disabled={gravarCertas.isPending}
            className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90"
          >
            Guardar
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {ateMes > 0
            ? `Contas certas até ${MESES[ateMes - 1]} de ${ano}.`
            : "Ainda não há meses com contas certas neste ano."}
        </p>
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
