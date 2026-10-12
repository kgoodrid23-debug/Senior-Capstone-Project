import os
from pathlib import Path

import requests
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

DATA_API_BASE_URL = os.getenv("DATA_API_BASE_URL")


def retrieve_events():
    if not DATA_API_BASE_URL:
        raise RuntimeError("DATA_API_BASE_URL is not configured")

    response = requests.get(
        f"{DATA_API_BASE_URL}/api/events",
        headers={"Accept": "application/json"},
        timeout=10,
    )

    response.raise_for_status()
    return response.json()