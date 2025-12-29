import express from "express";
import userRoutes from "./modules/user/user.routes.js";
import cardRoutes from "./modules/cartao/cartao.routes.js";
import rechargeRoutes from "./modules/recarga/recarga.routes.js"; 
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/cartao", cardRoutes);     
app.use("/recarga", rechargeRoutes); 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;