import { PrismaClient, Difficulty, Role } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface ProblemSeedData {
  title: string;
  description: string;
  difficulty: Difficulty;
  constraints: string;
  examples: string;
  testCases: {
    input: string;
    expectedOutput: string;
    isSample: boolean;
  }[];
}

const NEW_PROBLEMS: ProblemSeedData[] = [
  {
    title: 'Valid Parentheses',
    difficulty: Difficulty.EASY,
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Print \`true\` if valid, or \`false\` otherwise.`,
    constraints: `- 1 <= s.length <= 10^4
- \`s\` consists of parentheses only \`'()[]{}'.\``,
    examples: `**Example 1:**
Input:
()[]{}

Output:
true

**Example 2:**
Input:
(]

Output:
false`,
    testCases: [
      { input: '()[]{}', expectedOutput: 'true', isSample: true },
      { input: '(]', expectedOutput: 'false', isSample: true },
      { input: '([{}])', expectedOutput: 'true', isSample: false },
      { input: '([)]', expectedOutput: 'false', isSample: false },
      { input: '((((({{{[[[()]]]}}})))))', expectedOutput: 'true', isSample: false },
    ],
  },
  {
    title: 'Palindrome Number',
    difficulty: Difficulty.EASY,
    description: `Given an integer \`x\`, print \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

An integer is a palindrome when it reads the same forward and backward.
For example, \`121\` is a palindrome while \`123\` and \`-121\` are not.`,
    constraints: `- -2^31 <= x <= 2^31 - 1`,
    examples: `**Example 1:**
Input:
121

Output:
true

**Example 2:**
Input:
-121

Output:
false`,
    testCases: [
      { input: '121', expectedOutput: 'true', isSample: true },
      { input: '-121', expectedOutput: 'false', isSample: true },
      { input: '10', expectedOutput: 'false', isSample: true },
      { input: '12321', expectedOutput: 'true', isSample: false },
      { input: '0', expectedOutput: 'true', isSample: false },
    ],
  },
  {
    title: 'Contains Duplicate',
    difficulty: Difficulty.EASY,
    description: `Given an integer array \`nums\`, print \`true\` if any value appears at least twice in the array, and print \`false\` if every element is distinct.

**Input Format:**
- Line 1: An integer \`n\` (size of array)
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9`,
    examples: `**Example 1:**
Input:
4
1 2 3 1

Output:
true

**Example 2:**
Input:
4
1 2 3 4

Output:
false`,
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true', isSample: true },
      { input: '4\n1 2 3 4', expectedOutput: 'false', isSample: true },
      { input: '10\n1 1 1 3 3 4 3 2 4 2', expectedOutput: 'true', isSample: false },
      { input: '1\n99', expectedOutput: 'false', isSample: false },
    ],
  },
  {
    title: 'Maximum Subarray (Kadane Algorithm)',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and print its sum.

A subarray is a contiguous non-empty sequence of elements within an array.

**Input Format:**
- Line 1: Integer \`n\` (number of elements)
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    examples: `**Example 1:**
Input:
9
-2 1 -3 4 -1 2 1 -5 4

Output:
6
(Subarray [4, -1, 2, 1] has the largest sum 6)

**Example 2:**
Input:
1
1

Output:
1`,
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true },
      { input: '1\n1', expectedOutput: '1', isSample: true },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isSample: false },
      { input: '4\n-5 -2 -8 -1', expectedOutput: '-1', isSample: false },
    ],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: Difficulty.EASY,
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Print the maximum profit you can achieve from this transaction. If you cannot achieve any profit, print \`0\`.

**Input Format:**
- Line 1: Integer \`n\` (number of days)
- Line 2: \`n\` space-separated prices`,
    constraints: `- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4`,
    examples: `**Example 1:**
Input:
6
7 1 5 3 6 4

Output:
5
(Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5)

**Example 2:**
Input:
5
7 6 4 3 1

Output:
0`,
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5', isSample: true },
      { input: '5\n7 6 4 3 1', expectedOutput: '0', isSample: true },
      { input: '2\n2 4', expectedOutput: '2', isSample: false },
      { input: '8\n3 2 6 5 0 3 9 1', expectedOutput: '9', isSample: false },
    ],
  },
  {
    title: 'Climbing Stairs',
    difficulty: Difficulty.EASY,
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

**Input Format:**
- A single integer \`n\``,
    constraints: `- 1 <= n <= 45`,
    examples: `**Example 1:**
Input:
2

Output:
2
(1. 1 step + 1 step
 2. 2 steps)

**Example 2:**
Input:
3

Output:
3
(1. 1 + 1 + 1
 2. 1 + 2
 3. 2 + 1)`,
    testCases: [
      { input: '2', expectedOutput: '2', isSample: true },
      { input: '3', expectedOutput: '3', isSample: true },
      { input: '5', expectedOutput: '8', isSample: false },
      { input: '10', expectedOutput: '89', isSample: false },
      { input: '35', expectedOutput: '14930352', isSample: false },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: Difficulty.MEDIUM,
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

**Input Format:**
- Single string \`s\` (on one line)`,
    constraints: `- 0 <= s.length <= 5 * 10^4
- \`s\` consists of English letters, digits, symbols and spaces.`,
    examples: `**Example 1:**
Input:
abcabcbb

Output:
3
(The answer is "abc", with length 3)

**Example 2:**
Input:
bbbbb

Output:
1
(The answer is "b", with length 1)`,
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isSample: true },
      { input: 'bbbbb', expectedOutput: '1', isSample: true },
      { input: 'pwwkew', expectedOutput: '3', isSample: true },
      { input: 'aab', expectedOutput: '2', isSample: false },
      { input: 'abcdefghijklm', expectedOutput: '13', isSample: false },
    ],
  },
  {
    title: 'Container With Most Water',
    difficulty: Difficulty.MEDIUM,
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Print the maximum amount of water a container can store.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated heights`,
    constraints: `- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4`,
    examples: `**Example 1:**
Input:
9
1 8 6 2 5 4 8 3 7

Output:
49

**Example 2:**
Input:
2
1 1

Output:
1`,
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isSample: true },
      { input: '2\n1 1', expectedOutput: '1', isSample: true },
      { input: '5\n4 3 2 1 4', expectedOutput: '16', isSample: false },
      { input: '6\n1 2 4 3 2 1', expectedOutput: '4', isSample: false },
    ],
  },
  {
    title: 'Search in Rotated Sorted Array',
    difficulty: Difficulty.MEDIUM,
    description: `There is an integer array \`nums\` sorted in ascending order (with distinct values).

Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index \`k\` (1 <= k < nums.length).

Given the array \`nums\` after the possible rotation and an integer \`target\`, print the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.

Your algorithm must run in O(log n) runtime complexity.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers
- Line 3: Target integer`,
    constraints: `- 1 <= nums.length <= 10^4
- -10^4 <= nums[i] <= 10^4
- All values of \`nums\` are unique.`,
    examples: `**Example 1:**
Input:
7
4 5 6 7 0 1 2
0

Output:
4

**Example 2:**
Input:
7
4 5 6 7 0 1 2
3

Output:
-1`,
    testCases: [
      { input: '7\n4 5 6 7 0 1 2\n0', expectedOutput: '4', isSample: true },
      { input: '7\n4 5 6 7 0 1 2\n3', expectedOutput: '-1', isSample: true },
      { input: '1\n1\n0', expectedOutput: '-1', isSample: false },
      { input: '8\n6 7 8 1 2 3 4 5\n8', expectedOutput: '2', isSample: false },
    ],
  },
  {
    title: 'Coin Change',
    difficulty: Difficulty.MEDIUM,
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Print the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, print \`-1\`.

You may assume that you have an infinite number of each kind of coin.

**Input Format:**
- Line 1: Number of coin types \`n\`
- Line 2: \`n\` space-separated coin denominations
- Line 3: Target \`amount\``,
    constraints: `- 1 <= coins.length <= 12
- 1 <= coins[i] <= 2^31 - 1
- 0 <= amount <= 10^4`,
    examples: `**Example 1:**
Input:
3
1 2 5
11

Output:
3
(11 = 5 + 5 + 1)

**Example 2:**
Input:
1
2
3

Output:
-1`,
    testCases: [
      { input: '3\n1 2 5\n11', expectedOutput: '3', isSample: true },
      { input: '1\n2\n3', expectedOutput: '-1', isSample: true },
      { input: '1\n1\n0', expectedOutput: '0', isSample: false },
      { input: '4\n1 5 10 25\n63', expectedOutput: '6', isSample: false },
    ],
  },
  {
    title: 'Trapping Rain Water',
    difficulty: Difficulty.HARD,
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

**Input Format:**
- Line 1: Integer \`n\` (number of bars)
- Line 2: \`n\` space-separated non-negative heights`,
    constraints: `- n == height.length
- 1 <= n <= 2 * 10^4
- 0 <= height[i] <= 10^5`,
    examples: `**Example 1:**
Input:
12
0 1 0 2 1 0 1 3 2 1 2 1

Output:
6

**Example 2:**
Input:
6
4 2 0 3 2 5

Output:
9`,
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true },
      { input: '6\n4 2 0 3 2 5', expectedOutput: '9', isSample: true },
      { input: '3\n3 0 3', expectedOutput: '3', isSample: false },
      { input: '5\n5 4 3 2 1', expectedOutput: '0', isSample: false },
    ],
  },
  {
    title: 'Longest Consecutive Sequence',
    difficulty: Difficulty.MEDIUM,
    description: `Given an unsorted array of integers \`nums\`, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in **O(n)** time complexity.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers`,
    constraints: `- 0 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9`,
    examples: `**Example 1:**
Input:
6
100 4 200 1 3 2

Output:
4
(The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.)

**Example 2:**
Input:
10
0 3 7 2 5 8 4 6 0 1

Output:
9`,
    testCases: [
      { input: '6\n100 4 200 1 3 2', expectedOutput: '4', isSample: true },
      { input: '10\n0 3 7 2 5 8 4 6 0 1', expectedOutput: '9', isSample: true },
      { input: '0\n', expectedOutput: '0', isSample: false },
      { input: '5\n9 1 4 7 3', expectedOutput: '1', isSample: false },
    ],
  },
];

async function seedMore() {
  console.log('Seeding expanded DSA problems...');

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!admin) {
    throw new Error('Admin user not found. Please run base seed first.');
  }

  let addedCount = 0;

  for (const prob of NEW_PROBLEMS) {
    const existing = await prisma.problem.findFirst({
      where: { title: prob.title },
    });

    if (existing) {
      console.log(`Skipping already existing problem: "${prob.title}"`);
      continue;
    }

    await prisma.problem.create({
      data: {
        title: prob.title,
        description: prob.description,
        difficulty: prob.difficulty,
        constraints: prob.constraints,
        examples: prob.examples,
        isPublished: true,
        createdBy: admin.id,
        testCases: {
          create: prob.testCases.map((tc, idx) => ({
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

    addedCount++;
    console.log(`[+] Added problem: "${prob.title}" [${prob.difficulty}]`);
  }

  console.log(`\nSuccessfully added ${addedCount} new problems!`);

  // Invalidate Redis problem caches so UI sees new problems immediately
  const keys = await redis.keys('codejudge:problems*');
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`Cleared ${keys.length} cached problem keys in Redis.`);
  }
}

seedMore()
  .catch((e) => {
    console.error('Failed to seed more problems:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
