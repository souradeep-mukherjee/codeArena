export interface ProblemTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
}

export interface ProblemDefinition {
  id: string;
  leetCodeNumber: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sourceUrl: string;
  summary: string;
  inputFormat: string;
  outputFormat: string;
  testCases: ProblemTestCase[];
}

const problems: ProblemDefinition[] = [
  {
    id: 'two-sum',
    leetCodeNumber: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/two-sum/',
    summary: 'Find two distinct indices whose values add up to the target.',
    inputFormat: 'Line 1: n\\nLine 2: n space-separated integers\\nLine 3: target',
    outputFormat: 'Two 0-based indices separated by a space (or -1 -1 if none).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Basic Pair',
        input: `4\n2 7 11 15\n9`,
        expectedOutput: `0 1`,
      },
      {
        id: 'tc-2',
        name: 'Unsorted Pair',
        input: `3\n3 2 4\n6`,
        expectedOutput: `1 2`,
      },
    ],
  },
  {
    id: 'valid-parentheses',
    leetCodeNumber: 20,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/valid-parentheses/',
    summary: 'Check whether bracket pairs are balanced and properly nested.',
    inputFormat: 'Line 1: string containing only ()[]{} characters',
    outputFormat: 'Print true or false (lowercase).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Balanced',
        input: `()[]{}`,
        expectedOutput: `true`,
      },
      {
        id: 'tc-2',
        name: 'Mismatched',
        input: `(]`,
        expectedOutput: `false`,
      },
    ],
  },
  {
    id: 'longest-common-prefix',
    leetCodeNumber: 14,
    title: 'Longest Common Prefix',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/longest-common-prefix/',
    summary: 'Return the longest shared prefix among all strings.',
    inputFormat: 'Line 1: n\\nLine 2: n space-separated strings',
    outputFormat: 'Print prefix. If empty, print <empty>.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Common Prefix Exists',
        input: `3\nflower flow flight`,
        expectedOutput: `fl`,
      },
      {
        id: 'tc-2',
        name: 'No Common Prefix',
        input: `3\ndog racecar car`,
        expectedOutput: `<empty>`,
      },
    ],
  },
  {
    id: 'merge-sorted-array',
    leetCodeNumber: 88,
    title: 'Merge Sorted Array',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/merge-sorted-array/',
    summary: 'Merge two sorted arrays into one sorted output.',
    inputFormat: 'Line 1: m n\\nLine 2: m sorted integers\\nLine 3: n sorted integers',
    outputFormat: 'Merged sorted array as space-separated integers.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Typical Merge',
        input: `3 3\n1 2 3\n2 5 6`,
        expectedOutput: `1 2 2 3 5 6`,
      },
      {
        id: 'tc-2',
        name: 'Second Empty',
        input: `1 0\n1\n`,
        expectedOutput: `1`,
      },
    ],
  },
  {
    id: 'maximum-subarray',
    leetCodeNumber: 53,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/maximum-subarray/',
    summary: 'Find the contiguous subarray with the maximum sum.',
    inputFormat: 'Line 1: n\\nLine 2: n integers',
    outputFormat: 'Maximum subarray sum as an integer.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Mixed Numbers',
        input: `9\n-2 1 -3 4 -1 2 1 -5 4`,
        expectedOutput: `6`,
      },
      {
        id: 'tc-2',
        name: 'Single Negative',
        input: `1\n-1`,
        expectedOutput: `-1`,
      },
    ],
  },
  {
    id: 'climbing-stairs',
    leetCodeNumber: 70,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/climbing-stairs/',
    summary: 'Count ways to reach step n with jumps of 1 or 2.',
    inputFormat: 'Line 1: n',
    outputFormat: 'Number of distinct ways.',
    testCases: [
      {
        id: 'tc-1',
        name: 'n=2',
        input: `2`,
        expectedOutput: `2`,
      },
      {
        id: 'tc-2',
        name: 'n=5',
        input: `5`,
        expectedOutput: `8`,
      },
    ],
  },
  {
    id: 'best-time-to-buy-and-sell-stock',
    leetCodeNumber: 121,
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    summary: 'Maximize profit from one buy and one sell operation.',
    inputFormat: 'Line 1: n\\nLine 2: n stock prices',
    outputFormat: 'Maximum profit as integer.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Profit Available',
        input: `6\n7 1 5 3 6 4`,
        expectedOutput: `5`,
      },
      {
        id: 'tc-2',
        name: 'No Profit',
        input: `5\n7 6 4 3 1`,
        expectedOutput: `0`,
      },
    ],
  },
  {
    id: 'binary-search',
    leetCodeNumber: 704,
    title: 'Binary Search',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/binary-search/',
    summary: 'Find target index in sorted array using binary search.',
    inputFormat: 'Line 1: n\\nLine 2: sorted integers\\nLine 3: target',
    outputFormat: '0-based index or -1.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Found',
        input: `6\n-1 0 3 5 9 12\n9`,
        expectedOutput: `4`,
      },
      {
        id: 'tc-2',
        name: 'Not Found',
        input: `6\n-1 0 3 5 9 12\n2`,
        expectedOutput: `-1`,
      },
    ],
  },
  {
    id: 'valid-anagram',
    leetCodeNumber: 242,
    title: 'Valid Anagram',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/valid-anagram/',
    summary: 'Determine whether two strings are anagrams.',
    inputFormat: 'Line 1: s\\nLine 2: t',
    outputFormat: 'Print true or false (lowercase).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Anagram',
        input: `anagram\nnagaram`,
        expectedOutput: `true`,
      },
      {
        id: 'tc-2',
        name: 'Not Anagram',
        input: `rat\ncar`,
        expectedOutput: `false`,
      },
    ],
  },
  {
    id: 'contains-duplicate',
    leetCodeNumber: 217,
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/contains-duplicate/',
    summary: 'Check whether any value appears at least twice.',
    inputFormat: 'Line 1: n\\nLine 2: n integers',
    outputFormat: 'Print true or false (lowercase).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Has Duplicate',
        input: `4\n1 2 3 1`,
        expectedOutput: `true`,
      },
      {
        id: 'tc-2',
        name: 'All Unique',
        input: `4\n1 2 3 4`,
        expectedOutput: `false`,
      },
    ],
  },
  {
    id: 'product-of-array-except-self',
    leetCodeNumber: 238,
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
    summary: 'For each index, compute product of all other elements.',
    inputFormat: 'Line 1: n\\nLine 2: n integers',
    outputFormat: 'n integers (space-separated).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Simple Case',
        input: `4\n1 2 3 4`,
        expectedOutput: `24 12 8 6`,
      },
      {
        id: 'tc-2',
        name: 'Includes Zero',
        input: `5\n-1 1 0 -3 3`,
        expectedOutput: `0 0 9 0 0`,
      },
    ],
  },
  {
    id: 'top-k-frequent-elements',
    leetCodeNumber: 347,
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/top-k-frequent-elements/',
    summary: 'Return k most frequent numbers.',
    inputFormat: 'Line 1: n k\\nLine 2: n integers',
    outputFormat: 'k values in ascending order for deterministic output.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Classic Frequency',
        input: `6 2\n1 1 1 2 2 3`,
        expectedOutput: `1 2`,
      },
      {
        id: 'tc-2',
        name: 'Larger Set',
        input: `9 2\n4 4 4 6 6 7 7 7 8`,
        expectedOutput: `4 7`,
      },
    ],
  },
  {
    id: 'kth-largest-element-in-an-array',
    leetCodeNumber: 215,
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    summary: 'Find the kth largest element without fully sorting requirement constraints.',
    inputFormat: 'Line 1: n k\\nLine 2: n integers',
    outputFormat: 'Single integer.',
    testCases: [
      {
        id: 'tc-1',
        name: 'k=2',
        input: `6 2\n3 2 1 5 6 4`,
        expectedOutput: `5`,
      },
      {
        id: 'tc-2',
        name: 'k=4',
        input: `9 4\n3 2 3 1 2 4 5 5 6`,
        expectedOutput: `4`,
      },
    ],
  },
  {
    id: 'coin-change',
    leetCodeNumber: 322,
    title: 'Coin Change',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/coin-change/',
    summary: 'Compute minimum number of coins to make target amount.',
    inputFormat: 'Line 1: m\\nLine 2: m coin values\\nLine 3: amount',
    outputFormat: 'Minimum count or -1.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Reachable',
        input: `3\n1 2 5\n11`,
        expectedOutput: `3`,
      },
      {
        id: 'tc-2',
        name: 'Unreachable',
        input: `1\n2\n3`,
        expectedOutput: `-1`,
      },
    ],
  },
  {
    id: 'longest-increasing-subsequence',
    leetCodeNumber: 300,
    title: 'Longest Increasing Subsequence',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    summary: 'Return the length of the longest strictly increasing subsequence.',
    inputFormat: 'Line 1: n\\nLine 2: n integers',
    outputFormat: 'Single integer (length).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Typical LIS',
        input: `8\n10 9 2 5 3 7 101 18`,
        expectedOutput: `4`,
      },
      {
        id: 'tc-2',
        name: 'Multiple Paths',
        input: `6\n0 1 0 3 2 3`,
        expectedOutput: `4`,
      },
    ],
  },
  {
    id: 'number-of-islands',
    leetCodeNumber: 200,
    title: 'Number of Islands',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/number-of-islands/',
    summary: 'Count connected components of 1s in a binary grid.',
    inputFormat: 'Line 1: rows cols\\nNext rows lines: binary strings (0/1)',
    outputFormat: 'Single integer (island count).',
    testCases: [
      {
        id: 'tc-1',
        name: 'One Island',
        input: `4 5\n11110\n11010\n11000\n00000`,
        expectedOutput: `1`,
      },
      {
        id: 'tc-2',
        name: 'Three Islands',
        input: `4 5\n11000\n11000\n00100\n00011`,
        expectedOutput: `3`,
      },
    ],
  },
  {
    id: 'course-schedule',
    leetCodeNumber: 207,
    title: 'Course Schedule',
    difficulty: 'Medium',
    sourceUrl: 'https://leetcode.com/problems/course-schedule/',
    summary: 'Detect if all courses can be finished given prerequisite pairs.',
    inputFormat: 'Line 1: numCourses m\\nNext m lines: a b (a depends on b)',
    outputFormat: 'Print true or false (lowercase).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Acyclic',
        input: `2 1\n1 0`,
        expectedOutput: `true`,
      },
      {
        id: 'tc-2',
        name: 'Cycle',
        input: `2 2\n1 0\n0 1`,
        expectedOutput: `false`,
      },
    ],
  },
  {
    id: 'move-zeroes',
    leetCodeNumber: 283,
    title: 'Move Zeroes',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/move-zeroes/',
    summary: 'Move all zeros to the end while preserving non-zero order.',
    inputFormat: 'Line 1: n\\nLine 2: n integers',
    outputFormat: 'Updated array as space-separated integers.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Mixed Values',
        input: `5\n0 1 0 3 12`,
        expectedOutput: `1 3 12 0 0`,
      },
      {
        id: 'tc-2',
        name: 'Single Zero',
        input: `1\n0`,
        expectedOutput: `0`,
      },
    ],
  },
  {
    id: 'missing-number',
    leetCodeNumber: 268,
    title: 'Missing Number',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/missing-number/',
    summary: 'Find the missing value in range [0..n].',
    inputFormat: 'Line 1: n\\nLine 2: n integers in range [0..n] with one missing',
    outputFormat: 'Missing integer.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Missing Middle',
        input: `3\n3 0 1`,
        expectedOutput: `2`,
      },
      {
        id: 'tc-2',
        name: 'Missing Last',
        input: `2\n0 1`,
        expectedOutput: `2`,
      },
    ],
  },
  {
    id: 'single-number',
    leetCodeNumber: 136,
    title: 'Single Number',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/single-number/',
    summary: 'Every element appears twice except one; return the unique element.',
    inputFormat: 'Line 1: n\\nLine 2: n integers',
    outputFormat: 'Single integer.',
    testCases: [
      {
        id: 'tc-1',
        name: 'Small Set',
        input: `3\n2 2 1`,
        expectedOutput: `1`,
      },
      {
        id: 'tc-2',
        name: 'Larger Set',
        input: `5\n4 1 2 1 2`,
        expectedOutput: `4`,
      },
    ],
  },
  {
    id: 'palindrome-number',
    leetCodeNumber: 9,
    title: 'Palindrome Number',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/palindrome-number/',
    summary: 'Check whether an integer reads the same forward and backward.',
    inputFormat: 'Line 1: integer x',
    outputFormat: 'Print true or false (lowercase).',
    testCases: [
      {
        id: 'tc-1',
        name: 'Palindrome',
        input: `121`,
        expectedOutput: `true`,
      },
      {
        id: 'tc-2',
        name: 'Negative',
        input: `-121`,
        expectedOutput: `false`,
      },
    ],
  },
  {
    id: 'reverse-string',
    leetCodeNumber: 344,
    title: 'Reverse String',
    difficulty: 'Easy',
    sourceUrl: 'https://leetcode.com/problems/reverse-string/',
    summary: 'Reverse a string.',
    inputFormat: 'Line 1: input string',
    outputFormat: 'Reversed string.',
    testCases: [
      {
        id: 'tc-1',
        name: 'hello',
        input: `hello`,
        expectedOutput: `olleh`,
      },
      {
        id: 'tc-2',
        name: 'leetcode',
        input: `leetcode`,
        expectedOutput: `edocteel`,
      },
    ],
  },
];

export const getProblemBank = (): ProblemDefinition[] => problems;
