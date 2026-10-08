import { createFileRoute } from "@tanstack/react-router";
import { ListaPagamentos } from "@/components/ListaPagamentos";

export const Route = createFileRoute("/fornecedor/$id/transferencias")({
  head: () => ({
    meta: [
      { title: "Transferências a fazer — Limpeza Dinâmico" },
      {
        name: "description",
        content: "Lista pronta a imprimir dos prédios que se pagam por transferência e ainda estão por pagar.",
      },
      { property: "og:title", content: "Transferências a fazer — Limpeza Dinâmico" },
      { property: "og:description", content: "Transferências pendentes do mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Transferencias,
});

function Transferencias() {
  const { id } = Route.useParams();
  return <ListaPagamentos id={id} metodo="transferencia" />;
}
