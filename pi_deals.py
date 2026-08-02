from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


DEFAULT_DEAL_THRESHOLD = 0.15

PRICE_PATTERN = re.compile(r"([$£€])\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?)")

# Typical resale/market value for common Raspberry Pi boards, kits, and
# accessories in USD. Every keyword in an entry must appear in a listing's
# title for that entry to match; the entry with the most matched keywords
# (i.e. the most specific one) wins.
REFERENCE_VALUES = [
    {"label": "Raspberry Pi 5 (8GB)", "keywords": ["pi 5", "8gb"], "value": 80},
    {"label": "Raspberry Pi 5 (4GB)", "keywords": ["pi 5", "4gb"], "value": 60},
    {"label": "Raspberry Pi 5 (2GB)", "keywords": ["pi 5", "2gb"], "value": 50},
    {"label": "Raspberry Pi 4 Model B (8GB)", "keywords": ["pi 4", "8gb"], "value": 75},
    {"label": "Raspberry Pi 4 Model B (4GB)", "keywords": ["pi 4", "4gb"], "value": 55},
    {"label": "Raspberry Pi 4 Model B (2GB)", "keywords": ["pi 4", "2gb"], "value": 45},
    {"label": "Raspberry Pi 4 Model B (1GB)", "keywords": ["pi 4", "1gb"], "value": 35},
    {"label": "Raspberry Pi 400", "keywords": ["pi 400"], "value": 70},
    {"label": "Raspberry Pi 3 Model B+", "keywords": ["pi 3", "b+"], "value": 35},
    {"label": "Raspberry Pi 3 Model B", "keywords": ["pi 3", "model b"], "value": 30},
    {"label": "Raspberry Pi Zero 2 W", "keywords": ["zero 2 w"], "value": 15},
    {"label": "Raspberry Pi Zero W", "keywords": ["zero w"], "value": 10},
    {"label": "Raspberry Pi Zero", "keywords": ["pi zero"], "value": 5},
    {"label": "Raspberry Pi Pico W", "keywords": ["pico w"], "value": 6},
    {"label": "Raspberry Pi Pico", "keywords": ["pico"], "value": 4},
    {"label": "Raspberry Pi Camera Module 3", "keywords": ["camera module 3"], "value": 25},
    {"label": "Raspberry Pi Camera Module", "keywords": ["camera module"], "value": 15},
    {"label": "Raspberry Pi Sense HAT", "keywords": ["sense hat"], "value": 40},
    {"label": "Raspberry Pi PoE+ HAT", "keywords": ["poe+ hat", "poe hat"], "value": 20},
    {
        "label": "Raspberry Pi Official 27W USB-C Power Supply",
        "keywords": ["27w", "power supply"],
        "value": 12,
    },
    {"label": "Raspberry Pi Official Case", "keywords": ["official case"], "value": 10},
]

BRAND_GATE_KEYWORDS = ["raspberry pi", "rpi"]


def find_deals_from_url(url: str, threshold: float = DEFAULT_DEAL_THRESHOLD) -> dict:
    validated_url = validate_listing_url(url)
    response = requests.get(
        validated_url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "Mozilla/5.0 (compatible; PiDealFinder/1.0)",
        },
        timeout=20,
    )
    response.raise_for_status()
    return find_deals_from_html(response.text, validated_url, threshold)


def find_deals_from_html(html: str, source_url: str, threshold: float = DEFAULT_DEAL_THRESHOLD) -> dict:
    listings = parse_listings_html(html, source_url)
    return evaluate_deals(listings, threshold)


def validate_listing_url(url: str) -> str:
    if not url:
        raise ValueError("A listings page URL is required.")

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http and https listing URLs are supported.")
    if not parsed.netloc:
        raise ValueError("That listings URL is not valid.")

    return url


def parse_listings_html(html: str, source_url: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    listings = extract_ebay_style_listings(soup, source_url)
    if listings:
        return listings
    return extract_generic_listings(soup, source_url)


def extract_ebay_style_listings(soup: BeautifulSoup, source_url: str) -> list[dict]:
    listings = []

    for item in soup.select("li.s-item, div.s-item"):
        title_el = item.select_one(".s-item__title")
        price_el = item.select_one(".s-item__price")
        link_el = item.select_one("a.s-item__link") or item.find("a")
        image_el = item.select_one(".s-item__image-img") or item.find("img")

        title = normalize_text(title_el.get_text(" ", strip=True) if title_el else "")
        if not title or title.lower() == "shop on ebay":
            continue

        price_text = price_el.get_text(" ", strip=True) if price_el else ""
        price = parse_price(price_text)
        if not price:
            continue

        link = resolve_url(link_el.get("href") if link_el else "", source_url)
        image = resolve_url(image_el.get("src") if image_el else "", source_url)

        listings.append(
            {
                "title": title,
                "price": price["amount"],
                "currency": price["currency"],
                "link": link,
                "image": image,
            }
        )

    return listings


def extract_generic_listings(soup: BeautifulSoup, source_url: str) -> list[dict]:
    listings = []
    seen_links = set()

    for anchor in soup.find_all("a", href=True):
        anchor_text = normalize_text(anchor.get_text(" ", strip=True))
        container = anchor.find_parent(["li", "div", "article"]) or anchor.parent
        context_text = normalize_text(container.get_text(" ", strip=True)) if container else anchor_text

        price = parse_price(context_text)
        if not price:
            continue

        title = anchor_text if len(anchor_text) > 8 else context_text[:120]
        if not title:
            continue

        link = resolve_url(anchor.get("href"), source_url)
        if not link or link in seen_links:
            continue
        seen_links.add(link)

        image_el = (container.find("img") if container else None) or anchor.find("img")
        image = resolve_url(image_el.get("src") if image_el else "", source_url)

        listings.append(
            {
                "title": title,
                "price": price["amount"],
                "currency": price["currency"],
                "link": link,
                "image": image,
            }
        )

    return listings


def evaluate_deals(listings: list[dict], threshold: float = DEFAULT_DEAL_THRESHOLD) -> dict:
    deals = []

    for listing in listings:
        title_lower = listing["title"].lower()
        if not any(keyword in title_lower for keyword in BRAND_GATE_KEYWORDS):
            continue

        match = match_reference_value(title_lower)
        if not match:
            continue

        price = listing["price"]
        value = match["value"]
        if price <= 0 or price >= value:
            continue

        discount = (value - price) / value
        if discount < threshold:
            continue

        deals.append(
            {
                "title": listing["title"],
                "match": match["label"],
                "price": price,
                "currency": listing["currency"],
                "estimatedValue": value,
                "discountPercent": round(discount * 100, 1),
                "link": listing["link"],
                "image": listing["image"],
                "comparable": listing["currency"] == "$",
            }
        )

    deals.sort(key=lambda deal: deal["discountPercent"], reverse=True)
    return {"deals": deals, "scanned": len(listings)}


def match_reference_value(title_lower: str) -> dict | None:
    best_match = None
    best_score = 0

    for entry in REFERENCE_VALUES:
        if all(keyword in title_lower for keyword in entry["keywords"]):
            score = len(entry["keywords"])
            if score > best_score:
                best_score = score
                best_match = entry

    return best_match


def parse_price(text: str) -> dict | None:
    if not text:
        return None

    match = PRICE_PATTERN.search(text)
    if not match:
        return None

    currency, amount_text = match.groups()
    amount_text = amount_text.replace(",", "")
    try:
        amount = float(amount_text)
    except ValueError:
        return None

    return {"currency": currency, "amount": amount}


def resolve_url(value: str | None, source_url: str) -> str:
    if not value:
        return ""
    try:
        return urljoin(source_url, value)
    except ValueError:
        return ""


def normalize_text(value: object) -> str:
    return str(value or "").replace("\xa0", " ").strip()
