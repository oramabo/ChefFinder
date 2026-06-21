import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.tsx";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/global.css";

export const createRoot = ViteReactSSG({ routes });
