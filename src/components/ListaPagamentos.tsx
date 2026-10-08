import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dadosLinha, useDadosFornecedor, type Linha } from "@/lib/dados";
import { usePeriodo } from "@/routes/fornecedor.$id";
import { MESES, euro, guardarLimpeza, type Pagamento } from "@/lib/limpezas";

const dataPt = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso))
    : "—";

export function ListaPagamentos({ id, metodo }: { id: string; metodo: Pagamento }) {
  const { ano, mes } = usePeriodo();
  const queryClient = useQueryClient();
  const { fornecedor, linhas } = useDadosFornecedor(id, ano, mes);
  const doMetodo = linhas.filter((l) => l.pagamento === metodo);
  const pendentes = doMetodo.filter((l) => !l.pago);
  const pagos = doMetodo.filter((l) => l.pago);
  const titulo = metodo === "transferencia" ? "Transferências a fazer" : "Pagamentos em numerário";
  const borda = metodo === "transferencia" ? "border-transfer/30" : "border-cash/30";

  const marcar = useMutation({
    mutationFn: (v: { l: Linha; pago: boolean }) =>
      guardarLimpeza({ fornecedor_id: id, ano, mes, ...dadosLinha(v.l, { pago: v.pago }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["limpezas", id, ano] }),
  });

  return (
    <div className="space-y-6">
      <section className={`rounded-xl border ${borda} bg-card p-6 shadow-sm print:border-0 print:shadow-none`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">
              {titulo} — {MESES[mes - 1]} {ano}
            </h1>
            <p className="text-sm text-muted-foreground">{fornecedor?.nome} · por pagar</p>
          </div>
          <button
            onClick={() => window.print()}
            className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary print:hidden"
          >
            Imprimir / PDF
          </button>
        </div>

        {pendentes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nada por pagar neste mês.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Cód</th>
                <th className="py-2">Morada</th>
                <th className="py-2 text-right">Valor</th>
                <th className="py-2 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendentes.map((l) => (
                <tr key={l.predio.id}>
                  <td className="py-2 font-bold text-muted-foreground">{l.predio.codigo}</td>
                  <td className="py-2">{l.predio.morada}</td>
                  <td className="py-2 text-right font-semibold">{euro(l.valor)}</td>
                  <td className="py-2 text-right print:hidden">
                    <button
                      onClick={() => marcar.mutate({ l, pago: true })}
                      className="cursor-pointer rounded-md bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground hover:bg-brand/90"
                    >
                      Marcar pago
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-bold" colSpan={2}>Total</td>
                <td className="py-2 text-right font-bold">
                  {euro(pendentes.reduce((s, l) => s + l.valor, 0))}
                </td>
                <td className="print:hidden" />
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm print:border-0 print:shadow-none">
        <h2 className="font-bold">Registo de pagos — {MESES[mes - 1]} {ano}</h2>
        {pagos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Ainda nenhum pago neste mês.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Cód</th>
                <th className="py-2">Morada</th>
                <th className="py-2 text-right">Valor</th>
                <th className="py-2">Pago em</th>
                <th className="py-2 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagos.map((l) => (
                <tr key={l.predio.id}>
                  <td className="py-2 font-bold text-muted-foreground">{l.predio.codigo}</td>
                  <td className="py-2">{l.predio.morada}</td>
                  <td className="py-2 text-right font-semibold">{euro(l.valor)}</td>
                  <td className="py-2 text-muted-foreground">{dataPt(l.pagoEm)}</td>
                  <td className="py-2 text-right print:hidden">
                    <button
                      onClick={() => marcar.mutate({ l, pago: false })}
                      className="cursor-pointer text-xs text-muted-foreground hover:text-destructive"
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-bold" colSpan={2}>Total pago</td>
                <td className="py-2 text-right font-bold">
                  {euro(pagos.reduce((s, l) => s + l.valor, 0))}
                </td>
                <td className="print:hidden" colSpan={2} />
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
