from app.config import PAGES_DIR, DEFAULT_INDEX_CONTENT
from pathlib import Path
from typing import TypedDict, Literal

import os


class FileNode(TypedDict):
    name: str
    path: str
    type: Literal["file", "directory"]
    children: list["FileNode"]


class PagesTree:

    def __init__(self) -> None:
        self.root_path = PAGES_DIR
        self.root_path.mkdir(parents=True, exist_ok=True)

        self._ensure_index()

        self._cached_tree: FileNode | None = None
        self._dir_mtimes: dict[str, float] = {}


    def _ensure_index(self) -> None:
        # Check if the directory is empty using scandir for efficiency
        with os.scandir(self.root_path) as entries:
            if any(entries):
                return

        index_file = self.root_path / "index.md"
        index_file.write_text(DEFAULT_INDEX_CONTENT, encoding="utf-8")


    def _is_cache_valid(self) -> bool:
        if self._cached_tree is None: return False

        # Compare current folder mtimes (last modified timestamp) against 
        # cached mtimes to quikly determine whether cache changed.
        current_dirs: set[str] = set()

        for dirpath, _, _ in os.walk(self.root_path):
            current_dirs.add(dirpath)
            try:
                current_mtime = os.stat(dirpath).st_mtime

            except OSError: return False

            if self._dir_mtimes.get(dirpath) != current_mtime:
                return False

        if set(self._dir_mtimes.keys()) != current_dirs:
            return False

        return True


    def _build_tree(self, current_dir: Path) -> FileNode:
        mtime = current_dir.stat().st_mtime
        self._dir_mtimes[str(current_dir)] = mtime

        children: list[FileNode] = []

        # os.scandir is faster than Path.iterdir() as it avoids extra stat 
        # calls
        with os.scandir(current_dir) as entries:
            # sorted_entries = sorted(entries, key=lambda entry: entry.name.lower())
            for entry in entries:
                path = Path(entry.path)

                if entry.is_dir(follow_symlinks=False):
                    subtree = self._build_tree(path)

                    # Skip empty folders
                    if not subtree["children"]: continue
                    
                    children.append(subtree)

                if not entry.is_file(follow_symlinks=False):
                    continue

                if not entry.name.lower().endswith(".md"):
                    continue

                rel_path = path.relative_to(self.root_path).as_posix()
                children.append({
                    "name": entry.name[:-3],
                    "path": rel_path,
                    "type": "file",
                    "children": [],
                })

        return ({
            "name": current_dir.name,
            "path": current_dir.relative_to(self.root_path.parent).as_posix(),
            "type": "directory",
            "children": children,
        })


    def get_pages(self) -> FileNode:
        if not self.root_path.exists():
            return {
                "name": self.root_path.name,
                "path": self.root_path.name,
                "type": "directory",
                "children": [],
            }

        if self._is_cache_valid() and self._cached_tree is not None:
            return self._cached_tree

        # Rebuild cache when invalidated
        self._dir_mtimes.clear()
        self._cached_tree = self._build_tree(self.root_path)

        return self._cached_tree
