#!/bin/bash
#
# Documentation Maintenance Script
# Checks for common documentation issues
#

echo "🔍 Flghtly Documentation Health Check"
echo "======================================"
echo ""

ISSUES=0

# Check for broken internal links
echo "📎 Checking for broken internal links..."
BROKEN_LINKS=$(grep -r "\[.*\](\..*\.md)" --include="*.md" . 2>/dev/null | grep -v node_modules | while read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINK=$(echo "$line" | grep -o "\](\..*\.md)" | sed 's/](//' | sed 's/)//')
    DIR=$(dirname "$FILE")
    TARGET="$DIR/$LINK"
    if [ ! -f "$TARGET" ]; then
        echo "  ❌ Broken link in $FILE: $LINK"
        ((ISSUES++))
    fi
done)

if [ -z "$BROKEN_LINKS" ]; then
    echo "  ✅ No broken internal links found"
else
    echo "$BROKEN_LINKS"
    ISSUES=$((ISSUES + $(echo "$BROKEN_LINKS" | wc -l)))
fi

echo ""

# Check for old brand references
echo "🏷️  Checking for old brand references..."
OLD_BRAND=$(grep -r "refundfinder" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v ".git")
if [ -z "$OLD_BRAND" ]; then
    echo "  ✅ No old brand references found"
else
    echo "  ⚠️  Found old brand references:"
    echo "$OLD_BRAND"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Check for placeholder text
echo "📝 Checking for placeholder text..."
PLACEHOLDERS=$(grep -r "TODO\|FIXME\|\[TBD\]\|XXX" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "check-docs.sh")
if [ -z "$PLACEHOLDERS" ]; then
    echo "  ✅ No placeholder text found"
else
    echo "  ⚠️  Found placeholder text:"
    echo "$PLACEHOLDERS" | head -10
    COUNT=$(echo "$PLACEHOLDERS" | wc -l)
    echo "  Total: $COUNT instances"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Check documentation age
echo "📅 Checking documentation age (>6 months old)..."
STALE_DOCS=$(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" -mtime +180 2>/dev/null)
if [ -z "$STALE_DOCS" ]; then
    echo "  ✅ All docs updated within 6 months"
else
    echo "  ⚠️  Docs not updated in 6+ months:"
    echo "$STALE_DOCS" | head -10
    COUNT=$(echo "$STALE_DOCS" | wc -l)
    echo "  Total: $COUNT files"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Check for docs missing frontmatter
echo "🏷️  Checking for missing frontmatter in /docs..."
MISSING_FRONTMATTER=$(find ./docs -name "*.md" 2>/dev/null | while read -r file; do
    if ! head -1 "$file" | grep -q "^---"; then
        echo "  ⚠️  $file"
    fi
done)

if [ -z "$MISSING_FRONTMATTER" ]; then
    echo "  ✅ All /docs files have frontmatter"
else
    echo "  Files missing frontmatter:"
    echo "$MISSING_FRONTMATTER"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Check for duplicate content (simple check for identical files)
echo "🔁 Checking for potential duplicate content..."
# This is a simple check - won't catch all duplicates
DUPLICATE_FILES=$(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" -type f -exec md5 {} \; 2>/dev/null | sort | uniq -d -w 32)
if [ -z "$DUPLICATE_FILES" ]; then
    echo "  ✅ No identical duplicate files found"
else
    echo "  ⚠️  Found potentially duplicate files (same md5 hash):"
    echo "$DUPLICATE_FILES"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Summary
echo "======================================"
if [ $ISSUES -eq 0 ]; then
    echo "✅ Documentation health check passed!"
    echo "No issues found."
    exit 0
else
    echo "⚠️  Documentation health check completed with $ISSUES issue(s)"
    echo "Please review and fix the issues above."
    exit 1
fi
