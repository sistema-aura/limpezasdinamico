import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { criarFornecedor, listarFornecedores } from "@/lib/limpezas";

export function Shell({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { id?: string };
  const [aAdicionar, setAAdicionar] = useState(false);
  const [nome, setNome] = useState("");

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: listarFornecedores,
  });

  const novo = useMutation({
    mutationFn: () => criarFornecedor(nome.trim()),
    onSuccess: () => {
      setNome("");
      setAAdicionar(false);
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground md:flex-row">
      <aside className="flex w-full flex-col border-b border-border bg-sidebar md:w-64 md:border-r md:border-b-0">
        <div className="border-b border-border p-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-brand">
            Limpeza Dinâmico
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gestão de Limpezas
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Fornecedores
          </div>
          {fornecedores.map((f) => {
            const ativo = params.id === f.id;
            return (
              <Link
                key={f.id}
                to="/fornecedor/$id"
                params={{ id: f.id }}
                search={{ ano: undefined, mes: undefined }}

                className={
                  ativo
                    ? "flex items-center gap-3 rounded-lg bg-brand/10 px-3 py-2 font-medium text-brand"
                    : "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary"
                }
              >
                <span
                  className={
                    ativo ? "size-2 rounded-full bg-brand" : "size-2 rounded-full bg-border"
                  }
                />
                {f.nome}
              </Link>
            );
          })}
        </nav>

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
                  className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setAAdicionar(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAAdicionar(true)}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
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
