import { request, qs } from "./client";

export const knowledgeApi = {
  categories: () => request("/knowledge/categories"),
  articles: (params) => request("/knowledge/articles" + qs(params)),
};

export const notificationApi = {
  list: () => request("/notifications"),
};

export const adminApi = {
  getSettings: () => request("/admin/settings"),
  updateSettings: (data) => request("/admin/settings", { method: "PUT", body: data }),
};