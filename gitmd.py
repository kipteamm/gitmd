import argparse
from pathlib import Path
from app import create_app


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run local markdown doc editor."
    )
    parser.add_argument(
        "target",
        nargs="?",
        help="Path to repository or docs root (use '.' for current dir)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port to serve on (default: 5000)",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host binding (default: 127.0.0.1)",
    )
    args = parser.parse_args()

    if not args.target:
        parser.error("Target dir required.")

    target_path = Path(args.target).resolve()
    
    app = create_app(target_dir=target_path)
    app.run(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
