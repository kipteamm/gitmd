from app.config import PAGES_DIR
from pathlib import Path

from flask import Blueprint, Response, abort, make_response, request


api_bp = Blueprint("api", __name__, url_prefix="/api")


def resolve_safe_path(path: str) -> Path | None:
    if not path: return None

    # Resolve symlinks and normalize traversal dots (../)
    try:
        target = (PAGES_DIR / path).resolve()
        print(target)
    except (ValueError, OSError): return None

    # Target must strictly be inside PAGES_DIR
    if not target.is_relative_to(PAGES_DIR):
        return None

    if not target.is_file() or target.suffix.lower() != ".md":
        return None

    return target


@api_bp.get("/file")
def get_file():
    raw_path = request.args.get("path", "").strip()
    safe_path = resolve_safe_path(raw_path)

    print(safe_path)

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
