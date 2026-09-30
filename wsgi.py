import os
from dotenv import load_dotenv
from pathlib import Path
from app import create_app


load_dotenv()


target = Path(os.environ["GITMD_DOCS_DIR"]).resolve()
app = create_app(target_dir=target)
