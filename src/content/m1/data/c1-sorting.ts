import { BlitzProblem } from "../schema";

export const sortingConceptProblems: BlitzProblem[] = [
  {
    id: "concept-sorting-stability-guarantee",
    kind: "concept",
    title: "Stable Sorting Under Guaranteed O(n log n) Bounds",
    difficulty: "easy",
    category: "Sorting Concepts",
    constraints: [
      "n = 10^7 database records",
      "Must preserve relative order of equal keys (Stable)",
      "Strict O(n log n) worst-case time bound required",
    ],
    prompt:
      "You must sort 10 million database records where equal keys must preserve their original insertion order, with a guaranteed O(n log n) worst-case time limit. Which algorithm fits?",
    pattern: "Merge Sort (Divide and Conquer)",
    patternDistractors: [
      "Quicksort (Lomuto Partition)",
      "Heapsort",
      "Insertion Sort",
    ],
    invariantPrompt:
      "Why does Merge Sort fulfill both requirements while Heapsort and standard Quicksort fail this scenario?",
    invariantOptions: [
      "Heapsort is completely stable but requires O(n) auxiliary recursion stack frames that violate database constraints",
      "Quicksort is strictly stable across all pivot selections but degrades to O(n log^2 n) when processing duplicate records",
      "Merge Sort guarantees O(n log n) in all cases and preserves equal key stability during sub-array merging, whereas Heapsort is inherently unstable and Quicksort has an O(n^2) worst case",
      "Insertion Sort guarantees O(n log n) on large randomly ordered datasets while using strictly O(1) auxiliary space",
    ],
    correctInvariantIndex: 2,
    pseudocode: `function merge_sort(arr):
  if length(arr) <= 1: return arr
  mid = length(arr) // 2
  left = merge_sort(arr[0..mid-1])
  right = merge_sort(arr[mid..end])
  return merge_stable(left, right) // <= keeps left first`,
    timeComplexity: "O(n log n) in all cases (best, average, and worst)",
    spaceComplexity: "O(n) auxiliary space for arrays (O(1) for linked lists)",
    edgeCases: [
      "All keys equal: stability test ensures original sequence is preserved",
      "Already sorted array: still O(n log n) without adaptive checks",
      "Reversed input array: merges execute normally without depth traps",
      "Single element or empty input",
    ],
    explanation: {
      verdict: "Merge Sort (Divide and Conquer)",
      whyPattern:
        "Merge sort's divide-and-conquer merges preserve left-before-right order on equal keys (using <=), guaranteeing both stability and O(n log n) worst-case bounds.",
      distractorTakedown:
        "Heapsort guarantees O(n log n) time and O(1) space, but long-distance heap swaps break relative order of equal keys (unstable). Quicksort is cache-friendly with O(n log n) average time, but standard partitioning is unstable and degrades to O(n^2) worst-case on pathological pivots. Insertion sort is stable, but runs in O(n^2) time on large unsorted arrays.",
      takeaway:
        "When stability and strict O(n log n) worst-case guarantees are required, Merge Sort is the standard choice despite its O(n) space cost.",
    },
  },
  {
    id: "concept-sorting-adaptive-insertion",
    kind: "concept",
    title: "Adaptive Sorting for Nearly-Sorted or Small Streams",
    difficulty: "easy",
    category: "Sorting Concepts",
    constraints: [
      "n <= 50 elements OR each element is at most k positions from target (k << n)",
      "Memory overhead must be strictly O(1) auxiliary space",
    ],
    prompt:
      "You are sorting a continuous stream where new elements arrive almost in sorted order (at most 2 positions away from their final sorted index). Which algorithm achieves linear O(n) time?",
    pattern: "Insertion Sort (Adaptive In-Place)",
    patternDistractors: ["Selection Sort", "Heapsort", "Merge Sort"],
    invariantPrompt:
      "What algorithmic property allows Insertion Sort to achieve O(n) time on nearly sorted arrays while Selection Sort remains O(n^2)?",
    invariantOptions: [
      "Selection Sort operates recursively using logarithmic stack frames that prevent early termination on sorted inputs",
      "Selection Sort requires scanning the entire unsorted suffix for the minimum regardless of how sorted the prefix is, whereas Insertion Sort breaks inner loops early",
      "Merge Sort degrades to O(n^2) on nearly sorted inputs because dividing already ordered subsegments causes redundant merges",
      "Heapsort requires pre-sorting the input array in O(n^2) time before constructing the binary heap tree structure",
    ],
    correctInvariantIndex: 1,
    pseudocode: `for i from 1 to n - 1:
  key = arr[i], j = i - 1
  while j >= 0 and arr[j] > key:
    arr[j + 1] = arr[j]
    j -= 1
  arr[j + 1] = key`,
    timeComplexity: "O(n) best (nearly sorted), O(n^2) average and worst-case",
    spaceComplexity: "O(1) auxiliary space (in-place and stable)",
    edgeCases: [
      "Already fully sorted array: runs in exactly O(n) comparisons",
      "Reverse sorted array: triggers worst-case O(n^2) shifts",
      "All duplicate elements: runs in linear O(n) time",
      "k = 1 permutation (single adjacent swap)",
    ],
    explanation: {
      verdict: "Insertion Sort (Adaptive In-Place)",
      whyPattern:
        "Insertion sort is adaptive: its inner loop terminates as soon as an element <= key is reached, requiring only O(1) work per element when each item is within constant distance k.",
      distractorTakedown:
        "Selection sort is non-adaptive: it must examine all remaining elements to find the global minimum, taking Omega(n^2) comparisons even if already sorted. Merge sort always executes full divide-and-conquer in O(n log n) time and uses O(n) space. Heapsort always takes O(n log n) time and is non-adaptive.",
      takeaway:
        "Insertion sort is the optimal adaptive sort for nearly sorted inputs and short subarrays (the base case of TimSort and IntroSort).",
    },
  },
  {
    id: "concept-sorting-heapsort-in-place",
    kind: "concept",
    title: "Guaranteed O(n log n) with Zero Auxiliary Memory Allocation",
    difficulty: "medium",
    category: "Sorting Concepts",
    constraints: [
      "Embedded safety-critical system",
      "Strict zero heap allocation (O(1) auxiliary memory)",
      "Guaranteed O(n log n) worst-case time without recursion stack risks",
    ],
    prompt:
      "An embedded avionics system forbids dynamic memory allocation and recursive stack growth, but requires guaranteed O(n log n) worst-case sorting time. Which algorithm satisfies all constraints?",
    pattern: "Heapsort (In-Place Array Heap)",
    patternDistractors: ["Merge Sort", "Quicksort", "Counting Sort"],
    invariantPrompt:
      "Why does Heapsort fit strict embedded memory constraints where Quicksort and Merge Sort cannot be deployed?",
    invariantOptions: [
      "Quicksort requires auxiliary array copying of size O(n) while Merge Sort requires O(log n) heap allocations",
      "Heapsort is completely stable and processes sorted arrays in linear O(n) time without any element comparisons",
      "Counting Sort is forbidden because it requires floating-point hardware registers unavailable on embedded microcontrollers",
      "Heapsort organizes the array in-place with iterative sift-downs in O(1) space, whereas Merge Sort needs O(n) buffer and Quicksort needs O(log n) stack",
    ],
    correctInvariantIndex: 3,
    pseudocode: `build_max_heap(arr) // O(n) bottom-up sift-down
for i from n - 1 down to 1:
  swap(arr[0], arr[i])
  sift_down(arr, 0, i) // O(log n) iterative`,
    timeComplexity: "O(n log n) in all cases (best, average, and worst)",
    spaceComplexity: "O(1) auxiliary space (in-place, non-recursive, unstable)",
    edgeCases: [
      "All elements identical: runs in O(n log n) time",
      "Already sorted array: still undergoes O(n) build-heap and O(n log n) sifts",
      "Strictly decreasing array",
      "Two-element array",
    ],
    explanation: {
      verdict: "Heapsort (In-Place Array Heap)",
      whyPattern:
        "Building a max-heap in-place takes O(n) time, and iteratively extracting the root takes O(n log n) time, all within the input array using zero extra memory and zero recursion.",
      distractorTakedown:
        "Merge sort requires an O(n) auxiliary buffer for merging. Quicksort requires O(log n) stack memory even with tail-call optimization (and O(n) worst-case stack without it), risking stack overflow in constrained memory. Counting sort requires auxiliary count arrays proportional to key range O(k).",
      takeaway:
        "Heapsort guarantees O(n log n) time with true O(1) auxiliary space and zero stack frames, making it the bedrock fallback of IntroSort.",
    },
  },
  {
    id: "concept-sorting-quicksort-pivots",
    kind: "concept",
    title: "Quicksort Partitioning & Worst-Case Degeneracy",
    difficulty: "medium",
    category: "Sorting Concepts",
    constraints: [
      "Unsorted or partially sorted array of length n",
      "Cache efficiency is critical",
      "Must prevent O(n^2) worst case on sorted or duplicate inputs",
    ],
    prompt:
      "Standard Quicksort picking the first element as pivot degrades to O(n^2) time on already sorted inputs. Which technique prevents this degradation while keeping O(n log n) average performance?",
    pattern: "Median-of-Three with 3-Way Dutch National Flag Partitioning",
    patternDistractors: [
      "Lomuto Single Pivot Partitioning",
      "Always Picking Middle Index",
      "Converting to Bubble Sort",
    ],
    invariantPrompt:
      "How does 3-way partitioning specifically defend Quicksort against datasets containing many duplicate keys?",
    invariantOptions: [
      "It segments array elements into (< pivot), (== pivot), and (> pivot), eliminating all duplicate pivots from future recursive calls",
      "It sorts the duplicate values recursively using insertion sort before partitioning distinct elements",
      "It converts duplicate keys into unique integer hashes to ensure binary balance across partitions",
      "It replaces recursive quicksort partitions with iterative merge passes whenever duplicates exceed 10%",
    ],
    correctInvariantIndex: 0,
    pseudocode: `lt = low, gt = high, i = low, pivot = arr[low]
while i <= gt:
  if arr[i] < pivot: swap(arr[lt++], arr[i++])
  elif arr[i] > pivot: swap(arr[i], arr[gt--])
  else: i++
// recurse only on arr[low..lt-1] and arr[gt+1..high]`,
    timeComplexity: "O(n log n) average, O(n) best (on all duplicates with 3-way), O(n^2) pathological worst-case",
    spaceComplexity: "O(log n) auxiliary stack space with tail-call recursion optimization",
    edgeCases: [
      "Array where all elements are identical: 3-way partition finishes in O(n) time",
      "Already sorted array: median-of-three prevents O(n^2) unbalanced trees",
      "Alternating duplicate values",
      "Single element subarray",
    ],
    explanation: {
      verdict: "Median-of-Three with 3-Way Dutch National Flag Partitioning",
      whyPattern:
        "Median-of-three avoids worst-case splits on sorted data, while 3-way partitioning groups all equal keys together in a single pass, excluding them from recursive sub-calls.",
      distractorTakedown:
        "Lomuto partitioning does not handle duplicates efficiently and degrades to O(n^2) when all elements are identical because all equal elements fall on one side. Always picking the middle index avoids sorted arrays but fails on adversarial inputs. Bubble sort is O(n^2) and defeats the purpose of Quicksort.",
      takeaway:
        "3-way partitioning groups equal elements into their final positions in linear time, preventing Quicksort from degrading on arrays with duplicate keys.",
    },
  },
  {
    id: "concept-sorting-counting-sort-bounds",
    kind: "concept",
    title: "Linear-Time Sorting Under Bounded Integer Ranges",
    difficulty: "easy",
    category: "Sorting Concepts",
    constraints: [
      "n = 10^6 student exam scores",
      "Scores are strictly integers between 0 and 100 (k = 101)",
      "Must achieve faster than O(n log n) comparison lower bound",
    ],
    prompt:
      "You need to sort 1 million student exam records where all scores are integers between 0 and 100. How can you sort faster than the theoretical O(n log n) comparison barrier?",
    pattern: "Counting Sort (Direct Frequency Mapping)",
    patternDistractors: [
      "Quicksort (3-Way Partition)",
      "Merge Sort",
      "Binary Insertion Sort",
    ],
    invariantPrompt:
      "Why is Counting Sort able to break the mathematical Omega(n log n) lower bound for sorting algorithms?",
    invariantOptions: [
      "It performs parallel comparison operations across multi-core processor vector registers",
      "It applies divide-and-conquer recursion down to single elements where comparisons take zero time",
      "It is a non-comparison sort that uses direct array indexing based on integer key values rather than element comparisons",
      "It pre-computes hash table collisions to store all input records in logarithmic auxiliary space",
    ],
    correctInvariantIndex: 2,
    pseudocode: `count = array of size (max - min + 1) filled with 0
for x in arr: count[x - min] += 1
for i from 1 to length(count) - 1:
  count[i] += count[i - 1] // prefix sums for stability
for x in reversed(arr):
  out[--count[x - min]] = x`,
    timeComplexity: "O(n + k) where n is input size and k is the integer key range",
    spaceComplexity: "O(n + k) auxiliary space for output array and frequency bins (stable version)",
    edgeCases: [
      "k is much smaller than n (e.g. k=100, n=10^6): executes in pure O(n) linear time",
      "k is much larger than n (e.g. k=10^9, n=10): excessive space and time O(k), inappropriate",
      "Negative integer scores: offset by min value",
      "All elements identical",
    ],
    explanation: {
      verdict: "Counting Sort (Direct Frequency Mapping)",
      whyPattern:
        "The Omega(n log n) lower bound applies strictly to comparison-based sorting decision trees. When keys are bounded integers, direct array indexing counts frequencies in O(n + k) linear time.",
      distractorTakedown:
        "Quicksort, Merge Sort, and Binary Insertion Sort are all comparison-based algorithms fundamentally bounded by Omega(n log n) comparisons for arbitrary inputs. Furthermore, Binary Insertion Sort still requires O(n^2) element shifts even with binary search comparisons.",
      takeaway:
        "Counting sort bypasses comparison lower bounds by using integer values directly as array addresses, running in O(n + k) linear time when range k is small.",
    },
  },
  {
    id: "concept-sorting-radix-vs-counting",
    kind: "concept",
    title: "Radix Sort for Large Bounded Numeric Keys",
    difficulty: "medium",
    category: "Sorting Concepts",
    constraints: [
      "n = 10^6 32-bit positive integers",
      "Maximum value up to 2^31 - 1 (k = 2 * 10^9)",
      "Memory budget is limited to a few megabytes",
    ],
    prompt:
      "You must sort 1 million 32-bit integers up to 2,000,000,000 in linear time. Why does Counting Sort fail here, and how does Radix Sort solve it?",
    pattern: "Radix Sort (LSD with Stable Counting Sub-Passes)",
    patternDistractors: [
      "Standard Counting Sort",
      "Bucket Sort with Uniform Distribution",
      "Heapsort",
    ],
    invariantPrompt:
      "Why does Least Significant Digit (LSD) Radix Sort require the underlying digit-sorting subroutine to be strictly stable?",
    invariantOptions: [
      "Stability is required to prevent integer overflow when adding digits across base-10 radix columns",
      "Unstable digit sorting would scramble the relative ordering established by previously processed lower-significance digits",
      "Stable subroutines allow Radix Sort to skip the most significant digit pass entirely",
      "Unstable sorting causes the digit bucket array to expand from O(n) to O(n log n) auxiliary space",
    ],
    correctInvariantIndex: 1,
    pseudocode: `max_val = max(arr)
exp = 1 // 1, 10, 100... or base 256 bytes
while max_val // exp > 0:
  counting_sort_by_digit(arr, exp) // MUST BE STABLE
  exp *= 10`,
    timeComplexity: "O(d * (n + b)) where d is digit count (e.g. 4 passes for 32-bit base 256) and b is base radix",
    spaceComplexity: "O(n + b) auxiliary space for digit buckets and output buffer",
    edgeCases: [
      "Key range k=2*10^9: Counting Sort requires 8GB of memory and O(k) time; Radix uses base 256 with 4 passes",
      "Strings of uniform length: directly sortable via LSD",
      "Negative integers: require biased offset or sign partition",
      "All numbers have identical most significant digits",
    ],
    explanation: {
      verdict: "Radix Sort (LSD with Stable Counting Sub-Passes)",
      whyPattern:
        "Counting sort fails because allocating an array of 2 billion bins requires gigabytes of RAM. Radix sort breaks large keys into d small chunks (e.g., 4 bytes in base 256), sorting each with a small stable counting sort.",
      distractorTakedown:
        "Direct Counting Sort allocates an array proportional to max value k (O(2^31)), consuming gigabytes of memory and O(k) initialization time. Bucket sort requires assuming a uniform distribution, degrading to O(n^2) on skewed data. Heapsort is comparison-based O(n log n), not linear.",
      takeaway:
        "LSD Radix Sort decomposes large integer keys into fixed-radix digits, relying on stable sub-passes to achieve linear time without gigantic counting arrays.",
    },
  },
  {
    id: "concept-sorting-selection-vs-insertion",
    kind: "concept",
    title: "Loop Invariants: Selection Sort vs Insertion Sort",
    difficulty: "easy",
    category: "Sorting Concepts",
    constraints: [
      "Comparison of elementary O(n^2) in-place sorting algorithms",
      "Memory writes and swap count minimization",
    ],
    prompt:
      "You are writing to flash EEPROM memory where write/swap operations degrade the hardware. Which O(n^2) elementary sort guarantees at most O(n) write swaps in all cases?",
    pattern: "Selection Sort (Minimal Swap Invariant)",
    patternDistractors: [
      "Bubble Sort",
      "Insertion Sort",
      "Quicksort (Lomuto)",
    ],
    invariantPrompt:
      "What fundamental loop invariant distinguishes Selection Sort from Insertion Sort during each iteration i?",
    invariantOptions: [
      "Insertion sort inspects all unsorted items to place one, whereas Selection sort only inspects already sorted items",
      "Selection sort maintains a sorted prefix where elements are in their final global positions, whereas Insertion sort does not",
      "Bubble sort guarantees at most n/2 total memory writes by bubbling elements bidirectionally",
      "Selection sort places the absolute minimum of the remaining suffix into its final position arr[i] using at most 1 swap per outer loop",
    ],
    correctInvariantIndex: 3,
    pseudocode: `for i from 0 to n - 2:
  min_idx = i
  for j from i + 1 to n - 1:
    if arr[j] < arr[min_idx]: min_idx = j
  if min_idx != i: swap(arr[i], arr[min_idx]) // max 1 swap per loop`,
    timeComplexity: "O(n^2) comparisons in all cases (best, average, worst); exactly n-1 swaps maximum",
    spaceComplexity: "O(1) auxiliary space (in-place, unstable)",
    edgeCases: [
      "Flash memory with expensive write cycles: Selection Sort guarantees <= n swaps",
      "Already sorted array: still executes n(n-1)/2 comparisons",
      "Reverse sorted array: executes <= n swaps",
      "Duplicate keys: long distance swap makes Selection Sort unstable",
    ],
    explanation: {
      verdict: "Selection Sort (Minimal Swap Invariant)",
      whyPattern:
        "Selection sort scans the unsorted suffix for the global minimum and executes at most one swap per outer iteration, guaranteeing at most n - 1 total memory writes.",
      distractorTakedown:
        "Insertion sort can require O(n^2) writes in the worst case because shifting elements to insert a key overwrites memory on every comparison. Bubble sort can execute up to n(n-1)/2 adjacent swaps. Quicksort executes multiple swaps during partitioning.",
      takeaway:
        "Selection sort minimizes write operations to at most O(n) swaps at the cost of non-adaptive O(n^2) comparisons and instability.",
    },
  },
  {
    id: "concept-sorting-hybrid-timsort-introsort",
    kind: "concept",
    title: "Real-World Standard Library Hybrid Sorters",
    difficulty: "medium",
    category: "Sorting Concepts",
    constraints: [
      "Production programming language standard libraries (Python, Java, C++ STL, Rust)",
      "Handling real-world partially ordered data with worst-case fail-safes",
    ],
    prompt:
      "Why do modern standard libraries (C++ std::sort, Python, Java) use hybrid algorithms like IntroSort and TimSort rather than pure Quicksort or Merge Sort?",
    pattern: "Hybrid Sorting (IntroSort / TimSort)",
    patternDistractors: [
      "Pure Quicksort with Random Pivot",
      "Iterative Bottom-Up Merge Sort",
      "Binary Tree Sort",
    ],
    invariantPrompt:
      "How does IntroSort (used in C++ std::sort) guarantee O(n log n) worst-case time while preserving Quicksort's cache speed?",
    invariantOptions: [
      "It monitors recursion depth and switches to Heapsort if depth exceeds 2 * log(n), falling back to Insertion Sort for small slices",
      "It runs Quicksort and Merge Sort concurrently on background threads and terminates whichever finishes second",
      "It converts all inputs into a balanced red-black binary tree whenever recursion exceeds logarithmic depth",
      "It computes a SHA-256 hash of the input array to detect whether adversarial worst-case inputs were provided",
    ],
    correctInvariantIndex: 0,
    pseudocode: `function introsort(arr, max_depth = 2 * log2(n)):
  if length(arr) <= 16: insertion_sort(arr)
  elif max_depth == 0: heapsort(arr)
  else:
    p = partition(arr)
    introsort(arr[left..p-1], max_depth - 1)
    introsort(arr[p+1..right], max_depth - 1)`,
    timeComplexity: "O(n log n) guaranteed worst-case, O(n) best-case for TimSort on presorted runs",
    spaceComplexity: "O(log n) auxiliary stack space for IntroSort; O(n) auxiliary run space for TimSort",
    edgeCases: [
      "Adversarial anti-quicksort killer inputs: IntroSort switches to Heapsort at depth limit",
      "Short arrays (n <= 16-32): Insertion sort outperforms due to low constant factor and zero recursion",
      "Arrays with pre-existing ascending/descending runs: TimSort merges runs in O(n) time",
      "Random uniform data: Quicksort partitioning runs at peak cache speed",
    ],
    explanation: {
      verdict: "Hybrid Sorting (IntroSort / TimSort)",
      whyPattern:
        "Real-world hybrid sorters leverage the strengths of each algorithm: Quicksort for raw CPU cache efficiency on large partitions, Heapsort as a worst-case fallback against O(n^2) recursion depth traps, and Insertion Sort for small slices where low overhead dominates.",
      distractorTakedown:
        "Pure Quicksort remains vulnerable to adversarial O(n^2) pivot degradation even with randomized pivots. Pure Merge Sort incurs O(n) memory allocation overhead on primitive types where stability is unnecessary. Binary tree sort allocates O(n) dynamic heap nodes and has poor cache locality.",
      takeaway:
        "Engineering standard library sorts pair Quicksort's cache speed with Heapsort's O(n log n) safety valve and Insertion sort's low constant-factor base case.",
    },
  },
  {
    id: "concept-sorting-multi-column-stability",
    kind: "concept",
    title: "Multi-Level Sorting & Invariant of Algorithm Stability",
    difficulty: "medium",
    category: "Sorting Concepts",
    constraints: [
      "Secondary sort must not disrupt primary sort order",
      "Multi-column sorting (e.g. Sort by Timestamp, then Sort by Department)",
    ],
    prompt:
      "You have a table already sorted by timestamp. You now want to sort by Department so records within each department remain ordered by timestamp. What property must the second sort have?",
    pattern: "Stability (Preserving Relative Precedence of Equal Keys)",
    patternDistractors: [
      "In-Place Invariant",
      "Non-Recursive Execution",
      "Comparison Minimization",
    ],
    invariantPrompt:
      "Why does sorting by secondary key first, followed by a STABLE sort on primary key, correctly order multi-column records?",
    invariantOptions: [
      "Stability causes all secondary keys to be sorted in reverse descending order automatically",
      "Stable sorting algorithms merge primary and secondary columns into a combined 64-bit numeric hash",
      "A stable sort ensures records sharing identical primary keys preserve their earlier relative order established by the secondary sort",
      "Unstable sorting algorithms only fail if there are three or more compound sort keys",
    ],
    correctInvariantIndex: 2,
    pseudocode: `// To sort by (Department ASC, Timestamp ASC):
// Step 1: Sort by secondary key (Timestamp)
sort_by(records, key=record.timestamp)
// Step 2: STABLE sort by primary key (Department)
stable_sort_by(records, key=record.department)
// Invariant: equal departments preserve timestamp order`,
    timeComplexity: "O(n log n) using stable merge sort or TimSort for each column pass",
    spaceComplexity: "O(n) auxiliary space for stable buffer (or O(1) if using in-place stable merges)",
    edgeCases: [
      "All records have identical primary key: secondary sort order is completely preserved",
      "All records have unique primary keys: stability has no effect on final output",
      "Unstable second sort (e.g. Heapsort): breaks timestamp order arbitrarily",
      "Ties on both primary and secondary keys: original insertion order preserved",
    ],
    explanation: {
      verdict: "Stability (Preserving Relative Precedence of Equal Keys)",
      whyPattern:
        "An algorithm is stable if elements with identical keys appear in the output in the same relative order as the input. Sorting lowest priority key to highest priority key with stable passes guarantees lexicographical multi-column order.",
      distractorTakedown:
        "In-place behavior only relates to auxiliary memory usage, not order preservation. Non-recursive execution relates to stack usage. If an unstable sort (like Heapsort or standard Quicksort) is used for the second pass, it swaps equal department records across long distances, destroying the previously sorted timestamp order.",
      takeaway:
        "Multi-column sorting from least to most significant key succeeds if and only if every subsequent sort pass is strictly stable.",
    },
  },
  {
    id: "concept-sorting-external-merge-sort",
    kind: "concept",
    title: "External Merge Sort for Out-of-Core Datasets",
    difficulty: "hard",
    category: "Sorting Concepts",
    constraints: [
      "Dataset size = 500 GB on disk",
      "Available RAM = 8 GB",
      "Sequential disk I/O must be prioritized over random seeks",
    ],
    prompt:
      "You have a 500 GB file of log records and only 8 GB of RAM. The dataset cannot fit in memory. Which algorithm paradigm is designed to sort this dataset efficiently?",
    pattern: "External K-Way Merge Sort (Chunk Sorting & Streaming Heap Merge)",
    patternDistractors: [
      "Virtual Memory Quicksort",
      "In-Place Disk Heapsort",
      "External Bucket Sort",
    ],
    invariantPrompt:
      "Why does External Merge Sort use a min-heap during the second phase instead of comparing all K run files directly?",
    invariantOptions: [
      "The min-heap compresses the 500 GB disk file down into the 8 GB RAM space before writing to disk",
      "Direct comparisons of K runs would require loading all 500 GB into memory simultaneously",
      "The min-heap eliminates the need to sort the initial 8 GB chunks in Phase 1",
      "A min-heap of size K finds the global minimum across K streamed run chunks in O(log K) time per element with minimal disk seeks",
    ],
    correctInvariantIndex: 3,
    pseudocode: `// Phase 1: Create sorted runs on disk
while has_data(disk_file):
  chunk = read_chunk(disk_file, size=RAM)
  quicksort(chunk)
  write_run(chunk, disk)
// Phase 2: K-way merge using min-heap of size K
heap = min_heap(first_element_of_each_run)
while not heap.empty():
  min_elem = heap.pop()
  write(output_file, min_elem)
  heap.push(next_element_from_same_run(min_elem))`,
    timeComplexity: "O(N log(N/M) * (disk I/O transfer rate)) where N is total data size and M is RAM capacity",
    spaceComplexity: "O(M) RAM space used for streaming buffers and K-way min-heap",
    edgeCases: [
      "K runs exceed maximum open file descriptors: requires multi-pass hierarchical external merge",
      "Chunk size exactly equals RAM: must leave buffer space for OS disk cache and streaming queues",
      "All records identical: k-way merge streams linearly through runs",
      "Single run fits in RAM (N <= M): reduces to standard in-memory Quicksort",
    ],
    explanation: {
      verdict: "External K-Way Merge Sort (Chunk Sorting & Streaming Heap Merge)",
      whyPattern:
        "External merge sort breaks 500 GB into sorted 8 GB chunks on disk (Phase 1), then streams the heads of all runs into an in-memory K-way min-heap, writing out sequentially with sequential I/O (Phase 2).",
      distractorTakedown:
        "Virtual Memory Quicksort triggers thrashing: random memory accesses across 500 GB cause catastrophic disk page faults and random disk head seeks. In-place Disk Heapsort requires parent-child pointer hops at 2*i that span hundreds of gigabytes across disk, crippling I/O throughput. External bucket sort requires uniform hash distribution and fails on skewed data.",
      takeaway:
        "When data exceeds RAM, sort in-memory chunks sequentially, then stream-merge runs using a K-way min-heap to optimize sequential disk throughput.",
    },
  },
];
