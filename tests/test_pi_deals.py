import socket

import pytest

from pi_deals import find_deals_from_html, validate_listing_url

EBAY_HTML = """
<ul>
  <li class="s-item">
    <div class="s-item__info">
      <a class="s-item__link" href="https://www.ebay.com/itm/111">
        <div role="heading" class="s-item__title">Raspberry Pi 5 8GB Board New Sealed</div>
      </a>
      <span class="s-item__price">$55.00</span>
      <img class="s-item__image-img" src="https://img.example.com/pi5.jpg" />
    </div>
  </li>
  <li class="s-item">
    <div class="s-item__info">
      <a class="s-item__link" href="https://www.ebay.com/itm/222">
        <div role="heading" class="s-item__title">Shop on eBay</div>
      </a>
      <span class="s-item__price">$0.00</span>
    </div>
  </li>
</ul>
"""

EBAY_CARD_HTML_WITH_AUCTION_AND_ACCESSORY = """
<li class="s-card">
  <div class="s-card__title">Raspberry Pi 5 8GB Board New Sealed</div>
  <span class="s-card__price">$55.00</span>
  <a class="s-card__link" href="https://www.ebay.com/itm/111"></a>
</li>
<li class="s-card">
  <div class="s-card__title">New listing Raspberry Pi 3 Model B+ in Official Case</div>
  <span class="s-card__price">$1.17</span>
  <a class="s-card__link" href="https://www.ebay.com/itm/222"></a>
  <span>0 bids</span>
  <span>Time left 6d 23h left</span>
</li>
<li class="s-card">
  <div class="s-card__title">Case for Raspberry Pi 4 with Fan</div>
  <span class="s-card__price">$5.00</span>
  <a class="s-card__link" href="https://www.ebay.com/itm/333"></a>
</li>
<li class="s-card">
  <div class="s-card__title">MainsailOS Orange Pi 4 Board Plug and Play for Klipper on Raspberry Pi</div>
  <span class="s-card__price">$42.00</span>
  <a class="s-card__link" href="https://www.ebay.com/itm/444"></a>
</li>
"""

GENERIC_HTML = """
<div class="listing">
  <a href="/listings/pico-1">Raspberry Pi Pico W New</a>
  <span>Price: $2.50</span>
</div>
"""


def test_finds_deal_and_skips_shop_on_ebay_placeholder():
    result = find_deals_from_html(EBAY_HTML, "https://www.ebay.com/sch/i.html")

    assert result["scanned"] == 1
    assert len(result["deals"]) == 1
    assert result["deals"][0]["match"] == "Raspberry Pi 5 (8GB)"


def test_excludes_auctions_accessories_and_clone_boards():
    result = find_deals_from_html(
        EBAY_CARD_HTML_WITH_AUCTION_AND_ACCESSORY, "https://www.ebay.com/sch/i.html"
    )

    matched_titles = {deal["title"] for deal in result["deals"]}
    assert matched_titles == {"Raspberry Pi 5 8GB Board New Sealed"}


def test_generic_listings_extraction():
    result = find_deals_from_html(GENERIC_HTML, "https://example.com/search")

    assert len(result["deals"]) == 1
    assert result["deals"][0]["link"] == "https://example.com/listings/pico-1"


def test_non_usd_price_is_converted_before_comparison():
    html = """
    <li class="s-card">
      <div class="s-card__title">Raspberry Pi 4 Model B 4GB Used Good Condition</div>
      <span class="s-card__price">£20.00</span>
      <a class="s-card__link" href="https://www.ebay.co.uk/itm/1"></a>
    </li>
    """
    result = find_deals_from_html(html, "https://www.ebay.co.uk/sch/i.html")

    assert len(result["deals"]) == 1
    deal = result["deals"][0]
    assert deal["currency"] == "£"
    assert deal["approxConversion"] is True
    assert deal["priceUsd"] == pytest.approx(20.0 * 1.27)


def test_value_overrides_change_the_comparison():
    html = """
    <li class="s-card">
      <div class="s-card__title">Raspberry Pi Pico New</div>
      <span class="s-card__price">$3.00</span>
      <a class="s-card__link" href="https://ebay.com/itm/9"></a>
    </li>
    """
    without_override = find_deals_from_html(html, "https://ebay.com/sch")
    assert len(without_override["deals"]) == 1

    with_override = find_deals_from_html(
        html, "https://ebay.com/sch", value_overrides={"Raspberry Pi Pico": 100}
    )
    assert with_override["deals"][0]["estimatedValueUsd"] == 100


def test_validate_listing_url_rejects_non_http_schemes():
    with pytest.raises(ValueError):
        validate_listing_url("ftp://example.com/listings")


def test_validate_listing_url_rejects_loopback_and_link_local():
    with pytest.raises(ValueError):
        validate_listing_url("http://127.0.0.1/secret")
    with pytest.raises(ValueError):
        validate_listing_url("http://169.254.169.254/latest/meta-data/")


def test_validate_listing_url_allows_public_hostnames(monkeypatch):
    def fake_getaddrinfo(host, port):
        assert host == "listings.example.com"
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    assert (
        validate_listing_url("https://listings.example.com/search")
        == "https://listings.example.com/search"
    )
