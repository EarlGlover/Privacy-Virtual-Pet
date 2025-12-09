# FHEVM Automation Tools Guide

---

## 📋 Overview

The FHEVM automation suite provides tools for:

1. **Creating Example Repositories** - Generate standalone FHEVM example repos
2. **Organizing by Categories** - Group related examples together
3. **Auto-Generating Documentation** - Create GitBook-compatible docs from code
4. **Managing Dependencies** - Keep all examples updated
5. **Validating Examples** - Ensure quality and correctness

---

## 🛠️ Automation Scripts

### 1. `create-fhevm-example.ts`

**Purpose**: Create a single standalone example repository

**Usage**:
```bash
npx ts-node scripts/create-fhevm-example.ts <example-name>
```

**Examples**:
```bash
# Create counter example
npx ts-node scripts/create-fhevm-example.ts counter

# Create arithmetic example
npx ts-node scripts/create-fhevm-example.ts arithmetic

# Create encryption example
npx ts-node scripts/create-fhevm-example.ts encrypt-single
```

**Output**:
Creates a complete example repository with:
- `/contracts/` - Smart contract
- `/test/` - Test suite
- `/scripts/` - Deployment scripts
- `hardhat.config.ts` - Hardhat configuration
- `package.json` - Dependencies
- `README.md` - Generated documentation

**Built-in Examples**:
- `counter` - Encrypted counter with arithmetic operations
- `arithmetic` - Addition, subtraction, min, max operations
- `equality` - Equality comparison on encrypted values
- `encrypt-single` - Single value encryption
- `encrypt-multiple` - Multiple value encryption
- And more...

---

### 2. `create-fhevm-category.ts`

**Purpose**: Generate all examples in a category

**Usage**:
```bash
npx ts-node scripts/create-fhevm-category.ts <category-name>
npx ts-node scripts/create-fhevm-category.ts all
```

**Available Categories**:
- `basic` - Basic FHEVM operations
- `encryption` - Encryption patterns
- `decryption` - User decryption examples
- `access-control` - Access control patterns
- `antipatterns` - Common mistakes and how to avoid them
- `advanced` - Advanced use cases

**Examples**:
```bash
# Generate all basic examples
npx ts-node scripts/create-fhevm-category.ts basic

# Generate all access control examples
npx ts-node scripts/create-fhevm-category.ts access-control

# Generate all categories
npx ts-node scripts/create-fhevm-category.ts all
```

**Output**:
```
generated-examples/
├── basic/
│   ├── counter/
│   ├── arithmetic/
│   ├── equality/
│   └── README.md
├── encryption/
│   ├── encrypt-single/
│   ├── encrypt-multiple/
│   └── README.md
└── access-control/
    ├── allow-pattern/
    ├── transient-allow/
    └── README.md
```

---

### 3. `generate-docs.ts`

**Purpose**: Auto-generate documentation from test files

**Usage**:
```bash
npx ts-node scripts/generate-docs.ts [options]
```

**Options**:
```bash
--input <path>    Input directory (default: test)
--output <path>   Output directory (default: docs)
--chapter <name>  Specific chapter (optional)
```

**Examples**:
```bash
# Generate docs from test/ to docs/
npx ts-node scripts/generate-docs.ts

# Custom paths
npx ts-node scripts/generate-docs.ts --input ./test --output ./generated-docs

# Specific chapter
npx ts-node scripts/generate-docs.ts --chapter access-control
```

**How It Works**:
1. Scans test files for JSDoc/TSDoc comments
2. Extracts `@chapter` annotations for organization
3. Generates markdown files per chapter
4. Creates GitBook-compatible structure
5. Generates table of contents and index

**Annotation Format** (in test files):
```typescript
/**
 * @chapter access-control
 * Test: FHE.allow() grants decryption permissions
 * Demonstrates proper access control with permissions
 */
it("should grant decryption permissions", async function () {
    // Test code
});
```

**Output Structure**:
```
docs/
├── index.md                  # Main index
├── README.md                 # Overview
├── SUMMARY.md               # Table of contents (GitBook)
├── introduction.md
├── setup.md
├── access-control.md        # Chapter files
├── encryption.md
├── decryption.md
└── reference.md
```

---

### 4. `automation.ts`

**Purpose**: Main entry point for all automation tasks

**Usage**:
```bash
npx ts-node scripts/automation.ts <command> [options]
```

**Commands**:

#### `init`
Initialize automation environment
```bash
npx ts-node scripts/automation.ts init
```
Creates necessary directories and configuration.

#### `create-example`
Create a single example
```bash
npx ts-node scripts/automation.ts create-example --name counter
```

#### `create-category`
Create a category of examples
```bash
npx ts-node scripts/automation.ts create-category --category basic
npx ts-node scripts/automation.ts create-category --all
```

#### `generate-docs`
Generate documentation
```bash
npx ts-node scripts/automation.ts generate-docs --input test/ --output docs/
```

#### `validate`
Validate generated examples
```bash
# Validate structure only
npx ts-node scripts/automation.ts validate

# Compile contracts
npx ts-node scripts/automation.ts validate --compile

# Run tests
npx ts-node scripts/automation.ts validate --test

# Full validation
npx ts-node scripts/automation.ts validate --full
```

#### `update-dependencies`
Update all examples
```bash
npx ts-node scripts/automation.ts update-dependencies
```

#### `list-examples`
List all available examples
```bash
npx ts-node scripts/automation.ts list-examples
```

#### `help`
Show help message
```bash
npx ts-node scripts/automation.ts help
```

---

## 📦 Base Template

Located at: `./base-template/`

Used by automation scripts as the foundation for all examples.

**Structure**:
```
base-template/
├── contracts/
│   └── Example.sol
├── test/
│   └── Example.test.ts
├── scripts/
│   └── deploy.ts
├── hardhat.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Files**:
- `hardhat.config.ts` - Network configuration, compiler settings
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `contracts/Example.sol` - Template contract
- `test/Example.test.ts` - Template test file
- `scripts/deploy.ts` - Template deployment script

---

## 🚀 Complete Workflow

### Step 1: Initialize Automation Environment

```bash
npx ts-node scripts/automation.ts init
```

Creates directories:
- `generated-examples/` - For generated example repos
- `templates/` - For custom templates
- `generated-docs/` - For auto-generated documentation

### Step 2: Generate Examples

**Option A: Generate by Category**
```bash
# Generate all basic examples
npx ts-node scripts/create-fhevm-category.ts basic

# Generate all categories
npx ts-node scripts/create-fhevm-category.ts all
```

**Option B: Generate Individual Examples**
```bash
npx ts-node scripts/create-fhevm-example.ts counter
npx ts-node scripts/create-fhevm-example.ts arithmetic
npx ts-node scripts/create-fhevm-example.ts access-control
```

### Step 3: Test Generated Examples

```bash
# Validate all examples
npx ts-node scripts/automation.ts validate --full

# Or validate individual example
cd generated-examples/counter
npm install
npm run test
```

### Step 4: Generate Documentation

```bash
# Generate docs from all test files
npx ts-node scripts/generate-docs.ts

# Custom paths
npx ts-node scripts/generate-docs.ts --input ./test --output ./gitbook-docs
```

### Step 5: Update Examples

```bash
# Update all dependencies
npx ts-node scripts/automation.ts update-dependencies

# Or manually in each example
cd generated-examples/counter
npm install
```

---

## 📝 Example Categories

### Basic Operations
- Counter (arithmetic)
- Arithmetic operations (add, sub, mul)
- Equality comparison
- Min/max operations

### Encryption
- Encrypt single value
- Encrypt multiple values
- Type conversions (euint32 ↔ euint8)

### Decryption
- Decrypt single value
- Decrypt multiple values
- Conditional decryption

### Access Control
- FHE.allow() pattern
- FHE.allowTransient() for temporary access
- Input proof handling
- Permission management

### Anti-Patterns
- View functions with encrypted values (incorrect)
- Missing FHE.allow() permissions
- Improper input proof handling

### Advanced
- Blind auction
- Private token contract
- Voting system
- Private data marketplace

---

## 🔧 Customizing Automation

### Adding New Examples

Edit `create-fhevm-example.ts`:

```typescript
const EXAMPLES: Record<string, ExampleConfig> = {
    // ... existing examples ...
    "my-example": {
        name: "my-example",
        title: "My Custom Example",
        description: "Description of what this example teaches",
        category: "Basic",
        chapter: "custom-chapter",
        contractContent: `// Solidity code here`,
        testContent: `// Test code here`,
        documentationContent: `# Documentation markdown`
    }
};
```

### Adding New Categories

Edit `create-fhevm-category.ts`:

```typescript
const CATEGORIES: Record<string, CategoryConfig> = {
    // ... existing categories ...
    "my-category": {
        name: "my-category",
        title: "My Category",
        description: "Category description",
        examples: [
            {
                name: "example-1",
                title: "Example 1",
                description: "Description"
            }
        ]
    }
};
```

---

## 📊 Output Structure

### Generated Examples Directory

```
generated-examples/
├── .automation.json          # Automation config
├── EXAMPLES_INDEX.md         # Master index
├── basic/
│   ├── README.md            # Category overview
│   ├── INDEX.md             # Category index
│   ├── counter/
│   │   ├── contracts/
│   │   ├── test/
│   │   ├── scripts/
│   │   ├── hardhat.config.ts
│   │   ├── package.json
│   │   └── README.md
│   └── [more examples...]
├── encryption/
└── [more categories...]
```

### Generated Documentation

```
docs/
├── index.md                 # Main entry point
├── README.md               # Overview
├── SUMMARY.md              # GitBook table of contents
├── introduction.md         # Getting started
├── setup.md               # Installation guide
├── basic-operations.md     # Chapter files
├── encryption.md
├── access-control.md
└── reference.md
```

---

## 🔍 Validation and Testing

### Auto-Validation

```bash
# Structure validation only
npx ts-node scripts/automation.ts validate

# Output:
# Validating: counter
#   Structure: ✅
#
# Found 25 example(s)
```

### Full Validation

```bash
# Compile and test
npx ts-node scripts/automation.ts validate --full

# Output:
# Validating: counter
#   Structure: ✅
#   Compiling...
#   Compilation: ✅
#   Testing...
#   Tests: ✅
```

---

## 🐛 Troubleshooting

### Issue: TypeScript compilation errors

**Solution**:
```bash
npm install -g ts-node typescript
npm install --save-dev @types/node
```

### Issue: glob not found

**Solution**:
```bash
npm install glob @types/glob
```

### Issue: Generated examples have errors

**Solution**:
1. Check the automation script syntax
2. Validate the contract content
3. Ensure solidity version matches hardhat config
4. Run with verbose logging

---

## 📚 Learn More

- **Create Examples**: See `create-fhevm-example.ts` for example definitions
- **Organize Categories**: See `create-fhevm-category.ts` for category structure
- **Documentation**: See `generate-docs.ts` for doc generation
- **Base Template**: See `base-template/` for template structure

---

## 🤝 Contributing

To contribute new examples:

1. Add definition to `EXAMPLES` in `create-fhevm-example.ts`
2. Include contract code, tests, and documentation
3. Test by running the generation script
4. Validate with `npm run test`
5. Submit as pull request

---

**The automation suite makes it easy to create, organize, test, and document FHEVM examples at scale.** 🚀✅
