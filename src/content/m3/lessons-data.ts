import { Lesson } from "./lesson-schema";

export const CURATED_LESSONS: Lesson[] = [
  // ----------------------------------------------------
  // 1. Caching & Cache-Aside Strategy
  // ----------------------------------------------------
  {
    id: "caching-fundamentals",
    title: "Caching & Cache-Aside Strategy",
    outcome: "Master the Cache-Aside pattern, latency trade-offs, and how to prevent cache stampedes under high concurrency.",
    eli5: "Think of your brain versus a giant file cabinet across the room. Looking at your notepad takes a second, but walking across the room takes 10 minutes. Caching keeps the most popular papers right on your desk!",
    paths: ["backend", "foundations"],
    prerequisites: ["HTTP/REST basics"],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "Why Caching Matters",
        durationMinutes: 1,
        type: "text",
        content: `Databases write data to disk (or SSDs) with ACID transaction overhead. Disk I/O and relational index lookups take milliseconds (5ms - 50ms).

RAM (memory) operates in nanoseconds (50ns - 100ns) — roughly **100,000 times faster** than disk.

When 10,000 concurrent users request the same product catalog page, querying PostgreSQL 10,000 times will saturate CPU, exhaust connection pools, and spike latency into seconds. Storing the computed result in an in-memory cache (like Redis) drops latency to < 1ms and protects the primary database.`,
        keyTakeaway: "Caching trades memory cost and slight data staleness for order-of-magnitude lower latency and database load shedding.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "The Cache-Aside Mental Model",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `The application code orchestrates all reads and writes directly between Cache and Database.

1. **Read Request Arrives:** App checks the cache by key.
2. **Cache Hit:** If found, return immediately without touching the DB.
3. **Cache Miss:** If absent, read from Database, write to Cache with a TTL (Time-To-Live), and return to client.
4. **Write/Update Request:** App updates Database first, then invalidates (deletes) the cached key.`,
        diagramNodes: [
          {
            id: "step-1",
            label: "1. Client Request",
            description: "App checks Redis for key `user:101`.",
            subtext: "Latency: ~0.5ms",
          },
          {
            id: "step-2",
            label: "2. Cache Hit / Miss",
            description: "Hit: returns immediately. Miss: fallback to DB.",
            subtext: "Decision point",
          },
          {
            id: "step-3",
            label: "3. Database Read",
            description: "Query primary PostgreSQL table on miss.",
            subtext: "Latency: ~15ms",
          },
          {
            id: "step-4",
            label: "4. Populate Cache",
            description: "SET key in Redis with TTL expiration.",
            subtext: "Prevents future misses",
          },
        ],
        keyTakeaway: "Under Cache-Aside, the application owns synchronization. On writes, always invalidate the cache rather than overwriting.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Cache-Aside with Invalidation",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Examine the canonical Node.js / TypeScript implementation of Cache-Aside with Redis and PostgreSQL:`,
        codeSnippet: `async function getProduct(productId: string): Promise<Product> {
  const cacheKey = \`product:\${productId}\`;

  // 1. Check cache first (Cache-Aside read)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // CACHE HIT (< 1ms)
  }

  // 2. Cache Miss: Query Database
  const product = await db.query(
    "SELECT * FROM products WHERE id = $1", 
    [productId]
  );
  if (!product) throw new NotFoundError();

  // 3. Backfill cache with 15-minute TTL
  await redis.set(cacheKey, JSON.stringify(product), "EX", 900);

  return product;
}

async function updateProduct(id: string, data: UpdateDTO): Promise<void> {
  // Update source of truth first
  await db.query("UPDATE products SET price = $1 WHERE id = $2", [data.price, id]);
  
  // Invalidate cache immediately
  await redis.del(\`product:\${id}\`);
}`,
        codeLanguage: "typescript",
        keyTakeaway: "Always invalidate (del) cache keys on write instead of updating, avoiding race conditions between concurrent updates.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Simulation: The Cache Stampede Hazard",
        durationMinutes: 4,
        type: "simulation",
        content: `Scenario: A key for a viral post with 50,000 req/sec expires at 12:00:00. At 12:00:01, 5,000 simultaneous requests experience a cache miss at the exact same millisecond. 

What happens if there is no lock or stampede protection?`,
        interactiveExercise: {
          prompt: "What critical failure occurs when a high-traffic cache key expires without mutex locking?",
          options: [
            {
              id: "opt-a",
              text: "Redis runs out of memory because 5,000 requests write duplicate keys at once.",
            },
            {
              id: "opt-b",
              text: "Cache Stampede (Thundering Herd): all 5,000 requests query the primary database simultaneously, overwhelming connection pools and crashing the DB.",
            },
            {
              id: "opt-c",
              text: "Clients receive HTTP 301 Permanent Redirects.",
            },
            {
              id: "opt-d",
              text: "PostgreSQL automatically pauses all incoming connections until Redis repopulates.",
            },
          ],
          correctOptionId: "opt-b",
          explanation: "This is the classic 'Thundering Herd' or Cache Stampede. Without a distributed lock (e.g. Redlock or probabilistic early expiration), concurrent misses hit the DB simultaneously. Solve this using mutex locks or TTL jitter.",
        },
        keyTakeaway: "Use distributed mutex locks or probabilistic early recomputation (XFetch) to prevent thundering herd crashes.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Check Your Mental Model",
        durationMinutes: 3,
        type: "quiz",
        content: `Answer correctly to pass this lesson and claim your XP reward:`,
        interactiveExercise: {
          prompt: "In the Cache-Aside pattern, why should you DELETE the cache key on an update instead of writing the new value directly to Redis?",
          options: [
            {
              id: "opt-1",
              text: "Redis does not support updating existing keys.",
            },
            {
              id: "opt-2",
              text: "Deleting prevents concurrent write race conditions where a slower write could overwrite a faster newer update with stale data.",
            },
            {
              id: "opt-3",
              text: "Deleting saves network bandwidth because delete packets are smaller than write packets.",
            },
            {
              id: "opt-4",
              text: "PostgreSQL triggers automatically block any Redis SET commands.",
            },
          ],
          correctOptionId: "opt-2",
          explanation: "If two concurrent updates A and B run, write A could update Redis after write B finishes if network latency fluctuates, leaving Redis permanently holding stale data A. Deleting forces the next read to fetch the true canonical state.",
        },
        keyTakeaway: "Cache invalidation by deletion guarantees eventual consistency against out-of-order write races.",
      },
    ],
    reference: {
      whereUsed: [
        "High-read public APIs (product catalogs, user profiles, feed items)",
        "Database load reduction in microservices",
        "Session storage and authentication token lookups",
      ],
      commonlyConfusedWith: [
        "Write-Through Caching (cache writes synchronously to DB on write)",
        "Write-Behind / Write-Back (writes to cache immediately, flushes to DB asynchronously)",
        "Read-Through (cache provider itself reads DB transparently to app)",
      ],
      remember: [
        "Cache-Aside = App code coordinates cache and DB",
        "On writes: Update DB first, then DEL key in cache",
        "Set TTL on every key to prevent memory exhaustion",
        "Protect hot keys with distributed mutex or early refresh",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 2. RAG (Retrieval-Augmented Generation) Architecture
  // ----------------------------------------------------
  {
    id: "rag-pipeline",
    title: "Retrieval-Augmented Generation (RAG) Architecture",
    outcome: "Understand how vector search connects private documents to LLMs without fine-tuning, step-by-step.",
    eli5: "Imagine taking an open-book test. Instead of trying to memorize the entire library, you have an assistant who runs to the library, grabs the exact two paragraphs you need, and hands them to you so you can write the correct answer!",
    paths: ["ai", "backend"],
    prerequisites: ["LLM basics", "Embeddings"],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "Why Standard LLMs Need Retrieval",
        durationMinutes: 1,
        type: "text",
        content: `LLMs are frozen in time at their training cut-off date. They do not know about:
1. Your company's internal documentation, customer databases, or codebase.
2. Real-time events occurring after training.
3. Proprietary domain rules.

When asked about unfamiliar facts, LLMs hallucinate plausible-sounding falsehoods. 

Instead of spending millions fine-tuning models on rapidly changing data, **Retrieval-Augmented Generation (RAG)** injects relevant source documents directly into the prompt context at inference time.`,
        keyTakeaway: "RAG converts a closed-book generative task into an open-book exam with verified citations.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "The 5-Stage RAG Pipeline",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `The complete end-to-end RAG architecture consists of 5 deterministic stages:

1. **Ingest & Chunk:** Split PDFs, wikis, or source code into semantic chunks (e.g. 500 tokens).
2. **Embed:** Convert each text chunk into a high-dimensional dense vector (e.g. 768 or 1536 floats).
3. **Index:** Store vectors in a Vector Database (MongoDB Atlas Vector Search / Pinecone) with an HNSW index.
4. **Retrieve:** On user query, embed query and retrieve the Top-K closest chunks via cosine similarity.
5. **Synthesize:** Inject retrieved chunks as system context into LLM prompt and generate grounded response.`,
        diagramNodes: [
          {
            id: "rag-1",
            label: "1. Chunk Documents",
            description: "Recursive character chunking with 10% overlap.",
            subtext: "Chunk size: 500 tokens",
          },
          {
            id: "rag-2",
            label: "2. Vector Embeddings",
            description: "Text → Dense vector representation.",
            subtext: "e.g. text-embedding-3-small",
          },
          {
            id: "rag-3",
            label: "3. Vector Index",
            description: "HNSW approximate nearest neighbor index.",
            subtext: "Cosine distance metric",
          },
          {
            id: "rag-4",
            label: "4. Similarity Search",
            description: "Query vector finds Top-K closest document chunks.",
            subtext: "Top-3 to Top-5 passages",
          },
          {
            id: "rag-5",
            label: "5. LLM Synthesis",
            description: "Prompt = Instructions + Retrieved Chunks + Question.",
            subtext: "Grounded output + citation",
          },
        ],
        keyTakeaway: "RAG combines deterministic vector retrieval with generative language synthesis.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Ingest & Retrieve in Practice",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Here is a production-grade RAG retrieval and synthesis function in TypeScript:`,
        codeSnippet: `async function answerQuestionWithRag(query: string): Promise<string> {
  // 1. Embed user query with same model used for index
  const queryVector = await embeddingGateway.embed(query);

  // 2. Vector search in MongoDB Atlas / Pinecone
  const relevantDocs = await db.collection("docs").aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryVector,
        numCandidates: 100,
        limit: 3
      }
    }
  ]).toArray();

  // 3. Assemble Grounded Prompt Context
  const context = relevantDocs.map(d => d.text).join("\\n---\\n");
  const prompt = \`Answer the question using ONLY the context provided below.
If you cannot answer from context, say "I don't know".

Context:
\${context}

Question: \${query}\`;

  // 4. Generate grounded synthesis
  return await llmGateway.generate(prompt);
}`,
        codeLanguage: "typescript",
        keyTakeaway: "Strict prompt guards ('use ONLY the context provided') reduce hallucination and ensure auditability.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Diagnosis: Chunk Size Trade-Offs",
        durationMinutes: 4,
        type: "predict",
        content: `Your RAG pipeline chunks documents into tiny 30-word sentences. Users report the LLM frequently misses the broader context and answers incompletely.

What is the root cause of this retrieval failure?`,
        interactiveExercise: {
          prompt: "What is the primary danger of excessively small chunk sizes in RAG systems?",
          options: [
            {
              id: "opt-a",
              text: "Vector databases cannot store vectors smaller than 1000 dimensions.",
            },
            {
              id: "opt-b",
              text: "Semantic fragmentation: sentences lose their surrounding context, table references, and pronoun antecedents.",
            },
            {
              id: "opt-c",
              text: "Small chunks cause cosine similarity scores to invert to negative numbers.",
            },
            {
              id: "opt-d",
              text: "Embedding models refuse to embed fewer than 200 words.",
            },
          ],
          correctOptionId: "opt-b",
          explanation: "Excessively small chunks lose semantic context (e.g. 'It was established in 1994' loses what 'It' refers to). Conversely, chunks that are too large dilute the embedding vector. Balancing chunk size (e.g. 400-800 tokens with 50-token overlap) is critical.",
        },
        keyTakeaway: "Chunking is the highest-leverage parameter in RAG: too small fragments meaning; too large dilutes vector similarity.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Grounding Guarantee",
        durationMinutes: 3,
        type: "quiz",
        content: `Complete this recall question to verify your RAG architecture understanding and claim XP:`,
        interactiveExercise: {
          prompt: "Why must the embedding model used at query time match the embedding model used during document ingestion?",
          options: [
            {
              id: "opt-1",
              text: "Different models map concepts into incompatible vector spaces with different dimensions and coordinate semantics.",
            },
            {
              id: "opt-2",
              text: "Vector databases reject connections from mismatched HTTP user-agents.",
            },
            {
              id: "opt-3",
              text: "The LLM will refuse to parse tokens from other companies.",
            },
            {
              id: "opt-4",
              text: "Only Gemini models support cosine distance.",
            },
          ],
          correctOptionId: "opt-1",
          explanation: "Embeddings are coordinates in a high-dimensional semantic space learned during that specific model's training. Comparing vectors from two different models is meaningless, yielding random similarity distances.",
        },
        keyTakeaway: "Document ingestion and query retrieval MUST use the identical embedding model.",
      },
    ],
    reference: {
      whereUsed: [
        "Internal enterprise search & knowledge wikis",
        "Customer support automated assistants with live policy grounding",
        "Codebase Q&A and documentation search",
      ],
      commonlyConfusedWith: [
        "Fine-Tuning (adjusting neural model weights permanently)",
        "Prompt Engineering (improving prompt instructions without retrieval)",
        "BM25 Full-Text Search (keyword-based inverted index rather than semantic vectors)",
      ],
      remember: [
        "RAG = Ingest → Chunk → Embed → Vector Search → Grounded LLM Prompt",
        "Chunk size matters: 400-800 tokens with ~10% overlap is standard",
        "Always use identical embedding models for query and index",
        "Add explicit guardrails: 'Answer ONLY using context'",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 3. LLM Basics & Autoregressive Generation
  // ----------------------------------------------------
  {
    id: "llm-basics",
    title: "LLM Fundamentals & Autoregressive Generation",
    outcome: "Understand how Large Language Models generate text token-by-token and control randomness via temperature.",
    eli5: "An AI doesn't write full stories in its head. It plays the world's most advanced autocomplete game on your phone: looking at what you just typed, and guessing the very next word with the highest probability!",
    paths: ["ai", "foundations"],
    prerequisites: [],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "Why LLMs Are Probability Engines",
        durationMinutes: 1,
        type: "text",
        content: `Contrary to common intuition, Large Language Models do not store pre-formed thoughts, facts, or database tables.

At their core, decoder-only transformers are statistical next-token prediction machines. Given a sequence of preceding tokens $T_1, T_2, ... T_n$, the model computes a probability distribution over the entire vocabulary (e.g. 100,000 candidate tokens) for what $T_{n+1}$ should be.

Because generation is probabilistic, the model can generate answers that sound authoritative and fluent while being factually untrue (hallucinations). Understanding this sampling process is crucial for writing robust AI engineering systems.`,
        keyTakeaway: "LLMs do not query a database of truth; they sample high-probability continuation tokens.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "The Autoregressive Loop",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `Text generation occurs in an iterative loop called autoregression:

1. **Input Tokens:** The prompt is converted into numeric token IDs.
2. **Transformer Forward Pass:** Self-attention layers compute relationships across all tokens.
3. **Logits Vector:** The output layer produces raw scores (logits) for every vocabulary token.
4. **Softmax & Temperature:** Logits are scaled by temperature $T$ and converted into probabilities via Softmax.
5. **Sampling:** A token is picked (Greedy or Top-P) and appended to the prompt for the next pass.`,
        diagramNodes: [
          {
            id: "step-1",
            label: "1. Tokenized Input",
            description: "Prompt converted into embedding vectors.",
            subtext: "Context: N tokens",
          },
          {
            id: "step-2",
            label: "2. Attention Layers",
            description: "Attention matrix computes token correlations.",
            subtext: "Decoder stack",
          },
          {
            id: "step-3",
            label: "3. Raw Logits",
            description: "Unnormalized scores over ~100k vocabulary tokens.",
            subtext: "Vector of floats",
          },
          {
            id: "step-4",
            label: "4. Softmax(Logits/T)",
            description: "Temperature scales distribution sharpness.",
            subtext: "Probability distribution",
          },
          {
            id: "step-5",
            label: "5. Sample & Append",
            description: "Next token selected; fed back as input.",
            subtext: "Autoregressive step",
          },
        ],
        keyTakeaway: "Autoregression generates one token per forward pass; output length directly determines inference time.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Sampling Parameters in Practice",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Controlling temperature and top_p when invoking LLMs via the gateway:`,
        codeSnippet: `interface CompletionConfig {
  temperature: number; // 0.0 = Deterministic/Greedy, 1.0+ = Creative
  topP: number;        // Nucleus sampling: cumulative probability mass cutoff
  maxTokens: number;
}

// 1. Strict JSON / SQL extraction requires temperature = 0.0
const extractionParams: CompletionConfig = {
  temperature: 0.0,
  topP: 1.0,
  maxTokens: 500,
};

// 2. Creative ideation / brainstorming benefits from temperature = 0.7 - 0.9
const creativeParams: CompletionConfig = {
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 1000,
};`,
        codeLanguage: "typescript",
        keyTakeaway: "Use temperature = 0 for deterministic code/schema extraction; use higher temperature for open-ended ideation.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Simulation: Temperature Scaling",
        durationMinutes: 4,
        type: "simulation",
        content: `You configure an automated customer service invoice parser with temperature = 1.8. Users complain that order totals and tax calculations keep changing randomly on every retry.

Why is this happening?`,
        interactiveExercise: {
          prompt: "What mathematical effect does an excessively high temperature (e.g. 1.8) have on token selection?",
          options: [
            {
              id: "opt-a",
              text: "It flattens the probability distribution across all tokens, causing the model to sample rare, improbable tokens and produce random hallucinated numbers.",
            },
            {
              id: "opt-b",
              text: "It causes the model to consume 10x more GPU memory per token.",
            },
            {
              id: "opt-c",
              text: "It restricts the vocabulary to only single-digit numbers.",
            },
            {
              id: "opt-d",
              text: "It forces the model to run on CPU threads instead of tensor cores.",
            },
          ],
          correctOptionId: "opt-a",
          explanation: "Temperature divides raw logits before Softmax: $P_i = \\frac{e^{z_i / T}}{\\sum e^{z_j / T}}$. As $T \\to \\infty$, the distribution becomes uniform, meaning every random token has equal probability. For structured tasks, always use $T = 0$ (greedy decoding).",
        },
        keyTakeaway: "High temperature flattens probability peaks; structured schema extraction always requires temperature = 0.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Grounding Guarantee",
        durationMinutes: 3,
        type: "quiz",
        content: `Answer this question to verify your mental model of LLM generation:`,
        interactiveExercise: {
          prompt: "Why can an LLM generate a completely false citation or non-existent library method while writing fluent TypeScript?",
          options: [
            {
              id: "opt-1",
              text: "The model optimizes for grammatical and semantic token likelihood, not factual verification against external ground truth.",
            },
            {
              id: "opt-2",
              text: "The model is running an outdated version of Node.js.",
            },
            {
              id: "opt-3",
              text: "TypeScript syntax requires floating-point numbers.",
            },
            {
              id: "opt-4",
              text: "The context window has reached its token expiration date.",
            },
          ],
          correctOptionId: "opt-1",
          explanation: "Transformers learn statistical word associations. A fabricated function name like `db.executeOptimisticQuery()` has high linguistic probability following a database query prompt, even if the method never existed in the library.",
        },
        keyTakeaway: "Never trust LLM claims about facts or APIs without external compiler/runtime validation or RAG citations.",
      },
    ],
    reference: {
      whereUsed: [
        "Text generation, summarization, and chat agents",
        "Structured data extraction (JSON Mode / Zod parsing)",
        "Code autocomplete and automated pair programming",
      ],
      commonlyConfusedWith: [
        "Search Engines (which retrieve exact matching indexed documents)",
        "Relational Databases (which execute deterministic SQL queries)",
        "Rule Engines (which evaluate deterministic boolean logic trees)",
      ],
      remember: [
        "Autoregressive = output token fed back as next input",
        "Temperature = 0 for exact facts/schemas; > 0.7 for creative writing",
        "Hallucination is a natural byproduct of next-token probability sampling",
        "Always pair LLM code generation with sandbox assertion validation",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 4. Tokens, Tokenization & Context Windows
  // ----------------------------------------------------
  {
    id: "tokens-context",
    title: "Tokens, Tokenization & Context Windows",
    outcome: "Master Byte-Pair Encoding (BPE), token-to-word ratios, and how context window memory limits impact app design.",
    eli5: "Computers can't read words or letters directly. They cut sentences into small Lego bricks called tokens. The context window is the size of the kitchen table—if you put down too many Lego bricks, they spill over the edge and the computer gets confused!",
    paths: ["ai", "foundations"],
    prerequisites: ["LLM basics"],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "Why Raw Text Cannot Be Fed to Models",
        durationMinutes: 1,
        type: "text",
        content: `Neural networks perform matrix multiplications over floating-point numbers. They cannot directly process raw UTF-8 strings like "Hello, world!".

Splitting by single characters creates sequences that are too long (saturating quadratic $O(N^2)$ attention memory). Splitting by whole words creates an infinite vocabulary that cannot handle typos, compound words, or code syntax like \`useCallback()\`.

Modern models use **Byte-Pair Encoding (BPE)**: subword tokenization that merges frequent byte pairs. Understanding tokens is critical because API pricing, latency, and context limits are all metered in tokens.`,
        keyTakeaway: "Tokens are the fundamental atomic units of LLM compute, memory, and cost.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "Subwords and Context Windows",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `How text becomes tokens and fits into model memory:

1. **Rule of Thumb:** In English, 1 token $\\approx$ 0.75 words, or 4 characters. 1,000 words $\\approx$ 1,333 tokens.
2. **Code & Whitespace:** Code uses more tokens per word due to indentation, punctuation, and camelCase splitting (\`getUserById\` $\\to$ \`get\`, \`User\`, \`By\`, \`Id\`).
3. **Context Window Limit:** Represents the total sum of **Input Tokens + Output Tokens**. Exceeding it results in an immediate HTTP 400 error.`,
        diagramNodes: [
          {
            id: "bpe-1",
            label: "1. Raw String",
            description: "\"Internationalization\"",
            subtext: "20 characters",
          },
          {
            id: "bpe-2",
            label: "2. BPE Subwords",
            description: "[\"Intern\", \"ational\", \"ization\"]",
            subtext: "3 tokens",
          },
          {
            id: "bpe-3",
            label: "3. Numeric IDs",
            description: "[1284, 8421, 391]",
            subtext: "Integer lookup",
          },
          {
            id: "bpe-4",
            label: "4. Attention Window",
            description: "Input tokens + Output tokens <= Context Max.",
            subtext: "e.g. 8k, 32k, 128k limit",
          },
        ],
        keyTakeaway: "Context limits are shared between prompt and completion; reserve headroom for the output.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Estimating Token Budget and Truncation",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Safely managing context window limits and token budgeting:`,
        codeSnippet: `function trimHistoryToTokenBudget(
  messages: Array<{ role: string; content: string }>,
  maxBudget = 6000
): Array<{ role: string; content: string }> {
  // Rough fast heuristic: ~4 chars per token
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  let totalTokens = 0;
  const kept: Array<{ role: string; content: string }> = [];

  // Iterate backwards from most recent message
  for (let i = messages.length - 1; i >= 0; i--) {
    const cost = estimateTokens(messages[i].content);
    if (totalTokens + cost > maxBudget) {
      break; // Stop including older conversation turns
    }
    totalTokens += cost;
    kept.unshift(messages[i]);
  }

  return kept;
}`,
        codeLanguage: "typescript",
        keyTakeaway: "Always implement sliding-window truncation or conversation summarization to avoid context window overflow.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Diagnosis: Context Window Overflow",
        durationMinutes: 4,
        type: "predict",
        content: `You call an LLM with a 16,384 token context window. Your prompt with RAG documents takes 15,500 tokens. You request \`max_tokens = 2000\` for the completion.

What happens at runtime?`,
        interactiveExercise: {
          prompt: "What happens when prompt tokens (15,500) + requested max_tokens (2,000) exceeds context limit (16,384)?",
          options: [
            {
              id: "opt-a",
              text: "The request succeeds and silently truncates the prompt down to 14,000 tokens.",
            },
            {
              id: "opt-b",
              text: "The API immediately throws an HTTP 400 Bad Request error (context_length_exceeded) before generating any tokens.",
            },
            {
              id: "opt-c",
              text: "The model runs at half precision to compress the prompt.",
            },
            {
              id: "opt-d",
              text: "The API bills your credit card double to allocate extra RAM.",
            },
          ],
          correctOptionId: "opt-b",
          explanation: "In OpenAI and Google APIs, if prompt_tokens + max_tokens exceeds the model's total context limit, the API rejects the request before inference starts. You must calculate and set `max_tokens <= context_window - prompt_tokens`.",
        },
        keyTakeaway: "Prompt tokens and max_tokens cannot exceed the model's physical context window.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Subword Tokenization Mechanics",
        durationMinutes: 3,
        type: "quiz",
        content: `Answer this active recall question to verify your comprehension:`,
        interactiveExercise: {
          prompt: "Why does Byte-Pair Encoding (BPE) split unfamiliar words or new technical names into subwords instead of rejecting them as unknown tokens?",
          options: [
            {
              id: "opt-1",
              text: "Subword decomposition guarantees an open vocabulary: any arbitrary string can always be broken down into known subword fragments or individual UTF-8 bytes.",
            },
            {
              id: "opt-2",
              text: "Subwords execute faster in GPU cache than whole words.",
            },
            {
              id: "opt-3",
              text: "Only English words are permitted in language model vocabularies.",
            },
            {
              id: "opt-4",
              text: "BPE is an encryption algorithm designed to protect prompt privacy.",
            },
          ],
          correctOptionId: "opt-1",
          explanation: "BPE ensures zero 'Out Of Vocabulary' (OOV) tokens. Rare or brand-new technical words (like `Kubernetes` or `NextAuth`) are simply decomposed into smaller familiar chunks.",
        },
        keyTakeaway: "BPE guarantees that any string can be tokenized down to byte-level fragments without breaking.",
      },
    ],
    reference: {
      whereUsed: [
        "Prompt engineering and budget calculation",
        "API pricing estimation (input tokens vs output tokens)",
        "Sliding window conversation memory in chatbots",
      ],
      commonlyConfusedWith: [
        "Word count (1 token != 1 word; English is ~1.33 tokens per word)",
        "Character count (ASCII characters != tokens; code uses more tokens)",
        "Embedding dimension (token count is sequence length; embedding is vector width)",
      ],
      remember: [
        "1,000 words ≈ 1,333 tokens (English rule of thumb)",
        "Prompt tokens + Completion tokens <= Max Context Window",
        "Code and non-English scripts consume significantly more tokens per character",
        "Always calculate dynamic max_tokens: context_limit - prompt_tokens",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 5. Vector Embeddings & Similarity Search
  // ----------------------------------------------------
  {
    id: "embeddings-similarity",
    title: "Vector Embeddings & Similarity Search",
    outcome: "Understand high-dimensional dense vector spaces, cosine distance vs Euclidean metric, and how semantic similarity search works.",
    eli5: "Every sentence gets converted into a GPS coordinate on a giant galaxy map of ideas. Even if two sentences use different words like 'kitten' and 'small cat', they get parked on the exact same corner because their meaning is identical!",
    paths: ["ai", "backend", "foundations"],
    prerequisites: ["LLM basics"],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "Why Keyword Search Is Inadequate",
        durationMinutes: 1,
        type: "text",
        content: `Traditional relational databases and inverted indexes (like Elasticsearch) search by exact character strings.

If a user searches for *"affordable automobile"*, an exact keyword query misses documents talking about *"cheap cars"*, *"budget sedans"*, or *"inexpensive vehicles"*, even though they mean the identical thing.

**Embeddings** map text into a continuous high-dimensional geometric space where proximity corresponds to semantic similarity. Words and concepts with similar meanings cluster together, enabling true conceptual search.`,
        keyTakeaway: "Embeddings turn human language into geometry where meaning equals vector direction.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "The Geometry of Embeddings",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `How embeddings and distance metrics work:

1. **Dense Vector:** An embedding is an array of floating-point numbers (e.g. 768 or 1536 floats) generated by an encoder.
2. **Cosine Similarity:** Measures the angle $\\theta$ between two vectors: $\\cos(\\theta) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$. It ranges from -1 to 1 (1 = identical direction).
3. **Length Invariance:** Cosine similarity evaluates direction rather than magnitude, ensuring a 20-word passage and a 200-word passage on the same topic match accurately.`,
        diagramNodes: [
          {
            id: "vec-1",
            label: "1. Text Passage",
            description: "\"How do I reset my password?\"",
            subtext: "Natural language input",
          },
          {
            id: "vec-2",
            label: "2. Encoder Model",
            description: "Deep neural network generates dense vector.",
            subtext: "768-dim floats",
          },
          {
            id: "vec-3",
            label: "3. Vector Space",
            description: "Coordinates: [0.12, -0.45, 0.88, ...]",
            subtext: "Normalized unit sphere",
          },
          {
            id: "vec-4",
            label: "4. Cosine Distance",
            description: "cos(θ) = 0.94 with \"Forgot credentials\"",
            subtext: "Semantic match",
          },
        ],
        keyTakeaway: "Cosine similarity measures vector angle rather than magnitude, making it ideal for text passages of variable length.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Computing Cosine Similarity",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Calculating dot product and cosine similarity between two normalized vectors:`,
        codeSnippet: `function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have identical dimensionality");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// If vectors are already normalized (unit length = 1.0),
// Cosine Similarity is simply the Dot Product!` ,
        codeLanguage: "typescript",
        keyTakeaway: "When vectors are pre-normalized to unit length, cosine similarity reduces to a fast single dot-product operation.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Simulation: Metric Selection",
        durationMinutes: 4,
        type: "simulation",
        content: `You configure a vector database for customer support documents. You have three distance metrics available: Cosine, Euclidean (L2), and Dot Product. Your documents vary widely from 20 words to 500 words.

Which metric should you select?`,
        interactiveExercise: {
          prompt: "Why is Cosine Similarity preferred over Euclidean Distance (L2) for passages of varying length?",
          options: [
            {
              id: "opt-a",
              text: "Euclidean distance is sensitive to vector magnitude: longer passages with more words have larger vector lengths, falsely making them appear distant from short queries.",
            },
            {
              id: "opt-b",
              text: "Euclidean distance cannot be calculated in more than 3 dimensions.",
            },
            {
              id: "opt-c",
              text: "Cosine similarity runs in $O(1)$ constant time on all hardware.",
            },
            {
              id: "opt-d",
              text: "Euclidean distance only works on integer coordinates.",
            },
          ],
          correctOptionId: "opt-a",
          explanation: "Magnitude grows with token count in unnormalized embeddings. Euclidean distance penalizes magnitude differences, whereas Cosine similarity strictly evaluates angular direction (semantic intent).",
        },
        keyTakeaway: "Use Cosine similarity when comparing text passages of differing lengths.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Vector Dimensions",
        durationMinutes: 3,
        type: "quiz",
        content: `Answer this question to verify your understanding of vector spaces:`,
        interactiveExercise: {
          prompt: "Can you compare an embedding generated by text-embedding-3-small (1536 dims) directly with an embedding from nomic-embed-text (768 dims)?",
          options: [
            {
              id: "opt-1",
              text: "No: dot products and cosine similarity require identical dimensions, and coordinates from different models live in completely different mathematical spaces.",
            },
            {
              id: "opt-2",
              text: "Yes: you can pad the 768-dim vector with zeroes to reach 1536 dims.",
            },
            {
              id: "opt-3",
              text: "Yes: vector databases automatically convert embeddings between models.",
            },
            {
              id: "opt-4",
              text: "Yes: all models adhere to the ISO 9001 embedding standard.",
            },
          ],
          correctOptionId: "opt-1",
          explanation: "Dimensionality mismatch throws vector math errors. More fundamentally, coordinate spaces are learned independently during training; axis 42 in model A has zero semantic relation to axis 42 in model B.",
        },
        keyTakeaway: "Always use the same model version for both index generation and user query retrieval.",
      },
    ],
    reference: {
      whereUsed: [
        "Semantic search and document retrieval (RAG)",
        "Recommendation engines (finding similar products/users)",
        "Duplicate detection and clustering in data pipelines",
      ],
      commonlyConfusedWith: [
        "Inverted Index / BM25 (keyword frequency matching vs semantic geometry)",
        "LLMs (encoder embeddings produce vectors; decoder LLMs generate text)",
        "One-Hot Encoding (sparse discrete booleans vs dense continuous floats)",
      ],
      remember: [
        "Embeddings = dense vector representations of semantic meaning",
        "Cosine similarity measures angle (1.0 = identical; 0.0 = orthogonal)",
        "Pre-normalizing vectors turns cosine similarity into a fast dot product",
        "Never mix vectors from different embedding models",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 6. HTTP/REST & Idempotent API Design
  // ----------------------------------------------------
  {
    id: "http-rest",
    title: "HTTP/REST Architecture & Idempotent API Design",
    outcome: "Master REST conventions, safe vs idempotent HTTP verbs, and robust idempotency key design for financial transactions.",
    eli5: "Safe is looking through a bakery window without ordering anything. Idempotent is pushing an elevator button: whether you push it once or mash it 20 times impatiently, the elevator still arrives once!",
    paths: ["backend", "frontend", "foundations"],
    prerequisites: [],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "The Distributed Network Fallacy",
        durationMinutes: 1,
        type: "text",
        content: `Networks are fundamentally unreliable. Packets drop, timeouts occur, and mobile users drive through tunnels mid-request.

Consider an e-commerce checkout. The client sends \`POST /api/orders\`. The server successfully charges the credit card and creates the order, but the HTTP 200 response packet drops on the return path.

The client times out after 10 seconds. Should the client retry? If the client retries a standard naive POST, the user gets charged twice!

Understanding **Safe and Idempotent HTTP methods** and designing **Idempotency Keys** is a non-negotiable requirement for senior backend engineers.`,
        keyTakeaway: "In distributed systems, operations will be retried; your APIs must handle retries safely without duplicate side effects.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "Safe vs Idempotent Verbs",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `HTTP specifications define two critical properties for methods:

- **Safe:** Calling the endpoint causes zero resource mutation (read-only). E.g. \`GET\`, \`HEAD\`, \`OPTIONS\`.
- **Idempotent:** Calling the endpoint $N$ times produces the exact same server state as calling it once. E.g. \`GET\`, \`PUT\`, \`DELETE\`.
- **Neither Safe nor Idempotent:** \`POST\` appends new resources on every invocation. Calling \`POST /transfers\` 5 times executes 5 transfers!`,
        diagramNodes: [
          {
            id: "m-get",
            label: "GET",
            description: "Safe & Idempotent. Read resource state.",
            subtext: "Read-only",
          },
          {
            id: "m-put",
            label: "PUT",
            description: "Idempotent. Replaces target resource completely.",
            subtext: "N calls = 1 call",
          },
          {
            id: "m-delete",
            label: "DELETE",
            description: "Idempotent. Deletes resource; state remains absent.",
            subtext: "N calls = 1 call",
          },
          {
            id: "m-post",
            label: "POST",
            description: "Not Idempotent. Appends new resource per request.",
            subtext: "Must guard with Idempotency Key",
          },
        ],
        keyTakeaway: "Idempotent means f(f(x)) = f(x): calling the endpoint multiple times leaves identical state.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Idempotency-Key Header Implementation",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Production pattern for idempotent POST endpoints using Redis locks and cached responses:`,
        codeSnippet: `app.post("/api/charges", async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"];
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Idempotency-Key header required" });
  }

  const cacheKey = \`idempotency:\${req.user.id}:\${idempotencyKey}\`;

  // 1. Try to acquire lock or fetch previous result
  const existing = await redis.get(cacheKey);
  if (existing) {
    const cached = JSON.parse(existing);
    return res.status(cached.status).json(cached.body); // Return identical response
  }

  // 2. Set processing lock (NX = only if not exists, EX = 120s TTL)
  const locked = await redis.set(cacheKey, JSON.stringify({ status: 409, body: "In Flight" }), "NX", "EX", 120);
  if (!locked) {
    return res.status(409).json({ error: "Concurrent request in flight" });
  }

  // 3. Execute business logic (charge card, save DB)
  const charge = await paymentGateway.charge(req.body);

  // 4. Cache final response for 24 hours
  await redis.set(cacheKey, JSON.stringify({ status: 201, body: charge }), "EX", 86400);

  return res.status(201).json(charge);
});`,
        codeLanguage: "typescript",
        keyTakeaway: "Use Redis NX locks with an Idempotency-Key to cache and replay the initial response on network retries.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Diagnosis: DELETE Semantics",
        durationMinutes: 4,
        type: "simulation",
        content: `A junior developer argues: "DELETE is NOT idempotent because the first call returns 200 OK, but the second call returns 404 Not Found. Different status codes mean it isn't idempotent!"

Is the developer correct or incorrect?`,
        interactiveExercise: {
          prompt: "Is DELETE idempotent if subsequent requests return HTTP 404?",
          options: [
            {
              id: "opt-a",
              text: "Incorrect: Idempotency refers to server resource state, not HTTP status code. After call 1 and call 2, the resource is absent in both cases.",
            },
            {
              id: "opt-b",
              text: "Correct: Any change in HTTP status code invalidates idempotency according to RFC 9110.",
            },
            {
              id: "opt-c",
              text: "Incorrect: DELETE is only idempotent if the database uses soft deletes.",
            },
            {
              id: "opt-d",
              text: "Correct: DELETE should return HTTP 500 on the second attempt.",
            },
          ],
          correctOptionId: "opt-a",
          explanation: "Per the HTTP standard (RFC 9110), idempotency requires that the server side-effect on the target resource is identical whether executed once or multiple times. In both cases, the user record is gone. The response status code may differ (e.g. 200/204 on first, 404 on second).",
        },
        keyTakeaway: "Idempotency governs side-effects on state, not the response status code.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Verb Classification",
        durationMinutes: 3,
        type: "quiz",
        content: `Verify your mastery of HTTP API methods:`,
        interactiveExercise: {
          prompt: "Which HTTP method is idempotent, but NOT safe?",
          options: [
            { id: "opt-1", text: "PUT" },
            { id: "opt-2", text: "GET" },
            { id: "opt-3", text: "HEAD" },
            { id: "opt-4", text: "POST" },
          ],
          correctOptionId: "opt-1",
          explanation: "`PUT` mutates server resource state (making it NOT safe), but replacing the resource $N$ times with the same payload results in the exact same state (making it idempotent). `GET` and `HEAD` are both safe and idempotent. `POST` is neither.",
        },
        keyTakeaway: "PUT and DELETE are idempotent (can be retried safely) but not safe (they mutate state).",
      },
    ],
    reference: {
      whereUsed: [
        "Payment gateways and financial transactions (Stripe, Razorpay)",
        "Public REST API design and webhook delivery retries",
        "Distributed microservice RPC and event publishing",
      ],
      commonlyConfusedWith: [
        "Safe vs Idempotent (Safe = no mutation; Idempotent = repeatable mutation)",
        "PUT vs PATCH (PUT replaces whole resource idempotently; PATCH applies partial delta)",
        "POST vs PUT (POST creates subordinate resource; PUT creates/replaces at exact URI)",
      ],
      remember: [
        "GET/HEAD = Safe + Idempotent",
        "PUT/DELETE = Not safe, but Idempotent",
        "POST = Neither safe nor idempotent (requires Idempotency-Key)",
        "Idempotency protects state against network retry duplication",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 7. Docker & Containerization
  // ----------------------------------------------------
  {
    id: "docker-containers",
    title: "Docker Containerization & Image Optimization",
    outcome: "Understand Linux namespaces, cgroups, and multi-stage Dockerfile layer caching to build lightweight, fast container images.",
    eli5: "A Virtual Machine is building a whole separate house with its own furnace and water pipes. A Container is just putting up partition walls inside an apartment: everyone shares the same plumbing, but no one can touch your stuff!",
    paths: ["devops", "backend"],
    prerequisites: [],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "The 'Works on My Machine' Problem",
        durationMinutes: 1,
        type: "text",
        content: `Software development historically suffered from environment discrepancies: differing Node.js patch versions, missing C shared libraries, host OS differences, and unrecorded environment variables.

Virtual Machines (VMs) solved this by packaging the entire operating system, but VMs require a Hypervisor and a dedicated guest OS kernel, consuming gigabytes of disk and RAM and taking minutes to boot.

**Docker Containers** package the application code and dependencies while sharing the host Linux kernel directly. They start in milliseconds and use a fraction of the memory.`,
        keyTakeaway: "Containers isolate processes using host Linux kernel features instead of virtualizing hardware.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "Namespaces, Cgroups & Layered Filesystems",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `A Docker container is a standard Linux process isolated by three kernel mechanisms:

1. **Namespaces:** Restricts what a process can *see* (PID namespace isolates process list, NET isolates network interfaces, MNT isolates filesystem mounts).
2. **Control Groups (cgroups):** Restricts what a process can *use* (hard memory limits like 512MB, CPU quotas like 1 core).
3. **UnionFS (Overlay2):** Layers of read-only image filesystem stacked together, with a thin writable layer on top for the container.`,
        diagramNodes: [
          {
            id: "dk-1",
            label: "Host Linux Kernel",
            description: "Shared kernel executing instructions directly.",
            subtext: "Bare-metal performance",
          },
          {
            id: "dk-2",
            label: "Linux Namespaces",
            description: "Process, Network, and Mount isolation boundaries.",
            subtext: "Process sandboxing",
          },
          {
            id: "dk-3",
            label: "Control Groups (cgroups)",
            description: "Enforces CPU and RAM resource caps.",
            subtext: "Prevents runaway memory",
          },
          {
            id: "dk-4",
            label: "OverlayFS Layers",
            description: "Cached read-only image layers + thin R/W top layer.",
            subtext: "Shared filesystem cache",
          },
        ],
        keyTakeaway: "Containers are not mini-virtual machines; they are isolated host processes governed by Namespaces and cgroups.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: Production Multi-Stage Dockerfile",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `Production Next.js / Node multi-stage build dropping image size from 1.2GB to 85MB:`,
        codeSnippet: `# Stage 1: Dependency resolution & build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

# Stage 2: Minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user for security
USER node

# Copy only production artifacts and node_modules from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]`,
        codeLanguage: "dockerfile",
        keyTakeaway: "Multi-stage builds leave compiler tools, linters, and devDependencies out of the final production image.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Simulation: Layer Cache Invalidation",
        durationMinutes: 4,
        type: "simulation",
        content: `A developer writes a Dockerfile where \`COPY . .\` is executed before \`RUN npm install\`. Every time they change a markdown comment in \`README.md\`, the build takes 4 minutes to re-run npm install.

Why does Docker re-run npm install on every single change?`,
        interactiveExercise: {
          prompt: "How does Docker evaluate layer caching when building images?",
          options: [
            {
              id: "opt-a",
              text: "Docker checks the hash of the instruction and its copied files from top to bottom. If any layer changes, all subsequent cached layers are invalidated.",
            },
            {
              id: "opt-b",
              text: "Docker automatically detects npm dependencies and only invalidates when package.json changes.",
            },
            {
              id: "opt-c",
              text: "Docker builds always download npm dependencies fresh by default.",
            },
            {
              id: "opt-d",
              text: "Node.js alpine images disable layer caching.",
            },
          ],
          correctOptionId: "opt-a",
          explanation: "Docker layer caching is sequential. If `COPY . .` changes because of an edit to any local file, Docker cannot use cached layers for any step following it. Copying `package*.json` first ensures `npm install` remains cached as long as dependencies don't change.",
        },
        keyTakeaway: "Order Dockerfile instructions from least-frequently changed to most-frequently changed.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Kernel Primitives",
        durationMinutes: 3,
        type: "quiz",
        content: `Answer this question to verify your container fundamentals:`,
        interactiveExercise: {
          prompt: "Which Linux kernel feature is responsible for enforcing memory limits (e.g. 512MB RAM) on a container?",
          options: [
            { id: "opt-1", text: "Control Groups (cgroups)" },
            { id: "opt-2", text: "PID Namespaces" },
            { id: "opt-3", text: "IPTables" },
            { id: "opt-4", text: "AppArmor" },
          ],
          correctOptionId: "opt-1",
          explanation: "Control Groups (cgroups) meter and limit physical resources (memory, CPU shares, block I/O) allocated to a collection of processes. Namespaces govern visibility and access, not resource quotas.",
        },
        keyTakeaway: "Namespaces control what processes can see; cgroups control what processes can consume.",
      },
    ],
    reference: {
      whereUsed: [
        "Local development parity across operating systems",
        "Kubernetes and container orchestration clusters",
        "CI/CD build environments and immutable deployment artifacts",
      ],
      commonlyConfusedWith: [
        "Virtual Machines (VMs virtualize hardware and run guest kernels; Containers share host kernel)",
        "Images vs Containers (Image = immutable read-only blueprint; Container = running process instance)",
        "Docker vs Kubernetes (Docker builds/runs single containers; K8s orchestrates clusters of containers)",
      ],
      remember: [
        "Containers share the host kernel via Namespaces & cgroups",
        "Order Dockerfile steps: copy package.json first, then source code",
        "Use multi-stage builds to discard build dependencies from production images",
        "Always run containers as a non-root user (USER node)",
      ],
    },
    xpAward: 50,
  },

  // ----------------------------------------------------
  // 8. CI/CD Delivery Pipelines & Deployment Strategies
  // ----------------------------------------------------
  {
    id: "cicd-pipelines",
    title: "CI/CD Delivery Pipelines & Deployment Strategies",
    outcome: "Master automated delivery pipelines, trunk-based branching, and zero-downtime deployment strategies (Canary vs Blue-Green).",
    eli5: "Like an automatic bakery conveyor belt. Whenever a baker invents a new cookie recipe, robots automatically test the dough, bake a mini batch, test for poison, and only if all tests pass, send it straight to the grocery store!",
    paths: ["devops", "foundations"],
    prerequisites: ["Docker basics"],
    steps: [
      {
        stage: "why",
        stageNumber: 1,
        title: "The High Cost of Infrequent Releases",
        durationMinutes: 1,
        type: "text",
        content: `In traditional legacy development, teams worked on long-lived feature branches for months. Merging into production was a high-stakes, terrifying quarterly event requiring weekend maintenance windows.

When deployments are large and infrequent:
1. Merge conflicts become nightmarish.
2. Root-causing bugs is difficult because thousands of lines changed at once.
3. Rollbacks require reverting massive pull requests.

**Continuous Integration & Continuous Delivery (CI/CD)** automates linting, testing, and deployment so code can ship to production multiple times a day in small, low-risk increments.`,
        keyTakeaway: "Small, frequent automated releases drastically reduce deployment risk and time-to-market.",
      },
      {
        stage: "mental_model",
        stageNumber: 2,
        title: "The Automated Delivery Pipeline",
        durationMinutes: 3,
        type: "stepDiagram",
        content: `The end-to-end automated pipeline workflow:

1. **Commit & Push:** Developer pushes PR to trunk (main).
2. **Continuous Integration (CI):** Fast automated linter, unit test suite, and security scan execute in parallel (< 5 mins).
3. **Build Artifact:** Docker image or production bundle is built and tagged with commit SHA.
4. **Staging Verification:** Deployed to preview environment for automated E2E tests.
5. **Continuous Deployment (CD):** Zero-downtime deployment to production using Blue-Green or Canary gates.`,
        diagramNodes: [
          {
            id: "ci-1",
            label: "1. Code Commit",
            description: "Trunk-based branch merged.",
            subtext: "Git webhook trigger",
          },
          {
            id: "ci-2",
            label: "2. Fast CI Gate",
            description: "Linting, static types, and unit tests.",
            subtext: "Fails fast in < 3 mins",
          },
          {
            id: "ci-3",
            label: "3. Immutable Artifact",
            description: "Docker image tagged with git commit SHA.",
            subtext: "Container registry",
          },
          {
            id: "ci-4",
            label: "4. Deployment Strategy",
            description: "Blue-Green or Canary traffic shifting.",
            subtext: "Zero downtime",
          },
          {
            id: "ci-5",
            label: "5. Production Monitoring",
            description: "Automated rollback if error rate spikes.",
            subtext: "Healthcheck verified",
          },
        ],
        keyTakeaway: "Automated CI/CD turns deployments from an unpredictable event into a routine, automated non-event.",
      },
      {
        stage: "see_it",
        stageNumber: 3,
        title: "Code Walkthrough: GitHub Actions Workflow",
        durationMinutes: 4,
        type: "codeWalkthrough",
        content: `A production GitHub Actions CI workflow with matrix testing and caching:`,
        codeSnippet: `name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Lint & Typecheck
        run: |
          npm run lint
          npx tsc --noEmit

      - name: Unit Tests
        run: npm run test

      - name: Build Artifact
        run: npm run build`,
        codeLanguage: "yaml",
        keyTakeaway: "Cache dependencies (`cache: 'npm'`) and run lint/tests before building the production bundle.",
      },
      {
        stage: "try_it",
        stageNumber: 4,
        title: "Interactive Diagnosis: Deployment Strategies",
        durationMinutes: 4,
        type: "predict",
        content: `You need to deploy a major backend rewrite of your recommendation algorithm handling 100,000 req/sec. You want to verify latency and error rates on real production users with minimal blast radius if something goes wrong.

Which deployment strategy should you select?`,
        interactiveExercise: {
          prompt: "Which deployment strategy routes a small percentage of real user traffic (e.g. 5%) to the new version before rolling out to 100%?",
          options: [
            {
              id: "opt-a",
              text: "Canary Deployment: incrementally shifts traffic (5% -> 25% -> 100%) while monitoring Sentry error rates and telemetry.",
            },
            {
              id: "opt-b",
              text: "Big Bang Deployment: replaces all servers simultaneously at midnight.",
            },
            {
              id: "opt-c",
              text: "Recreate Deployment: terminates all old servers before booting new ones.",
            },
            {
              id: "opt-d",
              text: "Shadowing: clones the entire database and charges credit cards twice.",
            },
          ],
          correctOptionId: "opt-a",
          explanation: "Canary deployments minimize the blast radius of unexpected defects. By routing 5% of traffic to the new version and observing latency and error rates, any failure only affects a tiny fraction of users and can be rolled back automatically in seconds.",
        },
        keyTakeaway: "Canary deployments limit the blast radius by rolling out to a small percentage of live users first.",
      },
      {
        stage: "recall",
        stageNumber: 5,
        title: "Active Recall: Delivery vs Deployment",
        durationMinutes: 3,
        type: "quiz",
        content: `Answer this question to verify your understanding of modern DevOps definitions:`,
        interactiveExercise: {
          prompt: "What is the key difference between Continuous Delivery and Continuous Deployment?",
          options: [
            {
              id: "opt-1",
              text: "Continuous Delivery automatically deploys to a staging environment and prepares a production-ready artifact, requiring a manual human approval button to release to production. Continuous Deployment deploys every passing commit to production automatically without manual intervention.",
            },
            {
              id: "opt-2",
              text: "Continuous Delivery requires Docker; Continuous Deployment requires Kubernetes.",
            },
            {
              id: "opt-3",
              text: "Continuous Deployment only works on frontend static sites.",
            },
            {
              id: "opt-4",
              text: "Continuous Delivery runs tests; Continuous Deployment skips tests.",
            },
          ],
          correctOptionId: "opt-1",
          explanation: "Both automate testing and building. The sole difference is whether the final push to production is gated by a manual human approval click (Delivery) or occurs 100% automatically upon passing all pipeline gates (Deployment).",
        },
        keyTakeaway: "Continuous Delivery = ready to ship with manual approval. Continuous Deployment = auto-ships directly to production.",
      },
    ],
    reference: {
      whereUsed: [
        "Modern cloud-native engineering teams (deploying 10+ times per day)",
        "Automated regression prevention and pull request validation",
        "Zero-downtime production upgrades with automated rollback",
      ],
      commonlyConfusedWith: [
        "Continuous Delivery vs Continuous Deployment (manual approval gate vs 100% automated rollout)",
        "Blue-Green vs Canary (instant full-traffic router flip vs incremental percentage-based rollout)",
        "GitFlow vs Trunk-Based Development (long-lived branch trees vs frequent short-lived branches into main)",
      ],
      remember: [
        "Fast CI feedback loop: lint, typecheck, test in < 5 minutes",
        "Artifacts are immutable: build once, tag with commit SHA, deploy everywhere",
        "Canary deployments minimize blast radius by testing on 5% of real traffic",
        "Pair CD with automated rollback triggers on error rate spikes",
      ],
    },
    xpAward: 50,
  },
];
