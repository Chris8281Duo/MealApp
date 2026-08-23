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
# (i.e. the most specific one) wins. Board keywords spell out "raspberry pi"
# in full (rather than a bare "pi 4") so a clone board that merely mentions
# Raspberry Pi for compatibility (e.g. "Orange Pi 4", "for Raspberry Pi")
# can't satisfy them by coincidence.
REFERENCE_VALUES = [
    {"label": "Raspberry Pi 5 (8GB)", "keywords": ["raspberry pi 5", "8gb"], "value": 80, "kind": "board"},
    {"label": "Raspberry Pi 5 (4GB)", "keywords": ["raspberry pi 5", "4gb"], "value": 60, "kind": "board"},
    {"label": "Raspberry Pi 5 (2GB)", "keywords": ["raspberry pi 5", "2gb"], "value": 50, "kind": "board"},
    {"label": "Raspberry Pi 4 Model B (8GB)", "keywords": ["raspberry pi 4", "8gb"], "value": 75, "kind": "board"},
    {"label": "Raspberry Pi 4 Model B (4GB)", "keywords": ["raspberry pi 4", "4gb"], "value": 55, "kind": "board"},
    {"label": "Raspberry Pi 4 Model B (2GB)", "keywords": ["raspberry pi 4", "2gb"], "value": 45, "kind": "board"},
    {"label": "Raspberry Pi 4 Model B (1GB)", "keywords": ["raspberry pi 4", "1gb"], "value": 35, "kind": "board"},
    {"label": "Raspberry Pi 400", "keywords": ["raspberry pi 400"], "value": 70, "kind": "board"},
    {"label": "Raspberry Pi 3 Model B+", "keywords": ["raspberry pi 3", "b+"], "value": 35, "kind": "board"},
    {"label": "Raspberry Pi 3 Model B", "keywords": ["raspberry pi 3", "model b"], "value": 30, "kind": "board"},
    {"label": "Raspberry Pi 3 Model A+", "keywords": ["raspberry pi 3", "model a+"], "value": 25, "kind": "board"},
    {"label": "Raspberry Pi 2 Model B", "keywords": ["raspberry pi 2"], "value": 25, "kind": "board"},
    {"label": "Raspberry Pi 1 Model B+", "keywords": ["raspberry pi model b+"], "value": 20, "kind": "board"},
    {"label": "Raspberry Pi Zero 2 W", "keywords": ["raspberry pi zero 2 w"], "value": 15, "kind": "board"},
    {"label": "Raspberry Pi Zero W", "keywords": ["raspberry pi zero w"], "value": 10, "kind": "board"},
    {"label": "Raspberry Pi Zero", "keywords": ["raspberry pi zero"], "value": 5, "kind": "board"},
    {"label": "Raspberry Pi Pico 2 W", "keywords": ["pico 2 w"], "value": 8, "kind": "board"},
    {"label": "Raspberry Pi Pico 2", "keywords": ["pico 2"], "value": 5, "kind": "board"},
    {"label": "Raspberry Pi Pico W", "keywords": ["pico w"], "value": 6, "kind": "board"},
    {"label": "Raspberry Pi Pico", "keywords": ["pico"], "value": 4, "kind": "board"},
    {"label": "Raspberry Pi Compute Module 5", "keywords": ["compute module 5"], "value": 45, "kind": "board"},
    {"label": "Raspberry Pi Compute Module 4", "keywords": ["compute module 4"], "value": 30, "kind": "board"},
    {"label": "Raspberry Pi Camera Module 3", "keywords": ["camera module 3"], "value": 25, "kind": "accessory"},
    {"label": "Raspberry Pi Camera Module", "keywords": ["camera module"], "value": 15, "kind": "accessory"},
    {"label": "Raspberry Pi High Quality Camera", "keywords": ["high quality camera"], "value": 50, "kind": "accessory"},
    {"label": "Raspberry Pi Sense HAT", "keywords": ["sense hat"], "value": 40, "kind": "accessory"},
    {"label": "Raspberry Pi Build HAT", "keywords": ["build hat"], "value": 25, "kind": "accessory"},
    {"label": "Raspberry Pi AI HAT+", "keywords": ["ai hat"], "value": 110, "kind": "accessory"},
    {"label": "Raspberry Pi AI Kit", "keywords": ["ai kit"], "value": 70, "kind": "accessory"},
    {"label": "Raspberry Pi M.2 HAT+", "keywords": ["m.2 hat"], "value": 15, "kind": "accessory"},
    {"label": "Raspberry Pi PoE+ HAT", "keywords": ["poe+ hat"], "value": 20, "kind": "accessory"},
    {"label": "Raspberry Pi PoE HAT", "keywords": ["poe hat"], "value": 18, "kind": "accessory"},
    {"label": "Raspberry Pi Touch Display 2", "keywords": ["touch display 2"], "value": 60, "kind": "accessory"},
    {"label": "Raspberry Pi Touch Display", "keywords": ["touch display"], "value": 55, "kind": "accessory"},
    {"label": "Raspberry Pi Official Keyboard", "keywords": ["official keyboard"], "value": 12, "kind": "accessory"},
    {"label": "Raspberry Pi Official Mouse", "keywords": ["official mouse"], "value": 8, "kind": "accessory"},
    {"label": "Raspberry Pi Active Cooler", "keywords": ["active cooler"], "value": 5, "kind": "accessory"},
    {
        "label": "Raspberry Pi Official 27W USB-C Power Supply",
        "keywords": ["27w", "power supply"],
        "value": 12,
        "kind": "accessory",
    },
    {"label": "Raspberry Pi Official Case", "keywords": ["official case"], "value": 10, "kind": "accessory"},
]

BRAND_GATE_KEYWORDS = ["raspberry pi", "rpi"]

# Accessory listings often mention a board only for compatibility ("Case for
# Raspberry Pi 4", "Supports Raspberry Pi 3B+/4B"). Without this, that
# mention alone can satisfy a board's keywords and get mispriced as the
# board itself.
ACCESSORY_PHRASE_PATTERN = re.compile(
    r"\b(?:for|supports?|compatible(?:\s+with)?|works\s+with|fits)\s+(?:the\s+)?(?:raspberry\s+pi|rpi)\b",
    re.IGNORECASE,
)

# Approximate, static conversion rates to USD. Good enough to catch a deal
# without chasing live FX rates; listings in unlisted currencies are skipped
# rather than compared incorrectly.
EXCHANGE_RATES_TO_USD = {"$": 1.0, "£": 1.27, "€": 1.08}


def find_deals_from_url(
    url: str,
    threshold: float = DEFAULT_DEAL_THRESHOLD,
    value_overrides: dict[str, float] | None = None,
) -> dict:
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
    return find_deals_from_html(response.text, validated_url, threshold, value_overrides)


def find_deals_from_html(
    html: str,
    source_url: str,
    threshold: float = DEFAULT_DEAL_THRESHOLD,
    value_overrides: dict[str, float] | None = None,
) -> dict:
    listings = parse_listings_html(html, source_url)
    return evaluate_deals(listings, threshold, value_overrides)


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

    for item in soup.select("li.s-item, div.s-item, li.s-card, div.s-card"):
        title_el = item.select_one(".s-item__title, .s-card__title")
        price_el = item.select_one(".s-item__price, .s-card__price")
        link_el = item.select_one("a.s-item__link, a.s-card__link") or item.find("a")
        image_el = item.select_one(".s-item__image-img, .s-card__image") or item.find("img")

        title = extract_listing_title(title_el)
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
                "isAuction": is_auction_listing(item),
            }
        )

    return listings


def is_auction_listing(item) -> bool:
    # A live auction's current price is just the highest bid so far, not a
    # price you can actually pay today, so it can't be judged as a "deal".
    return bool(re.search(r"\d+\s+bids?\b", item.get_text(" ", strip=True), re.IGNORECASE))


def extract_listing_title(title_el) -> str:
    if not title_el:
        return ""

    clipped = title_el.select_one(".clipped")
    if clipped:
        clipped.extract()

    title = normalize_text(title_el.get_text(" ", strip=True))
    return re.sub(r"^New [Ll]isting\s+", "", title).strip()


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
                "isAuction": is_auction_listing(container) if container else False,
            }
        )

    return listings


def evaluate_deals(
    listings: list[dict],
    threshold: float = DEFAULT_DEAL_THRESHOLD,
    value_overrides: dict[str, float] | None = None,
) -> dict:
    deals = []
    value_overrides = value_overrides or {}

    for listing in listings:
        if listing.get("isAuction"):
            continue

        title_lower = listing["title"].lower()
        if not any(keyword in title_lower for keyword in BRAND_GATE_KEYWORDS):
            continue

        match = match_reference_value(title_lower)
        if not match:
            continue

        if match["kind"] == "board" and ACCESSORY_PHRASE_PATTERN.search(title_lower):
            continue

        rate = EXCHANGE_RATES_TO_USD.get(listing["currency"])
        if rate is None:
            continue

        price = listing["price"]
        override_value = value_overrides.get(match["label"])
        value = override_value if isinstance(override_value, (int, float)) and override_value >= 0 else match["value"]
        price_usd = price * rate
        if price_usd <= 0 or price_usd >= value:
            continue

        discount = (value - price_usd) / value
        if discount < threshold:
            continue

        deals.append(
            {
                "title": listing["title"],
                "match": match["label"],
                "price": price,
                "currency": listing["currency"],
                "priceUsd": round(price_usd, 2),
                "estimatedValueUsd": value,
                "discountPercent": round(discount * 100, 1),
                "link": listing["link"],
                "image": listing["image"],
                "approxConversion": listing["currency"] != "$",
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
