// Single import surface for all API resources.
export { authApi } from "./auth";
export { ticketApi } from "./tickets";
export { customerApi } from "./customers";
export { userApi } from "./users";
export { reportApi } from "./reports";
export { knowledgeApi, notificationApi, adminApi } from "./knowledge";
export { ApiError } from "./client";