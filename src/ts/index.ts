// @ts-ignore
import "../css/index.css";
import "./editor";
import "./files";

import { FileTreeManager } from "./fileTreeManager";
import { api } from "./pagesApi";


document.getElementById("menu")!.addEventListener("click", () => {
    document.getElementById("nav")!.classList.toggle("active");
});


new FileTreeManager(api, () => window.location.reload());
