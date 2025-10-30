#!/bin/bash
#
# Add frontmatter to markdown files that don't have it
#

add_frontmatter() {
    local file="$1"
    local owner="${2:-@connorowens}"
    local status="${3:-current}"

    # Check if file already has frontmatter
    if head -1 "$file" | grep -q "^---"; then
        echo "  ✓ $file already has frontmatter"
        return
    fi

    # Create temp file with frontmatter + original content
    {
        echo "---"
        echo "last_updated: $(date +%Y-%m-%d)"
        echo "status: $status"
        echo "owner: $owner"
        echo "---"
        echo ""
        cat "$file"
    } > "$file.tmp"

    # Replace original file
    mv "$file.tmp" "$file"
    echo "  ✅ Added frontmatter to $file"
}

echo "Adding frontmatter to files..."
echo ""

# Add frontmatter to all docs files that need it
find ./docs -name "*.md" -type f | while read -r file; do
    add_frontmatter "$file"
done

echo ""
echo "Done!"
