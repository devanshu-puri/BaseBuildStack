import { BlitzProblem } from "../schema";

export const binarySearchProblems: BlitzProblem[] = [
  {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "medium",
    category: "Binary Search",
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i] <= 10^4", "All values are unique", "O(log n) runtime"],
    prompt: "Given integer array nums sorted in ascending order (with distinct values) and possibly rotated at an unknown pivot, find the index of target in O(log n) time.",
    pattern: "Modified Binary Search (Sorted Half Identification)",
    patternDistractors: ["Two Pointers", "Linear Scan", "Quickselect"],
    invariantPrompt: "At any midpoint mid in a rotated sorted array, what invariant is guaranteed?",
    invariantOptions: [
      "At least one half ([left..mid] or [mid..right]) is guaranteed to be strictly sorted",
      "Both halves are always sorted",
      "The pivot index is always the midpoint",
      "The target is always in the left half"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 0, right = n - 1
while left <= right:
  mid = (left + right) // 2
  if nums[mid] == target: return mid
  if nums[left] <= nums[mid]: # left half sorted
    if nums[left] <= target < nums[mid]: right = mid - 1
    else: left = mid + 1
  else: # right half sorted
    if nums[mid] < target <= nums[right]: left = mid + 1
    else: right = mid - 1`,
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Array not rotated at all", "Array of length 1", "Target is first or last element"],
    explanation: {
      verdict: "Modified Binary Search",
      whyPattern: "One half of the array is always normally sorted. We can check if target lies within that sorted half in O(1) and discard the other half.",
      distractorTakedown: "Linear scan violates the O(log n) constraint.",
      takeaway: "In rotated arrays, check which half is strictly sorted (`nums[left] <= nums[mid]`) before checking target range."
    }
  },
  {
    id: "find-minimum-in-rotated-sorted-array",
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "medium",
    category: "Binary Search",
    constraints: ["n == nums.length", "1 <= n <= 5000", "All integers are unique", "O(log n) runtime"],
    prompt: "Given the sorted rotated array nums of unique elements, return the minimum element of this array in O(log n) time.",
    pattern: "Binary Search (Pivot Comparison against Right)",
    patternDistractors: ["Kadane's Algorithm", "Monotonic Deque", "Heap Search"],
    invariantPrompt: "Why compare nums[mid] against nums[right] rather than nums[left]?",
    invariantOptions: [
      "If nums[mid] > nums[right], the inflection pivot lies strictly to the right (left = mid + 1)",
      "nums[left] is always the smallest element",
      "nums[right] is always greater than all elements in nums",
      "Comparing with left causes infinite loops on sorted arrays"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 0, right = n - 1
while left < right:
  mid = (left + right) // 2
  if nums[mid] > nums[right]:
    left = mid + 1
  else:
    right = mid
return nums[left]`,
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Not rotated: [1, 2, 3, 4, 5]", "Rotated once: [5, 1, 2, 3, 4]", "Length 1 or 2 array"],
    explanation: {
      verdict: "Binary Search vs Right Boundary",
      whyPattern: "Because right boundary is the end of the second sorted segment. If mid is greater than right, mid belongs to the first (higher) segment, so pivot is right of mid.",
      distractorTakedown: "Comparing with left fails on unrotated arrays.",
      takeaway: "When searching for inflection point in rotated array, always compare `nums[mid]` against `nums[right]`."
    }
  },
  {
    id: "koko-eating-bananas",
    title: "Koko Eating Bananas",
    difficulty: "medium",
    category: "Binary Search",
    constraints: ["1 <= piles.length <= 10^4", "piles.length <= h <= 10^9", "1 <= piles[i] <= 10^9"],
    prompt: "Koko can eat bananas at speed k/hour. In each hour, she chooses a pile and eats k bananas. Return the minimum integer k such that she can eat all bananas within h hours.",
    pattern: "Binary Search on Answer Space (Monotonic Feasibility)",
    patternDistractors: ["Greedy Bin Packing", "Dynamic Programming", "Dijkstra's Algorithm"],
    invariantPrompt: "What property allows binary searching the eating speed k from 1 to max(piles)?",
    invariantOptions: [
      "Hours needed is monotonically non-increasing as eating speed k increases",
      "The piles array is sorted ascending",
      "Koko must eat exactly 1 pile per hour",
      "h is always a power of 2"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 1, right = max(piles)
while left < right:
  mid = (left + right) // 2
  hours = sum(ceil(p / mid) for p in piles)
  if hours <= h: right = mid # feasible: try slower
  else: left = mid + 1 # too slow: must eat faster
return left`,
    timeComplexity: "O(n log(max(piles)))",
    spaceComplexity: "O(1)",
    edgeCases: ["h == piles.length (k must be max(piles))", "h >> sum(piles) (k can be 1)", "Very large numbers 10^9"],
    explanation: {
      verdict: "Binary Search on Answer Space",
      whyPattern: "The feasibility function `canFinish(k)` is monotonic (False, False, ..., True, True). Binary search finds the boundary in logarithmic steps.",
      distractorTakedown: "Greedy choice of k fails because hours function is non-linear.",
      takeaway: "Whenever an optimization problem asks for min/max satisfying a monotonic condition, binary search the answer range."
    }
  },
  {
    id: "capacity-to-ship-packages",
    title: "Capacity To Ship Packages Within D Days",
    difficulty: "medium",
    category: "Binary Search",
    constraints: ["1 <= days <= weights.length <= 5 * 10^4", "1 <= weights[i] <= 500"],
    prompt: "A conveyor belt has packages that must be shipped within days days. Packages must be shipped in order. Return the least weight capacity of the ship that will result in all packages being shipped within days days.",
    pattern: "Binary Search on Monotonic Capacity",
    patternDistractors: ["Knapsack DP", "Interval Scheduling", "Min Heap"],
    invariantPrompt: "What are the exact search boundaries for ship capacity?",
    invariantOptions: [
      "Lower bound = max(weights); Upper bound = sum(weights)",
      "Lower bound = 1; Upper bound = weights.length",
      "Lower bound = min(weights); Upper bound = max(weights) * days",
      "Lower bound = average(weights); Upper bound = sum(weights) / days"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = max(weights), right = sum(weights)
while left < right:
  mid = (left + right) // 2
  days_needed = count_days(weights, capacity=mid)
  if days_needed <= days: right = mid
  else: left = mid + 1
return left`,
    timeComplexity: "O(n log(sum(weights)))",
    spaceComplexity: "O(1)",
    edgeCases: ["days == 1 (capacity must equal sum)", "days == weights.length (capacity equals max(weights))", "Single package"],
    explanation: {
      verdict: "Binary Search on Monotonic Capacity",
      whyPattern: "Minimum possible capacity is the heaviest single package max(weights); maximum is shipping all in 1 day sum(weights). Feasibility is monotonic.",
      distractorTakedown: "Knapsack DP would reorder packages; packages must ship in strict sequential order.",
      takeaway: "Bounds for binary search on answer are determined by the most extreme single item (lower) and total volume (upper)."
    }
  },
  {
    id: "time-based-key-value-store",
    title: "Time Based Key-Value Store",
    difficulty: "medium",
    category: "Binary Search",
    constraints: ["1 <= key.length, value.length <= 100", "1 <= timestamp <= 10^7", "Strictly increasing timestamps in set() calls"],
    prompt: "Design a time-based key-value data structure that can store multiple values for the same key at different timestamps and retrieve the key's value at a certain timestamp (or latest timestamp <= query).",
    pattern: "Hash Map of Arrays + Binary Search (Upper Bound)",
    patternDistractors: ["B-Tree", "Segment Tree", "LRU Cache"],
    invariantPrompt: "Since timestamps are appended in strictly increasing order, how is get(key, timestamp) queried in O(log n)?",
    invariantOptions: [
      "Binary search the key's timestamp list for the rightmost timestamp <= query timestamp",
      "Linear scan backward from the latest timestamp",
      "Hash lookup with floored timestamp modulus",
      "Rebalance an AVL tree per key"
    ],
    correctInvariantIndex: 0,
    pseudocode: `def set(key, value, timestamp):
  store[key].append((timestamp, value))

def get(key, timestamp):
  arr = store.get(key, [])
  left, right, ans = 0, len(arr) - 1, ""
  while left <= right:
    mid = (left + right) // 2
    if arr[mid].timestamp <= timestamp:
      ans = arr[mid].value; left = mid + 1
    else: right = mid - 1
  return ans`,
    timeComplexity: "set: O(1), get: O(log n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Query timestamp smaller than all recorded timestamps (return empty string)", "Exact timestamp match", "Multiple queries on same key"],
    explanation: {
      verdict: "Hash Map + Binary Search",
      whyPattern: "Map key -> list of (timestamp, value). Because inputs arrive sorted by timestamp, binary search directly yields O(log n) time without complex trees.",
      distractorTakedown: "Linear scan degrades to O(n) per query on popular keys.",
      takeaway: "Appending to a list keeps timestamps sorted automatically for binary search."
    }
  },
  {
    id: "middle-of-linked-list",
    title: "Middle of the Linked List",
    difficulty: "easy",
    category: "Fast & Slow Pointers",
    constraints: ["The number of nodes in the list is in the range [1, 100]", "1 <= Node.val <= 100"],
    prompt: "Given the head of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.",
    pattern: "Two Pointers (Fast 2x, Slow 1x)",
    patternDistractors: ["Two Pointers from Ends", "Recursive Unwind", "Reversal Count"],
    invariantPrompt: "When fast pointer reaches null or fast.next is null, what is the position of slow pointer?",
    invariantOptions: [
      "Slow has traveled exactly half the distance, landing directly on the middle node",
      "Slow is at head + 1",
      "Slow is at the tail node",
      "Slow must be decremented by 1"
    ],
    correctInvariantIndex: 0,
    pseudocode: `slow = head, fast = head
while fast and fast.next:
  slow = slow.next
  fast = fast.next.next
return slow`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Odd length list (single middle)", "Even length list (second middle returned)", "Single node"],
    explanation: {
      verdict: "Fast and Slow Pointers (1x/2x)",
      whyPattern: "Since fast advances twice as fast as slow, when fast reaches the end, slow is exactly at index n // 2.",
      distractorTakedown: "Single linked list cannot traverse backward from ends.",
      takeaway: "Ratio speeds (1x vs 2x) find fractional positions in linked data structures in a single pass."
    }
  }
];
