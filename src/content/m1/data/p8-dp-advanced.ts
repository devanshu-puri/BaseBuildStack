import { BlitzProblem } from "../schema";

export const dpAndAdvancedProblems: BlitzProblem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "easy",
    category: "Dynamic Programming",
    constraints: ["1 <= n <= 45"],
    prompt: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    pattern: "1D DP / Fibonacci Space Optimization",
    patternDistractors: ["Breadth-First Search", "Binomial Expansion", "Bitmask Combinations"],
    invariantPrompt: "What recurrence relation calculates ways to reach step i?",
    invariantOptions: [
      "ways[i] = ways[i - 1] + ways[i - 2] (only step i-1 or step i-2 can lead directly to i)",
      "ways[i] = ways[i - 1] * 2",
      "ways[i] = ways[i - 1] + 1",
      "ways[i] = n * (n + 1) / 2"
    ],
    correctInvariantIndex: 0,
    pseudocode: `prev1 = 1, prev2 = 1
for i in 2..n:
  curr = prev1 + prev2
  prev2 = prev1; prev1 = curr
return prev1`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["n = 1 (1 way)", "n = 2 (2 ways)", "n = 3 (3 ways)"],
    explanation: {
      verdict: "1D DP (Fibonacci recurrence)",
      whyPattern: "The state at step n depends solely on states n-1 and n-2. Storing the last two values gives O(1) space and O(n) time.",
      distractorTakedown: "Recursive tree without memoization is O(2^n) exponential.",
      takeaway: "When current state depends only on the last k states, optimize DP space to O(k)."
    }
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "medium",
    category: "Dynamic Programming",
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    prompt: "Given an integer array coins representing coins of different denominations and an integer amount, return the fewest number of coins that you need to make up that amount (or -1 if impossible).",
    pattern: "Bottom-Up 1D DP (Unbounded Knapsack)",
    patternDistractors: ["Greedy (Take largest coin first)", "Breadth-First Search on Graph", "Binary Search on Coins"],
    invariantPrompt: "Why does a greedy approach (picking largest coins first) fail for denominations like [1, 3, 4] for amount 6?",
    invariantOptions: [
      "Greedy picks 4 + 1 + 1 (3 coins), whereas the optimal solution is 3 + 3 (2 coins)",
      "Coins must always be powers of 2",
      "Greedy uses too much memory",
      "Amount must be prime"
    ],
    correctInvariantIndex: 0,
    pseudocode: `dp = [infinity] * (amount + 1)
dp[0] = 0
for a in 1..amount:
  for c in coins:
    if a >= c:
      dp[a] = min(dp[a], 1 + dp[a - c])
return dp[amount] if dp[amount] != infinity else -1`,
    timeComplexity: "O(amount * len(coins))",
    spaceComplexity: "O(amount)",
    edgeCases: ["amount == 0 (0 coins)", "Impossible to form amount (return -1)", "Coin larger than amount"],
    explanation: {
      verdict: "Bottom-Up Unbounded Knapsack DP",
      whyPattern: "Optimal substructure: min coins for `amount` is 1 + min coins for `amount - coin`. DP explores all candidate transitions safely.",
      distractorTakedown: "Greedy fails on non-canonical currency denominations.",
      takeaway: "Coin Change is an unbounded knapsack problem: `dp[a] = min(dp[a], 1 + dp[a - c])`."
    }
  },
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "medium",
    category: "Dynamic Programming",
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4", "Solve in O(n log n) time"],
    prompt: "Given an integer array nums, return the length of the longest strictly increasing subsequence in O(n log n) time.",
    pattern: "Patience Sorting / Binary Search (Tails Array)",
    patternDistractors: ["O(n^2) 1D Dynamic Programming", "Monotonic Stack", "Longest Common Subsequence with Sorted Array"],
    invariantPrompt: "What does tails[i] represent in the O(n log n) Patience Sorting algorithm?",
    invariantOptions: [
      "The smallest tail value of all increasing subsequences of length i + 1 found so far",
      "The longest increasing subsequence ending at index i",
      "The maximum value in the array",
      "The number of subsequences of length i"
    ],
    correctInvariantIndex: 0,
    pseudocode: `tails = []
for x in nums:
  idx = bisect_left(tails, x)
  if idx == len(tails): tails.append(x)
  else: tails[idx] = x
return len(tails)`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Strictly decreasing array (length 1)", "All identical elements (length 1)", "Already sorted ascending"],
    explanation: {
      verdict: "Patience Sorting (Binary Search)",
      whyPattern: "Maintaining smallest possible end-element for each subsequence length enables binary search lookup `bisect_left` for each number in O(log n).",
      distractorTakedown: "Standard DP takes O(n^2), which is too slow for 2500 elements in performance interviews.",
      takeaway: "Replace or append to a monotonic `tails` array with `bisect_left` for O(n log n) LIS."
    }
  },
  {
    id: "word-break",
    title: "Word Break",
    difficulty: "medium",
    category: "Dynamic Programming",
    constraints: ["1 <= s.length <= 300", "1 <= wordDict.length <= 1000", "1 <= wordDict[i].length <= 20", "s and words consist of lowercase English letters"],
    prompt: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
    pattern: "1D Boolean DP (Prefix Reachability)",
    patternDistractors: ["Trie DFS without Memoization", "KMP String Search", "Greedy Substring Match"],
    invariantPrompt: "When is dp[i] (can form s[0..i]) set to true?",
    invariantOptions: [
      "If there exists some j < i such that dp[j] == true AND s[j..i] is in wordDict",
      "When s[i] matches any word's first letter",
      "When len(s) is divisible by word length",
      "If wordDict contains all 26 alphabet characters"
    ],
    correctInvariantIndex: 0,
    pseudocode: `dp = [false] * (len(s) + 1)
dp[0] = true
word_set = Set(wordDict)
for i in 1..len(s):
  for j in 0..i-1:
    if dp[j] and s[j..i] in word_set:
      dp[i] = true; break
return dp[len(s)]`,
    timeComplexity: "O(n^2 * k) where k is max word length",
    spaceComplexity: "O(n)",
    edgeCases: ["Single letter repeated 'aaaaa' with dictionary ['a', 'aa']", "s cannot be formed (missing last char)", "Entire string equals one dictionary word"],
    explanation: {
      verdict: "1D Boolean Prefix DP",
      whyPattern: "A prefix of length i is valid if some smaller valid prefix of length j can be extended by a valid dictionary word `s[j..i]`.",
      distractorTakedown: "Greedy choice of words fails when an earlier long match blocks valid future segments.",
      takeaway: "`dp[i] = any(dp[j] and s[j:i] in dict)` is the classic prefix validation pattern."
    }
  },
  {
    id: "house-robber-ii",
    title: "House Robber II",
    difficulty: "medium",
    category: "Dynamic Programming",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    prompt: "All houses are arranged in a circle. You cannot rob adjacent houses, and the first and last houses are adjacent. Return the maximum amount of money you can rob.",
    pattern: "Linear DP on Two Disjoint Slices",
    patternDistractors: ["Greedy Odd/Even sum", "Circular Queue Simulation", "Min Cut"],
    invariantPrompt: "How is the circular constraint (first and last cannot both be robbed) decomposed into standard House Robber I?",
    invariantOptions: [
      "Compute max(rob_linear(nums[0..n-2]), rob_linear(nums[1..n-1]))",
      "Subtract min(nums[0], nums[n-1]) from total",
      "Rob houses with even indices only",
      "Multiply results of both halves"
    ],
    correctInvariantIndex: 0,
    pseudocode: `if len(nums) == 1: return nums[0]
def rob_linear(houses):
  rob1 = 0, rob2 = 0
  for h in houses:
    new_rob = max(rob1 + h, rob2)
    rob1 = rob2; rob2 = new_rob
  return rob2
return max(rob_linear(nums[:-1]), rob_linear(nums[1:]))`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["nums of length 1 (can rob that single house)", "nums of length 2 (max of the two)", "All house values identical"],
    explanation: {
      verdict: "Decomposition into Two Linear Slices",
      whyPattern: "Since house 0 and house n-1 cannot both be taken, the optimal set is either a subset of houses [0..n-2] OR [1..n-1].",
      distractorTakedown: "Greedy odd/even fails on arrays like [2, 1, 1, 2].",
      takeaway: "Circular DP constraints often reduce to taking the maximum over two linear sub-ranges excluding either end."
    }
  },
  {
    id: "unique-paths",
    title: "Unique Paths",
    difficulty: "medium",
    category: "Dynamic Programming",
    constraints: ["1 <= m, n <= 100"],
    prompt: "A robot is located at the top-left corner of an m x n grid. The robot can only move either down or right at any point in time. How many possible unique paths are there to the bottom-right corner?",
    pattern: "2D Grid DP (Space-Optimized to 1D Row)",
    patternDistractors: ["Breadth-First Search", "DFS with Path Memorization", "Dijkstra"],
    invariantPrompt: "What recurrence relation calculates paths to cell (r, c)?",
    invariantOptions: [
      "paths(r, c) = paths(r - 1, c) + paths(r, c - 1) (sum of paths from cell above and cell to the left)",
      "paths(r, c) = paths(r - 1, c) * paths(r, c - 1)",
      "paths(r, c) = r * c",
      "paths(r, c) = 2^(r + c)"
    ],
    correctInvariantIndex: 0,
    pseudocode: `row = [1] * n
for r in 1..m-1:
  new_row = [1] * n
  for c in 1..n-1:
    new_row[c] = new_row[c - 1] + row[c]
  row = new_row
return row[n - 1]`,
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(n) space-optimized",
    edgeCases: ["m == 1 or n == 1 (always 1 path)", "2x2 grid (2 paths)", "Square vs non-square grid"],
    explanation: {
      verdict: "Grid DP (Top + Left sum)",
      whyPattern: "To arrive at (r, c), robot must come from (r-1, c) or (r, c-1). Summing the two gives total unique paths in O(n) memory.",
      distractorTakedown: "DFS path enumeration takes exponential O(2^(m+n)) time.",
      takeaway: "Grid moves restricted to Down/Right always satisfy `dp[r][c] = dp[r-1][c] + dp[r][c-1]`."
    }
  },
  {
    id: "redundant-connection",
    title: "Redundant Connection",
    difficulty: "medium",
    category: "Advanced",
    constraints: ["n == edges.length", "3 <= n <= 1000", "edges[i].length == 2", "Graph is connected with 1 extra edge"],
    prompt: "A tree is an undirected graph that is connected and has no cycles. Given an edge list of a tree with one additional edge added, return an edge that can be removed so that the resulting graph is a tree of n nodes.",
    pattern: "Disjoint Set Union (Union-Find Cycle Detection)",
    patternDistractors: ["Dijkstra Shortest Path", "Bipartite Coloring", "Kosaraju's Algorithm"],
    invariantPrompt: "How does Union-Find detect the redundant edge in O(alpha(n)) time per edge?",
    invariantOptions: [
      "If find(u) == find(v), u and v are already in the same connected component, meaning edge (u, v) creates a cycle",
      "Union-find sorts edges by weight",
      "Count edge degree at every node",
      "Edges with largest node IDs are always redundant"
    ],
    correctInvariantIndex: 0,
    pseudocode: `parent = [i for i in 0..n]
def find(x):
  if parent[x] != x: parent[x] = find(parent[x])
  return parent[x]
for u, v in edges:
  root_u, root_v = find(u), find(v)
  if root_u == root_v: return [u, v]
  parent[root_u] = root_v`,
    timeComplexity: "O(n * alpha(n)) practically O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Cycle formed at the very last edge", "Triangle cycle [1,2], [2,3], [3,1]", "Self loop"],
    explanation: {
      verdict: "Disjoint Set Union (Union-Find)",
      whyPattern: "Union-Find maintains connected components. If an edge connects two nodes that already share a root representative, it is redundant and creates a cycle.",
      distractorTakedown: "DFS/BFS cycle checks take O(n^2) overall when rerun per edge.",
      takeaway: "For dynamic connectivity and cycle detection on undirected graphs, use Union-Find with path compression."
    }
  },
  {
    id: "implement-trie",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "medium",
    category: "Advanced",
    constraints: ["1 <= word.length, prefix.length <= 2000", "words and prefixes consist only of lowercase English letters", "At most 3 * 10^4 calls"],
    prompt: "A trie (pronounced as 'try') or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement insert, search, and startsWith.",
    pattern: "Trie Node with Children Array and isEnd Flag",
    patternDistractors: ["Hash Table of Full Strings", "Binary Search Tree of Strings", "Suffix Automaton"],
    invariantPrompt: "What is the structural difference between search(word) and startsWith(prefix)?",
    invariantOptions: [
      "search(word) requires node.isEnd == true at the final character; startsWith(prefix) only requires all characters to exist in path",
      "startsWith reverses the search query",
      "search is case-sensitive, startsWith is not",
      "startsWith searches leaves only"
    ],
    correctInvariantIndex: 0,
    pseudocode: `class TrieNode:
  children = {}, isEnd = false

def insert(word):
  curr = root
  for c in word:
    if c not in curr.children: curr.children[c] = TrieNode()
    curr = curr.children[c]
  curr.isEnd = true

def search(word):
  curr = walk(word); return curr != null and curr.isEnd

def startsWith(prefix):
  return walk(prefix) != null`,
    timeComplexity: "insert/search/startsWith: O(L) where L is string length",
    spaceComplexity: "O(total characters * alphabet size)",
    edgeCases: ["Prefix exists but word does not ('app' vs 'apple')", "Single letter words", "Duplicate inserts"],
    explanation: {
      verdict: "Prefix Tree (Trie)",
      whyPattern: "Common prefixes share root paths, allowing retrieval in O(L) proportional to word length rather than dictionary size.",
      distractorTakedown: "Hash table cannot perform `startsWith` without hashing all possible prefixes O(L^2).",
      takeaway: "Trie nodes carry a character map to children and an `isEnd` boolean flag."
    }
  },
  {
    id: "word-search",
    title: "Word Search",
    difficulty: "medium",
    category: "Advanced",
    constraints: ["m == board.length, n == board[i].length", "1 <= m, n <= 6", "1 <= word.length <= 15", "Letters are uppercase English"],
    prompt: "Given an m x n grid of characters board and a string word, return true if word exists in the grid. The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically).",
    pattern: "Backtracking DFS with In-Place Visited Masking",
    patternDistractors: ["Breadth-First Search", "Dynamic Programming", "Dijkstra"],
    invariantPrompt: "How can we mark cell board[r][c] as visited during current path exploration with O(1) space?",
    invariantOptions: [
      "Temporarily mutate board[r][c] = '#' before exploring neighbors, and restore original character on backtrack",
      "Allocate an m x n boolean matrix on each recursive call",
      "Delete the cell permanently",
      "Keep an array of coordinate strings"
    ],
    correctInvariantIndex: 0,
    pseudocode: `def dfs(r, c, idx):
  if idx == len(word): return true
  if r < 0 or r >= m or c < 0 or c >= n or board[r][c] != word[idx]: return false
  tmp = board[r][c]
  board[r][c] = '#' # mark visited
  found = (dfs(r+1, c, idx+1) or dfs(r-1, c, idx+1) or
           dfs(r, c+1, idx+1) or dfs(r, c-1, idx+1))
  board[r][c] = tmp # backtrack
  return found`,
    timeComplexity: "O(m * n * 4^L) where L is word length",
    spaceComplexity: "O(L) recursion stack",
    edgeCases: ["word longer than board cells", "Single character board", "Word cannot reuse same cell twice in path"],
    explanation: {
      verdict: "Backtracking with Cell Masking",
      whyPattern: "We must explore all 4 directions while avoiding reusing cells on the current path. Mutating and reverting `board[r][c]` avoids memory overhead.",
      distractorTakedown: "BFS queue cannot easily maintain independent visited sets for exponential branching paths.",
      takeaway: "Temporarily mutate grid to '#' and restore on unwind to backtrack in O(1) space."
    }
  },
  {
    id: "combination-sum",
    title: "Combination Sum",
    difficulty: "medium",
    category: "Advanced",
    constraints: ["1 <= candidates.length <= 30", "2 <= candidates[i] <= 40", "All elements of candidates are distinct", "1 <= target <= 40"],
    prompt: "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return combinations in any order. The same number may be chosen unlimited times.",
    pattern: "Backtracking with Index Maintenance (Decision Tree)",
    patternDistractors: ["Dynamic Programming Table", "Greedy Subtraction", "Bitmask Combinations"],
    invariantPrompt: "How are duplicate combinations (like [2, 2, 3] and [3, 2, 2]) prevented during backtracking?",
    invariantOptions: [
      "Pass current index i to recursive calls so future choices can only pick candidates[i..n-1], enforcing non-decreasing order",
      "Sort all combinations after generating and insert into a set",
      "Only pick even numbers first",
      "Reset search from 0 on every step"
    ],
    correctInvariantIndex: 0,
    pseudocode: `res = []
def backtrack(remain, combo, start):
  if remain == 0: res.append(list(combo)); return
  if remain < 0: return
  for i in start..len(candidates)-1:
    combo.append(candidates[i])
    backtrack(remain - candidates[i], combo, i) # reuse i allowed
    combo.pop()
backtrack(target, [], 0)
return res`,
    timeComplexity: "O(2^target)",
    spaceComplexity: "O(target / min(candidate))",
    edgeCases: ["Smallest candidate greater than target (empty result)", "Target formed by repeated single candidate", "Multiple distinct paths to target"],
    explanation: {
      verdict: "Backtracking with Index Constraint",
      whyPattern: "By passing the current index `start` to recursive calls, candidates are picked in non-decreasing index order, completely preventing duplicate permutations.",
      distractorTakedown: "Generating all permutations and filtering in a set explodes time complexity.",
      takeaway: "In combination generation, restrict subsequent picks to index `>= current` to avoid duplicate permutations."
    }
  }
];
