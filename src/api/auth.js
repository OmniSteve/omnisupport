import { request } from "./client";

export const authApi = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  logout: () => {
    localStorage.removeItem("omni_token");
    return Promise.resolve();
  },
};