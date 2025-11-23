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
  
};

export default userController;