import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate.js";
import * as tasksController from "../controllers/tasks.controller.js";
import {
  taskIdParamsSchema,
  updateTaskBodySchema,
  updateTaskStatusBodySchema,
} from "../validators/task.validators.js";

const router = Router();

router.patch(
  "/:taskId/status",
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskStatusBodySchema),
  tasksController.updateTaskStatus,
);
router.get(
  "/:taskId",
  validateParams(taskIdParamsSchema),
  tasksController.getTask,
);
router.patch(
  "/:taskId",
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskBodySchema),
  tasksController.updateTask,
);
router.delete(
  "/:taskId",
  validateParams(taskIdParamsSchema),
  tasksController.deleteTask,
);

export { router as tasksByIdRouter };
