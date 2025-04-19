import express from "express";
import {
  createEvent,
  checkWalletFunding,
  createTokenForEvent,
  updateTokenForEvent,
  windrawMoney,
  // createLiquidityPool,
  getTokenMetadata,
  windrawToken,
  setupDiscord,
  connectDiscord,
  newSetupDiscord,
} from "../controllers/eventController.js";
import { eventSchema } from "../validation/validationSchemas.js";
import { validate } from "../middleware/validationMiddleware.js";
import { setOAuthState } from "../middleware/setAouthDiscordMiddleware.js";

const router = express.Router();

router.post("/create", validate(eventSchema), createEvent);
router.get("/create", (req, res) => res.status(200).json({ success: true }));
router.post("/check_wallet_founding", checkWalletFunding);
router.post("/create_token", createTokenForEvent);
router.post("/update_token", updateTokenForEvent);
// router.post("/create_pool", createLiquidityPool);
router.get("/get_token_metadata", getTokenMetadata);
router.post("/windraw", windrawMoney);
router.post("/withdraw_token", windrawToken);

router.post("/set_sesion", setOAuthState);
router.post("/connect_discord", connectDiscord);
router.post("/sew_setup_discord", newSetupDiscord);
router.post("/setup_discord", setupDiscord);

export default router;
