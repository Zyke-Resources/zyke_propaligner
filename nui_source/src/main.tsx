import ReactDOM from "react-dom/client";

import "./styling/accordion.css";
import "./styling/popover.css";
import "./styling/base_defaults.css";
import "./styling/index.css";
import "./styling/inputs.css";
import "./styling/text.css";
import "./styling/progress.css";
import "./styling/pagination.css";
import "./styling/kbd.css";
import App from "./components/App";
import EnsureLoader from "./context/EnsureLoader";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <EnsureLoader>
        <App />
    </EnsureLoader>
);
