#!/bin/bash

#
# @chapter automation
# Master compilation script for all FHEVM examples
#
# This script compiles all 10 examples and verifies successful compilation.
#

set -e

echo "========================================="
echo "FHEVM Example Hub - Compilation Runner"
echo "========================================="
echo ""

EXAMPLES_DIR="generated-examples"
TOTAL=0
PASSED=0
FAILED=0

declare -a EXAMPLES=(
    "basic/arithmetic"
    "basic/counter"
    "basic/equality"
    "encryption/encrypt-single"
    "encryption/encrypt-multiple"
    "decryption/decrypt-single"
    "access-control/fhe-allow"
    "access-control/input-proofs"
    "anti-patterns/view-function-errors"
    "advanced/blind-auction"
)

declare -a FAILED_EXAMPLES=()

for example in "${EXAMPLES[@]}"; do
    TOTAL=$((TOTAL + 1))
    echo ""
    echo "========================================="
    echo "Compiling: $example"
    echo "========================================="

    EXAMPLE_PATH="$EXAMPLES_DIR/$example"

    if [ ! -d "$EXAMPLE_PATH" ]; then
        echo "❌ Example directory not found: $EXAMPLE_PATH"
        FAILED=$((FAILED + 1))
        FAILED_EXAMPLES+=("$example")
        continue
    fi

    cd "$EXAMPLE_PATH"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found"
        FAILED=$((FAILED + 1))
        FAILED_EXAMPLES+=("$example")
        cd - > /dev/null
        continue
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install --silent
    fi

    # Compile
    echo "Compiling contracts..."
    if npm run compile --silent; then
        echo "✅ Compilation successful for $example"
        PASSED=$((PASSED + 1))
    else
        echo "❌ Compilation failed for $example"
        FAILED=$((FAILED + 1))
        FAILED_EXAMPLES+=("$example")
    fi

    cd - > /dev/null
done

echo ""
echo "========================================="
echo "Compilation Summary"
echo "========================================="
echo "Total Examples: $TOTAL"
echo "Compiled Successfully: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "Failed examples:"
    for example in "${FAILED_EXAMPLES[@]}"; do
        echo "  - $example"
    done
    echo ""
    echo "❌ Some compilations failed"
    exit 1
else
    echo ""
    echo "✅ All examples compiled successfully!"
    exit 0
fi
