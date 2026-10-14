import { BugAuditProblem } from "./bug-audit-schema";

export const BUG_AUDIT_PROBLEMS: BugAuditProblem[] = [
  // 1. Binary Search — Infinite loop when left = mid without + 1
  {
    id: "bug_bin_search_1",
    title: "Binary Search: Left Pointer Infinite Loop",
    category: "Binary Search",
    difficulty: "easy",
    language: "javascript",
    code: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid; // Buggy: does not advance pointer, causes infinite loop when left === mid
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
    entryFunctionName: "search",
    buggyLineNumber: 10,
    bugType: "Infinite Loop / Stale Pointer",
    breakingInputPrompt: "Which target value causes the binary search to hang or loop indefinitely?",
    breakingInputOptions: [
      "nums = [1, 3], target = 3",
      "nums = [1, 3, 5], target = 1",
      "nums = [2, 4, 6], target = 0",
      "nums = [5], target = 5",
    ],
    correctBreakingInputIndex: 0,
    canonicalFix: "left = mid + 1;",
    canonicalCode: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
    testCases: [
      {
        description: "Target present on right side",
        input: [[1, 3], 3],
        expected: 1,
      },
      {
        description: "Target present at first index",
        input: [[1, 3, 5], 1],
        expected: 0,
      },
      {
        description: "Target absent",
        input: [[2, 4, 6], 0],
        expected: -1,
      },
    ],
    explanation: {
      verdict: "Line 10 fails to increment `left` to `mid + 1`, causing an infinite loop when `left + 1 === right` and `nums[mid] < target`.",
      why: "When `nums = [1, 3]` and `target = 3`, `mid = Math.floor(0 + 1) / 2 = 0`. Because `nums[0] < 3`, `left = mid = 0`. On the next iteration `left` is still 0 and `mid` is still 0, looping infinitely.",
      distractorTakedown: "Option B and D hit the target immediately without entering the branch. Option C branches to `right = mid - 1` and terminates promptly.",
      takeaway: "In standard binary search, always discard the evaluated midpoint: `left = mid + 1` and `right = mid - 1`.",
      fix: "Replace `left = mid;` with `left = mid + 1;`.",
    },
  },

  // 2. Sliding Window — Minimum Window Substring / Shrink Condition Inverted
  {
    id: "bug_sliding_window_1",
    title: "Longest Substring Without Repeating Characters: Set Removal",
    category: "Sliding Window",
    difficulty: "medium",
    language: "javascript",
    code: `function lengthOfLongestSubstring(s) {
  let left = 0;
  let maxLen = 0;
  const seen = new Set();

  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      seen.delete(s[right]); // Buggy: deletes the new char instead of s[left], leaving old duplicates
      left++;
    }
    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}`,
    entryFunctionName: "lengthOfLongestSubstring",
    buggyLineNumber: 8,
    bugType: "Window Invariant Violation",
    breakingInputPrompt: "Which string produces an incorrect maximum substring length due to deleting `s[right]` instead of `s[left]`?",
    breakingInputOptions: [
      `s = "abcabcbb"`,
      `s = "bbbbb"`,
      `s = "pwwkew"`,
      `s = "a"`,
    ],
    correctBreakingInputIndex: 0,
    canonicalFix: "seen.delete(s[left]);",
    canonicalCode: `function lengthOfLongestSubstring(s) {
  let left = 0;
  let maxLen = 0;
  const seen = new Set();

  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }
    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}`,
    testCases: [
      {
        description: "Classic alternating duplicate characters",
        input: ["abcabcbb"],
        expected: 3,
      },
      {
        description: "All repeating characters",
        input: ["bbbbb"],
        expected: 1,
      },
      {
        description: "Single character",
        input: ["a"],
        expected: 1,
      },
    ],
    explanation: {
      verdict: "Line 8 deletes `s[right]` instead of `s[left]`, corrupting the window contents and failing to evict the previous occurrence.",
      why: "When shrinking the sliding window, characters must be evicted in FIFO order from the left edge (`s[left]`). Deleting `s[right]` leaves the older instance of the character in the set while incrementing `left`.",
      distractorTakedown: "For single-char string `s = 'a'`, the duplicate branch never executes. For `bbbbb`, every char is identical, masking the eviction index bug.",
      takeaway: "The sliding window contract requires removing from `left` when advancing `left`: `seen.delete(s[left])`.",
      fix: "Change `seen.delete(s[right])` to `seen.delete(s[left])`.",
    },
  },

  // 3. Two Pointers — Two Sum II Pointer Movement Inversion
  {
    id: "bug_two_pointers_1",
    title: "Two Sum II Sorted: Inverted Sum Comparison",
    category: "Two Pointers",
    difficulty: "easy",
    language: "javascript",
    code: `function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    } else if (sum > target) {
      left++; // Buggy: incrementing left increases the sum further when already exceeding target!
    } else {
      right--;
    }
  }

  return [];
}`,
    entryFunctionName: "twoSumSorted",
    buggyLineNumber: 10,
    bugType: "Inverted Pointer Direction",
    breakingInputPrompt: "Which input causes the search to diverge away from the solution because `left++` is called when `sum > target`?",
    breakingInputOptions: [
      "numbers = [2, 7, 11, 15], target = 9",
      "numbers = [1, 2, 3, 9], target = 5",
      "numbers = [2, 3, 4], target = 6",
      "numbers = [3, 3], target = 6",
    ],
    correctBreakingInputIndex: 1,
    canonicalFix: "right--;",
    canonicalCode: `function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    } else if (sum > target) {
      right--;
    } else {
      left++;
    }
  }

  return [];
}`,
    testCases: [
      {
        description: "Initial sum exceeds target (1 + 9 = 10 > 5)",
        input: [[1, 2, 3, 9], 5],
        expected: [2, 3],
      },
      {
        description: "Sum matches target on first step",
        input: [[2, 7, 11, 15], 9],
        expected: [1, 2],
      },
      {
        description: "Pair at ends",
        input: [[3, 3], 6],
        expected: [1, 2],
      },
    ],
    explanation: {
      verdict: "Line 10 increments `left` when `sum > target`, increasing the sum even more instead of decreasing it with `right--`.",
      why: "Because the array is sorted in ascending order, if the current pair sum is too large (`sum > target`), the only way to decrease the sum is to decrement `right`. Incrementing `left` drives the sum higher and skips valid candidates.",
      distractorTakedown: "For `numbers = [2, 7, 11, 15], target = 9`, the initial sum `2 + 15 = 17` hits the bug, but option B highlights the exact intermediate pair `[2, 3]` that gets completely skipped.",
      takeaway: "In sorted two pointers: `sum > target => right--`, `sum < target => left++`.",
      fix: "Change line 10 to `right--;` and line 12 to `left++;`.",
    },
  },

  // 4. Merge Intervals — Sorting by End Time instead of Start Time
  {
    id: "bug_intervals_1",
    title: "Merge Intervals: Inverted Sort Key",
    category: "Intervals",
    difficulty: "medium",
    language: "javascript",
    code: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // Buggy: sorting by end time (b[1] - a[1]) instead of start time (a[0] - b[0])
  intervals.sort((a, b) => a[1] - b[1]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = merged[merged.length - 1];

    if (current[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}`,
    entryFunctionName: "merge",
    buggyLineNumber: 5,
    bugType: "Incorrect Sort Invariant",
    breakingInputPrompt: "Which set of intervals fails to merge properly when sorted by end time instead of start time?",
    breakingInputOptions: [
      "intervals = [[2, 3], [4, 5], [6, 7]]",
      "intervals = [[1, 4], [0, 4]]",
      "intervals = [[1, 4], [2, 3]]",
      "intervals = [[1, 2]]",
    ],
    correctBreakingInputIndex: 1,
    canonicalFix: "intervals.sort((a, b) => a[0] - b[0]);",
    canonicalCode: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = merged[merged.length - 1];

    if (current[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}`,
    testCases: [
      {
        description: "Enclosing interval where earlier start has same end",
        input: [[[1, 4], [0, 4]]],
        expected: [[0, 4]],
      },
      {
        description: "Enclosed interval with smaller end time",
        input: [[[1, 4], [2, 3]]],
        expected: [[1, 4]],
      },
      {
        description: "Disjoint intervals",
        input: [[[2, 3], [4, 5], [6, 7]]],
        expected: [[2, 3], [4, 5], [6, 7]],
      },
    ],
    explanation: {
      verdict: "Line 5 sorts by interval finish time (`a[1] - b[1]`) instead of start time (`a[0] - b[0]`), breaking the sequential merge invariant.",
      why: "If `[1, 4]` and `[0, 4]` share the same end time, `[1, 4]` is processed first. The merged array records `[1, 4]`, but the true start is 0. Intervals must be ordered by start time so earlier beginnings always precede later ones.",
      distractorTakedown: "For disjoint intervals with strictly increasing bounds, both sort orders happen to coincide, hiding the flaw.",
      takeaway: "Interval merging relies on the invariant that start times are non-decreasing: `intervals.sort((a, b) => a[0] - b[0])`.",
      fix: "Sort by start time: `intervals.sort((a, b) => a[0] - b[0]);`.",
    },
  },

  // 5. Monotonic Stack — Daily Temperatures Comparator
  {
    id: "bug_mono_stack_1",
    title: "Daily Temperatures: Non-Strict Inequality",
    category: "Monotonic Stack",
    difficulty: "medium",
    language: "javascript",
    code: `function dailyTemperatures(temperatures) {
  const result = new Array(temperatures.length).fill(0);
  const stack = []; // indices of temperatures

  for (let i = 0; i < temperatures.length; i++) {
    // Buggy: <= pops equal temperatures, but problem asks for a WARMER day (>), not equal
    while (stack.length > 0 && temperatures[i] <= temperatures[stack[stack.length - 1]]) {
      const prevIdx = stack.pop();
      result[prevIdx] = i - prevIdx;
    }
    stack.push(i);
  }

  return result;
}`,
    entryFunctionName: "dailyTemperatures",
    buggyLineNumber: 7,
    bugType: "Inverted Stack Condition",
    breakingInputPrompt: "Which input produces incorrect wait days because the stack pops cooler/equal temperatures instead of waiting for a warmer day?",
    breakingInputOptions: [
      "temperatures = [73, 74, 75, 71, 69, 72, 76, 73]",
      "temperatures = [30, 40, 50, 60]",
      "temperatures = [30, 60, 90]",
      "temperatures = [50]",
    ],
    correctBreakingInputIndex: 0,
    canonicalFix: "while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {",
    canonicalCode: `function dailyTemperatures(temperatures) {
  const result = new Array(temperatures.length).fill(0);
  const stack = [];

  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIdx = stack.pop();
      result[prevIdx] = i - prevIdx;
    }
    stack.push(i);
  }

  return result;
}`,
    testCases: [
      {
        description: "Array with varying temperatures",
        input: [[73, 74, 75, 71, 69, 72, 76, 73]],
        expected: [1, 1, 4, 2, 1, 1, 0, 0],
      },
      {
        description: "Monotonically increasing temperatures",
        input: [[30, 40, 50, 60]],
        expected: [1, 1, 1, 0],
      },
      {
        description: "Single element array",
        input: [[50]],
        expected: [0],
      },
    ],
    explanation: {
      verdict: "Line 7 uses `<=` instead of `>`, popping entries when the current temperature is colder or equal rather than strictly warmer.",
      why: "A day on the stack only resolves its waiting period when a *strictly warmer* day is encountered (`temperatures[i] > temperatures[stack.top]`). With `<=`, a colder day mistakenly resolves a warmer prior day.",
      distractorTakedown: "For strictly increasing temperatures `[30, 40, 50, 60]`, every next day is strictly warmer, so the `<=` condition happens to never trigger on equal or colder days.",
      takeaway: "Next greater element problems require monotonic decreasing stacks popped strictly when `curr > top`.",
      fix: "Replace `<=` with `>` on line 7.",
    },
  },

  // 6. Tree BFS — Dynamic Queue Size Inside Loop
  {
    id: "bug_tree_bfs_1",
    title: "Binary Tree Level Order: Dynamic Loop Bound",
    category: "Trees",
    difficulty: "medium",
    language: "javascript",
    code: `function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const currentLevel = [];
    // Buggy: queue.length changes as child nodes are pushed inside the loop!
    for (let i = 0; i < queue.length; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }

  return result;
}`,
    entryFunctionName: "levelOrder",
    buggyLineNumber: 10,
    bugType: "Dynamic Loop Bound Mutation",
    breakingInputPrompt: "Which tree structure results in incorrect level groupings because `queue.length` is evaluated dynamically in the loop header?",
    breakingInputOptions: [
      "root = { val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } }",
      "root = { val: 1, left: null, right: null }",
      "root = null",
      "root = { val: 1, left: { val: 2, left: null, right: null }, right: null }",
    ],
    correctBreakingInputIndex: 0,
    canonicalFix: "const levelSize = queue.length; for (let i = 0; i < levelSize; i++) {",
    canonicalCode: `function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const currentLevel = [];
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }

  return result;
}`,
    testCases: [
      {
        description: "Two level tree with both children",
        input: [{ val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } }],
        expected: [[1], [2, 3]],
      },
      {
        description: "Single root node",
        input: [{ val: 1, left: null, right: null }],
        expected: [[1]],
      },
      {
        description: "Empty tree",
        input: [null],
        expected: [],
      },
    ],
    explanation: {
      verdict: "Line 10 evaluates `i < queue.length` on every iteration, but `queue.shift()` and `queue.push()` mutate the queue length mid-level.",
      why: "Because children are added to the back while the loop executes, `queue.length` continuously shifts. As a consequence, children from the next level get prematurely processed into the current level.",
      distractorTakedown: "For a single node (Option B), the loop runs once (`i = 0 < 1`), pushes no children, and terminates correctly.",
      takeaway: "In level-order BFS, always snapshot the current level's width before iterating: `const levelSize = queue.length;`.",
      fix: "Extract `const levelSize = queue.length;` and loop `i < levelSize`.",
    },
  },

  // 7. Dynamic Programming — 0/1 Knapsack Outer/Inner Direction
  {
    id: "bug_dp_knapsack_1",
    title: "Subset Sum: Unbounded Reuse from Forward Loop",
    category: "Dynamic Programming",
    difficulty: "medium",
    language: "javascript",
    code: `function canPartition(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;
  const target = sum / 2;

  const dp = new Array(target + 1).fill(false);
  dp[0] = true;

  for (const num of nums) {
    // Buggy: looping forward (num to target) allows using the same item multiple times!
    for (let j = num; j <= target; j++) {
      if (dp[j - num]) {
        dp[j] = true;
      }
    }
  }

  return dp[target];
}`,
    entryFunctionName: "canPartition",
    buggyLineNumber: 11,
    bugType: "Forward DP Overwrite / Unbounded Reuse",
    breakingInputPrompt: "Which array incorrectly returns `true` because the same number is reused multiple times like in unbounded knapsack?",
    breakingInputOptions: [
      "nums = [1, 2, 5]",
      "nums = [1, 5, 11, 5]",
      "nums = [1, 2, 3, 5]",
      "nums = [2, 2, 3, 5]",
    ],
    correctBreakingInputIndex: 0,
    canonicalFix: "for (let j = target; j >= num; j--) {",
    canonicalCode: `function canPartition(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;
  const target = sum / 2;

  const dp = new Array(target + 1).fill(false);
  dp[0] = true;

  for (const num of nums) {
    for (let j = target; j >= num; j--) {
      if (dp[j - num]) {
        dp[j] = true;
      }
    }
  }

  return dp[target];
}`,
    testCases: [
      {
        description: "Odd sum impossible",
        input: [[1, 2, 5]],
        expected: false,
      },
      {
        description: "Valid partition [1, 5, 5] and [11]",
        input: [[1, 5, 11, 5]],
        expected: true,
      },
      {
        description: "Invalid partition [1, 2, 3, 5] sum 11",
        input: [[1, 2, 3, 5]],
        expected: false,
      },
    ],
    explanation: {
      verdict: "Line 11 iterates forward `j = num; j <= target; j++`, causing a 1D DP table to reuse the current element as if it were an unbounded knapsack problem.",
      why: "When updating 1D DP for 0/1 Knapsack (each item can only be used once), looping forward means `dp[j]` looks at `dp[j - num]` which was already updated in the *same* iteration. Looping backwards (`target` down to `num`) preserves previous state.",
      distractorTakedown: "For `[1, 5, 11, 5]`, target is 11 and a valid partition exists regardless, so it masks the duplicate reuse bug.",
      takeaway: "In 0/1 knapsack with space-optimized 1D array, iterate capacity backwards: `for (let j = target; j >= num; j--)`.",
      fix: "Change line 11 to `for (let j = target; j >= num; j--)`.",
    },
  },

  // 8. Hash Table — Subarray Sum Equals K Missing Zero Frequency
  {
    id: "bug_hash_prefix_1",
    title: "Subarray Sum Equals K: Missing Prefix Zero",
    category: "Prefix Sum",
    difficulty: "medium",
    language: "javascript",
    code: `function subarraySum(nums, k) {
  let count = 0;
  let currentSum = 0;
  // Buggy: map should be initialized with { 0: 1 } to count subarrays starting at index 0
  const prefixMap = new Map();

  for (const num of nums) {
    currentSum += num;
    if (prefixMap.has(currentSum - k)) {
      count += prefixMap.get(currentSum - k);
    }
    prefixMap.set(currentSum, (prefixMap.get(currentSum) || 0) + 1);
  }

  return count;
}`,
    entryFunctionName: "subarraySum",
    buggyLineNumber: 5,
    bugType: "Missing Prefix Sum Base Case",
    breakingInputPrompt: "Which input produces an incorrect count of 0 because subarrays starting at the very beginning (index 0) are not counted?",
    breakingInputOptions: [
      "nums = [3], k = 3",
      "nums = [1, -1, 0], k = 0",
      "nums = [1, 2, 3], k = 7",
      "nums = [1, 2, 3], k = 5",
    ],
    correctBreakingInputIndex: 0,
    canonicalFix: "const prefixMap = new Map([[0, 1]]);",
    canonicalCode: `function subarraySum(nums, k) {
  let count = 0;
  let currentSum = 0;
  const prefixMap = new Map([[0, 1]]);

  for (const num of nums) {
    currentSum += num;
    if (prefixMap.has(currentSum - k)) {
      count += prefixMap.get(currentSum - k);
    }
    prefixMap.set(currentSum, (prefixMap.get(currentSum) || 0) + 1);
  }

  return count;
}`,
    testCases: [
      {
        description: "Single element matching k exactly from index 0",
        input: [[3], 3],
        expected: 1,
      },
      {
        description: "Zero sum subarrays",
        input: [[1, -1, 0], 0],
        expected: 3,
      },
      {
        description: "No subarray matches k",
        input: [[1, 2, 3], 7],
        expected: 0,
      },
    ],
    explanation: {
      verdict: "Line 5 initializes an empty map instead of `Map([[0, 1]])`, failing to detect subarrays whose prefix sum equals `k` directly from index 0.",
      why: "If `currentSum === k`, then `currentSum - k === 0`. Without the base case `(0 -> 1)` in the frequency map, the entire prefix from `0` to `i` is omitted from the count.",
      distractorTakedown: "For `nums = [1, 2, 3], k = 7`, no subarray equals 7 anyway, returning 0 coincidentally.",
      takeaway: "Always seed prefix sum hash tables with `0: 1` to capture subarrays beginning at index 0.",
      fix: "Initialize the map with `const prefixMap = new Map([[0, 1]]);`.",
    },
  },
];
