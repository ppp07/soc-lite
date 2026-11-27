import tomllib
from pathlib import Path

from app import __version__


def test_version_matches_pyproject() -> None:
    data = tomllib.loads((Path(__file__).parents[2] / "pyproject.toml").read_text())
    assert data["project"]["version"] == __version__
