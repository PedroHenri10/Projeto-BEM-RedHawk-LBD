import prisma from "../../config/prismaClient.js";
import cardService from "../cartao/cartao.service.js"; 
import { Decimal } from "@prisma/client/runtime/library";

const rechargeService = {
  // RF020: O sistema deve permitir que o usuário recarregue um cartão do tipo comum, sendo próprio ou de terceiros.
  rechargeCard: async (rechargerId, rechargerType, cardId, value, paymentMethod, isThirdParty) => {
    try {
      const card = await prisma.tB_CARTAO.findUnique({
        where: { CAR_NUMERO: cardId },
        include: {
          tipoCartao: true,
          statusCartao: true,
        },
      });

      if (!card) {
        throw new Error("Cartão não encontrado.");
      }

      if (card.tipoCartao.TCA_NOME !== "Comum") {
        throw new Error("Apenas cartões do tipo 'Comum' podem ser recarregados por este método.");
      }

      if (card.statusCartao.SCA_NOME !== "Ativo") {
        throw new Error("Não é possível recarregar um cartão que não esteja 'Ativo'.");
      }

      const rechargeValue = new Decimal(value);
      if (rechargeValue.isNegative() || rechargeValue.isZero()) {
        throw new Error("O valor da recarga deve ser positivo.");
      }

      if (isThirdParty && rechargerType !== "user") {
        throw new Error("Somente usuários (pessoas físicas) podem recarregar cartões de terceiros.");
      }

      const updatedCard = await prisma.tB_CARTAO.update({
        where: { CAR_NUMERO: cardId },
        data: {
          CAR_SALDO: {
            increment: rechargeValue,
          },
        },
      });

      const statusRecarga = await prisma.tB_STATUS_RECARGA.findFirst({
        where: { SRE_NOME: "Concluído" },
      });
      const tipoRealizador = await prisma.tB_TIPO_REALIZADOR.findFirst({
        where: { TRE_NOME: rechargerType === "user" ? "Usuario" : "Empresa" },
      });
      const formaPagamento = await prisma.tB_FORMA_PAGAMENTO.findFirst({
        where: { FPA_NOME: paymentMethod },
      });

      if (!statusRecarga || !tipoRealizador || !formaPagamento) {
        throw new Error("Dados de registro de recarga incompletos. Verifique status, realizador ou forma de pagamento.");
      }

      const rechargeRecordData = {
        REC_DATA_HORA: new Date(),
        REC_VALOR: rechargeValue,
        CAR_NUMERO: cardId,
        SRE_ID: statusRecarga.SRE_ID,
        TRE_ID: tipoRealizador.TRE_ID,
        FPA_ID: formaPagamento.FPA_ID,
      };

      if (rechargerType === "user") {
        rechargeRecordData.USU_CPF = rechargerId;
      } else if (rechargerType === "company") {
        rechargeRecordData.EMP_CNPJ = rechargerId;
      }

      const recharge = await prisma.tB_RECARGA.create({ data: rechargeRecordData });

      cardService.checkAndNotifyLowBalance(cardId);

      return recharge;
    } catch (error) {
      console.error("Erro ao recarregar cartão:", error);
      throw new Error(error.message || "Erro ao recarregar cartão.");
    }
  },
};

export default rechargeService;