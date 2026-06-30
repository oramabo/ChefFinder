import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.tsx";
// Self-hosted fonts (no external requests): Varela Round — a friendly rounded
// face (Latin + Hebrew) used across the whole site. It ships a single weight;
// bolder text is synthesized by the browser.
import "@fontsource/varela-round/latin-400.css";
import "@fontsource/varela-round/hebrew-400.css";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/global.css";

export const createRoot = ViteReactSSG({ routes });
