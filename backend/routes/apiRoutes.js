import { Router } from "express";
import {
  createAction,
  deleteAction,
  handleGestureEvent,
  listActions,
  triggerAction,
  updateAction
} from "../controllers/actionController.js";
import { clearEvents, listEvents } from "../controllers/eventController.js";
import {
  addGestureSample,
  createGesture,
  deleteGesture,
  listGestures,
  updateGesture
} from "../controllers/gestureController.js";
import { listIntegrationTemplates } from "../controllers/integrationController.js";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.js";

export const apiRoutes = Router();

apiRoutes.use(requireAuth);

apiRoutes.get("/gestures", listGestures);
apiRoutes.post("/gestures", createGesture);
apiRoutes.put("/gestures/:id", updateGesture);
apiRoutes.post("/gestures/:id/samples", addGestureSample);
apiRoutes.delete("/gestures/:id", deleteGesture);

apiRoutes.get("/actions", listActions);
apiRoutes.post("/actions", createAction);
apiRoutes.put("/actions/:id", updateAction);
apiRoutes.delete("/actions/:id", deleteAction);
apiRoutes.post("/actions/:id/trigger", triggerAction);

apiRoutes.post("/events/gesture", handleGestureEvent);
apiRoutes.get("/events", listEvents);
apiRoutes.delete("/events", clearEvents);

apiRoutes.get("/settings", getSettings);
apiRoutes.put("/settings", updateSettings);

apiRoutes.get("/integrations/templates", listIntegrationTemplates);

