
import { middleware as _mw } from "../src/middleware.ts";
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
    page: () => import("../app/(dashboard)/dashboard/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
      () => import("../app/(dashboard)/layout.tsx"),
    ]
  },
  "/blog": {
    page: () => import("../app/blog/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },
  "/api/posts": {
    page: () => import("../app/api/posts/api.ts"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },
  "/blog/[slug]": {
    page: () => import("../app/blog/[slug]/page.tsx"),
    layouts: [
      () => import("../app/layout.tsx"),
    ]
  },

    }
};
