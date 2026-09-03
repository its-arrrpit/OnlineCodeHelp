// ===================================================================
// Prisma Seed Script
// ===================================================================
// Populates the database with sample data for development.
// Run with: npx prisma db seed
//
// WHY SEED DATA?
//   You don't want to manually create users and problems every time
//   you reset the database. Seed data gives you a working baseline
//   to test the UI and API immediately after setup.
// ===================================================================

import { PrismaClient, Difficulty, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // ─── Create Admin User ────────────────────────────────────────────
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
  console.log(`Created admin user: ${admin.email}`);

  // ─── Create Test User ─────────────────────────────────────────────
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@codejudge.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@codejudge.com',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });
  console.log(`Created test user: ${user.email}`);

  // ─── Create Sample Problems ───────────────────────────────────────

  const problem1 = await prisma.problem.create({
    data: {
      title: 'Two Sum',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

Print the two numbers separated by a space, in the order they appear in the array.`,
      difficulty: Difficulty.EASY,
      constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists.`,
      examples: `**Example 1:**
Input:
4
2 7 11 15
9

Output:
2 7

**Example 2:**
Input:
3
3 2 4
6

Output:
2 4`,
      isPublished: true,
      createdBy: admin.id,
      testCases: {
        create: [
          {
            input: '4\n2 7 11 15\n9',
            expectedOutput: '2 7',
            isSample: true,
            orderIndex: 0,
          },
          {
            input: '3\n3 2 4\n6',
            expectedOutput: '2 4',
            isSample: true,
            orderIndex: 1,
          },
          {
            input: '2\n3 3\n6',
            expectedOutput: '3 3',
            isSample: false,
            orderIndex: 2,
          },
          {
            input: '5\n1 9 4 7 2\n8',
            expectedOutput: '1 7',
            isSample: false,
            orderIndex: 3,
          },
        ],
      },
    },
  });
  console.log(`Created problem: ${problem1.title}`);

  const problem2 = await prisma.problem.create({
    data: {
      title: 'Reverse a String',
      description: `Write a program that reads a string and prints it reversed.`,
      difficulty: Difficulty.EASY,
      constraints: `- 1 <= s.length <= 10^5
- s consists of printable ASCII characters.`,
      examples: `**Example 1:**
Input:
hello

Output:
olleh

**Example 2:**
Input:
OpenAI

Output:
IAnepO`,
      isPublished: true,
      createdBy: admin.id,
      testCases: {
        create: [
          {
            input: 'hello',
            expectedOutput: 'olleh',
            isSample: true,
            orderIndex: 0,
          },
          {
            input: 'OpenAI',
            expectedOutput: 'IAnepO',
            isSample: true,
            orderIndex: 1,
          },
          {
            input: 'abcdefghij',
            expectedOutput: 'jihgfedcba',
            isSample: false,
            orderIndex: 2,
          },
        ],
      },
    },
  });
  console.log(`Created problem: ${problem2.title}`);

  const problem3 = await prisma.problem.create({
    data: {
      title: 'FizzBuzz',
      description: `Given an integer \`n\`, print the numbers from 1 to n. But for multiples of 3, print "Fizz" instead of the number. For multiples of 5, print "Buzz". For multiples of both 3 and 5, print "FizzBuzz".

Print each value on a new line.`,
      difficulty: Difficulty.EASY,
      constraints: `- 1 <= n <= 10^4`,
      examples: `**Example 1:**
Input:
5

Output:
1
2
Fizz
4
Buzz

**Example 2:**
Input:
15

Output:
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz`,
      isPublished: true,
      createdBy: admin.id,
      testCases: {
        create: [
          {
            input: '5',
            expectedOutput: '1\n2\nFizz\n4\nBuzz',
            isSample: true,
            orderIndex: 0,
          },
          {
            input: '15',
            expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
            isSample: true,
            orderIndex: 1,
          },
          {
            input: '1',
            expectedOutput: '1',
            isSample: false,
            orderIndex: 2,
          },
        ],
      },
    },
  });
  console.log(`Created problem: ${problem3.title}`);

  console.log('\nSeed completed successfully!');
  console.log('Admin login: admin@codejudge.com / admin123');
  console.log('User login:  user@codejudge.com / user123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
