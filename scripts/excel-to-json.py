#!/usr/bin/env python3
"""Convert Dainese Excel product export to JSON for Algolia indexing."""

import json
import re
import openpyxl

EXCEL_PATH = "/Users/oscar.meunier/Documents/Work/customers/dainese/technical/20260326091314_export_products.xlsx"
OUTPUT_PATH = "/Users/oscar.meunier/Documents/Work/customers/dainese/dainese-demo/data/products.json"


def strip_html(text):
    """Remove HTML tags from text."""
    if not text:
        return ""
    text = str(text)
    # Replace <br> variants with newline
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.IGNORECASE)
    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_tf_field(raw):
    """Parse a tf_* field which contains comma-separated JSON objects."""
    if not raw:
        return []
    raw = str(raw).strip()
    # Wrap in array brackets since it's comma-separated objects
    try:
        parsed = json.loads(f"[{raw}]")
        return parsed
    except json.JSONDecodeError:
        # Try fixing common issues
        try:
            # Sometimes there are trailing commas
            cleaned = re.sub(r",\s*$", "", raw)
            parsed = json.loads(f"[{cleaned}]")
            return parsed
        except json.JSONDecodeError:
            return []


def main():
    print("Loading Excel file...")
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    headers = list(rows[0])
    data_rows = rows[1:]

    print(f"Found {len(headers)} columns, {len(data_rows)} data rows")

    # Build header index
    col_idx = {h: i for i, h in enumerate(headers) if h}

    # Identify tf_ columns (non-var)
    tf_cols = [h for h in headers if h and h.startswith("tf_") and not h.startswith("var_")]

    products = []
    for row_num, row in enumerate(data_rows):
        def get(col_name):
            idx = col_idx.get(col_name)
            if idx is None:
                return None
            return row[idx]

        # Parse tf_ fields into attrs
        attrs = {}
        for tf_col in tf_cols:
            val = get(tf_col)
            if val:
                entries = parse_tf_field(val)
                for entry in entries:
                    spec_name = entry.get("specName", "").strip()
                    spec_value = entry.get("specValue", "").strip()
                    if spec_name and spec_value:
                        key = tf_col.replace("tf_", "")
                        if key not in attrs:
                            attrs[key] = []
                        attrs[key].append(spec_value)

        # Build product record - keep ALL raw fields
        product = {}
        for h in headers:
            if h is None:
                continue
            val = get(h)
            if val is not None:
                # Convert to appropriate type
                if isinstance(val, (int, float)):
                    product[h] = val
                else:
                    product[h] = str(val)

        # Strip HTML from long_description
        if "long_description" in product:
            product["long_description"] = strip_html(product["long_description"])
        if "var_long_description" in product:
            product["var_long_description"] = strip_html(product["var_long_description"])

        # Add parsed attrs
        if attrs:
            product["_parsed_attrs"] = attrs

        products.append(product)

        if (row_num + 1) % 500 == 0:
            print(f"  Processed {row_num + 1} rows...")

    print(f"Writing {len(products)} products to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print("Done!")
    wb.close()


if __name__ == "__main__":
    main()
