import { BlitzProblem } from "../schema";

export const slidingWindowProblems: BlitzProblem[] = [
  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    category: "Sliding Window",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces"],
    prompt: "Given a string s, find the length of the longest substring without repeating characters.",
    pattern: "Sliding Window (Dynamic Shrink)",
    patternDistractors: ["Prefix Sums", "Knuth-Morris-Pratt", "Trie"],
    invariantPrompt: "When duplicate character c is encountered at right, how does left advance in O(1)?",
    invariantOptions: [
      "Jump left to max(left, lastSeen[c] + 1) without iterating index-by-index",
      "Reset left to 0 and re-scan",
      "Advance left by exactly 1 position",
      "Swap s[left] and s[right]"
    ],
    correctInvariantIndex: 0,
    pseudocode: `last_seen = {}, left = 0, max_len = 0
for right in 0..len(s)-1:
  if s[right] in last_seen:
    left = max(left, last_seen[s[right]] + 1)
  last_seen[s[right]] = right
  max_len = max(max_len, right - left + 1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(n, m)) where m is charset size",
    edgeCases: ["Empty string", "All same characters 'bbbbb'", "Unique characters 'abcdef'"],
    explanation: {
      verdict: "Sliding Window (Dynamic Shrink)",
      whyPattern: "Maintains a contiguous window [left, right] where all characters inside are unique using a hash map of last seen indices.",
      distractorTakedown: "Prefix sums do not track uniqueness; KMP is for pattern searching.",
      takeaway: "Map character -> last index to jump left pointer forward in O(1)."
    }
  },
  {
    id: "minimum-window-substring",
    title: "Minimum Window Substring",
    difficulty: "hard",
    category: "Sliding Window",
    constraints: ["m == s.length, n == t.length", "1 <= m, n <= 10^5", "s and t consist of uppercase and lowercase English letters"],
    prompt: "Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.",
    pattern: "Sliding Window (Expand then Contract)",
    patternDistractors: ["Aho-Corasick Automaton", "Boyer-Moore", "Dynamic Programming"],
    invariantPrompt: "When is the current window [left, right] considered valid to start contracting from left?",
    invariantOptions: [
      "When formed == requiredCount (all target characters meet or exceed frequency)",
      "When right reaches the end of string s",
      "When the window length equals t.length exactly",
      "When left and right point to the same character"
    ],
    correctInvariantIndex: 0,
    pseudocode: `need = freq(t), have = {}, formed = 0, required = len(need)
while right < len(s):
  add s[right] to have; if matches need: formed += 1
  while formed == required:
    update_min_window(left, right)
    remove s[left] from have; if broken: formed -= 1; left += 1
  right += 1`,
    timeComplexity: "O(m + n)",
    spaceComplexity: "O(1) auxiliary (52 alphabet letters max)",
    edgeCases: ["s shorter than t", "t has duplicate letters", "s equals t"],
    explanation: {
      verdict: "Sliding Window (Expand then Contract)",
      whyPattern: "Expand right until all character requirements are met; then contract left to minimize the window length.",
      distractorTakedown: "DP would require exponential state spaces over character frequencies.",
      takeaway: "Track a single `formed` count matching distinct characters in target frequency table."
    }
  },
  {
    id: "longest-repeating-character-replacement",
    title: "Longest Repeating Character Replacement",
    difficulty: "medium",
    category: "Sliding Window",
    constraints: ["1 <= s.length <= 10^5", "s consists of only uppercase English letters", "0 <= k <= s.length"],
    prompt: "You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character at most k times. Return the length of the longest substring containing the same letter.",
    pattern: "Sliding Window (Max Frequency Tracking)",
    patternDistractors: ["Backtracking", "Manacher's Algorithm", "Binary Lifting"],
    invariantPrompt: "What condition invalidates the current window [left, right]?",
    invariantOptions: [
      "(window_len - max_freq) > k (more than k replacements required)",
      "window_len > s.length / 2",
      "max_freq <= k",
      "distinct characters in window > 2"
    ],
    correctInvariantIndex: 0,
    pseudocode: `counts = {}, max_f = 0, left = 0, max_len = 0
for right in 0..len(s)-1:
  counts[s[right]] += 1
  max_f = max(max_f, counts[s[right]])
  while (right - left + 1) - max_f > k:
    counts[s[left]] -= 1; left += 1
  max_len = max(max_len, right - left + 1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) (26 uppercase letters)",
    edgeCases: ["k == 0", "k >= s.length", "Single character repeated"],
    explanation: {
      verdict: "Sliding Window (Max Frequency Tracking)",
      whyPattern: "Characters to replace = (window_size - max_frequency). When replacements exceed k, slide left.",
      distractorTakedown: "Backtracking is O(26^n) exponential; Manacher is for palindromes.",
      takeaway: "Notice that window length minus max frequency tells you the exact number of replacements needed."
    }
  },
  {
    id: "max-consecutive-ones-iii",
    title: "Max Consecutive Ones III",
    difficulty: "medium",
    category: "Sliding Window",
    constraints: ["1 <= nums.length <= 10^5", "nums[i] is either 0 or 1", "0 <= k <= nums.length"],
    prompt: "Given a binary array nums and an integer k, return the maximum number of consecutive 1's in the array if you can flip at most k 0's.",
    pattern: "Sliding Window (Zero Count Monotonicity)",
    patternDistractors: ["Bit Manipulation", "DFS Recursion", "Interval Scheduling"],
    invariantPrompt: "When zeroes_count in window exceeds k, how is the invariant restored?",
    invariantOptions: [
      "Increment left pointer, decrementing zeroes_count whenever nums[left] was 0",
      "Reset both left and right to right + 1",
      "Flip nums[right] to 1 and continue",
      "Set k = 0"
    ],
    correctInvariantIndex: 0,
    pseudocode: `left = 0, zeros = 0, max_len = 0
for right in 0..len(nums)-1:
  if nums[right] == 0: zeros += 1
  while zeros > k:
    if nums[left] == 0: zeros -= 1
    left += 1
  max_len = max(max_len, right - left + 1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["All zeroes with k=0", "All ones", "k greater than array length"],
    explanation: {
      verdict: "Sliding Window (Zero Count)",
      whyPattern: "Rephrases problem as: 'find longest subarray containing at most k zeroes'.",
      distractorTakedown: "Bit manipulation cannot handle 10^5 array sizes in native words.",
      takeaway: "Translate 'flip at most k elements' into 'window with at most k invalid elements'."
    }
  },
  {
    id: "permutation-in-string",
    title: "Permutation in String",
    difficulty: "medium",
    category: "Sliding Window",
    constraints: ["1 <= s1.length, s2.length <= 10^4", "s1 and s2 consist of lowercase English letters"],
    prompt: "Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise.",
    pattern: "Fixed-Size Sliding Window",
    patternDistractors: ["Radix Sort", "Trie Matching", "Suffix Array"],
    invariantPrompt: "Why does window size remain strictly fixed to len(s1)?",
    invariantOptions: [
      "Any valid permutation of s1 must have identical length to s1",
      "Permutations can span arbitrary lengths",
      "s2 must be padded with zeroes",
      "Characters must appear in alphabetical order"
    ],
    correctInvariantIndex: 0,
    pseudocode: `if len(s1) > len(s2): return false
c1 = count(s1), c2 = count(s2[0..len(s1)-1])
if c1 == c2: return true
for i in len(s1)..len(s2)-1:
  c2[s2[i]] += 1; c2[s2[i - len(s1)]] -= 1
  if c1 == c2: return true`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) (26 English lowercase letters)",
    edgeCases: ["s1 longer than s2", "s1 of length 1", "Identical strings"],
    explanation: {
      verdict: "Fixed-Size Sliding Window",
      whyPattern: "Permutation requires exact frequency match and identical length. Keep window of size len(s1) and slide 1 step at a time.",
      distractorTakedown: "Generating all permutations is O(n!) factorial time.",
      takeaway: "Anagram and permutation subarray matching always uses a fixed-size sliding window."
    }
  },
  {
    id: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "hard",
    category: "Sliding Window",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
    prompt: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left to the very right. Return the max sliding window.",
    pattern: "Monotonic Decreasing Deque",
    patternDistractors: ["Max Heap", "Fenwick Tree", "Binary Search"],
    invariantPrompt: "Why is a monotonic decreasing deque strictly faster than a heap (O(n) vs O(n log k))?",
    invariantOptions: [
      "Each element index enters and leaves the deque at most once; front element is always window maximum in O(1)",
      "Deque sorts all k elements in O(1) time",
      "Heap cannot remove stale elements outside the window",
      "Arrays are already sorted"
    ],
    correctInvariantIndex: 0,
    pseudocode: `deque = [], result = []
for i in 0..len(nums)-1:
  # remove indices out of window boundary (i - k)
  while deque and deque.front <= i - k: deque.pop_front()
  # maintain decreasing order
  while deque and nums[deque.back] <= nums[i]: deque.pop_back()
  deque.push_back(i)
  if i >= k - 1: result.push(nums[deque.front])`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    edgeCases: ["k == 1", "k == nums.length", "Strictly decreasing array"],
    explanation: {
      verdict: "Monotonic Decreasing Deque",
      whyPattern: "Store indices of elements in monotonically decreasing value order. Front of deque is always current window max.",
      distractorTakedown: "Max Heap removal of outdated elements is O(log k) giving O(n log k) instead of linear O(n).",
      takeaway: "Monotonic deque gives O(1) sliding window min/max."
    }
  }
];
