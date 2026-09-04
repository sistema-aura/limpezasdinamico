import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { MESES, MESES_CURTOS } from "@/lib/limpezas";
import { useFornecedores } from "@/lib/dados";

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
  component: LayoutFornecedor,
});

export function usePeriodo() {
  const busca = Route.useSearch();
  const hoje = new Date();
  return {
    ano: busca.ano ?? hoje.getFullYear(),
    mes: busca.mes ?? hoje.getMonth() + 1,
  };
}

function LayoutFornecedor() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const { ano, mes } = usePeriodo();
  const { data: fornecedores = [] } = useFornecedores();
  const fornecedor = fornecedores.find((f) => f.id === id);
  const hoje = new Date();
  const anos = [
    hoje.getFullYear() + 1,
    hoje.getFullYear(),
    hoje.getFullYear() - 1,
    hoje.getFullYear() - 2,
  ];

  return (
    <Shell>
      <header className="flex flex-col items-start justify-between gap-4 border-b border-border bg-card px-8 py-4 sm:flex-row sm:items-center print:hidden">
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
                  ? "cursor-pointer rounded-md bg-card px-3 py-1.5 text-xs font-medium shadow-sm"
                  : "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {m}
            </button>
          ))}
          <select
            value={ano}
            onChange={(e) => navigate({ search: { ano: Number(e.target.value), mes } })}
            className="cursor-pointer bg-transparent px-2 text-xs font-medium text-muted-foreground outline-none"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="overflow-y-auto p-8">
        <Outlet />
      </div>
    </Shell>
  );
}
