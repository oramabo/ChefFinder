import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.tsx";
// Self-hosted Hebrew fonts (no external requests): Frank Ruhl Libre for display,
// Assistant for body/UI.
import "@fontsource/frank-ruhl-libre/hebrew-500.css";
import "@fontsource/frank-ruhl-libre/hebrew-700.css";
import "@fontsource/frank-ruhl-libre/hebrew-900.css";
import "@fontsource/assistant/hebrew-400.css";
import "@fontsource/assistant/hebrew-600.css";
import "@fontsource/assistant/hebrew-700.css";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/global.css";

export const createRoot = ViteReactSSG({ routes });
