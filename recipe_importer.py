from __future__ import annotations

import ipaddress
import json
import socket
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

MAX_REDIRECTS = 5


def import_recipe_from_url(url: str) -> dict:
    validated_url = validate_recipe_url(url)
    final_url, html = fetch_recipe_url(validated_url)
    return parse_recipe_html(html, final_url)


def fetch_recipe_url(url: str) -> tuple[str, str]:
    current_url = url

    for _ in range(MAX_REDIRECTS + 1):
        response = requests.get(
            current_url,
            headers={"Accept": "text/html,application/xhtml+xml"},
            timeout=20,
            allow_redirects=False,
        )

        location = response.headers.get("Location")
        if response.is_redirect and location:
            current_url = validate_recipe_url(urljoin(current_url, location))
            continue

        response.raise_for_status()
        return current_url, response.text

    raise ValueError("That recipe URL redirected too many times.")


def parse_recipe_html(html: str, source_url: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    recipe = extract_recipe_from_json_ld(soup, source_url)
    if recipe:
        return recipe
    return extract_recipe_from_visible_html(soup, source_url)


def validate_recipe_url(url: str) -> str:
    if not url:
        raise ValueError("A recipe URL is required.")

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http and https recipe URLs are supported.")
    if not parsed.hostname:
        raise ValueError("That recipe URL is not valid.")

    ensure_hostname_is_public(parsed.hostname)
    return url


def ensure_hostname_is_public(hostname: str) -> None:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise ValueError("That recipe URL could not be resolved.")

    addresses = {info[4][0] for info in infos}
    if not addresses:
        raise ValueError("That recipe URL could not be resolved.")

    for address in addresses:
        ip = ipaddress.ip_address(address)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ValueError("That recipe URL points to a restricted address.")


def extract_recipe_from_json_ld(soup: BeautifulSoup, source_url: str) -> dict | None:
    scripts = soup.find_all("script", attrs={"type": "application/ld+json"})
    nodes: list[dict] = []

    for script in scripts:
      try:
          parsed = json.loads(script.get_text(strip=True) or "null")
      except json.JSONDecodeError:
          continue

      payload = parsed if isinstance(parsed, list) else [parsed]
      for node in payload:
          if isinstance(node, dict):
              nodes.extend(flatten_json_ld_nodes(node))

    recipe_node = next((node for node in nodes if is_recipe_node(node)), None)
    if not recipe_node:
        return None

    instructions = normalize_instructions(recipe_node.get("recipeInstructions"))
    ingredients = normalize_string_list(recipe_node.get("recipeIngredient"))
    description = normalize_text(recipe_node.get("description"))
    title = normalize_text(recipe_node.get("name")) or infer_title_from_url(source_url)
    image = normalize_image(recipe_node.get("image"))

    return {
        "title": title,
        "sourceUrl": source_url,
        "description": description,
        "ingredients": ingredients,
        "instructions": instructions,
        "method": " ".join(instructions),
        "image": image,
    }


def extract_recipe_from_visible_html(soup: BeautifulSoup, source_url: str) -> dict:
    title = normalize_text(soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else "")
    description_tag = soup.find("meta", attrs={"name": "description"})
    description = normalize_text(description_tag.get("content") if description_tag else "")
    ingredients = gather_list_after_heading(soup, ["ingredients"])
    instructions = gather_list_after_heading(
        soup, ["instructions", "method", "directions", "preparation"]
    )

    return {
        "title": title or infer_title_from_url(source_url),
        "sourceUrl": source_url,
        "description": description,
        "ingredients": ingredients,
        "instructions": instructions,
        "method": " ".join(instructions),
        "image": "",
    }


def gather_list_after_heading(soup: BeautifulSoup, keywords: list[str]) -> list[str]:
    headings = soup.find_all(["h1", "h2", "h3", "h4", "strong", "b"])
    for heading in headings:
        heading_text = normalize_text(heading.get_text(" ", strip=True)).lower()
        if not any(keyword in heading_text for keyword in keywords):
            continue

        sibling = heading.find_next_sibling()
        while sibling is not None:
            if sibling.name in {"ul", "ol"}:
                return [
                    normalize_text(item.get_text(" ", strip=True))
                    for item in sibling.find_all("li")
                    if normalize_text(item.get_text(" ", strip=True))
                ]

            if sibling.name == "p":
                lines = [
                    normalize_text(line)
                    for line in sibling.get_text("\n", strip=True).splitlines()
                    if normalize_text(line)
                ]
                if lines:
                    return lines

            sibling = sibling.find_next_sibling()

    return []


def flatten_json_ld_nodes(node: dict) -> list[dict]:
    graph = node.get("@graph")
    nodes = [node]
    if isinstance(graph, list):
        nodes.extend(item for item in graph if isinstance(item, dict))
    return nodes


def is_recipe_node(node: dict) -> bool:
    node_type = node.get("@type")
    if isinstance(node_type, list):
        return "Recipe" in node_type
    return node_type == "Recipe"


def normalize_instructions(raw: object) -> list[str]:
    if not raw:
        return []

    if isinstance(raw, str):
        return [normalize_text(line) for line in raw.splitlines() if normalize_text(line)]

    if isinstance(raw, list):
        steps: list[str] = []
        for entry in raw:
            if isinstance(entry, str):
                text = normalize_text(entry)
                if text:
                    steps.append(text)
                continue

            if isinstance(entry, dict):
                if normalize_text(entry.get("text")):
                    steps.append(normalize_text(entry.get("text")))
                    continue

                sub_items = entry.get("itemListElement")
                if isinstance(sub_items, list):
                    for item in sub_items:
                        if isinstance(item, dict) and normalize_text(item.get("text")):
                            steps.append(normalize_text(item.get("text")))
        return steps

    return []


def normalize_string_list(raw: object) -> list[str]:
    if not raw:
        return []
    payload = raw if isinstance(raw, list) else [raw]
    return [normalize_text(str(item)) for item in payload if normalize_text(str(item))]


def normalize_image(raw: object) -> str:
    if isinstance(raw, str):
        return raw
    if isinstance(raw, list) and raw:
        first = raw[0]
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            return str(first.get("url") or "")
    if isinstance(raw, dict):
        return str(raw.get("url") or "")
    return ""


def infer_title_from_url(url: str) -> str:
    try:
        path = [part for part in urlparse(url).path.split("/") if part][-1]
    except IndexError:
        return "Imported Recipe"

    return path.replace("-", " ").replace("_", " ").title() if path else "Imported Recipe"


def normalize_text(value: object) -> str:
    return str(value or "").replace("\xa0", " ").strip()
