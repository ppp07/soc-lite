import pytest

from app.core.request_id import get_request_id, new_request_id, resolve_request_id


def test_valid_client_id_is_echoed() -> None:
    assert resolve_request_id("abc-123_X.y") == "abc-123_X.y"


@pytest.mark.parametrize(
    "bad", [None, "", "has space", "new\nline", "a" * 65, "<script>", "id;drop"]
)
def test_invalid_client_id_replaced(bad: str | None) -> None:
    result = resolve_request_id(bad)
    assert result != bad
    assert len(result) == 32


def test_generated_ids_unique() -> None:
    assert new_request_id() != new_request_id()


def test_get_request_id_from_scope() -> None:
    assert get_request_id({"state": {"request_id": "x"}}) == "x"
    assert get_request_id({}) is None
    assert get_request_id({"state": {"request_id": 5}}) is None
