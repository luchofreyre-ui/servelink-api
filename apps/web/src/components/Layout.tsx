import { Outlet } from "react-router-dom";
import { SiteNav } from "./seo/SiteNav";

export function Layout() {
  return (
    <>
      <SiteNav />
      <main>
        <Outlet />
      </main>
    </>
  );
}
