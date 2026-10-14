import { BlitzProblem } from "../schema";

export const twoPointersProblems: BlitzProblem[] = [
  {
    id: "two-sum-ii",
    title: "Two Sum II - Input Array Is Sorted",
    difficulty: "easy",
    category: "Two Pointers",
    constraints: ["2 <= numbers.length <= 3 * 10^4", "numbers is sorted non-decreasing", "Constant O(1) extra space"],
    prompt: "Given a 1-indexed array of integers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
    pattern: "Two Pointers (Opposite Ends)",
    patternDistractors: ["Sliding Window", "Monotonic Stack", "Binary Search Tree"],
    invariantPrompt: "When sum < target, which pointer movement maintains the search space invariant?",
    invariantOptions: [
      "Increment left pointer: numbers[left] is smallest, so sum increases monotonically",
      "Decrement right pointer: numbers[right] is largest, so sum increases monotonically",
      "Increment both pointers simultaneously",
      "Reset left to 0 and advance right"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 0, right = n - 1
while left < right:
  current_sum = nums[left] + nums[right]
  if current_sum == target: return [left + 1, right + 1]
  elif current_sum < target: left += 1
  else: right -= 1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Negative numbers", "Two largest numbers equal target", "Minimum array length of 2"],
    explanation: {
      verdict: "Two Pointers (Opposite Ends)",
      whyPattern: "Since the array is pre-sorted, comparing extreme elements gives monotonic sum transitions without extra hash table space.",
      distractorTakedown: "Sliding window requires contiguous subsegments; monotonic stack is for next-greater queries.",
      takeaway: "Whenever an array is sorted and you need pairwise sums with O(1) space, converge pointers from opposite ends."
    }
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "medium",
    category: "Two Pointers",
    constraints: ["2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    prompt: "Given n non-negative integers representing heights of vertical lines, find two lines that together with the x-axis forms a container that holds the most water.",
    pattern: "Two Pointers (Greedy Inward Shrink)",
    patternDistractors: ["Dynamic Programming", "Segment Tree", "Divide and Conquer"],
    invariantPrompt: "Why does advancing the pointer with the smaller height preserve the optimal solution?",
    invariantOptions: [
      "The width always shrinks by 1, so only a taller boundary can yield a larger area",
      "The taller pointer is guaranteed to never be part of any future valid container",
      "Water area is determined by the maximum height rather than minimum height",
      "Both heights must be equal to form a rectangular boundary"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 0, right = n - 1, max_area = 0
while left < right:
  h = min(height[left], height[right])
  max_area = max(max_area, h * (right - left))
  if height[left] < height[right]: left += 1
  else: right -= 1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["All heights equal", "Strictly descending heights", "Zero heights"],
    explanation: {
      verdict: "Two Pointers (Greedy Inward Shrink)",
      whyPattern: "Area is bound by min(height) * width. Moving the taller line strictly decreases width while cannot increase the bottleneck.",
      distractorTakedown: "DP would require O(n^2) state transitions without optimal substructure benefit.",
      takeaway: "Eliminate entire search quadrants by moving whichever boundary bottlenecks the objective function."
    }
  },
  {
    id: "3sum",
    title: "3Sum",
    difficulty: "medium",
    category: "Two Pointers",
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    prompt: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0 with no duplicate triplets.",
    pattern: "Sort + Two Pointers Convergence",
    patternDistractors: ["3D Dynamic Programming", "Union-Find", "Bitmask Brute Force"],
    invariantPrompt: "How are duplicate triplets avoided in O(1) additional memory?",
    invariantOptions: [
      "Skip identical values for nums[i] and advance left/right pointers past duplicates after finding a match",
      "Insert all results into a HashSet of strings",
      "Sort each triplet individually before appending",
      "Only test positive integers"
    ],
    correctInvariantIndex: 0,
    pseudocode: `sort(nums)
for i in 0..n-3:
  if i > 0 and nums[i] == nums[i-1]: continue
  left = i + 1, right = n - 1
  while left < right:
    # converge two pointers on target -nums[i]`,
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(1) extra space",
    edgeCases: ["All zeros [0,0,0,0]", "Multiple duplicates [-2,0,1,1,2]", "No triplets summing to 0"],
    explanation: {
      verdict: "Sort + Two Pointers",
      whyPattern: "Sorting takes O(n log n) and enables standard Two Sum II in O(n) per fixed element, while skipping adjacent duplicates.",
      distractorTakedown: "Hashing requires memory-heavy set deduping; DP does not apply to subset sum with exact size 3.",
      takeaway: "Sorting upfront turns k-sum into (k-1) loops with two pointers inside."
    }
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    category: "Two Pointers",
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    prompt: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    pattern: "Two Pointers (Left/Right Max Tracking)",
    patternDistractors: ["Floyd-Warshall", "Trie Traversal", "Topological Sort"],
    invariantPrompt: "When left_max < right_max, why can we safely compute trapped water at the left index alone?",
    invariantOptions: [
      "The water level at left is guaranteed to be bounded by left_max, regardless of intermediate bars",
      "The right boundary is completely ignored in the total calculation",
      "Left bars always trap more water than right bars",
      "The terrain must be symmetric around the median"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 0, right = n - 1, l_max = 0, r_max = 0, total = 0
while left <= right:
  if height[left] <= height[right]:
    l_max = max(l_max, height[left]); total += l_max - height[left]; left += 1
  else:
    r_max = max(r_max, height[right]); total += r_max - height[right]; right -= 1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Strictly ascending elevation", "Single bar", "V-shaped valley with wide bottom"],
    explanation: {
      verdict: "Two Pointers (Left/Right Max)",
      whyPattern: "Water trapped at i is min(max_left, max_right) - height[i]. By tracking whichever side is smaller, the bottleneck is known.",
      distractorTakedown: "Prefix arrays achieve O(n) time but require O(n) auxiliary memory.",
      takeaway: "When min(L, R) is the bottleneck, advance the smaller of the two running maximums."
    }
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "easy",
    category: "Two Pointers",
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters"],
    prompt: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    pattern: "Two Pointers (Collision Check)",
    patternDistractors: ["KMP String Matching", "Rabin-Karp", "Suffix Automaton"],
    invariantPrompt: "What is the optimal space-efficient way to validate alphanumeric characters?",
    invariantOptions: [
      "Advance left/right pointers while skipping non-alphanumeric characters in-place without allocating a filtered string",
      "Regex replace all characters and reverse the string in memory",
      "Push every character to a stack and pop for comparison",
      "Compute rolling polynomial hashes"
    ],
    correctInvariantIndex: 0,
    pseudocode: `l = 0, r = len(s) - 1
while l < r:
  while l < r and not isalnum(s[l]): l += 1
  while l < r and not isalnum(s[r]): r -= 1
  if tolower(s[l]) != tolower(s[r]): return false
  l += 1; r -= 1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Empty string or whitespace only", "Single character", "Punctuation only: '.,'"],
    explanation: {
      verdict: "Two Pointers (Collision Check)",
      whyPattern: "Two pointers inward scan compares symmetric characters in-place with zero string copies.",
      distractorTakedown: "Creating a sanitized copy of length 200k wastes O(n) memory.",
      takeaway: "Pointer skipping in-place preserves O(1) space overhead for string filtering."
    }
  },
  {
    id: "move-zeroes",
    title: "Move Zeroes",
    difficulty: "easy",
    category: "Two Pointers",
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    prompt: "Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements in-place.",
    pattern: "Two Pointers (Fast/Slow Partition)",
    patternDistractors: ["Merge Sort", "Quick Select", "Count Sort"],
    invariantPrompt: "What invariant does the slow pointer maintain at every iteration?",
    invariantOptions: [
      "All indices before slow contain processed non-zero elements in their original relative order",
      "All indices before slow are strictly equal to zero",
      "The slow pointer points to the maximum element seen so far",
      "The slow pointer alternates between even and odd indices"
    ],
    correctInvariantIndex: 0,
    pseudocode: `slow = 0
for fast in 0..len(nums)-1:
  if nums[fast] != 0:
    nums[slow], nums[fast] = nums[fast], nums[slow]
    slow += 1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["All zeroes [0,0,0]", "No zeroes [1,2,3]", "Zeroes already at the end"],
    explanation: {
      verdict: "Fast/Slow Pointer Partition",
      whyPattern: "Fast pointer scans every item; slow pointer marks the insertion boundary for non-zero elements.",
      distractorTakedown: "Sorting disrupts original relative ordering.",
      takeaway: "In-place partitioning uses a slow boundary pointer and a fast discovery pointer."
    }
  }
];
