import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ESTADO_CLASSE, useDadosFornecedor } from "@/lib/dados";
import { usePeriodo } from "./fornecedor.$id";
import {
  atualizarPagamentoPredio,
  criarPredio,
  euro,
  removerPredio,
  type Pagamento,
} from "@/lib/limpezas";

export const Route = createFileRoute("/fornecedor/$id/predios")({
  head: () => ({
    meta: [
      { title: "Prédios — Limpeza Dinâmico" },
      {
        name: "description",
        content: "Adicione, edite e remova os prédios de cada fornecedor, com valor e forma de pagamento habitual.",
      },
      { property: "og:title", content: "Prédios — Limpeza Dinâmico" },
      { property: "og:description", content: "Lista de prédios por fornecedor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Predios,
});

function Predios() {
  const { id } = Route.useParams();
  const { ano, mes } = usePeriodo();
  const queryClient = useQueryClient();
  const { predios } = useDadosFornecedor(id, ano, mes);

  const [codigo, setCodigo] = useState("");
  const [morada, setMorada] = useState("");
  const [valor, setValor] = useState("");
  const [pagamentoPadrao, setPagamentoPadrao] = useState<Pagamento>("transferencia");

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["predios", id] });

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
      invalidar();
    },
  });

  const apagar = useMutation({
    mutationFn: (predioId: string) => removerPredio(predioId),
    onSuccess: invalidar,
  });

  const mudarPagamento = useMutation({
    mutationFn: (v: { predioId: string; pagamento: Pagamento }) =>
      atualizarPagamentoPredio(v.predioId, v.pagamento),
    onSuccess: invalidar,
  });

  return (
    <div className="space-y-8">
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
            Pagamento habitual
          </label>
          <select
            value={pagamentoPadrao}
            onChange={(e) => setPagamentoPadrao(e.target.value as Pagamento)}
            className="mt-1 w-full cursor-pointer rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="transferencia">Transferência</option>
            <option value="numerario">Numerário</option>
          </select>
        </div>
        <button className="cursor-pointer rounded-lg bg-brand px-6 py-2 font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90">
          Adicionar
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            <span className="font-bold text-foreground">{predios.length}</span> prédio
            {predios.length === 1 ? "" : "s"}
          </p>
          <p>
            Valor base total: <span className="font-bold text-foreground">{euro(predios.reduce((s, p) => s + (p.valor || 0), 0))}</span>
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary font-medium text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Cód</th>
                <th className="px-6 py-4">Morada</th>
                <th className="px-6 py-4 text-right">Valor base</th>
                <th className="px-6 py-4">Pagamento habitual</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
          <tbody className="divide-y divide-border">
            {predios.map((p) => (
              <tr key={p.id} className="group hover:bg-secondary/40">
                <td className="px-6 py-4 font-bold text-muted-foreground">{p.codigo}</td>
                <td className="px-6 py-4 font-medium">{p.morada}</td>
                <td className="px-6 py-4 text-right font-semibold">{euro(p.valor)}</td>
                <td className="px-6 py-4">
                  <select
                    value={p.pagamento_padrao}
                    onChange={(e) =>
                      mudarPagamento.mutate({
                        predioId: p.id,
                        pagamento: e.target.value as Pagamento,
                      })
                    }
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium outline-none ${ESTADO_CLASSE[p.pagamento_padrao]}`}
                  >
                    <option value="transferencia">Transferência</option>
                    <option value="numerario">Numerário</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => apagar.mutate(p.id)}
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {predios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  Ainda não há prédios. Adicione o primeiro acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
