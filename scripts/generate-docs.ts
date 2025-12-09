#!/usr/bin/env node

/**
 * FHEVM Documentation Generator
 *
 * Auto-generates documentation from code annotations:
 * - Extracts JSDoc/TSDoc comments from test files
 * - Generates GitBook-compatible markdown
 * - Creates structured documentation with chapters
 * - Builds table of contents and index
 *
 * Usage:
 * npx ts-node scripts/generate-docs.ts --input test/ --output docs/
 */

import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

interface DocSection {
  chapter: string;
  title: string;
  content: string;
  examples: string[];
}

interface GeneratedDocs {
  sections: DocSection[];
  toc: TOCEntry[];
  chapters: Record<string, string[]>;
}

interface TOCEntry {
  title: string;
  path: string;
  level: number;
  chapter?: string;
}

class DocumentationGenerator {
  private inputDir: string;
  private outputDir: string;
  private sections: Map<string, DocSection> = new Map();
  private chapters: Map<string, string[]> = new Map();

  constructor(inputDir: string = "test", outputDir: string = "docs") {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
  }

  /**
   * Generate documentation from test files
   */
  async generate(): Promise<void> {
    console.log(`\n📚 Generating Documentation\n`);
    console.log(`Input directory: ${this.inputDir}`);
    console.log(`Output directory: ${this.outputDir}\n`);

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Find all test files
    const testFiles = this.findTestFiles();
    console.log(`Found ${testFiles.length} test files\n`);

    // Extract documentation from test files
    for (const file of testFiles) {
      this.extractDocumentation(file);
    }

    // Generate markdown files
    this.generateMarkdownFiles();

    // Generate table of contents
    this.generateTableOfContents();

    // Generate index
    this.generateIndex();

    console.log(`\n✅ Documentation generated successfully!`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log(`📄 Files: ${this.outputDir}/index.md`);
    console.log(`📑 Table of Contents: ${this.outputDir}/SUMMARY.md`);
  }

  private findTestFiles(): string[] {
    // Look for .test.ts, .test.js, .spec.ts, .spec.js files
    const patterns = [
      path.join(this.inputDir, "**/*.test.ts"),
      path.join(this.inputDir, "**/*.test.js"),
      path.join(this.inputDir, "**/*.spec.ts"),
      path.join(this.inputDir, "**/*.spec.js"),
    ];

    let files: string[] = [];
    for (const pattern of patterns) {
      files = files.concat(glob.sync(pattern));
    }

    return files;
  }

  private extractDocumentation(filePath: string): void {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let currentChapter = "general";
    let currentTest = "";
    let currentDoc = "";
    let inDocBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for chapter annotation
      const chapterMatch = line.match(/@chapter\s+(\S+)/);
      if (chapterMatch) {
        currentChapter = chapterMatch[1];
        if (!this.chapters.has(currentChapter)) {
          this.chapters.set(currentChapter, []);
        }
      }

      // Check for JSDoc/TSDoc comments
      if (line.trim().startsWith("/**")) {
        inDocBlock = true;
        currentDoc = "";
        continue;
      }

      if (inDocBlock) {
        if (line.trim().endsWith("*/")) {
          inDocBlock = false;
          // Extract test/function name from next non-empty line
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.startsWith("//")) {
              currentTest = this.extractTestName(nextLine);
              break;
            }
          }
        } else {
          // Extract comment content
          const commentContent = line
            .replace(/\s*\*\s?/, "")
            .replace(/\/\*/, "")
            .replace(/\*\//, "");

          if (commentContent.trim()) {
            currentDoc += commentContent + "\n";
          }
        }
      }

      // If we have both test name and doc, store it
      if (currentTest && currentDoc && !inDocBlock) {
        const section: DocSection = {
          chapter: currentChapter,
          title: currentTest,
          content: currentDoc.trim(),
          examples: this.extractCodeExamples(lines, i),
        };

        const sectionKey = `${currentChapter}-${currentTest}`;
        this.sections.set(sectionKey, section);

        const chapters = this.chapters.get(currentChapter) || [];
        chapters.push(currentTest);
        this.chapters.set(currentChapter, chapters);

        currentTest = "";
        currentDoc = "";
      }
    }
  }

  private extractTestName(line: string): string {
    // Extract test name from describe or it() calls
    const match = line.match(/(?:describe|it)\s*\(\s*["'`](.*?)["'`]/);
    return match ? match[1] : line;
  }

  private extractCodeExamples(lines: string[], currentIndex: number): string[] {
    const examples: string[] = [];
    let inCodeBlock = false;
    let codeBlock = "";

    for (let i = currentIndex; i < Math.min(currentIndex + 30, lines.length); i++) {
      const line = lines[i];

      if (line.includes("```")) {
        if (inCodeBlock) {
          examples.push(codeBlock);
          codeBlock = "";
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeBlock += line + "\n";
      }
    }

    return examples;
  }

  private generateMarkdownFiles(): void {
    console.log(`\nGenerating markdown files...`);

    for (const [chapterName, tests] of this.chapters) {
      let markdown = `# ${this.formatChapterName(chapterName)}\n\n`;

      for (const test of tests) {
        const sectionKey = `${chapterName}-${test}`;
        const section = this.sections.get(sectionKey);

        if (section) {
          markdown += `## ${section.title}\n\n`;
          markdown += `${section.content}\n\n`;

          if (section.examples.length > 0) {
            markdown += `### Example\n\n`;
            markdown += `\`\`\`solidity\n`;
            markdown += `${section.examples[0]}\n`;
            markdown += `\`\`\`\n\n`;
          }
        }
      }

      const fileName = `${chapterName}.md`;
      const filePath = path.join(this.outputDir, fileName);
      fs.writeFileSync(filePath, markdown);
      console.log(`  ✅ Created: ${fileName}`);
    }
  }

  private generateTableOfContents(): void {
    let toc = `# Table of Contents\n\n`;
    toc += `## Getting Started\n\n`;
    toc += `- [Introduction](introduction.md)\n`;
    toc += `- [Setup Guide](setup.md)\n\n`;

    toc += `## Chapters\n\n`;

    for (const [chapterName] of this.chapters) {
      const chapterFile = `${chapterName}.md`;
      toc += `- [${this.formatChapterName(chapterName)}](${chapterFile})\n`;
    }

    toc += `\n## Advanced\n\n`;
    toc += `- [FAQ](faq.md)\n`;
    toc += `- [Troubleshooting](troubleshooting.md)\n`;
    toc += `- [Reference](reference.md)\n`;

    fs.writeFileSync(path.join(this.outputDir, "SUMMARY.md"), toc);
    console.log(`  ✅ Created: SUMMARY.md`);
  }

  private generateIndex(): void {
    let index = `# FHEVM Documentation\n\n`;
    index += `Welcome to the FHEVM Examples and Learning Guide.\n\n`;

    index += `## Quick Start\n\n`;
    index += `1. [Installation & Setup](setup.md)\n`;
    index += `2. [Basic Concepts](introduction.md)\n`;
    index += `3. [First Example](basic-arithmetic.md)\n\n`;

    index += `## Chapter Overview\n\n`;

    for (const [chapterName, tests] of this.chapters) {
      index += `### [${this.formatChapterName(chapterName)}](${chapterName}.md)\n`;
      index += `Contains ${tests.length} examples:\n`;
      tests.slice(0, 3).forEach(test => {
        index += `- ${test}\n`;
      });
      if (tests.length > 3) {
        index += `- ... and ${tests.length - 3} more\n`;
      }
      index += `\n`;
    }

    index += `## Documentation Structure\n\n`;
    index += `This documentation is organized as follows:\n\n`;
    index += `- **Getting Started**: Installation and basic setup\n`;
    index += `- **Chapters**: Organized by concept and difficulty\n`;
    index += `- **Examples**: Working code for each concept\n`;
    index += `- **Reference**: API and function documentation\n\n`;

    index += `## Learning Paths\n\n`;
    index += `### For Beginners\n`;
    index += `1. Introduction\n`;
    index += `2. Basic Arithmetic\n`;
    index += `3. Encryption Basics\n\n`;

    index += `### For Developers\n`;
    index += `1. Setup Guide\n`;
    index += `2. All Chapters in Order\n`;
    index += `3. Reference & API\n\n`;

    index += `### For Advanced Users\n`;
    index += `1. Advanced Patterns\n`;
    index += `2. Gas Optimization\n`;
    index += `3. Security Best Practices\n\n`;

    fs.writeFileSync(path.join(this.outputDir, "index.md"), index);
    fs.writeFileSync(path.join(this.outputDir, "README.md"), index);
    console.log(`  ✅ Created: index.md, README.md`);
  }

  private formatChapterName(chapter: string): string {
    return chapter
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

// Main execution
const args = process.argv.slice(2);
let inputDir = "test";
let outputDir = "docs";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--input" && i + 1 < args.length) {
    inputDir = args[i + 1];
  }
  if (args[i] === "--output" && i + 1 < args.length) {
    outputDir = args[i + 1];
  }
}

const generator = new DocumentationGenerator(inputDir, outputDir);

generator.generate().catch(error => {
  console.error("Error generating documentation:", error);
  process.exit(1);
});
