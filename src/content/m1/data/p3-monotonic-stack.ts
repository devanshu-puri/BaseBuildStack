import { BlitzProblem } from "../schema";

export const monotonicStackAndCycleProblems: BlitzProblem[] = [
  {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "medium",
    category: "Monotonic Stack",
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    prompt: "Given an array of integers temperatures represents daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.",
    pattern: "Monotonic Decreasing Stack (Indices)",
    patternDistractors: ["Priority Queue", "Sliding Window", "Binary Search"],
    invariantPrompt: "When popping an index prev from stack upon seeing hotter temp[i], what is the answer for prev?",
    invariantOptions: [
      "i - prev (current day index minus previous day index)",
      "temperatures[i] - temperatures[prev]",
      "stack.length",
      "prev + 1"
    ],
    correctInvariantIndex: 0,
    pseudocode: `res = [0] * n, stack = []
for i in 0..n-1:
  while stack and temp[i] > temp[stack.top]:
    prev = stack.pop()
    res[prev] = i - prev
  stack.push(i)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Monotonically decreasing temperatures [90, 80, 70]", "All temperatures identical", "Single temperature"],
    explanation: {
      verdict: "Monotonic Stack",
      whyPattern: "We need the 'next greater element' to the right for each day. Monotonic decreasing stack resolves pending elements as soon as a warmer day arrives.",
      distractorTakedown: "Priority queue adds O(log n) overhead per day.",
      takeaway: "Every element is pushed and popped at most once, guaranteeing strict O(n) amortized time."
    }
  },
  {
    id: "next-greater-element-i",
    title: "Next Greater Element I",
    difficulty: "easy",
    category: "Monotonic Stack",
    constraints: ["1 <= nums1.length <= nums2.length <= 1000", "All integers in nums1 and nums2 are unique"],
    prompt: "The next greater element of some element x in an array is the first greater element to its right. For each x in nums1, find its next greater element in nums2.",
    pattern: "Monotonic Stack + Hash Map",
    patternDistractors: ["Quick Sort", "Prefix Sums", "Two Pointers"],
    invariantPrompt: "How do we map elements in nums2 to their next greater element in linear time?",
    invariantOptions: [
      "Pop smaller elements from monotonic stack and record element -> current in a hash map",
      "Sort nums2 and perform binary search for each element in nums1",
      "Compute cumulative maximums from left to right",
      "Store indices in a circular queue"
    ],
    correctInvariantIndex: 0,
    pseudocode: `next_greater = {}, stack = []
for num in nums2:
  while stack and num > stack.top:
    next_greater[stack.pop()] = num
  stack.push(num)
return [next_greater.get(x, -1) for x in nums1]`,
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(n)",
    edgeCases: ["No greater element exists for any number", "nums1 equals nums2", "Already sorted ascending"],
    explanation: {
      verdict: "Monotonic Stack + Hash Map",
      whyPattern: "Monotonic stack scans nums2 in O(n) to compute the next greater element for every value and stores it in an O(1) lookup table.",
      distractorTakedown: "Brute force search is O(n * m); sorting destroys original relative ordering.",
      takeaway: "Use monotonic stack to build a value -> next_greater lookup map in one pass."
    }
  },
  {
    id: "largest-rectangle-in-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "hard",
    category: "Monotonic Stack",
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    prompt: "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    pattern: "Monotonic Increasing Stack",
    patternDistractors: ["Divide and Conquer", "Segment Tree", "Kadane's Algorithm"],
    invariantPrompt: "When bar at top of stack is popped by a shorter bar i, what determines its width boundary?",
    invariantOptions: [
      "Right boundary is i - 1; Left boundary is the index of new stack.top (width = i - stack.top - 1)",
      "Width is always fixed to 1",
      "Left boundary is 0 and right boundary is n - 1",
      "Width equals heights[i]"
    ],
    correctInvariantIndex: 0,
    pseudocode: `stack = [-1], max_area = 0
heights.append(0) # sentinel
for i in 0..len(heights)-1:
  while stack.top != -1 and heights[i] < heights[stack.top]:
    h = heights[stack.pop()]
    w = i - stack.top - 1
    max_area = max(max_area, h * w)
  stack.push(i)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["All bars equal height", "Ascending stair bars", "Zero height bars interspersed"],
    explanation: {
      verdict: "Monotonic Increasing Stack",
      whyPattern: "A bar's rectangle extends left and right until the first strictly shorter bar on either side. Monotonic stack finds both bounds in linear time.",
      distractorTakedown: "Segment trees solve range min query in O(n log n), which is slower than linear stack.",
      takeaway: "Appending a 0-height sentinel flushes the remaining bars cleanly at the end."
    }
  },
  {
    id: "online-stock-span",
    title: "Online Stock Span",
    difficulty: "medium",
    category: "Monotonic Stack",
    constraints: ["1 <= price <= 10^5", "At most 10^4 calls will be made to next"],
    prompt: "Design an algorithm that collects daily price quotes for some stock and returns the span of that stock's price for the current day (consecutive previous days where price was <= current).",
    pattern: "Monotonic Decreasing Stack (Price + Span Compression)",
    patternDistractors: ["Binary Indexed Tree", "Skip List", "Doubly Linked List"],
    invariantPrompt: "How can we avoid re-traversing all smaller consecutive days on each query?",
    invariantOptions: [
      "Store (price, span) pairs in stack; when popping a smaller price, accumulate its span into current span",
      "Re-scan previous array values until a larger price is hit",
      "Maintain a running average of stock prices",
      "Divide the days into sqrt-sized buckets"
    ],
    correctInvariantIndex: 0,
    pseudocode: `def next(price):
  span = 1
  while stack and stack.top.price <= price:
    span += stack.pop().span
  stack.push({price, span})
  return span`,
    timeComplexity: "O(1) amortized per call",
    spaceComplexity: "O(n)",
    edgeCases: ["Monotonically increasing stock prices", "Monotonically decreasing stock prices", "Alternating fluctuations"],
    explanation: {
      verdict: "Monotonic Stack with Span Compression",
      whyPattern: "Store collapsed spans in the stack node so smaller previous days are consumed in O(1) amortized time.",
      distractorTakedown: "Array re-scanning degrades to O(n) per call or O(n^2) overall.",
      takeaway: "Store accumulated weights/spans directly in stack elements to compress past history."
    }
  },
  {
    id: "asteroid-collision",
    title: "Asteroid Collision",
    difficulty: "medium",
    category: "Monotonic Stack",
    constraints: ["2 <= asteroids.length <= 10^4", "-1000 <= asteroids[i] <= 1000", "asteroids[i] != 0"],
    prompt: "We are given an array asteroids of integers representing asteroids in a row. Asteroids moving right are positive; moving left are negative. Find the state of the asteroids after all collisions.",
    pattern: "Simulation Stack (Collision Resolution)",
    patternDistractors: ["Merge Sort", "Two Pointers Collision", "Interval Tree"],
    invariantPrompt: "Under what exact condition do two asteroids collide?",
    invariantOptions: [
      "Only when stack.top > 0 (moving right) and incoming asteroid < 0 (moving left)",
      "Whenever two asteroids have different signs, regardless of direction",
      "Whenever an asteroid is larger than the previous one",
      "Only at the boundaries of the array"
    ],
    correctInvariantIndex: 0,
    pseudocode: `stack = []
for ast in asteroids:
  alive = true
  while alive and ast < 0 and stack and stack.top > 0:
    if stack.top < -ast: stack.pop(); continue
    elif stack.top == -ast: stack.pop()
    alive = false
  if alive: stack.push(ast)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Asteroids moving away [-2, -1, 1, 2]", "Equal size collision [5, -5]", "All negative or all positive"],
    explanation: {
      verdict: "Simulation Stack",
      whyPattern: "Asteroids moving left only collide with preceding asteroids that are moving right. Stack LIFO access resolves collisions in order.",
      distractorTakedown: "Two pointers cannot handle cascades where one giant asteroid destroys multiple stack elements.",
      takeaway: "Stack model handles domino-style collision cascades elegantly in linear time."
    }
  },
  {
    id: "linked-list-cycle-ii",
    title: "Linked List Cycle II",
    difficulty: "medium",
    category: "Fast & Slow Pointers",
    constraints: ["The number of the nodes in the list is in the range [0, 10^4]", "O(1) memory space"],
    prompt: "Given the head of a linked list, return the node where the cycle begins. If there is no cycle, return null. Do not modify the linked list.",
    pattern: "Floyd's Tortoise and Hare Cycle Detection",
    patternDistractors: ["Hash Set Node Visited", "DFS Graph Coloring", "Tarjan's SCC"],
    invariantPrompt: "After slow and fast meet in the cycle, where should two pointers start to find the cycle entrance?",
    invariantOptions: [
      "One pointer starts at head, one pointer starts at meeting point; advance both 1 step at a time until they collide",
      "Advance fast by 2 steps and slow by 1 step from meeting point",
      "Reverse the linked list from the meeting point",
      "Count the cycle length and subtract from head index"
    ],
    correctInvariantIndex: 0,
    pseudocode: `slow = head, fast = head
while fast and fast.next:
  slow = slow.next; fast = fast.next.next
  if slow == fast:
    # cycle detected: find entrance
    p1 = head, p2 = slow
    while p1 != p2: p1 = p1.next; p2 = p2.next
    return p1
return null`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["No cycle (linear list)", "Cycle begins at head (circular list)", "Single node self-loop"],
    explanation: {
      verdict: "Floyd's Tortoise and Hare",
      whyPattern: "Let distance to cycle be a, meeting point in cycle be b. Mathematical proof shows that distance from head to entrance equals distance from meeting point to entrance modulo cycle length.",
      distractorTakedown: "Hash set requires O(n) memory violating O(1) space constraint.",
      takeaway: "When fast (2x) meets slow (1x), reset one pointer to head and advance both at 1x to find the cycle entrance."
    }
  },
  {
    id: "happy-number",
    title: "Happy Number",
    difficulty: "easy",
    category: "Fast & Slow Pointers",
    constraints: ["1 <= n <= 2^31 - 1"],
    prompt: "Starting with any positive integer, replace the number by the sum of the squares of its digits. Repeat until the number equals 1 (happy), or it loops endlessly in a cycle which does not include 1.",
    pattern: "Cycle Detection (Implicit Graph)",
    patternDistractors: ["Greedy Search", "Prime Factorization", "Dynamic Programming"],
    invariantPrompt: "Why is cycle detection guaranteed to terminate for any 32-bit integer?",
    invariantOptions: [
      "The sum of squares of digits of any 32-bit integer is strictly bounded (max 9^2 * 10 = 810), guaranteeing a finite state space",
      "All integers eventually reach 1",
      "Even numbers always cycle to zero",
      "Prime numbers never cycle"
    ],
    correctInvariantIndex: 0,
    pseudocode: `def next_num(n): return sum(int(d)**2 for d in str(n))
slow = n, fast = next_num(n)
while fast != 1 and slow != fast:
  slow = next_num(slow)
  fast = next_num(next_num(fast))
return fast == 1`,
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    edgeCases: ["n = 1", "Known cycle number: n = 4", "Maximum integer value 2^31 - 1"],
    explanation: {
      verdict: "Cycle Detection (Implicit Graph)",
      whyPattern: "The function mapping is a deterministic finite state transition. Any cycle is detected via slow/fast pointers in O(1) memory.",
      distractorTakedown: "HashSet uses extra memory; DP requires contiguous integer tables.",
      takeaway: "Any deterministic sequence with a bounded domain will either reach a terminal state or cycle."
    }
  },
  {
    id: "find-duplicate-number",
    title: "Find the Duplicate Number",
    difficulty: "medium",
    category: "Fast & Slow Pointers",
    constraints: ["nums.length == n + 1", "1 <= nums[i] <= n", "Modify array: false", "O(1) extra space"],
    prompt: "Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive, return the duplicate number without modifying the array using O(1) extra space.",
    pattern: "Floyd's Cycle Finding on Array Indices",
    patternDistractors: ["Bitwise XOR", "Binary Search on Values", "Hash Set"],
    invariantPrompt: "How can nums be treated as a directed linked list with guaranteed cycle?",
    invariantOptions: [
      "Treat index i as a node pointing to nums[i]; duplicate value has multiple incoming edges creating a cycle",
      "Sort array in-place to compare adjacent elements",
      "XOR all numbers from 1 to n with the array elements",
      "Sum the elements and subtract n*(n+1)/2"
    ],
    correctInvariantIndex: 0,
    pseudocode: `slow = nums[0], fast = nums[0]
while true:
  slow = nums[slow]
  fast = nums[nums[fast]]
  if slow == fast: break
slow = nums[0]
while slow != fast:
  slow = nums[slow]
  fast = nums[fast]
return slow`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Duplicate repeated more than twice [2,2,2,2,2]", "Duplicate is 1", "Duplicate is n"],
    explanation: {
      verdict: "Floyd's Cycle on Indices",
      whyPattern: "Because each number is between 1 and n, index 0 is never in a cycle and points into the list. Duplicate values create multiple pointers to the same node, forming a cycle.",
      distractorTakedown: "XOR only works if duplicate appears exactly twice and all others once; here duplicates can repeat many times.",
      takeaway: "Interpret `index -> nums[index]` as directed edges to solve duplicate/cycle problems in O(1) space."
    }
  }
];
