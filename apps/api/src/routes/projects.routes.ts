import { Router } from "express";
import { checkRole } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import * as projectsController from "../controllers/projects.controller.js";
import * as tasksController from "../controllers/tasks.controller.js";
import {
  createProjectBodySchema,
  projectIdParamsSchema,
  updateProjectBodySchema,
} from "../validators/project.validators.js";
import { createTaskBodySchema } from "../validators/task.validators.js";

const router = Router();

router.get("/", projectsController.listProjects);
router.post(
  "/",
  checkRole(["Admin"]),
  validateBody(createProjectBodySchema),
  projectsController.createProject,
);

const tasksRouter = Router({ mergeParams: true });
tasksRouter.get("/", tasksController.listTasksForProject);
tasksRouter.post(
  "/",
  validateBody(createTaskBodySchema),
  tasksController.createTask,
);

router.use(
  "/:projectId/tasks",
  validateParams(projectIdParamsSchema),
  tasksRouter,
);

router.get(
  "/:projectId",
  validateParams(projectIdParamsSchema),
  projectsController.getProject,
);
router.patch(
  "/:projectId",
  validateParams(projectIdParamsSchema),
  validateBody(updateProjectBodySchema),
  projectsController.updateProject,
);
router.delete(
  "/:projectId",
  validateParams(projectIdParamsSchema),
  projectsController.deleteProject,
);

export { router as projectsRouter };
