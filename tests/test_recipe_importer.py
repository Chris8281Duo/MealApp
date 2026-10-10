import socket
from pathlib import Path

import pytest

from recipe_importer import (
    extract_servings,
    infer_title_from_url,
    normalize_text,
    parse_recipe_html,
    validate_recipe_url,
)

FIXTURES = Path(__file__).parent / "fixtures"


def test_parses_json_ld_recipe():
    html = (FIXTURES / "json_ld_recipe.html").read_text()
    recipe = parse_recipe_html(html, "https://example.com/recipes/lemon-chicken")

    assert recipe["title"] == "Weeknight Lemon Chicken"
    assert recipe["description"] == "Bright, fast, and forgiving for a weeknight."
    assert recipe["servings"] == 4
    assert recipe["image"] == "https://example.com/images/lemon-chicken.jpg"
    assert recipe["ingredients"] == [
        "2 tbsp olive oil",
        "4 chicken breasts",
        "1 lemon, juiced",
        "2 garlic cloves, minced",
        "Salt and pepper to taste",
    ]
    assert recipe["instructions"] == [
        "Season the chicken with salt and pepper.",
        "Sear in olive oil until golden, about 5 minutes per side.",
        "Add garlic and lemon juice, simmer until cooked through.",
    ]


def test_falls_back_to_visible_html_without_json_ld():
    html = (FIXTURES / "visible_html_recipe.html").read_text()
    recipe = parse_recipe_html(html, "https://example.com/recipes/veg-stew")

    assert recipe["title"] == "Rustic Vegetable Stew"
    assert recipe["servings"] is None
    assert recipe["ingredients"] == [
        "2 carrots, sliced",
        "1 onion, diced",
        "400g canned tomatoes",
        "500ml vegetable stock",
    ]
    assert recipe["instructions"] == [
        "Saute the onion and carrots until soft.",
        "Add the tomatoes and stock, then simmer for 25 minutes.",
    ]


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("4", 4),
        ("4 servings", 4),
        (["4 to 6 servings"], 4),
        (None, None),
        ("serves many", None),
    ],
)
def test_extract_servings(raw, expected):
    assert extract_servings(raw) == expected


def test_normalize_text_collapses_whitespace_and_nbsp():
    messy = "A" + chr(160) + "B" + "\t\t" + "C" + "\n\n" + "D"
    assert normalize_text(messy) == "A B C D"


def test_infer_title_from_url_falls_back_when_unparseable():
    assert infer_title_from_url("") == "Imported Recipe"
    assert infer_title_from_url("https://example.com/roast-veg-pasta") == "Roast Veg Pasta"


def test_validate_recipe_url_rejects_non_http_schemes():
    with pytest.raises(ValueError):
        validate_recipe_url("ftp://example.com/recipe")


def test_validate_recipe_url_rejects_loopback_and_link_local():
    with pytest.raises(ValueError):
        validate_recipe_url("http://127.0.0.1/secret")
    with pytest.raises(ValueError):
        validate_recipe_url("http://169.254.169.254/latest/meta-data/")


def test_validate_recipe_url_allows_public_hostnames(monkeypatch):
    def fake_getaddrinfo(host, port):
        assert host == "recipes.example.com"
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    assert (
        validate_recipe_url("https://recipes.example.com/soup")
        == "https://recipes.example.com/soup"
    )
