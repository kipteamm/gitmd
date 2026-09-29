import { activeFilePath } from "./files";
import { FileTreeApi } from "./pagesApi";

export type TargetType = "file" | "directory" | "nav" | "readme";


export interface TargetContext {
    element: HTMLElement;
    type: TargetType;
    path: string;
}


export interface MenuAction {
    id: string;
    label: string;
    keybind?: string;
    visible: (type: TargetType) => boolean;
    execute: (context: TargetContext) => void | Promise<void>;
}


interface ClipboardPayload {
    action: "copy" | "cut";
    path: string;
}


export class FileTreeManager {
    private menuElement: HTMLUListElement | null = null;
    private actions: MenuAction[] = [];
    private clipboard: ClipboardPayload | null = null;
    private activeContext: TargetContext | null = null;
    private draggedPath: string | null = null;
    private currentDropTargetElement: HTMLElement | null = null;
    private nav = document.getElementById("nav")!;

    constructor(
        private api: FileTreeApi,
        private onTreeMutated: () => void = () => window.location.reload()
    ) {
        this.initEventListeners();
        this.registerDefaultActions();
    }

    public registerAction(action: MenuAction): void {
        this.actions.push(action);
    }

    private initEventListeners(): void {
        this.nav.addEventListener("contextmenu", this.onContextMenu);
        document.addEventListener("click", this.closeMenu);
        document.addEventListener("keydown", this.onKeyDown);

        // Drag & Drop
        this.nav.addEventListener("dragstart", this.onDragStart);
        this.nav.addEventListener("dragover", this.onDragOver);
        this.nav.addEventListener("dragleave", this.onDragLeave);
        this.nav.addEventListener("dragend", this.onDragEnd);
        this.nav.addEventListener("drop", this.onDrop);
    }

    private getDirectory(path: string): string {
        const parts = path.split("/"); parts.pop();
        return parts.join("/") || "./";
    }

    private getDirectoryElement(target: HTMLElement): HTMLElement | null {
        const dirItem = target.closest<HTMLElement>(".tree-item.directory");
        if (dirItem && this.nav.contains(dirItem))
            return dirItem;

        if (this.nav.contains(target))
            return this.nav;

        return null;
    }

    private getTargetContext(target: HTMLElement): TargetContext {
        const item = target.closest("[data-path]") as HTMLElement;

        // Nav allows for new files and folders, but does not have any other
        // contextmenu options
        if (!item || !this.nav.contains(item))
            return { element: this.nav, type: "nav", path: "." };

        const type = (item.getAttribute("data-type") as TargetType);
        const path = item.getAttribute("data-path")!;

        return { element: item, type, path };
    }

    // -------------------
    // Drag and Drop Logic
    // -------------------

    private clearDropHighlight(): void {
        if (!this.currentDropTargetElement) return;

        this.currentDropTargetElement.classList.remove("destination");
        this.currentDropTargetElement = null;
    }

    private setDropHighlight(element: HTMLElement): void {
        if (this.currentDropTargetElement === element) return;

        this.clearDropHighlight();
        this.currentDropTargetElement = element;
        this.currentDropTargetElement.classList.add("destination");
    }

    private onDragStart = (e: DragEvent): void => {
        const target = e.target as HTMLElement;
        if (!target) return;

        const context = this.getTargetContext(target);
        if (context.type === "nav") {
            e.preventDefault();
            return;
        }

        this.draggedPath = context.path;
        if (!e.dataTransfer) return;

        e.dataTransfer.setData("text/plain", context.path);
        e.dataTransfer.effectAllowed = "move";

        this.closeMenu();
    };

    private onDragOver = (e: DragEvent): void => {
        const target = e.target as HTMLElement | null;
        if (!target || !this.draggedPath) return;

        const dirElement = this.getDirectoryElement(target);
        if (!dirElement) {
            this.clearDropHighlight();
            return;
        }

        const destPath = dirElement === this.nav 
            ? "." 
            : (dirElement.dataset.path || ".");

        // Prevent dragging folder into itself or its own subdirectories
        if (target.dataset.path === this.draggedPath || destPath.startsWith(`${this.draggedPath}/`)) {
            this.clearDropHighlight();
            return;
        }

        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";

        this.setDropHighlight(dirElement);
    };

    private onDragLeave = (e: DragEvent): void => {
        const related = e.relatedTarget as Node | null;
        if (this.currentDropTargetElement && !this.currentDropTargetElement.contains(related)) {
            this.clearDropHighlight();
        }
    };

    private onDragEnd = (): void => {
        this.draggedPath = null;
        this.clearDropHighlight();
    };

    private onDrop = async (e: DragEvent): Promise<void> => {
        e.preventDefault();
        this.clearDropHighlight();

        const target = e.target as HTMLElement;
        if (!target || !this.draggedPath) return;

        const context = this.getTargetContext(target);

        if (context.type === "file" || context.type === "readme")
            context.path = this.getDirectory(context.path)

        const source = this.draggedPath;
        this.draggedPath = null;

        const result = await this.api.move(source, context.path);
        if (!result.success) {
            alert(result.error || "Failed to move item.");
            return;
        }

        this.onTreeMutated();
    };

    // -----------------------
    // Context Menu & Keybinds
    // -----------------------

    private onContextMenu = (e: MouseEvent): void => {
        const target = e.target as HTMLElement;
        if (!target) return;

        e.preventDefault();

        this.activeContext = this.getTargetContext(target);
        this.renderMenu(e.pageX, e.pageY, this.activeContext);
    };

    private renderMenu(x: number, y: number, context: TargetContext): void {
        this.closeMenu();

        const visibleActions = this.actions.filter(action => action.visible(context.type));
        if (visibleActions.length === 0) return;

        this.menuElement = document.createElement("ul");
        this.menuElement.className = "context-menu";
        this.menuElement.style.top = `${y}px`;
        this.menuElement.style.left = `${x}px`;

        visibleActions.forEach(action => {
            const li = document.createElement("li");
            li.innerHTML = `${action.label} ${action.keybind ? `<span>${action.keybind}</span>` : ""}`;
            li.id = action.id;

            li.addEventListener("click", async (e) => {
                e.stopPropagation();
                this.closeMenu();
                await action.execute(context);
            });

            this.menuElement!.appendChild(li);
        });

        document.body.appendChild(this.menuElement);
    }

    private closeMenu = (): void => {
        if (!this.menuElement) return;
        
        this.menuElement.remove();
        this.menuElement = null;
    };

    private onKeyDown = (e: KeyboardEvent): void => {
        if (!this.activeContext) return;
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === "F2") {
            e.preventDefault();
            this.executeActionById("rename", this.activeContext);
            return;
        }

        if (e.key === "Delete") {
            e.preventDefault();
            this.executeActionById("delete", this.activeContext);
            return;
        }

        if (e.ctrlKey && e.key.toLowerCase() === "c") {
            e.preventDefault();
            this.executeActionById("copy", this.activeContext);
            return;
        }

        if (e.ctrlKey && e.key.toLowerCase() === "x") {
            e.preventDefault();
            this.executeActionById("cut", this.activeContext);
            return;
        }

        if (e.ctrlKey && e.key.toLowerCase() === "v") {
            e.preventDefault();
            this.executeActionById("paste", this.activeContext);
            return;
        }
    };

    private executeActionById(id: string, context: TargetContext): void {
        const action = this.actions.find(a => a.id === id)!;        
        action.execute(context);
    }

    // -------
    // Actions
    // -------

    private registerDefaultActions(): void {
        this.registerAction({
            id: "new-file",
            label: "New File",
            visible: (type) => type === "directory" || type === "nav",
            execute: async (ctx) => {
                const name = window.prompt("Enter file name (don't include file extensions):") + ".md";
                if (!name?.trim()) return;

                const res = await this.api.createFile(ctx.path, name.trim());
                if (!res.success) return alert(res.error);

                let path = ctx.path + "/" + name.trim();
                if (path.startsWith("./"))
                    path = path.substring(2, path.length);

                window.location.hash = encodeURIComponent(path);
                window.location.reload();
            }
        });

        this.registerAction({
            id: "new-folder",
            label: "New Folder",
            visible: (type) => type === "directory" || type === "nav",
            execute: async (ctx) => {
                const name = window.prompt("Enter folder name:");
                if (!name?.trim()) return;

                const res = await this.api.createFolder(ctx.path, name.trim());
                if (!res.success) return alert(res.error);

                this.onTreeMutated();
            }
        });

        this.registerAction({
            id: "copy",
            label: "Copy",
            keybind: "Ctrl+C",
            visible: (type) => type === "file" || type === "directory" || type === "readme",
            execute: (ctx) => {
                this.clipboard = { action: "copy", path: ctx.path };
            }
        });

        this.registerAction({
            id: "cut",
            label: "Cut",
            keybind: "Ctrl+X",
            visible: (type) => type === "file" || type === "directory",
            execute: (ctx) => {
                this.clipboard = { action: "cut", path: ctx.path };
                ctx.element.classList.add("cut");
            }
        });

        this.registerAction({
            id: "paste",
            label: "Paste",
            keybind: "Ctrl+V",
            visible: (type) => (type === "directory" || type === "nav") && this.clipboard !== null,
            execute: async (ctx) => {
                if (!this.clipboard) return;

                const { action, path: sourcePath } = this.clipboard;
                const res = action === "cut"
                    ? await this.api.move(sourcePath, ctx.path)
                    : await this.api.copy(sourcePath, ctx.path);

                if (!res.success) return alert(res.error);
                if (action === "cut") this.clipboard = null;

                this.onTreeMutated();
            }
        });

        this.registerAction({
            id: "rename",
            label: "Rename",
            keybind: "F2",
            visible: (type) => type === "file" || type === "directory",
            execute: async (ctx) => {
                const currentName = ctx.path.split("/").pop() || "";
                const newName = (window.prompt(
                    "Enter new name (don't include file extensions):",
                    // Remove .md extension for files and re-add it later 
                    currentName.substring(
                        0, currentName.length - (ctx.type === "file"? 3: 0)
                    )
                ) || currentName).trim() + (ctx.type === "file"? ".md": "");

                if (newName.trim() === currentName) return;

                const res = await this.api.rename(ctx.path, newName);
                if (!res.success) return alert(res.error);

                if (activeFilePath === ctx.path) {
                    const path = ctx.path.substring(0, ctx.path.length - currentName.length) + newName;
                    window.history.replaceState({ path }, "", `#${encodeURIComponent(path)}`);
                }

                // Little delay so that window history can execute
                setTimeout(() => window.location.reload(), 100);
            }
        });

        this.registerAction({
            id: "delete",
            label: "Delete",
            keybind: "Del",
            visible: (type) => type === "file" || type === "directory",
            execute: async (ctx) => {
                const isConfirmed = window.confirm(`Delete ${ctx.type} "${ctx.path}"?`);
                if (!isConfirmed) return;

                const res = await this.api.delete(ctx.path);
                if (!res.success) return alert(res.error);

                window.history.back();
                // Little delay so that window history can execute
                setTimeout(() => window.location.reload(), 100);
            }
        });
    }
}
