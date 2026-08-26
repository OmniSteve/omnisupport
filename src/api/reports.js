import { request, qs } from "./client";

export const reportApi = {
  summary: (params) => request("/reports/summary" + qs(params)),
};