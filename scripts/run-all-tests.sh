#!/bin/bash

#
# @chapter automation
# Master test runner for all FHEVM examples
#
# This script runs tests for all 10 examples and provides a summary report.
#

set -e

echo "========================================="
echo "FHEVM Example Hub - Test Suite Runner"
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
    echo "Testing: $example"
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

    # Run tests
    echo "Running tests..."
    if npm test --silent; then
        echo "✅ Tests passed for $example"
        PASSED=$((PASSED + 1))
    else
        echo "❌ Tests failed for $example"
        FAILED=$((FAILED + 1))
        FAILED_EXAMPLES+=("$example")
    fi

    cd - > /dev/null
done

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Total Examples: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "Failed examples:"
    for example in "${FAILED_EXAMPLES[@]}"; do
        echo "  - $example"
    done
    echo ""
    echo "❌ Some tests failed"
    exit 1
else
    echo ""
    echo "✅ All tests passed!"
    exit 0
fi
