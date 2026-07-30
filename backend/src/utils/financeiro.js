export async function atualizarCobrancasAtrasadas(prisma, empresaId) {
  return prisma.cobranca.updateMany({
    where: {
      empresaId,
      status: "PENDENTE",
      vencimento: { lt: new Date() },
    },
    data: { status: "ATRASADO" },
  });
}
