import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import {
  ESTADO_LABEL,
  MESES,
  MESES_CURTOS,
  criarPredio,
  euro,
  guardarLimpeza,
  guardarNota,
  listarFornecedores,
  listarLimpezasDoAno,
  listarPredios,
  obterNota,
  removerPredio,
  type Estado,
  type Pagamento,
} from "@/lib/limpezas";

type Busca = { ano: number | undefined; mes: number | undefined };

export const Route = createFileRoute("/fornecedor/$id")({
  validateSearch: (search: Record<string, unknown>): Busca => ({
    ano: search["ano"] ? Number(search["ano"]) : undefined,
    mes: search["mes"] ? Number(search["mes"]) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Fornecedor — Limpeza Dinâmico" },
      {
        name: "description",
        content:
          "Controle mês a mês as limpezas de cada fornecedor: valores, pagamentos em numerário ou transferência e o que falta pagar.",
      },
      { property: "og:title", content: "Fornecedor — Limpeza Dinâmico" },
      {
        property: "og:description",
        content: "Pagamentos de limpezas por fornecedor, ano e mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaFornecedor,
});

const ESTADO_CLASSE: Record<Estado, string> = {
  transferencia: "bg-transfer/15 text-transfer-strong border-transfer/30",
  numerario: "bg-cash/15 text-cash-strong border-cash/30",
  pendente: "bg-unpaid/15 text-unpaid-strong border-unpaid/30",
};

function PaginaFornecedor() {
  const { id } = Route.useParams();
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const hoje = new Date();
  const ano = busca.ano ?? hoje.getFullYear();
  const mes = busca.mes ?? hoje.getMonth() + 1;
  const queryClient = useQueryClient();

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: listarFornecedores,
  });
  const fornecedor = fornecedores.find((f) => f.id === id);

  const { data: predios = [] } = useQuery({
    queryKey: ["predios", id],
    queryFn: () => listarPredios(id),
  });

  const { data: limpezas = [] } = useQuery({
    queryKey: ["limpezas", id, ano],
    queryFn: () => listarLimpezasDoAno(id, ano),
  });

  const { data: notaGuardada = "" } = useQuery({
    queryKey: ["nota", id, ano, mes],
    queryFn: () => obterNota(id, ano, mes),
  });

  const [nota, setNota] = useState("");
  useEffect(() => setNota(notaGuardada), [notaGuardada, id, ano, mes]);

  const guardarNotaMut = useMutation({
    mutationFn: () => guardarNota(id, ano, mes, nota),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nota", id, ano, mes] }),
  });

  const linhas = useMemo(
    () =>
      predios.map((p) => {
        const l = limpezas.find((x) => x.predio_id === p.id && x.mes === mes);
        return {
          predio: p,
          valor: l ? l.valor : p.valor,
          estado: (l?.estado ?? "pendente") as Estado,
          observacoes: l?.observacoes ?? "",
        };
      }),
    [predios, limpezas, mes],
  );

  const totais = useMemo(() => {
    let total = 0;
    let transferencia = 0;
    let numerario = 0;
    let falta = 0;
    for (const l of linhas) {
      total += l.valor;
      if (l.estado === "transferencia") transferencia += l.valor;
      else if (l.estado === "numerario") numerario += l.valor;
      else falta += l.valor;
    }
    return { total, transferencia, numerario, falta };
  }, [linhas]);

  const faturacaoAnual = useMemo(() => {
    return MESES_CURTOS.map((_, i) => {

      const doMes = limpezas.filter((l) => l.mes === i + 1);
      if (doMes.length === 0) return null;
      return doMes.reduce((s, l) => s + l.valor, 0);
    });
  }, [limpezas, predios]);

  const gravar = useMutation({
    mutationFn: (v: {
      predio_id: string;
      valor: number;
      estado: Estado;
      observacoes: string;
    }) =>
      guardarLimpeza({
        fornecedor_id: id,
        predio_id: v.predio_id,
        ano,
        mes,
        valor: v.valor,
        estado: v.estado,
        observacoes: v.observacoes,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["limpezas", id, ano] }),
  });

  const apagar = useMutation({
    mutationFn: (predioId: string) => removerPredio(predioId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["predios", id] }),
  });

  const [codigo, setCodigo] = useState("");
  const [morada, setMorada] = useState("");
  const [valor, setValor] = useState("");
  const [pagamentoPadrao, setPagamentoPadrao] = useState<Pagamento>("transferencia");

  const adicionar = useMutation({
    mutationFn: () =>
      criarPredio({
        fornecedor_id: id,
        codigo: codigo.trim(),
        morada: morada.trim(),
        valor: Number(valor.replace(",", ".")) || 0,
        pagamento_padrao: pagamentoPadrao,
      }),
    onSuccess: () => {
      setCodigo("");
      setMorada("");
      setValor("");
      setPagamentoPadrao("transferencia");
      queryClient.invalidateQueries({ queryKey: ["predios", id] });
    },
  });

  const anos = [hoje.getFullYear() + 1, hoje.getFullYear(), hoje.getFullYear() - 1, hoje.getFullYear() - 2];

  function proximoEstado(atual: Estado, padrao: Pagamento): Estado {
    const outro: Pagamento = padrao === "transferencia" ? "numerario" : "transferencia";
    if (atual === "pendente") return padrao;
    if (atual === padrao) return outro;
    return "pendente";
  }

  return (
    <Shell>
      <header className="flex flex-col items-start justify-between gap-4 border-b border-border bg-card px-8 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{fornecedor?.nome ?? "Fornecedor"}</span>
          <span>/</span>
          <span className="font-medium text-foreground">
            {MESES[mes - 1]} {ano}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary p-1">
          {MESES_CURTOS.map((m, i) => (
            <button
              key={m}
              onClick={() => navigate({ search: { ano, mes: i + 1 } })}
              className={
                mes === i + 1
                  ? "rounded-md bg-card px-3 py-1.5 text-xs font-medium shadow-sm"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {m}
            </button>
          ))}
          <select
            value={ano}
            onChange={(e) => navigate({ search: { ano: Number(e.target.value), mes } })}
            className="bg-transparent px-2 text-xs font-medium text-muted-foreground outline-none"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="space-y-8 overflow-y-auto p-8">
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (morada.trim()) adicionar.mutate();
          }}
          className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="min-w-[120px] flex-1">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">
              Código Prédio
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: 005"
              className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="min-w-[200px] flex-[2]">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">
              Morada / Rua
            </label>
            <input
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
              placeholder="Ex: Rua das Manteigadas nº41"
              className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="w-32">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">
              Valor (€)
            </label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="w-40">
            <label className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">
              Pagamento normal
            </label>
            <select
              value={pagamentoPadrao}
              onChange={(e) => setPagamentoPadrao(e.target.value as Pagamento)}
              className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="transferencia">Transferência</option>
              <option value="numerario">Numerário</option>
            </select>
          </div>
          <button className="cursor-pointer rounded-lg bg-brand px-6 py-2 font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90">
            Adicionar
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary font-medium text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Cód</th>
                <th className="px-6 py-4">Morada</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Estado / Pagamento</th>
                <th className="px-6 py-4">Observações</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.predio.id} className="group transition-colors hover:bg-secondary/60">
                  <td className="px-6 py-4 font-bold text-muted-foreground">{l.predio.codigo}</td>
                  <td className="px-6 py-4">{l.predio.morada}</td>
                  <td className="px-6 py-4 text-right font-semibold">
                    <input
                      defaultValue={l.valor.toFixed(2)}
                      key={`${l.predio.id}-${ano}-${mes}-${l.valor}`}
                      onBlur={(e) => {
                        const v = Number(e.target.value.replace(",", ".")) || 0;
                        if (v !== l.valor)
                          gravar.mutate({
                            predio_id: l.predio.id,
                            valor: v,
                            estado: l.estado,
                            observacoes: l.observacoes,
                          });
                      }}
                      className="w-24 rounded-md border border-transparent bg-transparent px-2 py-1 text-right outline-none hover:border-border focus:border-border focus:ring-2 focus:ring-brand/20"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={l.estado}
                      onChange={(e) =>
                        gravar.mutate({
                          predio_id: l.predio.id,
                          valor: l.valor,
                          estado: e.target.value as Estado,
                          observacoes: l.observacoes,
                        })
                      }
                      className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium outline-none ${ESTADO_CLASSE[l.estado]}`}
                    >
                      <option value="pendente">{ESTADO_LABEL.pendente}</option>
                      <option value="transferencia">{ESTADO_LABEL.transferencia}</option>
                      <option value="numerario">{ESTADO_LABEL.numerario}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      defaultValue={l.observacoes}
                      key={`obs-${l.predio.id}-${ano}-${mes}-${l.observacoes}`}
                      placeholder="—"
                      onBlur={(e) => {
                        if (e.target.value !== l.observacoes)
                          gravar.mutate({
                            predio_id: l.predio.id,
                            valor: l.valor,
                            estado: l.estado,
                            observacoes: e.target.value,
                          });
                      }}
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-muted-foreground outline-none hover:border-border focus:border-border focus:ring-2 focus:ring-brand/20"
                    />
                  </td>
                  <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => apagar.mutate(l.predio.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Ainda não há prédios. Adicione o primeiro acima.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Observações de {MESES[mes - 1]} {ano}
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onBlur={() => {
              if (nota !== notaGuardada) guardarNotaMut.mutate();
            }}
            placeholder="Notas sobre pagamentos, retiradas, garagens..."
            className="mt-2 min-h-[100px] w-full rounded-lg border border-border bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <section className="pt-4">
          <h2 className="mb-6 text-lg font-bold">Resumo de Faturação Mensal ({ano})</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12">
            {MESES_CURTOS.map((m, i) => {
              const v = faturacaoAnual[i] ?? null;
              const atual = mes === i + 1;
              return (
                <button
                  key={m}
                  onClick={() => navigate({ search: { ano, mes: i + 1 } })}
                  className={
                    atual
                      ? "rounded-lg border border-brand/20 bg-brand/5 p-3 text-center ring-2 ring-brand/20 ring-offset-1"
                      : v === null
                        ? "rounded-lg border border-border bg-secondary p-3 text-center opacity-50"
                        : "rounded-lg border border-border bg-card p-3 text-center"
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
                  <div
                    className={
                      atual ? "mt-1 text-sm font-bold text-brand" : "mt-1 text-sm font-bold"
                    }
                  >
                    {v === null ? "—" : euro(v)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}
