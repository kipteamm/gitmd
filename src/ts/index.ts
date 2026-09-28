// @ts-ignore
import "../css/index.css";
import "./editor";
import "./files";

import { FileTreeManager } from "./fileTreeManager";
import { FileTreeApi } from "./pagesApi";


document.getElementById("menu")!.addEventListener("click", () => {
    document.getElementById("nav")!.classList.toggle("active");
});


const api = new FileTreeApi();
new FileTreeManager(api, () => window.location.reload());
