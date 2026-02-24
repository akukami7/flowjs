export const middleware = (req: Request) => {
    const url = new URL(req.url);
    if (url.pathname === "/old") {
        return Response.redirect(new URL("/", req.url), 301);
    }
};
