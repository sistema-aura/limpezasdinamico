import { createFileRoute } from "@tanstack/react-router";
import { ListaPagamentos } from "@/components/ListaPagamentos";

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
  return <ListaPagamentos id={id} metodo="numerario" />;
}
