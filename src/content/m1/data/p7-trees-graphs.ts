import { BlitzProblem } from "../schema";

export const treesAndGraphsProblems: BlitzProblem[] = [
  {
    id: "lowest-common-ancestor-bst",
    title: "Lowest Common Ancestor of a Binary Search Tree",
    difficulty: "medium",
    category: "Trees",
    constraints: ["2 <= number of nodes <= 10^5", "-10^9 <= Node.val <= 10^9", "All Node.val are unique", "p and q exist in the BST"],
    prompt: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
    pattern: "BST Value Divergence Property",
    patternDistractors: ["General Tree Post-order DFS", "Tarjan's LCA with Disjoint Set", "Level-order BFS"],
    invariantPrompt: "How does BST ordering allow determining LCA in O(height) without visiting children?",
    invariantOptions: [
      "If both p and q values are strictly less than root, search left; if strictly greater, search right; otherwise root is the split point (LCA)",
      "LCA is always the root of the tree",
      "Check depth of p and depth of q",
      "LCA is always the node with minimum value"
    ],
    correctInvariantIndex: 0,
    pseudocode: `curr = root
while curr:
  if p.val < curr.val and q.val < curr.val:
    curr = curr.left
  elif p.val > curr.val and q.val > curr.val:
    curr = curr.right
  else:
    return curr`,
    timeComplexity: "O(h) where h is tree height",
    spaceComplexity: "O(1)",
    edgeCases: ["One of p or q is the ancestor of the other", "Root itself is the LCA", "Skewed BST"],
    explanation: {
      verdict: "BST Split Point Property",
      whyPattern: "In a BST, the first node where paths to p and q diverge (or one equals current node) is guaranteed to be the lowest common ancestor.",
      distractorTakedown: "General tree LCA requires post-order traversal visiting all subtrees; BST property solves it in O(h) with O(1) space.",
      takeaway: "In BSTs, divergence of values marks the exact LCA."
    }
  },
  {
    id: "binary-tree-maximum-path-sum",
    title: "Binary Tree Maximum Path Sum",
    difficulty: "hard",
    category: "Trees",
    constraints: ["1 <= number of nodes <= 3 * 10^4", "-1000 <= Node.val <= 1000"],
    prompt: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge. Return the maximum path sum of any non-empty path.",
    pattern: "Post-order DFS with Global Max Update",
    patternDistractors: ["Breadth-First Search", "Dijkstra's Algorithm", "Top-Down Greedy"],
    invariantPrompt: "What value does each recursive node return to its parent vs what value updates the global max?",
    invariantOptions: [
      "Returns node.val + max(0, max(left_gain, right_gain)) to parent; updates global max with node.val + left_gain + right_gain",
      "Returns both left and right branches to parent",
      "Returns sum of all subtree nodes",
      "Always returns positive infinity"
    ],
    correctInvariantIndex: 0,
    pseudocode: `max_sum = -infinity
def gain(node):
  if not node: return 0
  left = max(gain(node.left), 0)
  right = max(gain(node.right), 0)
  max_sum = max(max_sum, node.val + left + right)
  return node.val + max(left, right)
gain(root)
return max_sum`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(h) for call stack",
    edgeCases: ["All nodes are negative numbers [-3, -2, -1]", "Single node tree", "Path does not pass through root"],
    explanation: {
      verdict: "Post-order DFS Subtree Gain",
      whyPattern: "A path can only extend upward through ONE child branch (to maintain a non-branching path), but the node itself can join BOTH children at its peak.",
      distractorTakedown: "BFS cannot compute bottom-up maximum contributions.",
      takeaway: "Separate the return value (single branch to parent) from the local update (peak combining both branches)."
    }
  },
  {
    id: "serialize-and-deserialize-binary-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "hard",
    category: "Trees",
    constraints: ["0 <= number of nodes <= 10^4", "-1000 <= Node.val <= 1000"],
    prompt: "Design an algorithm to serialize and deserialize a binary tree without restriction on format, ensuring original tree structure can be faithfully reconstructed.",
    pattern: "Pre-order DFS with Null Sentinels",
    patternDistractors: ["In-order Traversal", "In-order + Pre-order Array Rebuilding", "Graph Adjacency List"],
    invariantPrompt: "Why does pre-order traversal with explicit null markers ('#') uniquely reconstruct any binary tree without needing an in-order array?",
    invariantOptions: [
      "Null sentinels unambiguously record missing branches; root is always the first token, followed recursively by left and right subtrees",
      "Pre-order trees are always complete",
      "Null markers encode parent pointers",
      "Numbers are strictly increasing in pre-order"
    ],
    correctInvariantIndex: 0,
    pseudocode: `def serialize(root):
  if not root: return "#,"
  return str(root.val) + "," + serialize(root.left) + serialize(root.right)

def deserialize(data):
  tokens = iter(data.split(","))
  def build():
    val = next(tokens)
    if val == "#": return null
    node = Node(int(val))
    node.left = build(); node.right = build()
    return node
  return build()`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Empty tree", "Single node tree", "Highly skewed tree"],
    explanation: {
      verdict: "Pre-order DFS with Null Sentinels",
      whyPattern: "Without null sentinels, two traversals are needed (e.g. pre + in). With explicit null markers, pre-order uniquely encodes tree topology in O(n).",
      distractorTakedown: "In-order traversal alone cannot distinguish left vs right null branches.",
      takeaway: "Explicit null sentinels allow single-traversal serialization."
    }
  },
  {
    id: "binary-tree-right-side-view",
    title: "Binary Tree Right Side View",
    difficulty: "medium",
    category: "Trees",
    constraints: ["0 <= number of nodes <= 100", "-100 <= Node.val <= 100"],
    prompt: "Given the root of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.",
    pattern: "Level-Order BFS (Last Node per Level)",
    patternDistractors: ["DFS right-only traversal (fails if left subtree is deeper)", "Morris Traversal", "Topological Sort"],
    invariantPrompt: "Why does traversing level-by-level with BFS guarantee seeing the rightmost node at every depth?",
    invariantOptions: [
      "The last element processed in a level's queue is the rightmost visible node at that depth, even if it is a left child",
      "Only right child nodes are visible from the right side",
      "The deepest node is always on the right",
      "Level sizes are always powers of 2"
    ],
    correctInvariantIndex: 0,
    pseudocode: `if not root: return []
q = [root], res = []
while q:
  size = len(q)
  for i in 0..size-1:
    node = q.pop_front()
    if i == size - 1: res.append(node.val)
    if node.left: q.append(node.left)
    if node.right: q.append(node.right)
return res`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    edgeCases: ["Tree with only left children (all left nodes are visible)", "Empty tree", "Single node"],
    explanation: {
      verdict: "Level-Order BFS Queue",
      whyPattern: "Level-order guarantees depth-by-depth exploration. Grabbing the last element of each queue level handles uneven subtrees gracefully.",
      distractorTakedown: "Simply following right pointers misses deeper left-side nodes that become visible once right subtree terminates.",
      takeaway: "Right side view means: 'last node at each depth level'."
    }
  },
  {
    id: "diameter-of-binary-tree",
    title: "Diameter of Binary Tree",
    difficulty: "easy",
    category: "Trees",
    constraints: ["1 <= number of nodes <= 10^4", "-100 <= Node.val <= 100"],
    prompt: "Given the root of a binary tree, return the length of the diameter of the tree. The diameter is the length of the longest path between any two nodes in a tree.",
    pattern: "Depth-First Post-order (Left Depth + Right Depth)",
    patternDistractors: ["Breadth-First Search", "Diameter on Adjacency Matrix", "Prim's MST"],
    invariantPrompt: "What is the longest path passing through any node?",
    invariantOptions: [
      "max_depth(node.left) + max_depth(node.right)",
      "max_depth(node.left) * 2",
      "node.val + max_depth(node)",
      "total nodes in subtree - 1"
    ],
    correctInvariantIndex: 0,
    pseudocode: `diameter = 0
def depth(node):
  if not node: return 0
  l = depth(node.left)
  r = depth(node.right)
  diameter = max(diameter, l + r)
  return 1 + max(l, r)
depth(root)
return diameter`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(h)",
    edgeCases: ["Diameter does not pass through root", "Skewed tree (diameter is total length)", "Two nodes tree"],
    explanation: {
      verdict: "Post-order Depth Aggregation",
      whyPattern: "At every node, the longest path that peaks at this node is left_depth + right_depth. Maintain a global maximum while returning 1 + max(L, R).",
      distractorTakedown: "Top-down re-calculation is O(n^2); bottom-up DFS achieves O(n).",
      takeaway: "Path diameter is simply the max sum of left and right branch heights."
    }
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "medium",
    category: "Graphs",
    constraints: ["m == grid.length, n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is '0' or '1'"],
    prompt: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    pattern: "Grid DFS/BFS Connected Component Traversal",
    patternDistractors: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Bellman-Ford"],
    invariantPrompt: "How do we prevent infinite loops when traversing adjacent land cells in-place?",
    invariantOptions: [
      "Sink visited land cells by mutating grid[r][c] = '0' (or marking visited)",
      "Only traverse right and down",
      "Count total '1's and divide by 4",
      "Store visited cells in a 1D array"
    ],
    correctInvariantIndex: 0,
    pseudocode: `count = 0
for r in 0..m-1:
  for c in 0..n-1:
    if grid[r][c] == '1':
      count += 1
      sink_island_dfs(grid, r, c)
return count`,
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(m * n) worst case recursion stack",
    edgeCases: ["All water '0'", "All land '1'", "1x1 grid"],
    explanation: {
      verdict: "Connected Components DFS Sink",
      whyPattern: "Each unvisited '1' initiates a flood fill that marks all connected land cells as visited. Each traversal trigger corresponds to one island.",
      distractorTakedown: "Shortest path algorithms (Dijkstra) are unneeded; this is component reachability.",
      takeaway: "In grid graph searches, mutate cell to water ('0') to track visited in O(1) extra space."
    }
  },
  {
    id: "clone-graph",
    title: "Clone Graph",
    difficulty: "medium",
    category: "Graphs",
    constraints: ["0 <= number of nodes <= 100", "1 <= Node.val <= 100", "Graph is connected and undirected"],
    prompt: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    pattern: "DFS/BFS with Visited Map (Original -> Clone)",
    patternDistractors: ["Topological Sort", "Eulerian Path", "Bipartite Check"],
    invariantPrompt: "Why must we pass an originalNode -> cloneNode hash map during graph traversal?",
    invariantOptions: [
      "To prevent infinite recursion on cycles and to avoid duplicate node allocations",
      "To sort the graph vertices",
      "To compute node degrees",
      "Because graph nodes have string keys"
    ],
    correctInvariantIndex: 0,
    pseudocode: `visited = {}
def clone(node):
  if not node: return null
  if node in visited: return visited[node]
  copy = Node(node.val)
  visited[node] = copy
  for neighbor in node.neighbors:
    copy.neighbors.append(clone(neighbor))
  return copy
return clone(start_node)`,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    edgeCases: ["Empty graph (null node)", "Single node with no neighbors", "Graph with self-cycles"],
    explanation: {
      verdict: "Graph DFS with Clone Map",
      whyPattern: "Store each newly created clone in a map before recursing into neighbors. Cyclic edges look up the already created clone from the map.",
      distractorTakedown: "Without map, cycles cause infinite recursion stack overflow.",
      takeaway: "Deep copying arbitrary graphs requires a `Map<OldNode, NewNode>` to handle cycles."
    }
  },
  {
    id: "course-schedule-ii",
    title: "Course Schedule II",
    difficulty: "medium",
    category: "Graphs",
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= numCourses * (numCourses - 1)", "All pairs [a, b] are distinct"],
    prompt: "Return the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible, return an empty array.",
    pattern: "Topological Sort (Kahn's Algorithm with In-degrees)",
    patternDistractors: ["Prim's Algorithm", "Max Flow Min Cut", "Graham Scan"],
    invariantPrompt: "In Kahn's Algorithm, which courses can be immediately added to the queue to be taken?",
    invariantOptions: [
      "Courses with in-degree == 0 (no remaining unfulfilled prerequisites)",
      "Courses with out-degree == 0",
      "Courses with the smallest course ID",
      "Courses that have cycles"
    ],
    correctInvariantIndex: 0,
    pseudocode: `indegree = [0] * n, adj = [[] for _ in 0..n]
for dest, src in prereqs:
  adj[src].append(dest); indegree[dest] += 1
q = [i for i in 0..n-1 if indegree[i] == 0]
order = []
while q:
  curr = q.pop_front(); order.append(curr)
  for nxt in adj[curr]:
    indegree[nxt] -= 1
    if indegree[nxt] == 0: q.append(nxt)
return order if len(order) == n else []`,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V + E)",
    edgeCases: ["Cycle exists (impossible: return [])", "Disconnected components", "No prerequisites (any order valid)"],
    explanation: {
      verdict: "Kahn's Topological Sort (In-degrees)",
      whyPattern: "Kahn's algorithm takes nodes with 0 incoming dependencies, removes their edges, and repeats. If total taken equals numCourses, ordering is a DAG topological sort.",
      distractorTakedown: "MST algorithms do not order directed dependencies.",
      takeaway: "Topological sort always uses: in-degree tracking + queue of 0-indegree nodes."
    }
  },
  {
    id: "pacific-atlantic-water-flow",
    title: "Pacific Atlantic Water Flow",
    difficulty: "medium",
    category: "Graphs",
    constraints: ["m == heights.length, n == heights[r].length", "1 <= m, n <= 200", "0 <= heights[r][c] <= 10^5"],
    prompt: "Given an m x n matrix of heights, water flows to neighbor cells with height <= current. Find all grid coordinates where water can flow to BOTH the Pacific and Atlantic oceans.",
    pattern: "Reverse Multi-Source DFS/BFS from Ocean Boundaries",
    patternDistractors: ["Dijkstra Shortest Path", "Simulate Flow from Every Cell O((m*n)^2)", "Union-Find"],
    invariantPrompt: "Why reverse the flow direction and search uphill from the oceans?",
    invariantOptions: [
      "Starting from ocean borders and moving to higher/equal neighbors only visits reachable cells in O(m * n) total time",
      "Oceans are always at height zero",
      "Water cannot flow uphill",
      "It avoids grid bounds checking"
    ],
    correctInvariantIndex: 0,
    pseudocode: `pacific = Set(), atlantic = Set()
# Run DFS inward from Pacific edges (top/left) where next_height >= curr_height
# Run DFS inward from Atlantic edges (bottom/right) where next_height >= curr_height
return list(pacific.intersection(atlantic))`,
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(m * n)",
    edgeCases: ["All cells have same height", "1x1 grid (always touches both)", "Ridge barrier blocking flow"],
    explanation: {
      verdict: "Reverse Flow from Boundaries",
      whyPattern: "Simulating flow from every cell is O((m*n)^2). Reversing flow from ocean borders inward finds cells reaching each ocean in O(m*n), then intersecting sets.",
      distractorTakedown: "Forward simulation has massive redundant re-computation.",
      takeaway: "When checking reachability to multiple perimeter targets, search inward from the perimeters."
    }
  },
  {
    id: "word-ladder",
    title: "Word Ladder",
    difficulty: "hard",
    category: "Graphs",
    constraints: ["1 <= beginWord.length <= 10", "endWord.length == beginWord.length", "1 <= wordList.length <= 5000", "All strings consist of lowercase English letters"],
    prompt: "Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord (changing 1 letter at a time).",
    pattern: "Breadth-First Search (Shortest Path in Unweighted Graph)",
    patternDistractors: ["Depth-First Search", "Dijkstra's Algorithm", "A* Search with Heuristic"],
    invariantPrompt: "Why is BFS strictly required rather than DFS to find the shortest transformation sequence?",
    invariantOptions: [
      "Unweighted edge costs mean BFS guarantees exploring all paths of length k before length k + 1, finding minimum steps",
      "DFS is faster for finding shortest paths",
      "Graph has negative weights",
      "Words can only be matched by length"
    ],
    correctInvariantIndex: 0,
    pseudocode: `word_set = Set(wordList)
if endWord not in word_set: return 0
q = [(beginWord, 1)], visited = {beginWord}
while q:
  word, steps = q.pop_front()
  if word == endWord: return steps
  for i in 0..len(word)-1:
    for c in 'a'..'z':
      nxt = word[:i] + c + word[i+1:]
      if nxt in word_set and nxt not in visited:
        visited.add(nxt); q.append((nxt, steps + 1))
return 0`,
    timeComplexity: "O(M^2 * N) where M is word length and N is wordList size",
    spaceComplexity: "O(M * N)",
    edgeCases: ["endWord not in wordList (return 0)", "beginWord differs by 1 letter from endWord", "No valid path"],
    explanation: {
      verdict: "Shortest Path BFS",
      whyPattern: "Each one-letter transition is an unweighted edge. BFS discovers the shortest path level by level in guaranteed minimum steps.",
      distractorTakedown: "DFS can explore deep rabbit holes and requires exploring all paths to prove minimality.",
      takeaway: "In unweighted state transitions, BFS guarantees the shortest path on first contact."
    }
  }
];
