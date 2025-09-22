const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  path: "/api/auth/refresh",
};

export { COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS };
