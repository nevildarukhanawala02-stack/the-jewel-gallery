#!/usr/bin/env python3
"""
Fresh migration: reads Google Drive URLs from CSV, downloads HEIC images,
converts to JPEG, uploads via presigned PUT to Manus storage, updates DB.
"""

import os
import sys
import csv
import json
import time
import uuid
import re
import tempfile
import requests
import mysql.connector
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

DATABASE_URL = os.environ.get("DATABASE_URL", "")
FORGE_API_URL = os.environ.get("BUILT_IN_FORGE_API_URL", "").rstrip("/")
FORGE_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY", "")
CSV_FILE = "/home/ubuntu/tjg_skus_v3.csv"


def parse_db_url(url):
    m = re.match(r'mysql(?:2)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(.+)', url)
    if not m:
        raise ValueError(f"Cannot parse DATABASE_URL")
    return {
        "user": m.group(1),
        "password": m.group(2),
        "host": m.group(3),
        "port": int(m.group(4) or 3306),
        "database": m.group(5).split("?")[0],
    }


def extract_drive_file_id(url: str) -> str | None:
    """Extract Google Drive file ID from various URL formats."""
    patterns = [
        r'/file/d/([a-zA-Z0-9_-]+)',
        r'id=([a-zA-Z0-9_-]+)',
        r'/d/([a-zA-Z0-9_-]+)',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def download_drive_image(url: str) -> bytes:
    """Download image from Google Drive."""
    file_id = extract_drive_file_id(url)
    if file_id:
        direct_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
    else:
        direct_url = url

    session = requests.Session()
    resp = session.get(direct_url, timeout=30, allow_redirects=True)
    resp.raise_for_status()

    # Handle Google Drive virus scan warning page
    if "Content-Disposition" not in resp.headers and len(resp.content) < 50000:
        # Try to find the download link in the HTML
        content = resp.text
        m = re.search(r'href="(/uc\?export=download[^"]+)"', content)
        if m:
            redirect_url = "https://drive.google.com" + m.group(1).replace("&amp;", "&")
            resp = session.get(redirect_url, timeout=30)
            resp.raise_for_status()

    return resp.content


def is_heic(data: bytes) -> bool:
    return b"ftyp" in data[:20] and (b"heic" in data[:20] or b"mif1" in data[:20] or b"heif" in data[:20])


def convert_to_jpeg(data: bytes) -> bytes:
    """Convert image (HEIC or other) to JPEG bytes."""
    suffix = ".heic" if is_heic(data) else ".img"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(data)
        tmp_in = f.name
    tmp_out = tmp_in.rsplit(".", 1)[0] + ".jpg"
    try:
        img = Image.open(tmp_in)
        img.convert("RGB").save(tmp_out, "JPEG", quality=90, optimize=True)
        with open(tmp_out, "rb") as f:
            return f.read()
    finally:
        os.unlink(tmp_in)
        if os.path.exists(tmp_out):
            os.unlink(tmp_out)


def storage_put_presign(rel_key: str, data: bytes, content_type: str = "image/jpeg") -> str:
    """Upload bytes using presigned PUT flow. Returns /manus-storage/{key}"""
    key = rel_key.lstrip("/")
    # Add hash suffix like storage.ts
    hash_val = uuid.uuid4().hex[:8]
    last_dot = key.rfind(".")
    if last_dot == -1:
        key = f"{key}_{hash_val}"
    else:
        key = f"{key[:last_dot]}_{hash_val}{key[last_dot:]}"

    # 1. Get presigned PUT URL
    resp = requests.get(
        f"{FORGE_API_URL}/v1/storage/presign/put",
        params={"path": key},
        headers={"Authorization": f"Bearer {FORGE_API_KEY}"},
        timeout=30,
    )
    if not resp.ok:
        raise RuntimeError(f"Presign failed: {resp.status_code} {resp.text[:200]}")
    s3_url = resp.json().get("url")
    if not s3_url:
        raise RuntimeError("Empty presign URL")

    # 2. PUT to S3
    put_resp = requests.put(s3_url, data=data, headers={"Content-Type": content_type}, timeout=60)
    if not put_resp.ok:
        raise RuntimeError(f"S3 PUT failed: {put_resp.status_code}")

    return f"/manus-storage/{key}"


def main():
    if not DATABASE_URL or not FORGE_API_URL or not FORGE_API_KEY:
        print("ERROR: Missing env vars (DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY)")
        sys.exit(1)

    # Test presign
    test = requests.get(
        f"{FORGE_API_URL}/v1/storage/presign/put",
        params={"path": "test/ping.txt"},
        headers={"Authorization": f"Bearer {FORGE_API_KEY}"},
        timeout=10,
    )
    print(f"Presign API test: {test.status_code}")
    if not test.ok:
        print("ERROR: Presign API not reachable")
        sys.exit(1)

    # Read CSV
    sku_to_drive_urls = {}
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku = row.get("SKU", "").strip()
            image_urls_raw = row.get("Image URLS", "").strip()
            if not sku or not image_urls_raw:
                continue
            # URLs may be comma or newline separated
            urls = [u.strip() for u in re.split(r'[,\n]+', image_urls_raw) if u.strip()]
            drive_urls = [u for u in urls if "drive.google.com" in u or "docs.google.com" in u]
            if drive_urls:
                sku_to_drive_urls[sku] = drive_urls

    print(f"Found {len(sku_to_drive_urls)} SKUs with Drive URLs in CSV")

    # Connect to DB
    db_config = parse_db_url(DATABASE_URL)
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, sku FROM products")
    products = cursor.fetchall()

    total_converted = 0
    total_errors = 0
    total_skipped = 0

    for product in products:
        prod_id = product["id"]
        sku = product["sku"]

        drive_urls = sku_to_drive_urls.get(sku, [])
        if not drive_urls:
            print(f"  [SKIP] {sku}: no Drive URLs in CSV")
            total_skipped += 1
            continue

        print(f"\n  Processing {sku} ({len(drive_urls)} images)...")
        new_images = []
        success = True

        for i, drive_url in enumerate(drive_urls):
            img_num = i + 1
            safe_sku = sku.replace(" ", "-")
            base_key = f"products/{safe_sku}_{img_num}"

            try:
                print(f"    [{img_num}] Downloading from Drive...")
                data = download_drive_image(drive_url)
                print(f"    [{img_num}] Downloaded {len(data)} bytes, format: {'HEIC' if is_heic(data) else 'other'}")

                # Convert to JPEG if needed
                try:
                    jpeg_data = convert_to_jpeg(data)
                    print(f"    [{img_num}] Converted to JPEG ({len(jpeg_data)} bytes)")
                except Exception as e:
                    print(f"    [{img_num}] Conversion failed: {e}, trying raw upload")
                    jpeg_data = data

                # Upload
                new_url = storage_put_presign(base_key, jpeg_data, "image/jpeg")
                print(f"    [{img_num}] Uploaded: {new_url}")
                new_images.append(new_url)
                total_converted += 1
                time.sleep(0.2)

            except Exception as e:
                print(f"    [{img_num}] ERROR: {e}")
                total_errors += 1
                success = False

        if new_images:
            cursor.execute(
                "UPDATE products SET images = %s WHERE id = %s",
                (json.dumps(new_images), prod_id)
            )
            conn.commit()
            print(f"  [UPDATED] {sku}: {len(new_images)} images saved to DB")
        else:
            print(f"  [FAILED] {sku}: no images uploaded")

    cursor.close()
    conn.close()

    print(f"\n=== DONE ===")
    print(f"Converted & uploaded: {total_converted}")
    print(f"Skipped (no Drive URL): {total_skipped}")
    print(f"Errors: {total_errors}")


if __name__ == "__main__":
    main()
