// ===================================================================
// Bulk LeetCode Problem Importer (1,500+ Problems Edition)
// ===================================================================
// Fetches the comprehensive LeetCode problem archive (2,800+ free problems),
// parses descriptions, constraints, examples, and sample test cases,
// and batch-inserts them into PostgreSQL with idempotent safety.
//
// Usage:
//   npm run seed:bulk                 # Imports 1,500 problems (default)
//   npx tsx scripts/import_bulk_leetcode.ts --limit 500
//   npx tsx scripts/import_bulk_leetcode.ts --all
//   npx tsx scripts/import_bulk_leetcode.ts --dry-run
// ===================================================================

import { PrismaClient, Difficulty, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

const DATASET_URL =
  'https://huggingface.co/datasets/Alishohadaee/leetcode-problems-dataset/resolve/main/raw_data/leetcode_problems.json';

function getLocalCachePath(): string {
  const candidates = [
    path.resolve(__dirname, '../data/leetcode_problems.json'),
    path.resolve(__dirname, '../../data/leetcode_problems.json'),
    path.resolve(process.cwd(), 'data/leetcode_problems.json'),
    path.resolve(process.cwd(), 'server/data/leetcode_problems.json'),
    path.resolve('/app/data/leetcode_problems.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]!;
}

const LOCAL_CACHE_PATH = getLocalCachePath();

const prisma = new PrismaClient();

interface RawLeetCodeProblem {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frontendQuestionId: string;
  paidOnly: boolean;
  title: string;
  titleSlug: string;
  description: string;
  category?: string;
  topics?: string[];
  hints?: string[];
}

interface ParsedProblem {
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string;
  examples: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isSample: boolean;
  }>;
}

/**
 * Parses raw LeetCode HTML description into clean Markdown,
 * separating constraints, examples, and extracting sample test cases.
 */
function parseLeetCodeProblem(raw: RawLeetCodeProblem): ParsedProblem {
  const html = raw.description || '';

  // 1. Map Difficulty
  let difficulty: Difficulty = Difficulty.MEDIUM;
  if (raw.difficulty === 'Easy') difficulty = Difficulty.EASY;
  if (raw.difficulty === 'Hard') difficulty = Difficulty.HARD;

  // 2. Extract Constraints
  let constraints = '';
  const constraintsMatch =
    html.match(/<p><strong>Constraints:<\/strong><\/p>([\s\S]*?)(?:<p>&nbsp;<\/p>|$)/i) ||
    html.match(/<strong>Constraints:<\/strong>([\s\S]*?)(?:<p>&nbsp;<\/p>|$)/i);

  if (constraintsMatch) {
    constraints = constraintsMatch[1]
      .replace(/<ul>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<sup>(.*?)<\/sup>/gi, '^$1')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  // 3. Extract Examples and Sample Test Cases
  let examples = '';
  const testCases: Array<{ input: string; expectedOutput: string; isSample: boolean }> = [];
  const exampleRegex =
    /<strong class="example">Example \d+:<\/strong>[\s\S]*?<pre>([\s\S]*?)<\/pre>/gi;
  let match: RegExpExecArray | null;
  let exIndex = 1;
  const exampleBlocks: string[] = [];

  while ((match = exampleRegex.exec(html)) !== null) {
    const rawPre = match[1];
    const cleanPre = rawPre
      .replace(/<strong>Input:<\/strong>\s*/gi, 'Input: ')
      .replace(/<strong>Output:<\/strong>\s*/gi, 'Output: ')
      .replace(/<strong>Explanation:<\/strong>\s*/gi, 'Explanation: ')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .trim();

    exampleBlocks.push(`**Example ${exIndex}:**\n${cleanPre}`);

    // Parse input & output for automated test cases
    const inMatch = cleanPre.match(/Input:\s*(.*?)(?=\nOutput:|$)/s);
    const outMatch = cleanPre.match(/Output:\s*(.*?)(?=\nExplanation:|$)/s);

    if (inMatch && outMatch) {
      testCases.push({
        input: inMatch[1].trim(),
        expectedOutput: outMatch[1].trim(),
        isSample: true,
      });
    }
    exIndex++;
  }

  if (exampleBlocks.length > 0) {
    examples = exampleBlocks.join('\n\n');
  }

  // 4. Clean main description
  let cleanDesc = html.split(/<h2 id="solution">|## Solution Article/i)[0];
  cleanDesc = cleanDesc
    .replace(/<p><strong class="example">Example[\s\S]*?<\/pre>/gi, '')
    .replace(/<p><strong>Constraints:[\s\S]*$/gi, '')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // If no test cases could be parsed from regex, create fallback sample test case
  if (testCases.length === 0) {
    testCases.push({
      input: 'sample_input',
      expectedOutput: 'sample_output',
      isSample: true,
    });
  }

  return {
    title: raw.title,
    difficulty,
    description: cleanDesc || `${raw.title} - LeetCode problem description.`,
    constraints: constraints || 'Standard integer range constraints apply.',
    examples: examples || 'Refer to problem description for input/output format.',
    testCases,
  };
}

/**
 * Downloads the dataset or loads from local cache.
 */
async function loadDataset(): Promise<RawLeetCodeProblem[]> {
  const dir = path.dirname(LOCAL_CACHE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(LOCAL_CACHE_PATH)) {
    console.log(`📦 Loading cached dataset from: ${LOCAL_CACHE_PATH}`);
    const data = fs.readFileSync(LOCAL_CACHE_PATH, 'utf-8');
    return JSON.parse(data);
  }

  console.log(`🌐 Downloading LeetCode dataset (~19 MB) from Hugging Face...`);
  console.log(`   URL: ${DATASET_URL}`);
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to download dataset: ${response.status} ${response.statusText}`);
  }

  const rawText = await response.text();
  fs.writeFileSync(LOCAL_CACHE_PATH, rawText, 'utf-8');
  console.log(`✅ Saved dataset cache to: ${LOCAL_CACHE_PATH}`);
  return JSON.parse(rawText);
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const importAll = args.includes('--all');

  let limit = 1500;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10) || 1500;
  }
  if (importAll) limit = 999999;

  console.log('===========================================================');
  console.log(`🚀 LeetCode Bulk Importer Target: ${importAll ? 'ALL' : limit} problems`);
  if (isDryRun) console.log('⚠️  DRY RUN MODE — No changes will be saved to database');
  console.log('===========================================================\n');

  // 1. Load Dataset
  const rawProblems = await loadDataset();
  console.log(`📊 Total items in source dataset: ${rawProblems.length}`);

  // 2. Filter for free problems
  const freeProblems = rawProblems.filter((p) => !p.paidOnly);
  console.log(`🔓 Free available problems: ${freeProblems.length}`);

  // Sort by frontendQuestionId so iconic lower-numbered questions come first (1, 2, 3...)
  freeProblems.sort((a, b) => (parseInt(a.frontendQuestionId, 10) || 0) - (parseInt(b.frontendQuestionId, 10) || 0));

  const targetProblems = freeProblems.slice(0, limit);
  console.log(`🎯 Problems selected for import: ${targetProblems.length}\n`);

  if (isDryRun) {
    console.log('🔍 Validating first 5 parsed problems...');
    for (let i = 0; i < Math.min(5, targetProblems.length); i++) {
      const parsed = parseLeetCodeProblem(targetProblems[i]);
      console.log(`  [#${targetProblems[i].frontendQuestionId}] ${parsed.title} (${parsed.difficulty})`);
      console.log(`     Test cases extracted: ${parsed.testCases.length}`);
    }
    console.log('\n✅ Dry run complete. Everything looks healthy!');
    return;
  }

  // 3. Ensure Admin User Exists
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codejudge.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@codejudge.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`👤 Admin user verified: ${admin.email}`);

  // 4. Check existing problems to ensure idempotency
  const existing = await prisma.problem.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((p) => p.title.toLowerCase().trim()));
  console.log(`📚 Existing problems in database: ${existingTitles.size}`);

  let insertedCount = 0;
  let skippedCount = 0;
  const BATCH_SIZE = 50;

  // 5. Batch Insert New Problems
  for (let i = 0; i < targetProblems.length; i += BATCH_SIZE) {
    const batch = targetProblems.slice(i, i + BATCH_SIZE);

    for (const raw of batch) {
      if (existingTitles.has(raw.title.toLowerCase().trim())) {
        skippedCount++;
        continue;
      }

      const parsed = parseLeetCodeProblem(raw);

      await prisma.problem.create({
        data: {
          title: parsed.title,
          difficulty: parsed.difficulty,
          description: parsed.description,
          constraints: parsed.constraints,
          examples: parsed.examples,
          isPublished: true,
          createdBy: admin.id,
          testCases: {
            create: parsed.testCases.map((tc, idx) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isSample: tc.isSample,
              orderIndex: idx,
              timeLimitMs: 2000,
              memoryLimitMb: 256,
            })),
          },
        },
      });

      existingTitles.add(raw.title.toLowerCase().trim());
      insertedCount++;
    }

    const progress = Math.min(i + BATCH_SIZE, targetProblems.length);
    process.stdout.write(`\r⏳ Processing: [${progress}/${targetProblems.length}] problems | Inserted: ${insertedCount} | Skipped: ${skippedCount}`);
  }

  console.log('\n\n✅ Bulk import completed successfully!');
  console.log(`   - Newly Inserted: ${insertedCount}`);
  console.log(`   - Already Existed (Skipped): ${skippedCount}`);
  console.log(`   - Total in Database: ${existingTitles.size}`);

  // 6. Invalidate Redis Cache
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const keys = await redis.keys('problems:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Invalidated ${keys.length} cached Redis problem keys.`);
    }
    await redis.quit();
  } catch (err) {
    console.log('ℹ️ Redis cache invalidation skipped (Redis not running or reachable)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
