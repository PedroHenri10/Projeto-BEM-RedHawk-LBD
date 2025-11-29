import rechargeService from "./recarga.service.js";

const rechargeController = {
  // RF020
  rechargeCard: async (req, res) => {
    try {
      const { id, type } = req.user;
      const { cardId, value, paymentMethod, isThirdParty } = req.body;

      const recharge = await rechargeService.rechargeCard(
        id,
        type,
        cardId,
        value,
        paymentMethod,
        isThirdParty || false 
      );
      res.status(200).json({ message: "Cartão recarregado com sucesso!", recharge });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

export default rechargeController;