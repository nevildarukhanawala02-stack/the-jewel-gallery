#!/usr/bin/env python3
"""
Convert all HEIC product images to proper JPEG and re-upload to Manus storage.
Updates the database with new image URLs.
"""

import os
import sys
import json
import time
import tempfile
import requests
import mysql.connector
from pathlib import Path
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

DATABASE_URL = os.environ.get("DATABASE_URL", "")
FORGE_API_URL = os.environ.get("BUILT_IN_FORGE_API_URL", "").rstrip("/")
FORGE_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY", "")
LOCAL_SERVER = "http://localhost:3000"

def parse_db_url(url):
    """Parse mysql://user:pass@host:port/db"""
    import re
    m = re.match(r'mysql(?:2)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(.+)', url)
    if not m:
        raise ValueError(f"Cannot parse DATABASE_URL: {url[:50]}...")
    return {
        "user": m.group(1),
        "password": m.group(2),
        "host": m.group(3),
        "port": int(m.group(4) or 3306),
        "database": m.group(5).split("?")[0],
    }

def download_image(storage_url: str) -> bytes:
    """Download image via local server storage proxy."""
    full_url = f"{LOCAL_SERVER}{storage_url}"
    resp = requests.get(full_url, timeout=30)
    resp.raise_for_status()
    return resp.content

def is_heic(data: bytes) -> bool:
    """Check if bytes are HEIC format."""
    return b"ftyp" in data[:20] and (b"heic" in data[:20] or b"mif1" in data[:20] or b"heif" in data[:20])

def convert_heic_to_jpeg(data: bytes) -> bytes:
    """Convert HEIC bytes to JPEG bytes."""
    with tempfile.NamedTemporaryFile(suffix=".heic", delete=False) as f:
        f.write(data)
        tmp_in = f.name
    tmp_out = tmp_in.replace(".heic", ".jpg")
    try:
        img = Image.open(tmp_in)
        img.convert("RGB").save(tmp_out, "JPEG", quality=90, optimize=True)
        with open(tmp_out, "rb") as f:
            return f.read()
    finally:
        os.unlink(tmp_in)
        if os.path.exists(tmp_out):
            os.unlink(tmp_out)

def upload_to_storage(key: str, data: bytes, content_type: str = "image/jpeg") -> str:
    """Upload bytes to Manus storage and return the storage URL."""
    upload_url = f"{FORGE_API_URL}/v1/storage/upload"
    resp = requests.post(
        upload_url,
        headers={"Authorization": f"Bearer {FORGE_API_KEY}"},
        files={"file": (key.split("/")[-1], data, content_type)},
        data={"path": key},
        timeout=60,
    )
    if not resp.ok:
        raise RuntimeError(f"Upload failed: {resp.status_code} {resp.text[:200]}")
    result = resp.json()
    # Return the manus-storage path
    return f"/manus-storage/{key}"

def main():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)
    if not FORGE_API_URL or not FORGE_API_KEY:
        print("ERROR: BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY not set")
        sys.exit(1)

    db_config = parse_db_url(DATABASE_URL)
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id, sku, images FROM products WHERE images IS NOT NULL")
    products = cursor.fetchall()

    total_converted = 0
    total_skipped = 0
    total_errors = 0

    for product in products:
        prod_id = product["id"]
        sku = product["sku"]
        images = product["images"]

        if isinstance(images, str):
            try:
                images = json.loads(images)
            except Exception:
                print(f"  [SKIP] Product {sku}: cannot parse images JSON")
                continue

        if not images:
            continue

        new_images = []
        changed = False

        for img_url in images:
            if not img_url.startswith("/manus-storage/"):
                new_images.append(img_url)
                continue

            print(f"  Processing {sku}: {img_url}")
            try:
                data = download_image(img_url)

                if not is_heic(data):
                    print(f"    -> Already JPEG/PNG, skipping conversion")
                    new_images.append(img_url)
                    total_skipped += 1
                    continue

                print(f"    -> HEIC detected, converting to JPEG...")
                jpeg_data = convert_heic_to_jpeg(data)

                # Build new key: replace original key with _converted suffix
                old_key = img_url.replace("/manus-storage/", "")
                # Keep same key but ensure it ends with .jpg
                new_key = old_key if old_key.endswith(".jpg") else old_key + ".jpg"
                # Add _c suffix to distinguish from old broken file
                base, ext = new_key.rsplit(".", 1)
                new_key = f"{base}_c.{ext}"

                new_url = upload_to_storage(new_key, jpeg_data, "image/jpeg")
                print(f"    -> Uploaded as {new_url}")
                new_images.append(new_url)
                changed = True
                total_converted += 1
                time.sleep(0.2)  # Be gentle with the API

            except Exception as e:
                print(f"    -> ERROR: {e}")
                new_images.append(img_url)  # Keep old URL on error
                total_errors += 1

        if changed:
            new_images_json = json.dumps(new_images)
            cursor.execute(
                "UPDATE products SET images = %s WHERE id = %s",
                (new_images_json, prod_id)
            )
            conn.commit()
            print(f"  [UPDATED] Product {sku} images updated in DB")

    cursor.close()
    conn.close()

    print(f"\n=== DONE ===")
    print(f"Converted: {total_converted}")
    print(f"Skipped (already JPEG): {total_skipped}")
    print(f"Errors: {total_errors}")

if __name__ == "__main__":
    main()
