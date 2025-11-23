import prisma from "../../config/prismaClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.USU_CPF || user.EMP_CNPJ, type: user.USU_CPF ? "user" : "company" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: user.USU_CPF || user.EMP_CNPJ, type: user.USU_CPF ? "user" : "company" },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const userService = {
  // RF001: O sistema deve permitir o cadastro de novos usuários (pessoa física ou jurídica)
  register: async (data, type) => {
    try {
      const hashedPassword = await bcrypt.hash(data.senha, 10);
      let user;

      if (type === "fisica") {
        user = await prisma.tB_USUARIO.create({
          data: {
            USU_CPF: data.cpf,
            USU_NOME_COMPLETO: data.nomeCompleto,
            USU_TELEFONE: data.telefone,
            USU_DT_NASC: new Date(data.dataNascimento),
            USU_EMAIL: data.email,
            USU_SENHA: hashedPassword,
          },
        });
      } else if (type === "juridica") {
        user = await prisma.tB_EMPRESA.create({
          data: {
            EMP_CNPJ: data.cnpj,
            EMP_RAZAO_SOCIAL: data.razaoSocial,
            EMP_EMAIL: data.email,
            EMP_TELEFONE: data.telefone,
            EMP_SENHA: hashedPassword,
          },
        });
      }
      return user;
    } catch (error) {
      console.error("Erro no cadastro:", error);
      throw new Error("Erro ao cadastrar usuário/empresa");
    }
  },

  // RF002: O sistema deve permitir que o usuário faça login utilizando CPF ou CNPJ e senha.
  login: async (identifier, senha) => {
    try {
      let user = null;
      let userType = null;

      if (identifier.length === 11) { 
        user = await prisma.tB_USUARIO.findUnique({
          where: { USU_CPF: identifier },
        });
        userType = "user";
      } else if (identifier.length === 14) { 
        user = await prisma.tB_EMPRESA.findUnique({
          where: { EMP_CNPJ: identifier },
        });
        userType = "company";
      }

      if (!user) {
        throw new Error("Usuário ou empresa não encontrado.");
      }

      const isPasswordValid = await bcrypt.compare(
        senha,
        user.USU_SENHA || user.EMP_SENHA
      );

      if (!isPasswordValid) {
        throw new Error("Credenciais inválidas.");
      }

      const { accessToken, refreshToken } = generateTokens(user);
      return { user, accessToken, refreshToken, userType };
    } catch (error) {
      console.error("Erro no login:", error);
      throw new Error(error.message || "Erro ao fazer login.");
    }
  },

  // RF003: O sistema deve permitir a recuperação de senha por e-mail ou SMS.
  recoverPassword: async (identifier, recoveryMethod) => {
    try {
      let user = null;
      let fieldToUpdate = null;
      let model = null;

      if (identifier.includes("@")) { 
        user = await prisma.tB_USUARIO.findUnique({ where: { USU_EMAIL: identifier } });
        if (!user) {
          user = await prisma.tB_EMPRESA.findUnique({ where: { EMP_EMAIL: identifier } });
        }
      } else if (identifier.length === 11) { 
        user = await prisma.tB_USUARIO.findUnique({ where: { USU_CPF: identifier } });
      } else if (identifier.length === 14) { 
        user = await prisma.tB_EMPRESA.findUnique({ where: { EMP_CNPJ: identifier } });
      }

      if (!user) {
        throw new Error("Usuário ou empresa não encontrado.");
      }

      const newPassword = Math.random().toString(36).slice(-8); 
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      if (user.USU_CPF) {
        await prisma.tB_USUARIO.update({
          where: { USU_CPF: user.USU_CPF },
          data: { USU_SENHA: hashedPassword },
        });
        fieldToUpdate = "USU_SENHA";
        model = prisma.tB_USUARIO;
      } else if (user.EMP_CNPJ) {
        await prisma.tB_EMPRESA.update({
          where: { EMP_CNPJ: user.EMP_CNPJ },
          data: { EMP_SENHA: hashedPassword },
        });
        fieldToUpdate = "EMP_SENHA";
        model = prisma.tB_EMPRESA;
      }

      if (recoveryMethod === "email") {
        await transporter.sendMail({
          from: EMAIL_USER,
          to: user.USU_EMAIL || user.EMP_EMAIL,
          subject: "Recuperação de Senha - BEM API",
          html: `<p>Sua nova senha temporária é: <strong>${newPassword}</strong>. Por favor, altere-a após o login.</p>`,
        });
      } else if (recoveryMethod === "sms") {
        // Implementar envio de SMS (requer integração com um provedor de SMS)
        // Por enquanto, apenas um log para simular
        console.log(`SMS enviado para ${user.USU_TELEFONE || user.EMP_TELEFONE} com a nova senha: ${newPassword}`);
      }

      return "Nova senha enviada com sucesso.";
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);
      throw new Error(error.message || "Erro ao recuperar senha.");
    }
  },

  // RF005: O sistema deve permitir que o usuário atualize seus dados pessoais (e-mail, telefone, senha etc.).
  updateProfile: async (id, type, data) => {
    try {
      const updateData = {};
      if (data.email) updateData.USU_EMAIL = data.email;
      if (data.telefone) updateData.USU_TELEFONE = data.telefone;
      if (data.senha) updateData.USU_SENHA = await bcrypt.hash(data.senha, 10);
      if (data.nomeCompleto) updateData.USU_NOME_COMPLETO = data.nomeCompleto;
      if (data.razaoSocial) updateData.EMP_RAZAO_SOCIAL = data.razaoSocial;
      if (data.site) updateData.EMP_SITE = data.site;


      let updatedUser;
      if (type === "user") {
        updatedUser = await prisma.tB_USUARIO.update({
          where: { USU_CPF: id },
          data: updateData,
          select: { 
            USU_CPF: true,
            USU_NOME_COMPLETO: true,
            USU_TELEFONE: true,
            USU_EMAIL: true,
            USU_DT_NASC: true,
            USU_NOME_CARTAO: true,
            EUS_ID: true,
          },
        });
      } else if (type === "company") {
        updatedUser = await prisma.tB_EMPRESA.update({
          where: { EMP_CNPJ: id },
          data: updateData,
          select: { 
            EMP_CNPJ: true,
            EMP_RAZAO_SOCIAL: true,
            EMP_EMAIL: true,
            EMP_TELEFONE: true,
            EMP_SITE: true,
            EEM_ID: true,
          },
        });
      }
      return updatedUser;
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw new Error("Erro ao atualizar perfil.");
    }
  },

  // RF006: O sistema deve permitir que o usuário visualize seus dados pessoais, exceto dados sensíveis (como a senha).
  getProfile: async (id, type) => {
    try {
      let user;
      if (type === "user") {
        user = await prisma.tB_USUARIO.findUnique({
          where: { USU_CPF: id },
          select: { 
            USU_CPF: true,
            USU_NOME_COMPLETO: true,
            USU_TELEFONE: true,
            USU_EMAIL: true,
            USU_DT_NASC: true,
            USU_NOME_CARTAO: true,
            EUS_ID: true,
            endereco: true,
          },
        });
      } else if (type === "company") {
        user = await prisma.tB_EMPRESA.findUnique({
          where: { EMP_CNPJ: id },
          select: { 
            EMP_CNPJ: true,
            EMP_RAZAO_SOCIAL: true,
            EMP_EMAIL: true,
            EMP_TELEFONE: true,
            EMP_SITE: true,
            EEM_ID: true,
            endereco: true,
          },
        });
      }
      if (!user) {
        throw new Error("Usuário ou empresa não encontrado.");
      }
      return user;
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      throw new Error("Erro ao buscar perfil.");
    }
  },
};

export default userService;