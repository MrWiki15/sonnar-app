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
  newSetupDiscord,
  callbackDiscord,
  getDiscordRoles,
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
router.get("/callback", callbackDiscord);
router.post("/sew_setup_discord", newSetupDiscord);
router.post("/setup_discord", setupDiscord);
router.get("/discord_roles", getDiscordRoles);

export default router;
