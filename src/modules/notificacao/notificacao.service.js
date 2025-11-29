import nodemailer from "nodemailer";
import prisma from "../config/prismaClient.js";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const notificationService = {
  // RF022: O sistema deve enviar notificação ao usuário quando o saldo de um cartão estiver abaixo de um valor definido.
  sendLowBalanceNotification: async (cardId, currentBalance, threshold) => {
    try {
      const card = await prisma.tB_CARTAO.findUnique({
        where: { CAR_NUMERO: cardId },
        include: {
          usuario: true, 
          empresa: true, 
        },
      });

      if (!card) {
        console.warn(`Cartão ${cardId} não encontrado para notificação.`);
        return;
      }

      let recipientEmail = null;
      let recipientName = null;

      if (card.usuario) {
        recipientEmail = card.usuario.USU_EMAIL;
        recipientName = card.usuario.USU_NOME_COMPLETO;
      } else if (card.empresa) {
        recipientEmail = card.empresa.EMP_EMAIL;
        recipientName = card.empresa.EMP_RAZAO_SOCIAL;
      }

      if (!recipientEmail) {
        console.warn(`Nenhum e-mail de destinatário encontrado para o cartão ${cardId}.`);
        return;
      }

      const mailOptions = {
        from: EMAIL_USER,
        to: recipientEmail,
        subject: "Alerta de Saldo Baixo do Cartão BEM",
        html: `
          <p>Prezado(a) ${recipientName},</p>
          <p>Seu cartão de número <strong>${card.CAR_NUMERO}</strong> está com o saldo baixo.</p>
          <p>Saldo atual: R$ ${currentBalance.toFixed(2)}</p>
          <p>Valor limite definido: R$ ${threshold.toFixed(2)}</p>
          <p>Recomendamos que você realize uma recarga para continuar utilizando seus serviços sem interrupções.</p>
          <p>Atenciosamente,</p>
          <p>Equipe BEM API</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Notificação de saldo baixo enviada para ${recipientEmail} para o cartão ${cardId}`);
    } catch (error) {
      console.error(`Erro ao enviar notificação de saldo baixo para o cartão ${cardId}:`, error);
      throw new Error("Erro ao enviar notificação de saldo baixo.");
    }
  },
};

export default notificationService;