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
