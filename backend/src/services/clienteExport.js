import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export function buildClientePdf(cliente, res) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="cliente-${cliente.id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text("SUSSAI CRM — Ficha do Cliente", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Nome: ${cliente.nome}`);
  if (cliente.razaoSocial) doc.text(`Razão social: ${cliente.razaoSocial}`);
  doc.text(`Tipo: ${cliente.tipo} · Pessoa: ${cliente.tipoPessoa} · Status: ${cliente.status}`);
  doc.text(`Documento: ${cliente.cpfCnpj || "—"}`);
  doc.text(`E-mail: ${cliente.email || "—"}`);
  doc.text(`Telefone: ${cliente.telefone || "—"}`);
  doc.text(`WhatsApp: ${cliente.whatsapp || "—"}`);
  doc.text(`Cidade/UF: ${[cliente.cidade, cliente.estado].filter(Boolean).join(" / ") || "—"}`);
  doc.text(`Origem: ${cliente.origem || "—"}`);
  doc.text(`Corretor: ${cliente.corretor?.nome || "—"}`);
  doc.text(`Interesses: ${(cliente.interesses || []).join(", ") || "—"}`);
  doc.text(`Tags: ${(cliente.tags || []).join(", ") || "—"}`);
  doc.text(`Cidades de interesse: ${(cliente.cidadesInteresse || []).join(", ") || "—"}`);
  if (cliente.faixaPrecoMin != null || cliente.faixaPrecoMax != null) {
    doc.text(`Faixa de preço: ${cliente.faixaPrecoMin ?? "—"} até ${cliente.faixaPrecoMax ?? "—"}`);
  }
  if (cliente.notas) {
    doc.moveDown();
    doc.text("Notas:");
    doc.text(cliente.notas);
  }

  if (cliente.telefones?.length) {
    doc.moveDown();
    doc.text("Telefones:");
    cliente.telefones.forEach((item) => doc.text(`- ${item.numero} (${item.tipo})`));
  }
  if (cliente.emails?.length) {
    doc.moveDown();
    doc.text("E-mails:");
    cliente.emails.forEach((item) => doc.text(`- ${item.email} (${item.tipo})`));
  }
  if (cliente.enderecos?.length) {
    doc.moveDown();
    doc.text("Endereços:");
    cliente.enderecos.forEach((item) => {
      doc.text(`- ${item.logradouro}, ${item.numero || "s/n"} — ${item.bairro || ""} ${item.cidade}/${item.estado}`);
    });
  }
  if (cliente.favoritos?.length) {
    doc.moveDown();
    doc.text("Imóveis favoritos:");
    cliente.favoritos.forEach((item) => {
      doc.text(`- ${item.imovel?.codigo || ""} ${item.imovel?.titulo || ""}`);
    });
  }

  doc.end();
}

export async function buildClientesExcel(clientes, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Clientes");
  sheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Nome", key: "nome", width: 28 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Pessoa", key: "tipoPessoa", width: 10 },
    { header: "Status", key: "status", width: 14 },
    { header: "CPF/CNPJ", key: "cpfCnpj", width: 18 },
    { header: "E-mail", key: "email", width: 26 },
    { header: "Telefone", key: "telefone", width: 16 },
    { header: "Cidade", key: "cidade", width: 18 },
    { header: "UF", key: "estado", width: 6 },
    { header: "Origem", key: "origem", width: 16 },
    { header: "Corretor", key: "corretor", width: 22 },
    { header: "Tags", key: "tags", width: 24 },
    { header: "Interesses", key: "interesses", width: 24 },
  ];

  clientes.forEach((cliente) => {
    sheet.addRow({
      id: cliente.id,
      nome: cliente.nome,
      tipo: cliente.tipo,
      tipoPessoa: cliente.tipoPessoa,
      status: cliente.status,
      cpfCnpj: cliente.cpfCnpj || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      origem: cliente.origem || "",
      corretor: cliente.corretor?.nome || "",
      tags: (cliente.tags || []).join(", "),
      interesses: (cliente.interesses || []).join(", "),
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=\"clientes.xlsx\"");
  await workbook.xlsx.write(res);
  res.end();
}
