const APP_TITLE = "Nu Standard Cleaning Admin";

/**
 * Set document title for admin pages. Not for public SEO; for admin usability.
 */
export function setAdminDocumentTitle(pageTitle: string): void {
  if (typeof document !== "undefined") {
    document.title = pageTitle ? `${pageTitle} | ${APP_TITLE}` : APP_TITLE;
  }
}
