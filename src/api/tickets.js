import { request, qs } from "./client";

export const ticketApi = {
  list: (params) => request("/tickets" + qs(params)),
  get: (reference) => request("/tickets/" + reference),
  create: (data) => request("/tickets", { method: "POST", body: data }),
  update: (reference, data) => request("/tickets/" + reference, { method: "PATCH", body: data }),
  messages: (reference) => request("/tickets/" + reference + "/messages"),
  addMessage: (reference, data) =>
    request("/tickets/" + reference + "/messages", { method: "POST", body: data }),
  activity: (reference) => request("/tickets/" + reference + "/activity"),
};