import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listarFornecedores,
  listarLimpezasDoAno,
  listarPredios,
  type Estado,
  type Predio,
} from "@/lib/limpezas";

export type Linha = {
  predio: Predio;
  valor: number;
  pagamento: Predio["pagamento_padrao"];
  pago: boolean;
  observacoes: string;
};

export function useFornecedores() {
  return useQuery({ queryKey: ["fornecedores"], queryFn: listarFornecedores });
}

export function useDadosFornecedor(id: string, ano: number, mes: number) {
  const { data: fornecedores = [] } = useFornecedores();
  const fornecedor = fornecedores.find((f) => f.id === id);

  const { data: predios = [] } = useQuery({
    queryKey: ["predios", id],
    queryFn: () => listarPredios(id),
  });

  const { data: limpezas = [] } = useQuery({
    queryKey: ["limpezas", id, ano],
    queryFn: () => listarLimpezasDoAno(id, ano),
  });

  const linhas = useMemo<Linha[]>(
    () =>
      predios.map((p) => {
        const l = limpezas.find((x) => x.predio_id === p.id && x.mes === mes);
        const estado = (l?.estado ?? "pendente") as Estado;
        return {
          predio: p,
          valor: l ? l.valor : p.valor,
          pagamento: p.pagamento_padrao,
          pago: estado !== "pendente",
          observacoes: l?.observacoes ?? "",
        };
      }),
    [predios, limpezas, mes],
  );

  const porTransferir = useMemo(
    () => linhas.filter((l) => l.pagamento === "transferencia" && !l.pago),
    [linhas],
  );

  const porNumerario = useMemo(
    () => linhas.filter((l) => l.pagamento === "numerario" && !l.pago),
    [linhas],
  );

  const totais = useMemo(() => {
    let total = 0;
    let transferencia = 0;
    let numerario = 0;
    let falta = 0;
    for (const l of linhas) {
      total += l.valor;
      if (!l.pago) falta += l.valor;
      else if (l.pagamento === "transferencia") transferencia += l.valor;
      else numerario += l.valor;
    }
    return { total, transferencia, numerario, falta };
  }, [linhas]);

  return { fornecedor, predios, limpezas, linhas, porTransferir, porNumerario, totais };
}

export const ESTADO_CLASSE: Record<Estado, string> = {
  transferencia: "bg-transfer/15 text-transfer-strong border-transfer/30",
  numerario: "bg-cash/15 text-cash-strong border-cash/30",
  pendente: "bg-unpaid/15 text-unpaid-strong border-unpaid/30",
};
