import cardService from "./cartao.service.js";

const cardController = {
  // RF007
  requestNewCard: async (req, res) => {
    try {
      const { id, type } = req.user;
      const { cardType } = req.body; 
      const newCard = await cardService.createCard(id, type, cardType);
      res.status(201).json({ message: "Solicitação de cartão criada com sucesso!", card: newCard });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // RF009
  getCardDetails: async (req, res) => {
    try {
      const { id, type } = req.user;
      const { cardId } = req.params;
      const cardDetails = await cardService.getCardDetails(cardId, id, type);
      res.status(200).json({ card: cardDetails });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // RF012
  cancelCard: async (req, res) => {
    try {
      const { id, type } = req.user;
      const { cardId } = req.params;
      const canceledCard = await cardService.cancelCard(cardId, id, type);
      res.status(200).json({ message: "Cartão cancelado com sucesso!", card: canceledCard });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // RF015
  getBalances: async (req, res) => {
    try {
      const { id, type } = req.user;
      const balances = await cardService.getCardBalance(id, type);
      res.status(200).json({ cards: balances });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // RF016 & RF017
  getUsageHistory: async (req, res) => {
    try {
      const { id, type } = req.user;
      const { cardId } = req.params;
      const { orderBy, orderDirection } = req.query; 
      const history = await cardService.getCardUsageHistory(cardId, id, type, orderBy, orderDirection);
      res.status(200).json({ history });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

export default cardController;