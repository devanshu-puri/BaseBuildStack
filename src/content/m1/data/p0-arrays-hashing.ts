import { BlitzProblem } from "../schema";

export const arraysAndHashingProblems: BlitzProblem[] = [
  {
    id: "contains-duplicate",
    title: "Contains Duplicate (LC 217)",
    difficulty: "easy",
    category: "Arrays & Hashing",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    prompt:
      "Determine whether any integer appears more than once in an unsorted list. Return true if at least one duplicate exists, or false if every value is distinct.",
    pattern: "Hash Set (Lookup & Insert)",
    patternDistractors: [
      "Sliding Window",
      "Monotonic Stack",
      "Two Pointers (Opposite Ends)",
    ],
    invariantPrompt:
      "Why is a hash set preferred over in-place sorting for this check under standard interview constraints?",
    invariantOptions: [
      "In-place sorting is mathematically invalid here because comparing adjacent elements destroys duplicate parity",
      "Hash sets guarantee strict O(1) worst-case lookup and insertion time regardless of hash collisions",
      "Hash sets provide expected O(1) membership checks per element, avoiding the O(n log n) overhead or mutation of sorting",
      "A dynamic sliding window can track all duplicate occurrences in O(1) auxiliary space without sorting",
    ],
    correctInvariantIndex: 2,
    pseudocode: `seen = empty_hash_set()
for num in nums:
  if num in seen:
    return true
  seen.add(num)
return false`,
    timeComplexity: "O(n) average (worst case depends on the hash implementation)",
    spaceComplexity: "O(n) auxiliary space for the hash set",
    edgeCases: [
      "Single-element array returns false",
      "Duplicates at extremities e.g. [1, 2, 3, 1]",
      "All elements identical e.g. [7, 7, 7]",
      "Negative numbers e.g. [-5, -5]",
    ],
    explanation: {
      verdict: "Hash Set (Lookup & Insert)",
      whyPattern:
        "Single pass tracking previously encountered values gives average O(1) lookup per element, terminating immediately when a match is found.",
      distractorTakedown:
        "Sorting first and checking adjacent elements is correct-but-inefficient at O(n log n) time and mutates the array (or uses O(n) memory to copy). Sliding window fails because duplicates can be separated arbitrarily across an unsorted array (e.g., [1, 2, 3, 1]). Monotonic stack only tracks next greater/smaller elements, not set membership. Two pointers without sorting fails because there is no monotonic direction to move pointers in [2, 3, 1, 3, 5].",
      takeaway:
        "When verifying whether an element has appeared before, a hash set turns linear search into expected constant time.",
    },
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram (LC 242)",
    difficulty: "easy",
    category: "Arrays & Hashing",
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters",
    ],
    prompt:
      "Given two strings s and t, verify whether t is an anagram of s by confirming both words contain identical character frequencies.",
    pattern: "Frequency Array / Hash Map",
    patternDistractors: ["Prefix Sum", "Two Pointers", "Sliding Window"],
    invariantPrompt:
      "If s and t have equal lengths, which invariant proves they are valid anagrams in one pass?",
    invariantOptions: [
      "Calculating the cumulative ASCII character code sum of both strings verifies anagrams without extra memory",
      "Incrementing counts for string s and decrementing for t leaves all 26 bins at exactly zero if and only if they are anagrams",
      "Matching the boundary characters while checking identical string lengths confirms multiset equivalence",
      "Comparing character parity at symmetric indices from both string ends verifies character balance in one pass",
    ],
    correctInvariantIndex: 1,
    pseudocode: `if length(s) != length(t): return false
counts = array of 26 zeros
for i from 0 to length(s) - 1:
  counts[s[i] - 'a'] += 1
  counts[t[i] - 'a'] -= 1
for c in counts:
  if c != 0: return false
return true`,
    timeComplexity: "O(n) where n is length of s and t",
    spaceComplexity: "O(1) auxiliary space (fixed 26-element array for lowercase alphabet)",
    edgeCases: [
      "Unequal string lengths return false immediately",
      "Single identical character returns true",
      "Same ASCII sum but different letters e.g. 'ac' vs 'bb' fails checksum",
      "Identical multi-character words",
    ],
    explanation: {
      verdict: "Frequency Array / Hash Map",
      whyPattern:
        "Anagrams require exact multiset equivalence. A fixed 26-bin tally verifies frequency parity in a single linear pass.",
      distractorTakedown:
        "Sorting both strings is correct-but-inefficient at O(n log n) time and O(n) space. Prefix sums fail because character sums yield false positives on anagram collisions (e.g., 'ac' and 'bb' share the same ASCII sum 195). Two pointers cannot reconcile arbitrary permutations across non-matching index positions without pre-sorting. Sliding window tracks contiguous subsegments in a host string rather than comparing two standalone strings.",
      takeaway:
        "To compare multiset equivalence over a finite alphabet, use fixed-size frequency counting for guaranteed O(1) auxiliary space.",
    },
  },
  {
    id: "two-sum",
    title: "Two Sum (LC 1)",
    difficulty: "easy",
    category: "Arrays & Hashing",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Exactly one valid answer exists",
      "Cannot use the same element twice",
    ],
    prompt:
      "Given an unsorted integer array and an integer target, find the indices of the two distinct numbers that sum to target.",
    pattern: "Hash Map (One-Pass Complement Lookup)",
    patternDistractors: [
      "Binary Search",
      "Two Pointers (Opposite Ends)",
      "Greedy Selection",
    ],
    invariantPrompt:
      "Why must the hash map store values mapped to their indices rather than just a boolean set?",
    invariantOptions: [
      "Storing visited numbers mapped to their indices allows O(1) average lookup of the target complement while preserving original indices",
      "Converging two pointers from array extremities finds target sums in O(1) space on unsorted arrays",
      "Greedily choosing the largest element strictly less than target guarantees finding the pair in linear time",
      "Binary search finds each complement in O(log n) time without requiring the input array to be sorted",
    ],
    correctInvariantIndex: 0,
    pseudocode: `seen = empty_hash_map()
for i, num in enumerate(nums):
  complement = target - num
  if complement in seen:
    return [seen[complement], i]
  seen[num] = i
return []`,
    timeComplexity: "O(n) average (worst case depends on the hash implementation)",
    spaceComplexity: "O(n) auxiliary space for the hash map",
    edgeCases: [
      "Duplicate numbers forming the target e.g. [3, 3] with target 6",
      "Negative numbers and negative target e.g. [-1, -2] with target -3",
      "Target sum formed by elements at opposite extremities e.g. [2, 5, 5, 11] target 13",
      "Target requires the zero element e.g. [0, 4, 3, 0] target 0",
    ],
    explanation: {
      verdict: "Hash Map (One-Pass Complement Lookup)",
      whyPattern:
        "For each element x, its complement (target - x, which fits within 32-bit signed integer range) is checked against a hash map of previously visited elements in expected O(1) time.",
      distractorTakedown:
        "Brute force pairwise checking is correct-but-inefficient at O(n^2) time and O(1) space. Two pointers from opposite ends is valid only after sorting in O(n log n), but sorting discards original indices unless auxiliary index pairs are tracked in O(n) space. Binary search fails because the input is unsorted. Greedy selection fails because picking the largest number <= target can preclude the true complement.",
      takeaway:
        "Trade linear auxiliary space for constant-time complement lookups when searching for exact pairwise sums in unsorted arrays.",
    },
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams (LC 49)",
    difficulty: "medium",
    category: "Arrays & Hashing",
    constraints: [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters",
    ],
    prompt:
      "Given an array of strings, group words together that are anagrams of each other. Return the grouped lists in any order.",
    pattern: "Hash Map with Canonical Key (Sorted String or Char Count)",
    patternDistractors: [
      "Trie Prefix Tree",
      "Disjoint Set Union",
      "Breadth-First Search",
    ],
    invariantPrompt:
      "How does using a delimited count signature (count.join('#')) compare to a sorted string as the hash map key?",
    invariantOptions: [
      "Sorting each string produces a shorter hash key and therefore always achieves faster runtime than frequency counting",
      "Using the raw 26-element array directly as the map key works identically in all languages without string serialization",
      "Frequency counting fails when strings contain repeated letters because count signatures cannot distinguish character counts",
      "Frequency counting runs in O(k) per word versus O(k log k) for sorting, but requires serializing the 26 counts into a string key",
    ],
    correctInvariantIndex: 3,
    pseudocode: `groups = hash_map_with_list_defaults()
for s in strs:
  count = array of 26 zeros
  for ch in s: count[ch - 'a'] += 1
  key = count.join("#")
  groups[key].append(s)
return values(groups)`,
    timeComplexity: "O(n * k) average time where n is word count and k is max string length",
    spaceComplexity: "O(n * k) auxiliary space to store all grouped strings in hash map",
    edgeCases: [
      "Array with a single empty string [''] returning [['']]",
      "Multiple empty strings ['', ''] grouping together into [['', '']]",
      "Single character strings and words with identical character frequencies",
      "Strings with identical characters of different lengths e.g. 'a' vs 'aa'",
    ],
    explanation: {
      verdict: "Hash Map with Canonical Key (Sorted String or Char Count)",
      whyPattern:
        "All anagrams share an identical canonical signature. Mapping each word to a serialized count key in a hash map groups them in linear time.",
      distractorTakedown:
        "Sorting each string to form the key is a valid correct-but-inefficient alternative running in O(n * k log k) time. Trie organizes common prefixes, but anagrams have scrambled prefixes (e.g., 'eat', 'tea', 'ate') and would scatter into distinct branches. Disjoint Set Union (DSU) requires pairwise anagram checks, resulting in O(n^2 * k) time. Breadth-First Search (BFS) explores state graphs and has no application to partitioning strings by multiset equality.",
      takeaway:
        "Group equivalence classes by projecting varied inputs into a single canonical invariant representation used as a hash key.",
    },
  },
  {
    id: "product-of-array-except-self",
    title: "Product of Array Except Self (LC 238)",
    difficulty: "medium",
    category: "Arrays & Hashing",
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "Product of any prefix/suffix fits in 32-bit integer",
      "Solve in O(n) time WITHOUT division",
    ],
    prompt:
      "Given an integer array nums, return an array answer where answer[i] is equal to the product of all elements of nums except nums[i], without using division.",
    pattern: "Prefix and Suffix Product Accumulation",
    patternDistractors: [
      "Monotonic Stack",
      "Sliding Window",
      "Binary Exponentiation",
    ],
    invariantPrompt:
      "How do prefix and suffix passes produce the product of all elements except nums[i] in O(1) extra space?",
    invariantOptions: [
      "First pass stores prefix products in output; second backwards pass multiplies running suffix products in O(1) extra space",
      "Dividing total prefix product by suffix product calculates the answer while avoiding forbidden direct division",
      "A sliding window of width 2 can compute products of adjacent elements to reconstruct all excluded products in linear time",
      "A monotonic stack tracks the product of nearest smaller neighbors to avoid multiplying unnecessary array elements",
    ],
    correctInvariantIndex: 0,
    pseudocode: `n = length(nums), res = array of size n filled with 1
prefix = 1
for i from 0 to n - 1:
  res[i] = prefix
  prefix *= nums[i]
postfix = 1
for i from n - 1 down to 0:
  res[i] *= postfix
  postfix *= nums[i]
return res`,
    timeComplexity: "O(n) time where n is length of nums (two linear passes)",
    spaceComplexity: "O(1) auxiliary space (excluding returned output array per standard conventions)",
    edgeCases: [
      "Single zero in array: only that index has non-zero product",
      "Multiple zeros in array: all products evaluate to zero",
      "Negative numbers alternating in sign",
      "Minimum array length of 2",
    ],
    explanation: {
      verdict: "Prefix and Suffix Product Accumulation",
      whyPattern:
        "Every element's answer is decomposed into (product of elements to its left) * (product of elements to its right), eliminating the need for division.",
      distractorTakedown:
        "Division is explicitly forbidden by problem constraints and mathematically fails when any element is 0 (or multiple zeros). Storing separate prefix and suffix arrays is correct-but-inefficient at O(n) auxiliary space instead of accumulating in output. Sliding window fails because it tracks contiguous subarrays rather than all elements excluding a pivot index. Monotonic stack only resolves element comparisons, not product aggregations. Binary exponentiation calculates powers of a single value, not products of distinct array elements.",
      takeaway:
        "When an operation on index i requires excluding nums[i], decompose the aggregation into independent left prefix and right suffix accumulations.",
    },
  },
  {
    id: "valid-sudoku",
    title: "Valid Sudoku (LC 36)",
    difficulty: "medium",
    category: "Arrays & Hashing",
    constraints: [
      "board.length == 9",
      "board[i].length == 9",
      "board[i][j] is a digit 1-9 or '.'",
    ],
    prompt:
      "Determine if a 9x9 Sudoku board is valid by checking that filled cells have no duplicate digits (1-9) in any row, column, or 3x3 subgrid.",
    pattern: "Coordinate Hash Sets / Bitmasks",
    patternDistractors: [
      "Backtracking Recursion",
      "Breadth-First Search",
      "Dynamic Programming",
    ],
    invariantPrompt:
      "Which formula uniquely maps cell (r, c) to its 3x3 sub-box index from 0 to 8?",
    invariantOptions: [
      "Sub-box index is determined by (r % 3) * 3 + (c % 3) because modulo separates 3x3 quadrant blocks",
      "Sub-box index is determined by (floor(r / 3) * 3) + floor(c / 3), clustering 9 contiguous 3x3 cells into buckets 0 through 8",
      "Sub-box index equals (r + c) / 3 because row and column indices scale symmetrically across diagonals",
      "Sub-box index equals floor((r * c) / 9) because cell products remain invariant within each sub-grid",
    ],
    correctInvariantIndex: 1,
    pseudocode: `rows = 9 sets, cols = 9 sets, boxes = 9 sets
for r from 0 to 8:
  for c from 0 to 8:
    val = board[r][c]
    if val == '.': continue
    b = (r // 3) * 3 + (c // 3)
    if val in rows[r] or val in cols[c] or val in boxes[b]:
      return false
    rows[r].add(val), cols[c].add(val), boxes[b].add(val)
return true`,
    timeComplexity: "O(1) strictly bounded time (81 cells visited once)",
    spaceComplexity: "O(1) auxiliary space (27 sets of size <= 9, or integer bitmasks)",
    edgeCases: [
      "Duplicate numbers in the same row with valid columns and boxes",
      "Duplicate numbers in the same column with valid rows and boxes",
      "Duplicate numbers in the same 3x3 box with valid rows and columns",
      "Completely empty 9x9 board with only '.' characters",
    ],
    explanation: {
      verdict: "Coordinate Hash Sets / Bitmasks",
      whyPattern:
        "Validating current grid state only requires checking uniqueness constraints across rows, columns, and sub-boxes in a single pass.",
      distractorTakedown:
        "A three-pass approach (validating all rows, then all columns, then all boxes separately) is a correct alternative with the same O(1) bound but requires three full traversals instead of one. Backtracking is necessary to solve an incomplete board, but this problem only validates existing entries. BFS traverses shortest paths in graphs, which is irrelevant to static matrix constraint validation. Dynamic programming is for optimal substructure, which does not exist in board rule validation.",
      takeaway:
        "To validate multi-dimensional constraints simultaneously, map coordinate pairs to canonical subregion identifiers using integer division.",
    },
  },
  {
    id: "encode-and-decode-strings",
    title: "Encode and Decode Strings (LC 271)",
    difficulty: "medium",
    category: "Arrays & Hashing",
    constraints: [
      "0 <= strs.length <= 200",
      "0 <= strs[i].length <= 200",
      "strs[i] contains any possible ASCII characters",
    ],
    prompt:
      "Design an algorithm to encode a list of strings into a single string, and decode that string back to the original list of strings without delimiter collisions.",
    pattern: "Length-Prefixed Chunking (Chunk Framing)",
    patternDistractors: [
      "Naive Delimiter Joining",
      "Fixed-Width Length Prefix",
      "Run-Length Encoding",
    ],
    invariantPrompt:
      "Why does prefixing each string with its length followed by a delimiter (e.g., '4#word') prevent collision with delimiters inside the word?",
    invariantOptions: [
      "Joining strings with a rare punctuation delimiter like '~' reliably prevents collisions across arbitrary ASCII text",
      "A fixed 2-digit length prefix correctly handles arbitrary string lengths without needing delimiter characters",
      "Variable length plus delimiter (len#) allows the parser to read the exact character count, ignoring any '#' inside the word",
      "Run-length encoding compresses repeated characters so that word boundaries can be reconstructed without delimiters",
    ],
    correctInvariantIndex: 2,
    pseudocode: `function encode(strs):
  return join([length(s) + "#" + s for s in strs])

function decode(s):
  res = [], i = 0
  while i < length(s):
    j = find next '#' starting from i
    len = parseInt(s[i..j-1])
    res.append(s[j + 1 .. j + 1 + len - 1])
    i = j + 1 + len
  return res`,
    timeComplexity: "O(N) time for both encode and decode, where N is total character count",
    spaceComplexity: "O(1) auxiliary space (excluding memory for encoded string and returned list)",
    edgeCases: [
      "List contains empty string e.g. [''] encoded as '0#'",
      "List itself is empty e.g. [] encoded as ''",
      "Strings contain the delimiter symbol itself e.g. '3#4#'",
      "Strings with non-ASCII or whitespace characters",
    ],
    explanation: {
      verdict: "Length-Prefixed Chunking (Chunk Framing)",
      whyPattern:
        "Prefixing length + delimiter defines exact slice boundaries. Even if the text contains '#', the length tells the decoder how many bytes to read verbatim.",
      distractorTakedown:
        "Delimiter escaping (e.g., doubling delimiters like '%%') and Base64 encoding are valid alternatives: escaping handles collisions but requires O(N) re-scanning and string resizing; Base64 eliminates binary collisions but adds ~33% size overhead. In contrast, naive delimiter joining genuinely fails because input strings can contain the delimiter (e.g., joining with ',' splits 'a,b' into two words). Fixed-width length prefixes fail when string lengths exceed the allocated byte width. Run-length encoding compresses repeated characters, not word boundaries.",
      takeaway:
        "To serialize arbitrary data containing unknown characters, use length-prefixed framing rather than delimiter separation.",
    },
  },
  {
    id: "longest-consecutive-sequence",
    title: "Longest Consecutive Sequence (LC 128)",
    difficulty: "medium",
    category: "Arrays & Hashing",
    constraints: [
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "Must run in O(n) time",
    ],
    prompt:
      "Given an unsorted integer array nums, return the length of the longest consecutive sequence of elements. You must solve it in O(n) runtime.",
    pattern: "Hash Set Sequence Starting-Point Check",
    patternDistractors: [
      "Adjacent Comparison Without Deduplication",
      "Monotonic Deque",
      "Binary Search Tree Insertion",
    ],
    invariantPrompt:
      "How does the condition '(num - 1) not in num_set' ensure an overall O(n) runtime instead of O(n^2)?",
    invariantOptions: [
      "Sorting the array and incrementing streak when nums[i] == nums[i-1] + 1 correctly handles all arrays with duplicates",
      "A monotonic deque maintains the longest consecutive sequence across array indices in a single linear pass",
      "Inserting all elements into a balanced binary search tree finds the longest sequence in guaranteed O(n) time",
      "Checking that (num - 1) is absent identifies true sequence start points, ensuring each number is visited at most twice",
    ],
    correctInvariantIndex: 3,
    pseudocode: `num_set = hash_set(nums)
max_streak = 0
for num in num_set:
  if (num - 1) not in num_set:
    current = num, streak = 1
    while (current + 1) in num_set:
      current += 1, streak += 1
    max_streak = max(max_streak, streak)
return max_streak`,
    timeComplexity: "O(n) average (worst case depends on the hash implementation)",
    spaceComplexity: "O(n) auxiliary space to store elements in hash set",
    edgeCases: [
      "Empty array returns 0",
      "Array with multiple duplicate values e.g. [0, 1, 1, 2]",
      "Negative consecutive sequences e.g. [-3, -2, -1, 0]",
      "All elements non-consecutive returns 1",
    ],
    explanation: {
      verdict: "Hash Set Sequence Starting-Point Check",
      whyPattern:
        "Inserting all elements into a hash set allows O(1) existence checks. Only starting a sequence traversal when (num - 1) is absent guarantees O(n) total operations.",
      distractorTakedown:
        "Sorting and scanning with deduplication is correct-but-inefficient: it takes O(n log n) time and O(log n) auxiliary stack space (or O(n) depending on language sorting algorithms), violating the strict O(n) time bound. Simple adjacent comparison without duplicate handling fails on inputs like [0, 1, 1, 2] where repeated numbers reset the streak. Monotonic deque only tracks contiguous index windows, not value sequences. Binary search tree insertion takes O(n log n) time with balanced trees and O(n^2) worst-case with unbalanced trees.",
      takeaway:
        "In unsorted sequence searches, identify sequence root elements by verifying the absence of their predecessors to avoid redundant traversals.",
    },
  },
];
