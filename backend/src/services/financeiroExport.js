import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateBr(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export async function buildFinanceiroExcel(lancamentos, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SUSSAI CRM";
  const sheet = workbook.addWorksheet("Lançamentos");
  sheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Descrição", key: "descricao", width: 40 },
    { header: "Valor", key: "valor", width: 14 },
    { header: "Pago", key: "valorPago", width: 14 },
    { header: "Vencimento", key: "vencimento", width: 14 },
    { header: "Pagamento", key: "dataPagamento", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Categoria", key: "categoria", width: 20 },
    { header: "Centro de custo", key: "centro", width: 18 },
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Contrato", key: "contrato", width: 14 },
    { header: "Corretor", key: "corretor", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const item of lancamentos) {
    sheet.addRow({
      id: item.id,
      tipo: item.tipo,
      descricao: item.descricao,
      valor: item.valor,
      valorPago: item.valorPago,
      vencimento: dateBr(item.vencimento),
      dataPagamento: dateBr(item.dataPagamento),
      status: item.status,
      categoria: item.categoria?.nome || "",
      centro: item.centroCusto?.nome || "",
      cliente: item.cliente?.nome || "",
      contrato: item.contrato?.numero || "",
      corretor: item.corretor?.nome || "",
    });
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="financeiro-sussai.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}

export function buildFinanceiroPdf(lancamentos, resumo, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="financeiro-sussai.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text("SUSSAI CRM — Relatório Financeiro", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#475569");
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  if (resumo) {
    doc.moveDown(0.5);
    doc.fillColor("#0f172a").text(
      `A receber: ${money(resumo.aReceber)} · A pagar: ${money(resumo.aPagar)} · Recebido mês: ${money(resumo.recebidoMes)} · Pago mês: ${money(resumo.pagoMes)}`,
    );
  }
  doc.moveDown();
  doc.fillColor("#0f172a").fontSize(11).text(`Lançamentos (${lancamentos.length})`, { underline: true });
  doc.moveDown(0.5);

  for (const item of lancamentos.slice(0, 80)) {
    doc.fontSize(9).text(
      `#${item.id} [${item.tipo}] ${item.descricao} — ${money(item.valor)} · ${item.status} · venc. ${dateBr(item.vencimento)}`,
    );
    doc.fillColor("#64748b").text(
      `  ${item.categoria?.nome || "Sem categoria"} · ${item.cliente?.nome || "—"} · ${item.contrato?.numero || "—"}`,
    );
    doc.fillColor("#0f172a");
    doc.moveDown(0.25);
  }

  if (lancamentos.length > 80) {
    doc.moveDown().fillColor("#64748b").text(`… e mais ${lancamentos.length - 80} lançamentos (exporte Excel para a lista completa).`);
  }

  doc.end();
}
