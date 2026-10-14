import { BlitzProblem } from "../schema";

export const linkedListProblems: BlitzProblem[] = [
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "easy",
    category: "Linked Lists",
    constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000", "O(1) extra space"],
    prompt: "Given the head of a singly linked list, reverse the list, and return the reversed list in-place.",
    pattern: "Three Pointers (prev, curr, next) In-place Reversal",
    patternDistractors: ["Array Reversal", "Recursion Call Stack", "Doubly Linked List Conversion"],
    invariantPrompt: "Why save curr.next before mutating curr.next = prev?",
    invariantOptions: [
      "Mutating curr.next overwrites the forward link, losing access to the rest of the list unless saved in advance",
      "prev pointer would become null",
      "head must always remain at the beginning",
      "Garbage collection deletes curr immediately"
    ],
    correctInvariantIndex: 0,
    pseudocode: `prev = null, curr = head
while curr:
  nxt = curr.next
  curr.next = prev
  prev = curr
  curr = nxt
return prev`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Empty list", "Single node list", "Two nodes list"],
    explanation: {
      verdict: "Three Pointers In-place Reversal",
      whyPattern: "Store forward pointer, redirect current to previous, advance previous and current. O(n) time and O(1) space.",
      distractorTakedown: "Recursive solution uses O(n) call stack memory.",
      takeaway: "Always cache `nxt = curr.next` before flipping pointers."
    }
  },
  {
    id: "reverse-nodes-in-k-group",
    title: "Reverse Nodes in k-Group",
    difficulty: "hard",
    category: "Linked Lists",
    constraints: ["The number of nodes in the list is n", "1 <= k <= n <= 5000", "0 <= Node.val <= 1000", "O(1) extra space"],
    prompt: "Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list. Nodes that do not form a complete group of k should remain as they are.",
    pattern: "Dummy Node + Group Reversal with Pre-Check",
    patternDistractors: ["Array Copy", "Priority Queue", "Recursion with Buffer"],
    invariantPrompt: "What check must be performed before reversing any k-sized group?",
    invariantOptions: [
      "Check if at least k nodes remain in the current segment; if fewer than k remain, leave them untouched",
      "Check if k is an even number",
      "Reverse from the tail backward",
      "Count total nodes and discard remainder"
    ],
    correctInvariantIndex: 0,
    pseudocode: `dummy = Node(0, head), group_prev = dummy
while true:
  kth = get_kth_node(group_prev, k)
  if not kth: break
  group_next = kth.next
  # reverse group [group_prev.next .. kth]
  prev = group_next, curr = group_prev.next
  while curr != group_next:
    nxt = curr.next; curr.next = prev; prev = curr; curr = nxt
  tmp = group_prev.next; group_prev.next = kth; group_prev = tmp`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["k == 1 (no changes)", "n is multiple of k", "k == n"],
    explanation: {
      verdict: "Dummy Node + Segment In-place Reversal",
      whyPattern: "Pre-verifies k-node existence, connects previous group tail to new group head, and keeps remnant intact in O(1) space.",
      distractorTakedown: "Array conversion allocates O(n) extra space violating strict interview requirements.",
      takeaway: "Use a dummy node before head so group connection logic remains uniform across all groups."
    }
  },
  {
    id: "reorder-list",
    title: "Reorder List",
    difficulty: "medium",
    category: "Linked Lists",
    constraints: ["1 <= number of nodes <= 5 * 10^4", "1 <= Node.val <= 1000", "Modify list in-place without altering node values"],
    prompt: "You are given the head of a singly linked-list: L0 → L1 → … → Ln-1 → Ln. Reorder it to: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → … in-place.",
    pattern: "Find Middle + Reverse Second Half + Interleave Merge",
    patternDistractors: ["Array Double-Ended Queue", "Quadratic Scan", "Cycle Traversal"],
    invariantPrompt: "What are the three canonical steps to reorder the linked list in O(n) time and O(1) space?",
    invariantOptions: [
      "1. Find middle with slow/fast; 2. Reverse second half; 3. Interleave merge first and reversed second halves",
      "1. Convert to array; 2. Sort array; 3. Rebuild list",
      "1. Traverse list backwards using stack; 2. Swap values",
      "1. Rotate list by n/2; 2. Reverse all nodes"
    ],
    correctInvariantIndex: 0,
    pseudocode: `mid = find_middle(head)
second = reverse(mid.next)
mid.next = null
first = head
while second:
  tmp1 = first.next, tmp2 = second.next
  first.next = second; second.next = tmp1
  first = tmp1; second = tmp2`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Odd number of nodes", "Even number of nodes", "List with 1 or 2 nodes"],
    explanation: {
      verdict: "Middle + Reverse + Interleave",
      whyPattern: "Decomposes a complex problem into 3 standard sub-routines (fast/slow pointers, in-place reversal, two-pointer zip merge), all running in O(n) time and O(1) space.",
      distractorTakedown: "Deque requires O(n) memory.",
      takeaway: "Complex linked list reorderings almost always decompose into: split at mid, reverse half, merge."
    }
  },
  {
    id: "swap-nodes-in-pairs",
    title: "Swap Nodes in Pairs",
    difficulty: "medium",
    category: "Linked Lists",
    constraints: ["0 <= number of nodes <= 100", "0 <= Node.val <= 100"],
    prompt: "Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed).",
    pattern: "Dummy Node + Pair Pointer Rewiring",
    patternDistractors: ["Bubble Sort", "Node Value Swap", "Stack Reversal"],
    invariantPrompt: "To swap first and second node after prev, what pointer updates occur in order?",
    invariantOptions: [
      "first.next = second.next; second.next = first; prev.next = second; prev = first",
      "prev.next = first; first.next = second",
      "second.next = prev; prev.next = first",
      "first.next = prev; second.next = null"
    ],
    correctInvariantIndex: 0,
    pseudocode: `dummy = Node(0, head), prev = dummy
while prev.next and prev.next.next:
  first = prev.next, second = prev.next.next
  first.next = second.next
  second.next = first
  prev.next = second
  prev = first
return dummy.next`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Empty list", "Odd number of nodes (last remains unswapped)", "Exactly two nodes"],
    explanation: {
      verdict: "Pair Rewiring with Dummy Node",
      whyPattern: "Dummy node gives prev pointer for head pair. Swapping involves rewiring 3 pointers per pair in O(1) space.",
      distractorTakedown: "Modifying values violates strict constraint; recursion uses stack space.",
      takeaway: "Swapping adjacent pairs requires referencing the predecessor node `prev`."
    }
  },
  {
    id: "palindrome-linked-list",
    title: "Palindrome Linked List",
    difficulty: "easy",
    category: "Linked Lists",
    constraints: ["The number of nodes in the list is in the range [1, 10^5]", "0 <= Node.val <= 9", "O(n) time and O(1) space"],
    prompt: "Given the head of a singly linked list, return true if it is a palindrome or false otherwise in O(n) time and O(1) extra space.",
    pattern: "Find Middle + Reverse Second Half + Symmetric Comparison",
    patternDistractors: ["Array Copy and Two Pointers", "String Concatenation", "Recursive Unwind"],
    invariantPrompt: "How can we check palindrome symmetry with O(1) extra space?",
    invariantOptions: [
      "Find list midpoint with fast/slow pointers, reverse the second half in-place, then compare values from head and reversed second half",
      "Copy values into an ArrayList and check palindrome",
      "Hash all node values into a 64-bit integer",
      "Reverse the entire list from head"
    ],
    correctInvariantIndex: 0,
    pseudocode: `slow = head, fast = head
while fast and fast.next:
  slow = slow.next; fast = fast.next.next
rev = reverse(slow)
p1 = head, p2 = rev
while p2:
  if p1.val != p2.val: return false
  p1 = p1.next; p2 = p2.next
return true`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    edgeCases: ["Odd length list", "Even length list", "Single node list [1]"],
    explanation: {
      verdict: "Midpoint + Reverse Half",
      whyPattern: "Reversing second half in-place enables forward comparison from head and tail simultaneously without allocating an array.",
      distractorTakedown: "Array copy requires O(n) space.",
      takeaway: "In single linked lists where you need two pointers from ends, reverse the second half."
    }
  }
];
