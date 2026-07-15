// router.js
// location.hash ベースの簡易ルーター。

const routes = [];

function registerRoute(pattern, handler) {
  // pattern 例: "/u/:username/following"
  const paramNames = [];
  const regexStr = pattern
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        paramNames.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  routes.push({ regex: new RegExp(`^${regexStr}$`), paramNames, handler });
}

const AUTH_FREE_ROUTES = ["/login", "/signup"];

function currentPath() {
  const hash = location.hash || "#/login";
  return hash.slice(1) || "/login";
}

function navigate(path) {
  if (location.hash === `#${path}`) {
    handleRoute();
  } else {
    location.hash = `#${path}`;
  }
}

function handleRoute() {
  const path = currentPath();
  const loggedIn = Session.isLoggedIn();

  if (!loggedIn && !AUTH_FREE_ROUTES.includes(path)) {
    location.hash = "#/login";
    return;
  }
  if (loggedIn && AUTH_FREE_ROUTES.includes(path)) {
    location.hash = "#/timeline";
    return;
  }

  for (const route of routes) {
    const m = path.match(route.regex);
    if (m) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1])));
      route.handler(params);
      window.scrollTo(0, 0);
      return;
    }
  }

  // fallback
  navigate(loggedIn ? "/timeline" : "/login");
}

window.addEventListener("hashchange", handleRoute);
