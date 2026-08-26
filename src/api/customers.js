import { request, qs } from "./client";

export const customerApi = {
  list: (params) => request("/customers" + qs(params)),
  get: (id) => request("/customers/" + id),
  create: (data) => request("/customers", { method: "POST", body: data }),
  organisations: () => request("/organisations"),
};