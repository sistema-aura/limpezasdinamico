import { supabase } from "@/integrations/supabase/client";

export type Pagamento = "transferencia" | "numerario";
export type Estado = "pendente" | Pagamento;

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export const ESTADO_LABEL: Record<Estado, string> = {
  pendente: "Falta pagar",
  transferencia: "Transferência",
  numerario: "Numerário",
};

export const euro = (v: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);

export type Fornecedor = { id: string; nome: string };

export type Predio = {
  id: string;
  fornecedor_id: string;
  codigo: string;
  morada: string;
  valor: number;
  pagamento_padrao: Pagamento;
  ativo: boolean;
};

export type Limpeza = {
  id: string;
  fornecedor_id: string;
  predio_id: string;
  ano: number;
  mes: number;
  valor: number;
  estado: Estado;
  observacoes: string;
};

export async function listarFornecedores() {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("id, nome")
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Fornecedor[];
}

export async function listarPredios(fornecedorId: string) {
  const { data, error } = await supabase
    .from("predios")
    .select("id, fornecedor_id, codigo, morada, valor, pagamento_padrao, ativo")
    .eq("fornecedor_id", fornecedorId)
    .eq("ativo", true)
    .order("codigo");
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, valor: Number(p.valor) })) as Predio[];
}

export async function listarLimpezasDoAno(fornecedorId: string, ano: number) {
  const { data, error } = await supabase
    .from("limpezas")
    .select("id, fornecedor_id, predio_id, ano, mes, valor, estado, observacoes")
    .eq("fornecedor_id", fornecedorId)
    .eq("ano", ano);
  if (error) throw error;
  return (data ?? []).map((l) => ({ ...l, valor: Number(l.valor) })) as Limpeza[];
}

export async function guardarLimpeza(input: {
  fornecedor_id: string;
  predio_id: string;
  ano: number;
  mes: number;
  valor: number;
  estado: Estado;
  observacoes: string;
}) {
  const { error } = await supabase
    .from("limpezas")
    .upsert(input, { onConflict: "predio_id,ano,mes" });
  if (error) throw error;
}

export async function criarPredio(input: {
  fornecedor_id: string;
  codigo: string;
  morada: string;
  valor: number;
  pagamento_padrao: Pagamento;
}) {
  const { error } = await supabase.from("predios").insert(input);
  if (error) throw error;
}

export async function atualizarPagamentoPredio(id: string, pagamento: Pagamento) {
  const { error } = await supabase
    .from("predios")
    .update({ pagamento_padrao: pagamento })
    .eq("id", id);
  if (error) throw error;
}

export async function removerPredio(id: string) {
  const { error } = await supabase.from("predios").update({ ativo: false }).eq("id", id);
  if (error) throw error;
}

export async function criarFornecedor(nome: string) {
  const { data, error } = await supabase
    .from("fornecedores")
    .insert({ nome })
    .select("id, nome")
    .single();
  if (error) throw error;
  return data as Fornecedor;
}

export async function obterNota(fornecedorId: string, ano: number, mes: number) {
  const { data, error } = await supabase
    .from("notas_mensais")
    .select("texto")
    .eq("fornecedor_id", fornecedorId)
    .eq("ano", ano)
    .eq("mes", mes)
    .maybeSingle();
  if (error) throw error;
  return data?.texto ?? "";
}

export async function guardarNota(
  fornecedorId: string,
  ano: number,
  mes: number,
  texto: string,
) {
  const { error } = await supabase
    .from("notas_mensais")
    .upsert(
      { fornecedor_id: fornecedorId, ano, mes, texto },
      { onConflict: "fornecedor_id,ano,mes" },
    );
  if (error) throw error;
}
