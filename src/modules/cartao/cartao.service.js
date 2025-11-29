import prisma from "../../config/prismaClient.js";
import notificationService from "../../services/notification.service.js";
import { Decimal } from "@prisma/client/runtime/library";

const CARD_BALANCE_THRESHOLD = parseFloat(process.env.CARD_BALANCE_THRESHOLD || "15.00"); 

const cardService = {
  // RF007: O sistema deve permitir que o usuário solicite a criação de novos cartões,
  createCard: async (userId, userType, cardType) => {
    try {
      const type = await prisma.tB_TIPO_CARTAO.findFirst({
        where: { TCA_NOME: cardType },
      });

      if (!type) {
        throw new Error(`Tipo de cartão '${cardType}' inválido.`);
      }

      const activeStatus = await prisma.tB_STATUS_CARTAO.findFirst({
        where: { SCA_NOME: "Ativo" },
      });

      if (!activeStatus) {
        throw new Error("Status 'Ativo' não encontrado para cartões.");
      }

      const currentYear = new Date().getFullYear();
      const expirationYear = currentYear + 5; 
      const cardCreationDate = new Date();
      const cardRevalidationDate = new Date();
      cardRevalidationDate.setFullYear(expirationYear);

      const cardNumber = Math.random().toString().slice(2, 18).padEnd(16, '0'); 
      const cardCode = Math.random().toString().slice(2, 5).padEnd(3, '0'); 

      const data = {
        CAR_NUMERO: cardNumber,
        CAR_CODIGO: cardCode,
        CAR_DT_CRIACAO: cardCreationDate,
        CAR_DT_REVALIDACAO: cardRevalidationDate,
        CAR_SALDO: new Decimal(0.00), 
        TCA_ID: type.TCA_ID,
        SCA_ID: activeStatus.SCA_ID,
      };

      if (userType === "user") {
        data.USU_CPF = userId;
      } else if (userType === "company") {
        data.EMP_CNPJ = userId;
      } else {
        throw new Error("Tipo de usuário inválido.");
      }

      const card = await prisma.tB_CARTAO.create({ data });
      return card;
    } catch (error) {
      console.error("Erro ao solicitar criação de cartão:", error);
      throw new Error(error.message || "Erro ao solicitar criação de cartão.");
    }
  },

  // RF009: O sistema deve permitir que o usuário visualize os dados detalhados de um cartão específico
  getCardDetails: async (cardId, userId, userType) => {
    try {
      const card = await prisma.tB_CARTAO.findUnique({
        where: { CAR_NUMERO: cardId },
        include: {
          tipoCartao: true,
          statusCartao: true,
          historicos: {
            orderBy: { HIS_DATA_HORA: "desc" },
            take: 5, 
          },
        },
      });

      if (!card) {
        throw new Error("Cartão não encontrado.");
      }

      if (
        (userType === "user" && card.USU_CPF !== userId) ||
        (userType === "company" && card.EMP_CNPJ !== userId)
      ) {
        throw new Error("Você não tem permissão para visualizar este cartão.");
      }

      const { CAR_CODIGO, ...cardWithoutCode } = card;

      return cardWithoutCode;
    } catch (error) {
      console.error("Erro ao buscar detalhes do cartão:", error);
      throw new Error(error.message || "Erro ao buscar detalhes do cartão.");
    }
  },

  
};

export default cardService;