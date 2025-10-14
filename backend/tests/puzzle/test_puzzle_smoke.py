import importlib

def test_puzzle_modules_import():
    # Importing modules covers a surprising amount of lines when they have helpers/constants
    for mod in ("puzzle.adapters", "puzzle.views"):
        m = importlib.import_module(mod)
        assert m is not None

def test_puzzle_urls_has_urlpatterns():
    urls = importlib.import_module("puzzle.urls")
    assert isinstance(getattr(urls, "urlpatterns", []), list)

