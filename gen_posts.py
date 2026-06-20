import os, re, json

POSTS_DIR = "blog/posts"
OUTPUT    = "data/posts.js"

posts = []

for filename in sorted(os.listdir(POSTS_DIR)):
    if not filename.endswith(".md"):
        continue

    slug     = filename[:-3]
    filepath = os.path.join(POSTS_DIR, filename)

    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    match = re.match(r"^---\r?\n(.*?)\r?\n---", content, re.DOTALL)
    if not match:
        print(f"  skipped (no front matter): {filename}")
        continue

    meta = {}
    for line in match.group(1).splitlines():
        colon = line.find(":")
        if colon == -1:
            continue
        key   = line[:colon].strip()
        value = line[colon + 1:].strip()
        if value.startswith("[") and value.endswith("]"):
            value = [v.strip().strip("\"'") for v in value[1:-1].split(",") if v.strip()]
        meta[key] = value

    posts.append({
        "slug":        slug,
        "title":       meta.get("title", slug),
        "date":        meta.get("date", ""),
        "category":    meta.get("category", "Uncategorized"),
        "order":       int(meta.get("order", 999)),
        "description": meta.get("description", ""),
        "tags":        meta.get("tags", []),
    })

category_order = {
    "Machine Learning Acceleration": 0,
    "Optimization": 1,
}

posts.sort(key=lambda p: (
    -int(p["date"].replace("-", "") or 0),
    category_order.get(p["category"], 999),
    p["order"],
    p["title"],
))

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("const sitePosts = ")
    f.write(json.dumps(posts, indent=4, ensure_ascii=False))
    f.write(";\n")

print(f"Generated {len(posts)} post(s) → {OUTPUT}")
