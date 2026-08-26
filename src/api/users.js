import { request } from "./client";

export const userApi = {
  list: () => request("/users"),
  teams: () => request("/teams"),
};