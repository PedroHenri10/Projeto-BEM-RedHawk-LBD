import userService from "./user.service.js";

const userController = {
  // RF001
  registerUser: async (req, res) => {
    try {
      const user = await userService.register(req.body, "fisica");
      res.status(201).json({ message: "Usuário cadastrado com sucesso!", user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  registerCompany: async (req, res) => {
    try {
      const company = await userService.register(req.body, "juridica");
      res.status(201).json({ message: "Empresa cadastrada com sucesso!", company });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // RF002
  login: async (req, res) => {
    try {
      const { identifier, senha } = req.body;
      const { user, accessToken, refreshToken, userType } = await userService.login(identifier, senha);
      res.status(200).json({ message: "Login realizado com sucesso!", user, accessToken, refreshToken, userType });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  // RF003
  recoverPassword: async (req, res) => {
    try {
      const { identifier, recoveryMethod } = req.body; 
      const message = await userService.recoverPassword(identifier, recoveryMethod);
      res.status(200).json({ message });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // RF004: O sistema deve permitir que o usuário encerre a sessão.
  logout: async (req, res) => {
    try {
      res.status(200).json({ message: "Sessão encerrada com sucesso." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // RF005
  updateProfile: async (req, res) => {
    try {
      const { id, type } = req.user; 
      const updatedUser = await userService.updateProfile(id, type, req.body);
      res.status(200).json({ message: "Perfil atualizado com sucesso!", user: updatedUser });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // RF006
  getProfile: async (req, res) => {
    try {
      const { id, type } = req.user; 
      const user = await userService.getProfile(id, type);
      res.status(200).json({ user });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

export default userController;