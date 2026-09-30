from pathlib import Path
from typing import Any

from flask_login import login_required
from flask import Blueprint, Response, abort, make_response, request, current_app

import shutil


api_bp = Blueprint("api", __name__, url_prefix="/api")


def resolve_safe_path(path: str, is_file: bool) -> Path | None:
    if not path: return None
    docs_root = current_app.config["DOCS_ROOT"]

    # Resolve symlinks and normalize traversal dots (../)
    try:
        target = (docs_root / path).resolve()
        print(target)
    except (ValueError, OSError): return None

    # Target must strictly be inside DOCS_ROOT
    if not target.is_relative_to(docs_root):
        return None

    if not is_file:
        return target

    if not target.is_file() or target.suffix.lower() != ".md":
        return None

    return target


@api_bp.get("/file")
@login_required
def get_entity():
    raw_path = request.args.get("path", "").strip()
    safe_path = resolve_safe_path(raw_path, True)

    if safe_path is None:
        abort(404, description="File not found or access denied")

    try:
        stat_result = safe_path.stat()
    except OSError:
        abort(404)

    # Fast 304 cache check based on file mtime and size
    etag = f'"{int(stat_result.st_mtime)}-{stat_result.st_size}"'
    client_etag = request.headers.get("If-None-Match")

    if client_etag == etag:
        return Response(status=304)

    content = safe_path.read_text(encoding="utf-8", errors="replace")

    response = make_response(content)
    response.headers["Content-Type"] = "text/markdown; charset=utf-8"
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "no-cache"

    return response


@api_bp.put("/file/save")
@login_required
def save_file():
    data: dict[str, Any] | None = request.get_json()
    if not data:
        return {"success": False, "message": "Invalid JSON payload"}, 400

    path_str: str = data.get("path", "")
    content: str = data.get("content", "")
    
    target = resolve_safe_path(path_str, True)
    if not target:
        return {"success": False, "message": "Invalid path"}, 403

    if target.exists() and not target.is_file():
        return {"success": False, "message": "Target is not a file"}, 400

    try:
        target.write_text(content, encoding="utf-8")
    except OSError as e:
        return {"success": False, "message": str(e)}, 500

    return {"success": True}, 200


@api_bp.post("/file/create")
@login_required
def create_entity():
    data: dict[str, Any] | None = request.get_json()
    if not data:
        return {"success": False, "message": "Invalid JSON payload"}, 400

    folder_path: str = data.get("folderPath", "")
    name: str = data.get("name", "")
    entity_type: str = data.get("type", "file")

    parent_dir = resolve_safe_path(folder_path, False)
    if not parent_dir:
        return {"success": False, "message": "Invalid folder path"}, 403

    target = resolve_safe_path(f"{folder_path}/{name}", False)
    if not target:
        return {"success": False, "message": "Invalid target path"}, 403

    if target.exists():
        return {"success": False, "message": "Entity already exists"}, 409

    try:
        if entity_type == "directory":
            target.mkdir(parents=True, exist_ok=True)

            # Create one file in the folder by default
            index_file = Path(target) / "README.md"
            index_file.touch()
        else:
            target.touch()
    except OSError as e:
        return {"success": False, "message": str(e)}, 500

    return {"success": True}, 201


@api_bp.patch("/file/rename")
@login_required
def rename_entity():
    data: dict[str, Any] | None = request.get_json()
    if not data:
        return {"success": False, "message": "Invalid JSON payload"}, 400

    path_str: str = data.get("path", "")
    new_name: str = data.get("newName", "")

    # This is used for directories and files (=> is_file cannot be True)
    target = resolve_safe_path(path_str, False)
    if not target or not target.exists():
        return {"success": False, "message": "Invalid or missing path"}, 404

    new_target = target.parent / new_name
    if not new_target.is_relative_to(current_app.config["DOCS_ROOT"]):
        return {"success": False, "message": "Invalid new name"}, 403

    if new_target.exists():
        return {"success": False, "message": "Destination name already in use"}, 409

    try:
        target.rename(new_target)
    except OSError as e:
        return {"success": False, "message": str(e)}, 500

    return {"success": True}, 200


@api_bp.delete("/file/delete")
@login_required
def delete_entity():
    data: dict[str, Any] | None = request.get_json()
    if not data:
        return {"success": False, "message": "Invalid JSON payload"}, 400

    path_str: str = data.get("path", "")
    target = resolve_safe_path(path_str, False)

    if not target or not target.exists():
        return {"success": False, "message": "Invalid or missing path"}, 404

    try:
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
    except OSError as e:
        return {"success": False, "message": str(e)}, 500

    return {"success": True}, 200


@api_bp.post("/file/move")
@login_required
def move_entity():
    data: dict[str, Any] | None = request.get_json()
    if not data:
        return {"success": False, "message": "Invalid JSON payload"}, 400

    source_str: str = data.get("sourcePath", "")
    dest_str: str = data.get("destinationDir", "")

    # One can also move a directory so should not be a file
    source_target = resolve_safe_path(source_str, False)
    dest_dir = resolve_safe_path(dest_str, False)

    if not source_target or not dest_dir:
        return {"success": False, "message": "Invalid paths"}, 403

    if not source_target.exists() or not dest_dir.is_dir():
        return {"success": False, "message": "Source missing or destination is not a directory"}, 404

    new_target = dest_dir / source_target.name
    print(new_target)
    if new_target.exists():
        return {"success": False, "message": "Destination already exists"}, 409

    try:
        shutil.move(str(source_target), str(new_target))
    except OSError as e:
        return {"success": False, "message": str(e)}, 500

    return {"success": True}, 200


@api_bp.post("/file/copy")
@login_required
def copy_entity():
    data: dict[str, Any] | None = request.get_json()
    if not data:
        return {"success": False, "message": "Invalid JSON payload"}, 400

    source_str: str = data.get("sourcePath", "")
    dest_str: str = data.get("destinationDir", "")

    source_target = resolve_safe_path(source_str, True)
    dest_dir = resolve_safe_path(dest_str, False)

    if not source_target or not dest_dir:
        return {"success": False, "message": "Invalid paths"}, 403

    if not source_target.exists() or not dest_dir.is_dir():
        return {"success": False, "message": "Source missing or destination is not a directory"}, 404

    new_target = dest_dir / source_target.name
    if new_target.exists():
        return {"success": False, "message": "Destination already exists"}, 409

    try:
        if source_target.is_dir():
            shutil.copytree(source_target, new_target)
        else:
            shutil.copy2(source_target, new_target)
    except OSError as e:
        return {"success": False, "message": str(e)}, 500

    return {"success": True}, 200
