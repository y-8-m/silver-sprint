// Outlet context from Layout: a page can hide the app header and navigation
// while it needs the whole screen (an active Drill session).
export type LayoutOutletContext = { setImmersive(immersive: boolean): void };
