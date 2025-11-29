import cardService from "./card.service.js";

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

  
};

export default cardController;