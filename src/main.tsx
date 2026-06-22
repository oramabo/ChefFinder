import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.tsx";
// Self-hosted fonts (no external requests): Frank Ruhl Libre for display,
// Open Sans (Latin + Hebrew) for body/UI.
import "@fontsource/frank-ruhl-libre/hebrew-500.css";
import "@fontsource/frank-ruhl-libre/hebrew-700.css";
import "@fontsource/frank-ruhl-libre/hebrew-900.css";
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-600.css";
import "@fontsource/open-sans/latin-700.css";
import "@fontsource/open-sans/hebrew-400.css";
import "@fontsource/open-sans/hebrew-600.css";
import "@fontsource/open-sans/hebrew-700.css";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/global.css";

export const createRoot = ViteReactSSG({ routes });
