import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { criarFornecedor } from "@/lib/limpezas";
import { useFornecedores } from "@/lib/dados";

const SECCOES = [
  { to: "/fornecedor/$id", label: "Limpezas do mês", exact: true },
  { to: "/fornecedor/$id/predios", label: "Prédios", exact: false },
  { to: "/fornecedor/$id/transferencias", label: "Transferências a fazer", exact: false },
  { to: "/fornecedor/$id/observacoes", label: "Observações", exact: false },
  { to: "/fornecedor/$id/faturacao", label: "Resumo de faturação", exact: false },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { id?: string };
  const [aAdicionar, setAAdicionar] = useState(false);
  const [nome, setNome] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const { data: fornecedores = [] } = useFornecedores();

  const resultados = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    if (!t) return [];
    return fornecedores.filter((f) => f.nome.toLowerCase().includes(t));
  }, [fornecedores, pesquisa]);

  const novo = useMutation({
    mutationFn: () => criarFornecedor(nome.trim()),
    onSuccess: () => {
      setNome("");
      setAAdicionar(false);
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    },
  });

  const atual = fornecedores.find((f) => f.id === params.id);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground md:flex-row">
      <aside className="flex w-full flex-col border-b border-border bg-sidebar md:w-64 md:border-r md:border-b-0 print:hidden">
        <div className="border-b border-border p-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-brand">
            Limpeza Dinâmico
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gestão de Limpezas
          </p>
        </div>

        <div className="border-b border-border p-4">
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar fornecedor…"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
          {pesquisa.trim() && (
            <div className="mt-2 space-y-1">
              {resultados.map((f) => (
                <Link
                  key={f.id}
                  to="/fornecedor/$id"
                  params={{ id: f.id }}
                  search={{ ano: undefined, mes: undefined }}
                  onClick={() => setPesquisa("")}
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {f.nome}
                </Link>
              ))}
              {resultados.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">Sem resultados.</p>
              )}
            </div>
          )}
        </div>

        {atual && (
          <nav className="flex-1 space-y-1 p-4">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {atual.nome}
            </div>
            {SECCOES.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                params={{ id: atual.id }}
                search={(prev: { ano?: number | undefined; mes?: number | undefined }) => ({
                  ano: prev.ano,
                  mes: prev.mes,
                })}
                activeOptions={{ exact: s.exact, includeSearch: false }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary data-[status=active]:bg-brand/10 data-[status=active]:font-medium data-[status=active]:text-brand"
              >
                {s.label}
              </Link>
            ))}
          </nav>
        )}
        {!atual && <div className="flex-1" />}

        <div className="border-t border-border p-4">
          {aAdicionar ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nome.trim()) novo.mutate();
              }}
              className="space-y-2"
            >
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do fornecedor"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 cursor-pointer rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setAAdicionar(false)}
                  className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAAdicionar(true)}
              className="w-full cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              + Novo Fornecedor
            </button>
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
