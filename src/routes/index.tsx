import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import {
  listarFornecedores,
  removerFornecedor,
  renomearFornecedor,
  type Fornecedor,
} from "@/lib/limpezas";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Limpeza Dinâmico — Contas das limpezas de prédios" },
      {
        name: "description",
        content:
          "Registe prédios, valores e pagamentos das limpezas por fornecedor, mês e ano. Veja o que falta pagar, o que foi pago em numerário e por transferência.",
      },
      { property: "og:title", content: "Limpeza Dinâmico" },
      {
        property: "og:description",
        content: "Contas das limpezas de prédios, por fornecedor e por mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: listarFornecedores,
  });

  return (
    <Shell>
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-tight">Os seus fornecedores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um fornecedor para ver as limpezas de cada mês.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fornecedores.map((f) => (
            <Cartao key={f.id} fornecedor={f} />
          ))}

          {!isLoading && fornecedores.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ainda não há fornecedores. Use “+ Novo Fornecedor” na barra lateral.
            </p>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Cartao({ fornecedor }: { fornecedor: Fornecedor }) {
  const queryClient = useQueryClient();
  const [aEditar, setAEditar] = useState(false);
  const [nome, setNome] = useState(fornecedor.nome);

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["fornecedores"] });

  const guardar = useMutation({
    mutationFn: () => renomearFornecedor(fornecedor.id, nome.trim()),
    onSuccess: () => {
      setAEditar(false);
      invalidar();
    },
  });

  const apagar = useMutation({
    mutationFn: () => removerFornecedor(fornecedor.id),
    onSuccess: invalidar,
  });

  if (aEditar) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nome.trim()) guardar.mutate();
        }}
        className="rounded-xl border border-brand/40 bg-card p-5 shadow-sm"
      >
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="flex-1 cursor-pointer rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => {
              setNome(fornecedor.nome);
              setAEditar(false);
            }}
            className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-brand/40">
      <Link
        to="/fornecedor/$id"
        params={{ id: fornecedor.id }}
        search={{ ano: undefined, mes: undefined }}
        className="block"
      >
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-brand" />
          <span className="font-semibold">{fornecedor.nome}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Ver prédios e pagamentos</p>
      </Link>
      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <button
          onClick={() => setAEditar(true)}
          className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Editar nome
        </button>
        <button
          disabled={apagar.isPending}
          onClick={() => {
            if (
              window.confirm(
                `Apagar o fornecedor "${fornecedor.nome}"? Perde os prédios, limpezas e observações deste fornecedor.`,
              )
            )
              apagar.mutate();
          }}
          className="cursor-pointer rounded-lg border border-unpaid/30 bg-unpaid/10 px-3 py-1.5 text-xs font-medium text-unpaid-strong transition-colors hover:bg-unpaid/20"
        >
          Apagar
        </button>
      </div>
    </div>
  );
}
