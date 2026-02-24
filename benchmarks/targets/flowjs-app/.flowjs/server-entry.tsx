
import { middleware as _mw } from "../middleware.ts";
export const middleware = _mw;

export const manifest = {
    routes: {
  "/": {
    page: () => import("../app/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },
  "/dashboard": {
    page: () => import("../app/(auth)/dashboard/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
      () => import("../app/(auth)/layout.tsx"),
    ]
  },
  "/settings": {
    page: () => import("../app/(auth)/settings/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
      () => import("../app/(auth)/layout.tsx"),
    ]
  },
  "/about": {
    page: () => import("../app/about/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },
  "/blog": {
    page: () => import("../app/blog/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
      () => import("../app/blog/layout.tsx"),
    ]
  },
  "/api/users": {
    page: () => import("../app/api/users/api.ts"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },
  "/blog/[slug]": {
    page: () => import("../app/blog/[slug]/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
      () => import("../app/blog/layout.tsx"),
    ]
  },
  "/docs/[...path]": {
    page: () => import("../app/docs/[...path]/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },

    }
};
