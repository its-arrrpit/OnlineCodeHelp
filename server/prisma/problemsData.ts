import { Difficulty } from '@prisma/client';

export interface TestCaseSeed {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  orderIndex?: number;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface ProblemSeedData {
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string;
  examples: string;
  testCases: TestCaseSeed[];
}

export const ALL_PROBLEMS: ProblemSeedData[] = [
  // ===================================================================
  // 1. Two Sum
  // ===================================================================
  {
    title: 'Two Sum',
    difficulty: Difficulty.EASY,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

Print the two numbers separated by a space, in the order they appear in the array.

**Input Format:**
- Line 1: Integer \`n\` (size of array)
- Line 2: \`n\` space-separated integers
- Line 3: Integer \`target\``,
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
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '2 7', isSample: true },
      { input: '3\n3 2 4\n6', expectedOutput: '2 4', isSample: true },
      { input: '2\n3 3\n6', expectedOutput: '3 3', isSample: false },
      { input: '5\n1 9 4 7 2\n8', expectedOutput: '1 7', isSample: false },
      { input: '4\n-3 4 3 90\n0', expectedOutput: '-3 3', isSample: false },
    ],
  },

  // ===================================================================
  // 2. Reverse a String
  // ===================================================================
  {
    title: 'Reverse a String',
    difficulty: Difficulty.EASY,
    description: `Write a program that reads a string and prints it reversed.

**Input Format:**
- A single line containing string \`s\``,
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
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isSample: true },
      { input: 'OpenAI', expectedOutput: 'IAnepO', isSample: true },
      { input: 'abcdefghij', expectedOutput: 'jihgfedcba', isSample: false },
      { input: 'a', expectedOutput: 'a', isSample: false },
      { input: 'racecar', expectedOutput: 'racecar', isSample: false },
    ],
  },

  // ===================================================================
  // 3. FizzBuzz
  // ===================================================================
  {
    title: 'FizzBuzz',
    difficulty: Difficulty.EASY,
    description: `Given an integer \`n\`, print the numbers from 1 to n. But for multiples of 3, print "Fizz" instead of the number. For multiples of 5, print "Buzz". For multiples of both 3 and 5, print "FizzBuzz".

Print each value on a new line.

**Input Format:**
- A single integer \`n\``,
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
    testCases: [
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isSample: true },
      {
        input: '15',
        expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        isSample: true,
      },
      { input: '1', expectedOutput: '1', isSample: false },
      { input: '3', expectedOutput: '1\n2\nFizz', isSample: false },
    ],
  },

  // ===================================================================
  // 4. Valid Parentheses
  // ===================================================================
  {
    title: 'Valid Parentheses',
    difficulty: Difficulty.EASY,
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Print \`true\` if valid, or \`false\` otherwise.

**Input Format:**
- A single line containing string \`s\``,
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
      { input: ']', expectedOutput: 'false', isSample: false },
    ],
  },

  // ===================================================================
  // 5. Palindrome Number
  // ===================================================================
  {
    title: 'Palindrome Number',
    difficulty: Difficulty.EASY,
    description: `Given an integer \`x\`, print \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

An integer is a palindrome when it reads the same forward and backward.
For example, \`121\` is a palindrome while \`123\` and \`-121\` are not.

**Input Format:**
- A single line containing integer \`x\``,
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

  // ===================================================================
  // 6. Contains Duplicate
  // ===================================================================
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

  // ===================================================================
  // 7. Best Time to Buy and Sell Stock
  // ===================================================================
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

  // ===================================================================
  // 8. Climbing Stairs
  // ===================================================================
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
3`,
    testCases: [
      { input: '2', expectedOutput: '2', isSample: true },
      { input: '3', expectedOutput: '3', isSample: true },
      { input: '5', expectedOutput: '8', isSample: false },
      { input: '10', expectedOutput: '89', isSample: false },
      { input: '35', expectedOutput: '14930352', isSample: false },
    ],
  },

  // ===================================================================
  // 9. Valid Anagram
  // ===================================================================
  {
    title: 'Valid Anagram',
    difficulty: Difficulty.EASY,
    description: `Given two strings \`s\` and \`t\`, print \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Input Format:**
- Line 1: String \`s\`
- Line 2: String \`t\``,
    constraints: `- 1 <= s.length, t.length <= 5 * 10^4
- \`s\` and \`t\` consist of lowercase English letters.`,
    examples: `**Example 1:**
Input:
anagram
nagaram

Output:
true

**Example 2:**
Input:
rat
car

Output:
false`,
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true', isSample: true },
      { input: 'rat\ncar', expectedOutput: 'false', isSample: true },
      { input: 'listen\nsilent', expectedOutput: 'true', isSample: false },
      { input: 'ab\na', expectedOutput: 'false', isSample: false },
      { input: 'a\na', expectedOutput: 'true', isSample: false },
    ],
  },

  // ===================================================================
  // 10. Binary Search
  // ===================================================================
  {
    title: 'Binary Search',
    difficulty: Difficulty.EASY,
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`.

If \`target\` exists, then print its index. Otherwise, print \`-1\`.

Your algorithm must run in O(log n) runtime complexity.

**Input Format:**
- Line 1: Integer \`n\` (size of array)
- Line 2: \`n\` space-separated sorted integers
- Line 3: Integer \`target\``,
    constraints: `- 1 <= nums.length <= 10^4
- -10^4 < nums[i], target < 10^4
- All integers in \`nums\` are unique.
- \`nums\` is sorted in ascending order.`,
    examples: `**Example 1:**
Input:
6
-1 0 3 5 9 12
9

Output:
4

**Example 2:**
Input:
6
-1 0 3 5 9 12
2

Output:
-1`,
    testCases: [
      { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true },
      { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true },
      { input: '1\n5\n5', expectedOutput: '0', isSample: false },
      { input: '1\n5\n-5', expectedOutput: '-1', isSample: false },
      { input: '5\n2 5 8 12 16\n16', expectedOutput: '4', isSample: false },
    ],
  },

  // ===================================================================
  // 11. Maximum Subarray (Kadane's Algorithm)
  // ===================================================================
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

  // ===================================================================
  // 12. Longest Substring Without Repeating Characters
  // ===================================================================
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
1`,
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isSample: true },
      { input: 'bbbbb', expectedOutput: '1', isSample: true },
      { input: 'pwwkew', expectedOutput: '3', isSample: true },
      { input: 'aab', expectedOutput: '2', isSample: false },
      { input: 'abcdefghijklm', expectedOutput: '13', isSample: false },
    ],
  },

  // ===================================================================
  // 13. Container With Most Water
  // ===================================================================
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

  // ===================================================================
  // 14. Search in Rotated Sorted Array
  // ===================================================================
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

  // ===================================================================
  // 15. Coin Change
  // ===================================================================
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

  // ===================================================================
  // 16. Longest Consecutive Sequence
  // ===================================================================
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

  // ===================================================================
  // 17. Product of Array Except Self
  // ===================================================================
  {
    title: 'Product of Array Except Self',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in **O(n)** time and without using the division operation.

Print the elements of \`answer\` separated by a space.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers`,
    constraints: `- 2 <= nums.length <= 10^5
- -30 <= nums[i] <= 30
- The input is generated such that answer[i] fits in a 32-bit integer.`,
    examples: `**Example 1:**
Input:
4
1 2 3 4

Output:
24 12 8 6

**Example 2:**
Input:
5
-1 1 0 -3 3

Output:
0 0 9 0 0`,
    testCases: [
      { input: '4\n1 2 3 4', expectedOutput: '24 12 8 6', isSample: true },
      { input: '5\n-1 1 0 -3 3', expectedOutput: '0 0 9 0 0', isSample: true },
      { input: '2\n0 0', expectedOutput: '0 0', isSample: false },
      { input: '3\n2 3 4', expectedOutput: '12 8 6', isSample: false },
      { input: '4\n1 2 0 4', expectedOutput: '0 0 8 0', isSample: false },
    ],
  },

  // ===================================================================
  // 18. 3Sum
  // ===================================================================
  {
    title: '3Sum',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\`, find all unique triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.

Print the **count** of unique zero-sum triplets found.

**Input Format:**
- Line 1: Integer \`n\` (size of array)
- Line 2: \`n\` space-separated integers`,
    constraints: `- 3 <= nums.length <= 3000
- -10^5 <= nums[i] <= 10^5`,
    examples: `**Example 1:**
Input:
6
-1 0 1 2 -1 -4

Output:
2
(The unique triplets are [-1, -1, 2] and [-1, 0, 1])

**Example 2:**
Input:
3
0 1 1

Output:
0`,
    testCases: [
      { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '2', isSample: true },
      { input: '3\n0 1 1', expectedOutput: '0', isSample: true },
      { input: '3\n0 0 0', expectedOutput: '1', isSample: false },
      { input: '6\n-2 0 1 1 2 -1', expectedOutput: '2', isSample: false },
      { input: '5\n-1 0 1 0 -1', expectedOutput: '1', isSample: false },
    ],
  },

  // ===================================================================
  // 19. Top K Frequent Elements
  // ===================================================================
  {
    title: 'Top K Frequent Elements',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\` and an integer \`k\`, print the \`k\` most frequent elements.

Print the numbers separated by a single space, **sorted in ascending order**.

You may assume that the answer is unique.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers
- Line 3: Integer \`k\``,
    constraints: `- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4
- k is in the range [1, the number of unique elements in the array].
- It is guaranteed that the answer is unique.`,
    examples: `**Example 1:**
Input:
6
1 1 1 2 2 3
2

Output:
1 2

**Example 2:**
Input:
1
1
1

Output:
1`,
    testCases: [
      { input: '6\n1 1 1 2 2 3\n2', expectedOutput: '1 2', isSample: true },
      { input: '1\n1\n1', expectedOutput: '1', isSample: true },
      { input: '7\n4 1 -1 2 -1 2 3\n2', expectedOutput: '-1 2', isSample: false },
      { input: '6\n5 5 5 2 2 1\n3', expectedOutput: '1 2 5', isSample: false },
    ],
  },

  // ===================================================================
  // 20. Merge Intervals
  // ===================================================================
  {
    title: 'Merge Intervals',
    difficulty: Difficulty.MEDIUM,
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and print the resulting non-overlapping intervals that cover all the intervals in the input.

Print each interval on a new line as \`start end\`, sorted by their start values in ascending order.

**Input Format:**
- Line 1: Integer \`n\` (number of intervals)
- Following \`n\` lines: Two space-separated integers \`start end\``,
    constraints: `- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= start_i <= end_i <= 10^4`,
    examples: `**Example 1:**
Input:
4
1 3
2 6
8 10
15 18

Output:
1 6
8 10
15 18

**Example 2:**
Input:
2
1 4
4 5

Output:
1 5`,
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isSample: true },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', isSample: true },
      { input: '1\n1 4', expectedOutput: '1 4', isSample: false },
      { input: '3\n1 4\n0 2\n3 5', expectedOutput: '0 5', isSample: false },
      { input: '3\n1 4\n2 3\n5 6', expectedOutput: '1 4\n5 6', isSample: false },
    ],
  },

  // ===================================================================
  // 21. Rotate Image (90 Degrees Clockwise)
  // ===================================================================
  {
    title: 'Rotate Image (90 Degrees)',
    difficulty: Difficulty.MEDIUM,
    description: `You are given an \`n x n\` 2D matrix representing an image. Rotate the image by 90 degrees (clockwise).

Print the rotated matrix, where each row is printed on a new line with space-separated integers.

**Input Format:**
- Line 1: Integer \`n\`
- Following \`n\` lines: \`n\` space-separated integers per row`,
    constraints: `- n == matrix.length == matrix[i].length
- 1 <= n <= 20
- -1000 <= matrix[i][j] <= 1000`,
    examples: `**Example 1:**
Input:
3
1 2 3
4 5 6
7 8 9

Output:
7 4 1
8 5 2
9 6 3

**Example 2:**
Input:
2
1 2
3 4

Output:
3 1
4 2`,
    testCases: [
      { input: '3\n1 2 3\n4 5 6\n7 8 9', expectedOutput: '7 4 1\n8 5 2\n9 6 3', isSample: true },
      { input: '2\n1 2\n3 4', expectedOutput: '3 1\n4 2', isSample: true },
      { input: '1\n5', expectedOutput: '5', isSample: false },
      {
        input: '4\n5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16',
        expectedOutput: '15 13 2 5\n14 3 4 1\n12 6 8 9\n16 7 10 11',
        isSample: false,
      },
    ],
  },

  // ===================================================================
  // 22. Jump Game
  // ===================================================================
  {
    title: 'Jump Game',
    difficulty: Difficulty.MEDIUM,
    description: `You are given an integer array \`nums\`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.

Print \`true\` if you can reach the last index, or \`false\` otherwise.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= nums.length <= 10^4
- 0 <= nums[i] <= 10^5`,
    examples: `**Example 1:**
Input:
5
2 3 1 1 4

Output:
true
(Jump 1 step from index 0 to 1, then 3 steps to the last index.)

**Example 2:**
Input:
5
3 2 1 0 4

Output:
false`,
    testCases: [
      { input: '5\n2 3 1 1 4', expectedOutput: 'true', isSample: true },
      { input: '5\n3 2 1 0 4', expectedOutput: 'false', isSample: true },
      { input: '1\n0', expectedOutput: 'true', isSample: false },
      { input: '2\n2 0', expectedOutput: 'true', isSample: false },
      { input: '4\n1 0 1 0', expectedOutput: 'false', isSample: false },
    ],
  },

  // ===================================================================
  // 23. House Robber
  // ===================================================================
  {
    title: 'House Robber',
    difficulty: Difficulty.MEDIUM,
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and **it will automatically contact the police if two adjacent houses were broken into on the same night**.

Given an integer array \`nums\` representing the amount of money of each house, print the maximum amount of money you can rob tonight without alerting the police.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= nums.length <= 100
- 0 <= nums[i] <= 400`,
    examples: `**Example 1:**
Input:
4
1 2 3 1

Output:
4
(Rob house 1 (money = 1) and house 3 (money = 3). Total = 1 + 3 = 4.)

**Example 2:**
Input:
5
2 7 9 3 1

Output:
12
(Rob house 1 (money = 2), house 3 (money = 9) and house 5 (money = 1). Total = 12.)`,
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: '4', isSample: true },
      { input: '5\n2 7 9 3 1', expectedOutput: '12', isSample: true },
      { input: '1\n50', expectedOutput: '50', isSample: false },
      { input: '2\n1 2', expectedOutput: '2', isSample: false },
      { input: '6\n2 1 1 2 1 2', expectedOutput: '6', isSample: false },
    ],
  },

  // ===================================================================
  // 24. Longest Increasing Subsequence
  // ===================================================================
  {
    title: 'Longest Increasing Subsequence',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence.

A subsequence is an array that can be derived from another array by deleting some or no elements without changing the order of the remaining elements.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= nums.length <= 2500
- -10^4 <= nums[i] <= 10^4`,
    examples: `**Example 1:**
Input:
8
10 9 2 5 3 7 101 18

Output:
4
(The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4.)

**Example 2:**
Input:
6
0 1 0 3 2 3

Output:
4`,
    testCases: [
      { input: '8\n10 9 2 5 3 7 101 18', expectedOutput: '4', isSample: true },
      { input: '6\n0 1 0 3 2 3', expectedOutput: '4', isSample: true },
      { input: '7\n7 7 7 7 7 7 7', expectedOutput: '1', isSample: false },
      { input: '1\n10', expectedOutput: '1', isSample: false },
      { input: '5\n4 10 4 3 8', expectedOutput: '2', isSample: false },
    ],
  },

  // ===================================================================
  // 25. Number of Islands
  // ===================================================================
  {
    title: 'Number of Islands',
    difficulty: Difficulty.MEDIUM,
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), print the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

**Input Format:**
- Line 1: Two space-separated integers \`m n\` (rows and columns)
- Following \`m\` lines: \`n\` space-separated values (\`1\` or \`0\`)`,
    constraints: `- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 300
- grid[i][j] is '0' or '1'.`,
    examples: `**Example 1:**
Input:
4 5
1 1 1 1 0
1 1 0 1 0
1 1 0 0 0
0 0 0 0 0

Output:
1

**Example 2:**
Input:
4 5
1 1 0 0 0
1 1 0 0 0
0 0 1 0 0
0 0 0 1 1

Output:
3`,
    testCases: [
      {
        input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0',
        expectedOutput: '1',
        isSample: true,
      },
      {
        input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1',
        expectedOutput: '3',
        isSample: true,
      },
      { input: '1 1\n0', expectedOutput: '0', isSample: false },
      { input: '1 1\n1', expectedOutput: '1', isSample: false },
      { input: '3 3\n1 0 1\n0 1 0\n1 0 1', expectedOutput: '5', isSample: false },
    ],
  },

  // ===================================================================
  // 26. Evaluate Reverse Polish Notation
  // ===================================================================
  {
    title: 'Evaluate Reverse Polish Notation',
    difficulty: Difficulty.MEDIUM,
    description: `You are given an array of strings \`tokens\` that represents an arithmetic expression in a Reverse Polish Notation (Postfix notation).

Evaluate the expression. Print an integer that represents the value of the expression.

Note that:
- The valid operators are \`+\`, \`-\`, \`*\`, and \`/\`.
- Each operand may be an integer or another expression.
- The division between two integers always truncates toward zero.

**Input Format:**
- Line 1: Integer \`n\` (number of tokens)
- Line 2: \`n\` space-separated tokens`,
    constraints: `- 1 <= tokens.length <= 10^4
- tokens[i] is either an operator: "+", "-", "*", or "/", or an integer in the range [-200, 200].`,
    examples: `**Example 1:**
Input:
5
2 1 + 3 *

Output:
9
(Expression: ((2 + 1) * 3) = 9)

**Example 2:**
Input:
5
4 13 5 / +

Output:
6
(Expression: (4 + (13 / 5)) = 6)`,
    testCases: [
      { input: '5\n2 1 + 3 *', expectedOutput: '9', isSample: true },
      { input: '5\n4 13 5 / +', expectedOutput: '6', isSample: true },
      { input: '1\n18', expectedOutput: '18', isSample: false },
      { input: '5\n3 4 - 5 *', expectedOutput: '-5', isSample: false },
      { input: '7\n2 3 + 4 5 + *', expectedOutput: '45', isSample: false },
    ],
  },

  // ===================================================================
  // 27. Subarray Sum Equals K
  // ===================================================================
  {
    title: 'Subarray Sum Equals K',
    difficulty: Difficulty.MEDIUM,
    description: `Given an array of integers \`nums\` and an integer \`k\`, print the total number of continuous subarrays whose sum equals to \`k\`.

A subarray is a contiguous non-empty sequence of elements within an array.

**Input Format:**
- Line 1: Integer \`n\` (size of array)
- Line 2: \`n\` space-separated integers
- Line 3: Integer \`k\``,
    constraints: `- 1 <= nums.length <= 2 * 10^4
- -1000 <= nums[i] <= 1000
- -10^7 <= k <= 10^7`,
    examples: `**Example 1:**
Input:
3
1 1 1
2

Output:
2

**Example 2:**
Input:
3
1 2 3
3

Output:
2`,
    testCases: [
      { input: '3\n1 1 1\n2', expectedOutput: '2', isSample: true },
      { input: '3\n1 2 3\n3', expectedOutput: '2', isSample: true },
      { input: '1\n1\n0', expectedOutput: '0', isSample: false },
      { input: '4\n1 -1 1 -1\n0', expectedOutput: '4', isSample: false },
      { input: '5\n3 4 7 2 -3\n7', expectedOutput: '4', isSample: false },
    ],
  },

  // ===================================================================
  // 28. Word Break
  // ===================================================================
  {
    title: 'Word Break',
    difficulty: Difficulty.MEDIUM,
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, print \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words, or \`false\` otherwise.

Note that the same word in the dictionary may be reused multiple times in the segmentation.

**Input Format:**
- Line 1: String \`s\`
- Line 2: Integer \`m\` (number of words in dictionary)
- Line 3: \`m\` space-separated dictionary words`,
    constraints: `- 1 <= s.length <= 300
- 1 <= wordDict.length <= 1000
- 1 <= wordDict[i].length <= 20
- \`s\` and \`wordDict[i]\` consist of only lowercase English letters.
- All the strings of \`wordDict\` are unique.`,
    examples: `**Example 1:**
Input:
leetcode
2
leet code

Output:
true
(Return true because "leetcode" can be segmented as "leet code".)

**Example 2:**
Input:
applepenapple
2
apple pen

Output:
true`,
    testCases: [
      { input: 'leetcode\n2\nleet code', expectedOutput: 'true', isSample: true },
      { input: 'applepenapple\n2\napple pen', expectedOutput: 'true', isSample: true },
      { input: 'catsandog\n5\ncats dog sand and cat', expectedOutput: 'false', isSample: false },
      { input: 'a\n1\na', expectedOutput: 'true', isSample: false },
      { input: 'cars\n2\ncar ca', expectedOutput: 'false', isSample: false },
    ],
  },

  // ===================================================================
  // 29. Find Minimum in Rotated Sorted Array
  // ===================================================================
  {
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: Difficulty.MEDIUM,
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of unique elements, print the minimum element of this array.

You must write an algorithm that runs in **O(log n)** time.

**Input Format:**
- Line 1: Integer \`n\`
- Line 2: \`n\` space-separated integers`,
    constraints: `- n == nums.length
- 1 <= n <= 5000
- -5000 <= nums[i] <= 5000
- All the integers of nums are unique.
- nums is sorted and rotated between 1 and n times.`,
    examples: `**Example 1:**
Input:
5
3 4 5 1 2

Output:
1

**Example 2:**
Input:
7
4 5 6 7 0 1 2

Output:
0`,
    testCases: [
      { input: '5\n3 4 5 1 2', expectedOutput: '1', isSample: true },
      { input: '7\n4 5 6 7 0 1 2', expectedOutput: '0', isSample: true },
      { input: '1\n11', expectedOutput: '11', isSample: false },
      { input: '4\n11 13 15 17', expectedOutput: '11', isSample: false },
      { input: '2\n2 1', expectedOutput: '1', isSample: false },
    ],
  },

  // ===================================================================
  // 30. Trapping Rain Water
  // ===================================================================
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

  // ===================================================================
  // 31. Edit Distance
  // ===================================================================
  {
    title: 'Edit Distance',
    difficulty: Difficulty.HARD,
    description: `Given two strings \`word1\` and \`word2\`, return the minimum number of operations required to convert \`word1\` to \`word2\`.

You have the following three operations permitted on a word:
- Insert a character
- Delete a character
- Replace a character

**Input Format:**
- Line 1: String \`word1\`
- Line 2: String \`word2\``,
    constraints: `- 1 <= word1.length, word2.length <= 500
- \`word1\` and \`word2\` consist of lowercase English letters.`,
    examples: `**Example 1:**
Input:
horse
ros

Output:
3
(horse -> rorse (replace 'h' with 'r') -> rose (remove 'r') -> ros (remove 'e'))

**Example 2:**
Input:
intention
execution

Output:
5`,
    testCases: [
      { input: 'horse\nros', expectedOutput: '3', isSample: true },
      { input: 'intention\nexecution', expectedOutput: '5', isSample: true },
      { input: 'a\na', expectedOutput: '0', isSample: false },
      { input: 'cat\nhat', expectedOutput: '1', isSample: false },
      { input: 'kitten\nsitting', expectedOutput: '3', isSample: false },
      { input: 'zoologico\nzoologia', expectedOutput: '2', isSample: false },
    ],
  },

  // ===================================================================
  // 32. Median of Two Sorted Arrays
  // ===================================================================
  {
    title: 'Median of Two Sorted Arrays',
    difficulty: Difficulty.HARD,
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.

The overall run time complexity should be **O(log (m+n))**.

Print the median formatted with **one decimal place** (e.g., \`2.0\` or \`2.5\`).

**Input Format:**
- Line 1: Integer \`m\` (size of nums1)
- Line 2: \`m\` space-separated integers
- Line 3: Integer \`n\` (size of nums2)
- Line 4: \`n\` space-separated integers`,
    constraints: `- nums1.length == m
- nums2.length == n
- 0 <= m <= 1000
- 0 <= n <= 1000
- 1 <= m + n <= 2000
- -10^6 <= nums1[i], nums2[i] <= 10^6`,
    examples: `**Example 1:**
Input:
2
1 3
1
2

Output:
2.0
(Merged array = [1, 2, 3] and median is 2.0)

**Example 2:**
Input:
2
1 2
2
3 4

Output:
2.5
(Merged array = [1, 2, 3, 4] and median is (2 + 3) / 2 = 2.5)`,
    testCases: [
      { input: '2\n1 3\n1\n2', expectedOutput: '2.0', isSample: true },
      { input: '2\n1 2\n2\n3 4', expectedOutput: '2.5', isSample: true },
      { input: '1\n0\n1\n0', expectedOutput: '0.0', isSample: false },
      { input: '3\n1 2 3\n2\n4 5', expectedOutput: '3.0', isSample: false },
      { input: '2\n1 4\n2\n2 3', expectedOutput: '2.5', isSample: false },
    ],
  },

  // ===================================================================
  // 33. Kth Largest Element in an Array
  // ===================================================================
  {
    title: 'Kth Largest Element in an Array',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\`-th largest element in the array.

Note that it is the \`k\`-th largest element in sorted order, not the \`k\`-th distinct element.
Can you solve it in **O(n)** time complexity?

**Input Format:**
- Line 1: Integer \`n\` (size of array)
- Line 2: \`n\` space-separated integers
- Line 3: Integer \`k\``,
    constraints: `- 1 <= k <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    examples: `**Example 1:**
Input:
6
3 2 1 5 6 4
2

Output:
5

**Example 2:**
Input:
9
3 2 3 1 2 4 5 5 6
4

Output:
4`,
    testCases: [
      { input: '6\n3 2 1 5 6 4\n2', expectedOutput: '5', isSample: true },
      { input: '9\n3 2 3 1 2 4 5 5 6\n4', expectedOutput: '4', isSample: true },
      { input: '1\n1\n1', expectedOutput: '1', isSample: false },
      { input: '5\n7 10 4 3 20\n3', expectedOutput: '7', isSample: false },
      { input: '4\n-1 -2 -3 -4\n2', expectedOutput: '-2', isSample: false },
    ],
  },

  // ===================================================================
  // 34. Combination Sum
  // ===================================================================
  {
    title: 'Combination Sum',
    difficulty: Difficulty.MEDIUM,
    description: `Given an array of distinct integers \`candidates\` and a target integer \`target\`, return the **total number of unique combinations** of \`candidates\` where the chosen numbers sum to \`target\`.

You may return the combinations in any order. The same number may be chosen from \`candidates\` an unlimited number of times.

**Input Format:**
- Line 1: Integer \`n\` (number of candidates)
- Line 2: \`n\` space-separated integers
- Line 3: Integer \`target\``,
    constraints: `- 1 <= candidates.length <= 30
- 2 <= candidates[i] <= 40
- All elements of candidates are distinct.
- 1 <= target <= 40`,
    examples: `**Example 1:**
Input:
4
2 3 6 7
7

Output:
2
(Combinations: [2, 2, 3] and [7])

**Example 2:**
Input:
3
2 3 5
8

Output:
3
(Combinations: [2, 2, 2, 2], [2, 3, 3], and [3, 5])`,
    testCases: [
      { input: '4\n2 3 6 7\n7', expectedOutput: '2', isSample: true },
      { input: '3\n2 3 5\n8', expectedOutput: '3', isSample: true },
      { input: '1\n2\n1', expectedOutput: '0', isSample: false },
      { input: '2\n2 4\n6', expectedOutput: '2', isSample: false },
      { input: '3\n3 5 7\n12', expectedOutput: '2', isSample: false },
    ],
  },

  // ===================================================================
  // 35. Subsets
  // ===================================================================
  {
    title: 'Subsets',
    difficulty: Difficulty.MEDIUM,
    description: `Given an integer array \`nums\` of unique elements, return the **number of subsets** (the power set).

The solution set must not contain duplicate subsets.

**Input Format:**
- Line 1: Integer \`n\` (size of array)
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= nums.length <= 10
- -10 <= nums[i] <= 10
- All the numbers of nums are unique.`,
    examples: `**Example 1:**
Input:
3
1 2 3

Output:
8

**Example 2:**
Input:
1
0

Output:
2`,
    testCases: [
      { input: '3\n1 2 3', expectedOutput: '8', isSample: true },
      { input: '1\n0', expectedOutput: '2', isSample: true },
      { input: '4\n1 2 3 4', expectedOutput: '16', isSample: false },
      { input: '2\n-1 1', expectedOutput: '4', isSample: false },
    ],
  },

  // ===================================================================
  // 36. Daily Temperatures
  // ===================================================================
  {
    title: 'Daily Temperatures',
    difficulty: Difficulty.MEDIUM,
    description: `Given an array of integers \`temperatures\` represents the daily temperatures, return an array \`answer\` such that \`answer[i]\` is the number of days you have to wait after the \`i\`-th day to get a warmer temperature. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.

Print the elements of \`answer\` separated by a space.

**Input Format:**
- Line 1: Integer \`n\` (number of days)
- Line 2: \`n\` space-separated integers`,
    constraints: `- 1 <= temperatures.length <= 10^5
- 30 <= temperatures[i] <= 100`,
    examples: `**Example 1:**
Input:
8
73 74 75 71 69 72 76 73

Output:
1 1 4 2 1 1 0 0

**Example 2:**
Input:
4
30 40 50 60

Output:
1 1 1 0`,
    testCases: [
      { input: '8\n73 74 75 71 69 72 76 73', expectedOutput: '1 1 4 2 1 1 0 0', isSample: true },
      { input: '4\n30 40 50 60', expectedOutput: '1 1 1 0', isSample: true },
      { input: '3\n30 60 90', expectedOutput: '1 1 0', isSample: false },
      { input: '5\n89 62 70 58 47', expectedOutput: '0 1 0 0 0', isSample: false },
    ],
  },

  // ===================================================================
  // 37. Course Schedule
  // ===================================================================
  {
    title: 'Course Schedule',
    difficulty: Difficulty.MEDIUM,
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

Return \`true\` if you can finish all courses, or \`false\` otherwise.

**Input Format:**
- Line 1: Integer \`numCourses\`
- Line 2: Integer \`p\` (number of prerequisite pairs)
- Next \`p\` lines: Two integers \`a\` and \`b\` per line`,
    constraints: `- 1 <= numCourses <= 2000
- 0 <= prerequisites.length <= 5000
- All prerequisite pairs are unique.`,
    examples: `**Example 1:**
Input:
2
1
1 0

Output:
true

**Example 2:**
Input:
2
2
1 0
0 1

Output:
false`,
    testCases: [
      { input: '2\n1\n1 0', expectedOutput: 'true', isSample: true },
      { input: '2\n2\n1 0\n0 1', expectedOutput: 'false', isSample: true },
      { input: '3\n2\n1 0\n2 1', expectedOutput: 'true', isSample: false },
      { input: '4\n4\n1 0\n2 1\n3 2\n1 3', expectedOutput: 'false', isSample: false },
    ],
  },

  // ===================================================================
  // 38. Rotting Oranges
  // ===================================================================
  {
    title: 'Rotting Oranges',
    difficulty: Difficulty.MEDIUM,
    description: `You are given an \`m x n\` grid where each cell can have one of three values:
- \`0\` representing an empty cell,
- \`1\` representing a fresh orange, or
- \`2\` representing a rotten orange.

Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.
Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return \`-1\`.

**Input Format:**
- Line 1: Two integers \`m\` and \`n\`
- Next \`m\` lines: \`n\` space-separated integers`,
    constraints: `- m == grid.length, n == grid[i].length
- 1 <= m, n <= 10
- grid[i][j] is 0, 1, or 2.`,
    examples: `**Example 1:**
Input:
3 3
2 1 1
1 1 0
0 1 1

Output:
4

**Example 2:**
Input:
3 3
2 1 1
0 1 1
1 0 1

Output:
-1`,
    testCases: [
      { input: '3 3\n2 1 1\n1 1 0\n0 1 1', expectedOutput: '4', isSample: true },
      { input: '3 3\n2 1 1\n0 1 1\n1 0 1', expectedOutput: '-1', isSample: true },
      { input: '1 2\n0 2', expectedOutput: '0', isSample: false },
      { input: '1 1\n1', expectedOutput: '-1', isSample: false },
    ],
  },

  // ===================================================================
  // 39. Unique Paths
  // ===================================================================
  {
    title: 'Unique Paths',
    difficulty: Difficulty.MEDIUM,
    description: `There is a robot on an \`m x n\` grid. The robot is initially located at the top-left corner (i.e., \`grid[0][0]\`). The robot tries to move to the bottom-right corner (i.e., \`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time.

Given the two integers \`m\` and \`n\`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.

**Input Format:**
- Line 1: Two integers \`m\` and \`n\``,
    constraints: `- 1 <= m, n <= 100`,
    examples: `**Example 1:**
Input:
3 7

Output:
28

**Example 2:**
Input:
3 2

Output:
3`,
    testCases: [
      { input: '3 7', expectedOutput: '28', isSample: true },
      { input: '3 2', expectedOutput: '3', isSample: true },
      { input: '1 1', expectedOutput: '1', isSample: false },
      { input: '7 3', expectedOutput: '28', isSample: false },
      { input: '10 10', expectedOutput: '48620', isSample: false },
    ],
  },

  // ===================================================================
  // 40. Longest Common Subsequence
  // ===================================================================
  {
    title: 'Longest Common Subsequence',
    difficulty: Difficulty.MEDIUM,
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return \`0\`.

A **subsequence** of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

**Input Format:**
- Line 1: String \`text1\`
- Line 2: String \`text2\``,
    constraints: `- 1 <= text1.length, text2.length <= 1000
- text1 and text2 consist of only lowercase English characters.`,
    examples: `**Example 1:**
Input:
abcde
ace

Output:
3
(The longest common subsequence is "ace" and its length is 3.)

**Example 2:**
Input:
abc
abc

Output:
3`,
    testCases: [
      { input: 'abcde\nace', expectedOutput: '3', isSample: true },
      { input: 'abc\nabc', expectedOutput: '3', isSample: true },
      { input: 'abc\ndef', expectedOutput: '0', isSample: false },
      { input: 'oxcp\nace', expectedOutput: '1', isSample: false },
      { input: 'bsbininm\njmjkbkjkv', expectedOutput: '1', isSample: false },
    ],
  },
];

