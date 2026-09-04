import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { useFornecedores } from "@/lib/dados";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Listagem de fornecedores — Limpeza Dinâmico" },
      {
        name: "description",
        content: "Lista pronta a imprimir com o nome de todos os fornecedores de limpezas.",
      },
      { property: "og:title", content: "Listagem de fornecedores — Limpeza Dinâmico" },
      { property: "og:description", content: "Nomes de todos os fornecedores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListaFornecedores,
});

function ListaFornecedores() {
  const { data: fornecedores = [] } = useFornecedores();

  return (
    <Shell>
      <div className="overflow-y-auto p-8">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold">Listagem de fornecedores</h1>
              <p className="text-sm text-muted-foreground">
                {fornecedores.length}{" "}
                {fornecedores.length === 1 ? "fornecedor" : "fornecedores"}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary print:hidden"
            >
              Imprimir / PDF
            </button>
          </div>

          {fornecedores.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Ainda não há fornecedores.</p>
          ) : (
            <ol className="mt-4 divide-y divide-border text-sm">
              {fornecedores.map((f, i) => (
                <li key={f.id} className="flex gap-3 py-2">
                  <span className="w-6 text-muted-foreground">{i + 1}.</span>
                  <span className="font-medium">{f.nome}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </Shell>
  );
}
