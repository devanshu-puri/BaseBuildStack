import { BlitzProblem } from "../schema";

export const heapsAndIntervalsProblems: BlitzProblem[] = [
  {
    id: "kth-largest-element",
    title: "Kth Largest Element in an Array",
    difficulty: "medium",
    category: "Heaps",
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    prompt: "Given an integer array nums and an integer k, return the kth largest element in the array.",
    pattern: "Min Heap of Size K (or Quickselect)",
    patternDistractors: ["Sort entire array O(n log n)", "Counting Sort", "Bucket Sort"],
    invariantPrompt: "Why does maintaining a Min Heap of size k result in the top element being the kth largest?",
    invariantOptions: [
      "The heap holds the k largest elements seen so far; its smallest element (top) is the kth largest overall",
      "Min heap stores elements in descending order",
      "All elements smaller than k are pushed first",
      "Heap size increases indefinitely to n"
    ],
    correctInvariantIndex: 0,
    pseudocode: `min_heap = []
for x in nums:
  push(min_heap, x)
  if len(min_heap) > k:
    pop(min_heap)
return min_heap.top`,
    timeComplexity: "O(n log k)",
    spaceComplexity: "O(k)",
    edgeCases: ["k == 1 (maximum element)", "k == nums.length (minimum element)", "Duplicate elements [3, 2, 3, 1, 2, 4, 5, 5, 6]"],
    explanation: {
      verdict: "Min-Heap of Size K",
      whyPattern: "Keeping size k ensures that every element smaller than the top k gets evicted. Top of min-heap is the kth largest.",
      distractorTakedown: "Sorting whole array is O(n log n); min-heap is O(n log k) which is much faster when k << n.",
      takeaway: "To find kth largest, use a Min-Heap of size k; to find kth smallest, use a Max-Heap of size k."
    }
  },
  {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "medium",
    category: "Heaps",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "k is in range [1, unique elements]", "Better than O(n log n) runtime"],
    prompt: "Given an integer array nums and an integer k, return the k most frequent elements in any order.",
    pattern: "Frequency Map + Bucket Sort (or Min-Heap)",
    patternDistractors: ["Radix Sort", "Prefix Sums", "Two Pointers"],
    invariantPrompt: "How can Top K Frequent be solved in strictly linear O(n) time using Bucket Sort?",
    invariantOptions: [
      "Bucket index represents frequency (0 to n); group numbers by frequency and collect from highest bucket down to k elements",
      "Sort the frequency map values using merge sort",
      "Build a binary search tree of frequencies",
      "Hash each number to an integer modulo k"
    ],
    correctInvariantIndex: 0,
    pseudocode: `counts = freq_map(nums)
buckets = [[] for _ in 0..n]
for num, count in counts.items():
  buckets[count].append(num)
res = []
for i in n down to 0:
  for num in buckets[i]:
    res.append(num)
    if len(res) == k: return res`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["All elements have frequency 1", "k == 1", "Single unique element repeated n times"],
    explanation: {
      verdict: "Bucket Sort by Frequency",
      whyPattern: "Since maximum frequency cannot exceed n, an array of buckets indexed 0..n groups numbers by count in O(n) total time.",
      distractorTakedown: "Sorting by frequency takes O(n log n), which fails the strict sub-O(n log n) requirement.",
      takeaway: "When values being sorted are bounded by array length n (like frequencies), Bucket Sort achieves O(n) time."
    }
  },
  {
    id: "find-median-from-data-stream",
    title: "Find Median from Data Stream",
    difficulty: "hard",
    category: "Heaps",
    constraints: ["-10^5 <= num <= 10^5", "There will be at least one element in data structure before median query", "At most 5 * 10^4 calls"],
    prompt: "Design a data structure that supports adding integer numbers from a data stream and finding the median of all elements seen so far in O(1) or O(log n) time.",
    pattern: "Two Heaps (Max-Heap Small Half, Min-Heap Large Half)",
    patternDistractors: ["Balanced BST (AVL)", "Sorted Array with Binary Insertion", "Skip List"],
    invariantPrompt: "What balance invariant must be maintained between the two heaps?",
    invariantOptions: [
      "small_heap (max-heap) has either equal size or exactly 1 more element than large_heap (min-heap), with all elements in small <= large",
      "Both heaps must always have identical size",
      "small_heap contains only negative numbers",
      "Heaps are merged on every addNum call"
    ],
    correctInvariantIndex: 0,
    pseudocode: `def addNum(num):
  push(small, num) # max-heap
  push(large, pop(small)) # min-heap
  if len(small) < len(large):
    push(small, pop(large))

def findMedian():
  if len(small) > len(large): return small.top
  return (small.top + large.top) / 2.0`,
    timeComplexity: "addNum: O(log n), findMedian: O(1)",
    spaceComplexity: "O(n)",
    edgeCases: ["Odd vs even count of numbers", "Duplicate numbers", "Strictly increasing inputs"],
    explanation: {
      verdict: "Two Heaps (Max & Min)",
      whyPattern: "Partition numbers into lower half (Max-Heap) and upper half (Min-Heap). Tops of the two heaps represent the median elements directly in O(1).",
      distractorTakedown: "Array insertion takes O(n) shifts; BST balancing has high pointer overhead.",
      takeaway: "Two balanced heaps give dynamic median in O(log n) insertion and O(1) retrieval."
    }
  },
  {
    id: "task-scheduler",
    title: "Task Scheduler",
    difficulty: "medium",
    category: "Heaps",
    constraints: ["1 <= tasks.length <= 10^4", "tasks[i] is uppercase English letter", "0 <= n <= 100"],
    prompt: "Given a characters array tasks representing CPU tasks and a cooldown period n between two same tasks, return the minimum number of CPU units required to complete all tasks.",
    pattern: "Greedy Math / Max Frequency Slotting",
    patternDistractors: ["BFS Graph Scheduling", "Dynamic Programming", "Dijkstra"],
    invariantPrompt: "What formula determines the minimum idle slots created by the most frequent task?",
    invariantOptions: [
      "(max_freq - 1) * (n + 1) + count_of_tasks_with_max_freq; answer is max(len(tasks), slots)",
      "max_freq * n",
      "tasks.length * (n + 1)",
      "n * (n + 1) / 2"
    ],
    correctInvariantIndex: 0,
    pseudocode: `counts = freq(tasks)
max_f = max(counts.values())
max_count = sum(1 for f in counts.values() if f == max_f)
ans = (max_f - 1) * (n + 1) + max_count
return max(len(tasks), ans)`,
    timeComplexity: "O(len(tasks))",
    spaceComplexity: "O(1) (26 uppercase letters)",
    edgeCases: ["n == 0 (no cooldown needed)", "More tasks than idle slots", "Multiple tasks tie for max frequency"],
    explanation: {
      verdict: "Greedy Slotting / Frequency Math",
      whyPattern: "The task with max frequency creates (max_freq - 1) chunks of size (n + 1). Other tasks fill into the slots; if tasks exceed slots, answer is simply total tasks.",
      distractorTakedown: "Simulating step-by-step with Max-Heap is slower than direct O(1) mathematical calculation.",
      takeaway: "CPU cooldown problems boil down to chunking by the bottleneck frequency."
    }
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "hard",
    category: "Heaps",
    constraints: ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500", "-10^4 <= lists[i][j] <= 10^4"],
    prompt: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    pattern: "Min Heap of K Node Pointers",
    patternDistractors: ["Merge sequentially one-by-one", "Quick Sort on Nodes", "Buckets"],
    invariantPrompt: "Why maintain a Min-Heap of size k instead of merging lists sequentially?",
    invariantOptions: [
      "Min-heap extracts the smallest node across all k lists in O(log k), yielding O(N log k) total time vs O(k * N) sequential",
      "Min-heap uses O(N) space to sort all nodes at once",
      "Linked lists cannot be merged pair-wise",
      "Sequential merge modifies node values"
    ],
    correctInvariantIndex: 0,
    pseudocode: `heap = MinHeap()
for head in lists: if head: heap.push(head)
dummy = Node(0), curr = dummy
while heap:
  node = heap.pop()
  curr.next = node; curr = curr.next
  if node.next: heap.push(node.next)
return dummy.next`,
    timeComplexity: "O(N log k) where N is total nodes",
    spaceComplexity: "O(k) auxiliary memory",
    edgeCases: ["k == 0 (empty input)", "lists with empty lists [null, null]", "Single list"],
    explanation: {
      verdict: "Min-Heap of K List Heads",
      whyPattern: "Heap maintains the active candidates (at most k nodes). Each of the N nodes enters and leaves the heap once in O(log k) time.",
      distractorTakedown: "Merging one-by-one is O(k * N) quadratic in k.",
      takeaway: "Merging k sorted streams always uses a Min-Heap of size k."
    }
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    category: "Intervals",
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= starti <= endi <= 10^4"],
    prompt: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.",
    pattern: "Sort by Start Time + Greedy Merge",
    patternDistractors: ["Interval Tree", "Segment Tree", "Graph Connected Components"],
    invariantPrompt: "After sorting by start time, when does interval [s2, e2] overlap with previous merged interval [s1, e1]?",
    invariantOptions: [
      "When s2 <= e1 (current start is less than or equal to previous end); merged end becomes max(e1, e2)",
      "When s2 == s1 only",
      "When e2 <= s1",
      "When both start and end are identical"
    ],
    correctInvariantIndex: 0,
    pseudocode: `sort(intervals, key=lambda x: x[0])
merged = [intervals[0]]
for start, end in intervals[1:]:
  if start <= merged.last[1]:
    merged.last[1] = max(merged.last[1], end)
  else:
    merged.append([start, end])
return merged`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    edgeCases: ["One interval completely inside another [[1, 4], [2, 3]]", "Touching boundaries [[1, 4], [4, 5]]", "Single interval"],
    explanation: {
      verdict: "Sort by Start + Greedy Merge",
      whyPattern: "Sorting by start time ensures that any overlap must occur with the immediately preceding active interval.",
      distractorTakedown: "Graph connected components takes O(n^2) edge comparisons.",
      takeaway: "Sort by start time first; then compare each interval's start with the running end."
    }
  },
  {
    id: "insert-interval",
    title: "Insert Interval",
    difficulty: "medium",
    category: "Intervals",
    constraints: ["0 <= intervals.length <= 10^4", "intervals is sorted by start time non-decreasing", "No overlapping intervals initially"],
    prompt: "You are given an array of non-overlapping intervals sorted by starti and a newInterval. Insert newInterval such that intervals is still sorted and non-overlapping (merge if necessary).",
    pattern: "Three-Phase Linear Scan",
    patternDistractors: ["Sort entire list O(n log n)", "Binary Search with Array Shifts", "Interval Heap"],
    invariantPrompt: "What are the three distinct linear scan phases to insert and merge in O(n)?",
    invariantOptions: [
      "1. Add all intervals ending before newInterval starts; 2. Merge all overlapping intervals into newInterval; 3. Add all remaining intervals",
      "1. Insert at end; 2. Quick sort",
      "1. Binary search left index; 2. Shift all right elements",
      "1. Flatten intervals into a 1D array"
    ],
    correctInvariantIndex: 0,
    pseudocode: `res = [], i = 0, n = len(intervals)
# 1. Non-overlapping before
while i < n and intervals[i][1] < new[0]:
  res.append(intervals[i]); i += 1
# 2. Overlapping: merge into new
while i < n and intervals[i][0] <= new[1]:
  new[0] = min(new[0], intervals[i][0])
  new[1] = max(new[1], intervals[i][1]); i += 1
res.append(new)
# 3. Non-overlapping after
while i < n: res.append(intervals[i]); i += 1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Empty intervals array", "newInterval inserted before first interval", "newInterval inserted after last interval"],
    explanation: {
      verdict: "Three-Phase Linear Scan",
      whyPattern: "Since input is already sorted and non-overlapping, dividing into (before, merge, after) achieves optimal O(n) single pass.",
      distractorTakedown: "Re-sorting takes O(n log n) unnecessarily.",
      takeaway: "Use 3 phases (left disjoint, overlap expansion, right disjoint) for pre-sorted interval insertions."
    }
  },
  {
    id: "non-overlapping-intervals",
    title: "Non-overlapping Intervals",
    difficulty: "medium",
    category: "Intervals",
    constraints: ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "-5 * 10^4 <= starti < endi <= 5 * 10^4"],
    prompt: "Given an array of intervals, find the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    pattern: "Greedy Activity Selection (Sort by End Time)",
    patternDistractors: ["Dynamic Programming O(n^2)", "Backtracking", "Graph Coloring"],
    invariantPrompt: "Why does sorting by END time minimize the intervals removed?",
    invariantOptions: [
      "The interval that finishes earliest leaves the maximum possible remaining time for subsequent intervals",
      "End times are always smaller than start times",
      "Sorting by end time avoids overlapping start times",
      "It groups intervals by length"
    ],
    correctInvariantIndex: 0,
    pseudocode: `sort(intervals, key=lambda x: x[1])
removed = 0, prev_end = -infinity
for start, end in intervals:
  if start < prev_end: removed += 1
  else: prev_end = end
return removed`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    edgeCases: ["All intervals overlap at same point", "No intervals overlap", "Negative time intervals"],
    explanation: {
      verdict: "Greedy Activity Selection (Sort by End)",
      whyPattern: "Classic interval scheduling: choosing the interval that finishes earliest is mathematically proven to leave the maximum room for future intervals.",
      distractorTakedown: "Sorting by start time can pick a long interval that blocks multiple short ones.",
      takeaway: "To maximize non-overlapping intervals (or minimize removals), always sort by End Time."
    }
  },
  {
    id: "meeting-rooms-ii",
    title: "Meeting Rooms II",
    difficulty: "medium",
    category: "Intervals",
    constraints: ["1 <= intervals.length <= 10^4", "0 <= starti < endi <= 10^6"],
    prompt: "Given an array of meeting time intervals intervals where intervals[i] = [starti, endi], return the minimum number of conference rooms required.",
    pattern: "Chronological Start/End Sweep (or Min-Heap)",
    patternDistractors: ["Bin Packing", "Union-Find", "DFS"],
    invariantPrompt: "In the two-pointer chronological sweep method, when is a new room required?",
    invariantOptions: [
      "When start_times[s] < end_times[e], a meeting begins before the earliest ongoing meeting ends, requiring an additional room",
      "When start_times[s] == end_times[e]",
      "Rooms are doubled whenever count is odd",
      "Only when intervals overlap completely"
    ],
    correctInvariantIndex: 0,
    pseudocode: `starts = sort([i[0] for i in intervals])
ends = sort([i[1] for i in intervals])
s = 0, e = 0, rooms = 0, max_rooms = 0
while s < len(intervals):
  if starts[s] < ends[e]:
    rooms += 1; s += 1
  else:
    rooms -= 1; e += 1
  max_rooms = max(max_rooms, rooms)`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Meetings touching at boundary [1, 2] and [2, 3] (can reuse room)", "All meetings simultaneous", "Single meeting"],
    explanation: {
      verdict: "Chronological Event Sweep",
      whyPattern: "Treat starts as +1 room and ends as -1 room. Peak concurrent rooms in chronological order equals required conference rooms.",
      distractorTakedown: "DP is overkill for interval concurrency.",
      takeaway: "Separate starts and ends into two sorted arrays to count overlapping peaks in O(n) after sorting."
    }
  },
  {
    id: "minimum-number-of-arrows",
    title: "Minimum Number of Arrows to Burst Balloons",
    difficulty: "medium",
    category: "Intervals",
    constraints: ["1 <= points.length <= 10^5", "points[i].length == 2", "-2^31 <= xstart < xend <= 2^31 - 1"],
    prompt: "There are spherical balloons taped to a flat wall represented by [xstart, xend]. An arrow shot vertically at x bursts all balloons with xstart <= x <= xend. Return the minimum number of arrows.",
    pattern: "Greedy Intersection (Sort by End Coordinate)",
    patternDistractors: ["Maximum Flow", "Dynamic Programming", "Segment Tree"],
    invariantPrompt: "Where should the arrow be shot to burst the current overlapping cluster?",
    invariantOptions: [
      "Shoot at the end coordinate of the earliest-finishing balloon in the cluster (prev_end)",
      "Shoot at the midpoint of the balloon",
      "Shoot at the start coordinate of the longest balloon",
      "Shoot randomly within the range"
    ],
    correctInvariantIndex: 0,
    pseudocode: `sort(points, key=lambda x: x[1])
arrows = 1, arrow_x = points[0][1]
for start, end in points[1:]:
  if start > arrow_x:
    arrows += 1
    arrow_x = end
return arrows`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Points touch at single point [1, 2] and [2, 3] (1 arrow bursts both)", "Single balloon", "Integer overflow with 32-bit negatives"],
    explanation: {
      verdict: "Greedy Shoot at Min End",
      whyPattern: "Shooting as far right as possible (at the end of the earliest balloon) maximizes the number of subsequent balloons that can be pierced by the same arrow.",
      distractorTakedown: "Shooting at start coordinates misses balloons that start later.",
      takeaway: "Greedy arrow placement: always shoot at the right edge of the balloon that ends first."
    }
  }
];
