import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import * as authController from "../controllers/auth.controller.js";
import { loginBodySchema, signupBodySchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/signup", validateBody(signupBodySchema), authController.signup);
router.post("/login", validateBody(loginBodySchema), authController.login);

export { router as authRouter };
