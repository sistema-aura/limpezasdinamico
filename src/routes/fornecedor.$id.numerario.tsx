import { createFileRoute } from "@tanstack/react-router";
import { useDadosFornecedor } from "@/lib/dados";
import { usePeriodo } from "./fornecedor.$id";
import { MESES, euro } from "@/lib/limpezas";

export const Route = createFileRoute("/fornecedor/$id/numerario")({
  head: () => ({
    meta: [
      { title: "Pagamentos em numerário — Limpeza Dinâmico" },
      {
        name: "description",
        content:
          "Lista pronta a imprimir dos prédios que se pagam em numerário e ainda estão por pagar.",
      },
      { property: "og:title", content: "Pagamentos em numerário — Limpeza Dinâmico" },
      { property: "og:description", content: "Pagamentos em numerário por fazer no mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Numerario,
});

function Numerario() {
  const { id } = Route.useParams();
  const { ano, mes } = usePeriodo();
  const { fornecedor, porNumerario } = useDadosFornecedor(id, ano, mes);

  return (
    <section className="rounded-xl border border-cash/30 bg-card p-6 shadow-sm print:border-0 print:shadow-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">
            Pagamentos em numerário — {MESES[mes - 1]} {ano}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fornecedor?.nome} · prédios que se pagam em numerário e ainda estão por pagar
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary print:hidden"
        >
          Imprimir / PDF
        </button>
      </div>

      {porNumerario.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Não há pagamentos em numerário pendentes neste mês.
        </p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2">Cód</th>
              <th className="py-2">Morada</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {porNumerario.map((l) => (
              <tr key={l.predio.id}>
                <td className="py-2 font-bold text-muted-foreground">{l.predio.codigo}</td>
                <td className="py-2">{l.predio.morada}</td>
                <td className="py-2 text-right font-semibold">{euro(l.valor)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-bold" colSpan={2}>
                Total
              </td>
              <td className="py-2 text-right font-bold">
                {euro(porNumerario.reduce((s, l) => s + l.valor, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}
