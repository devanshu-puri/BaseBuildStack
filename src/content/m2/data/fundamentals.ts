import { M2Question } from "../question-schema";

export const FUNDAMENTALS_QUESTIONS: M2Question[] = [
  // --- SYSTEM DESIGN ---
  {
    id: "m2-sd-001",
    skillId: "system-design",
    topic: "cap-pacelc",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "According to the PACELC theorem, what trade-off must a distributed database make when there is NO network partition (the 'Else' branch)?",
    options: [
      {
        id: "A",
        text: "Trade-off between Latency (L) and Consistency (C).",
      },
      {
        id: "B",
        text: "Trade-off between Availability (A) and Partition Tolerance (P).",
      },
      {
        id: "C",
        text: "Trade-off between Storage Durability and Read Throughput.",
      },
      {
        id: "D",
        text: "Trade-off between Encryption strength and CPU utilization.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "PACELC extends the CAP theorem: If there is a Partition (P), how does the system trade off Availability (A) and Consistency (C)? Else (E), when running normally, how does the system trade off Latency (L) and Consistency (C)? For example, DynamoDB/Cassandra is PA/EL (favors low latency normally), whereas MongoDB/Spanner is PC/EC (favors strong consistency).",
      whyWrong: {
        B: "Trade-off between Availability and Partition Tolerance is the CAP partition scenario, not the normal operation scenario.",
        C: "Storage durability is handled by replication and journaling, not PACELC's latency vs consistency axis.",
        D: "Security encryption is completely unrelated to distributed consensus theorems.",
      },
      interviewTakeaway:
        "Impress interviewers by moving beyond CAP to PACELC: 'CAP only describes failure modes. PACELC also describes the trade-off during normal operations: lower latency or higher consistency.'",
    },
    tags: ["system-design", "pacelc", "cap-theorem", "distributed-systems"],
    sourceRefs: ["Daniel Abadi: PACELC Theorem (2012)"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-sd-002",
    skillId: "system-design",
    topic: "consistent-hashing",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "When using consistent hashing to distribute cache keys across N servers on a hash ring, why are 'Virtual Nodes' (Vnodes) introduced?",
    options: [
      {
        id: "A",
        text: "To ensure uniform distribution of keys and prevent hot-spot load skew when nodes have disparate hardware capacities or when servers join/leave.",
      },
      {
        id: "B",
        text: "To encrypt keys using public-key cryptography before hashing.",
      },
      {
        id: "C",
        text: "To bypass the need for hash functions entirely.",
      },
      {
        id: "D",
        text: "To enable synchronous master-slave replication across rings.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "With basic consistent hashing, physical servers map to single points on the ring, resulting in uneven key ranges (non-uniform distribution). By mapping each physical server to hundreds of virtual nodes (tokens) scattered around the ring, keys are distributed uniformly, and adding/removing a server rebalances small fractions across all nodes rather than dumping load onto one neighbor.",
      whyWrong: {
        B: "Consistent hashing uses fast non-cryptographic hash functions like MurmurHash3 or CityHash, not public key encryption.",
        C: "Vnodes still rely on hash functions to position tokens along the 360-degree ring.",
        D: "Replication topology is distinct from partition placement.",
      },
      interviewTakeaway:
        "Always mention virtual nodes when discussing consistent hashing in system design rounds (e.g. designing Dynamo, Cassandra, or a distributed cache cluster).",
    },
    tags: ["system-design", "consistent-hashing", "virtual-nodes", "caching"],
    sourceRefs: ["Dynamo: Amazon's Highly Available Key-value Store"],
    version: 1,
    status: "published",
  },

  // --- AUTH & SECURITY ---
  {
    id: "m2-auth-001",
    skillId: "auth-security",
    topic: "jwt-vs-sessions",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "What is the major security challenge of using stateless JSON Web Tokens (JWT) stored in the browser for user authentication compared to server-side sessions?",
    options: [
      {
        id: "A",
        text: "Immediate token revocation is difficult before expiration without introducing stateful server-side blocklists (e.g. in Redis).",
      },
      {
        id: "B",
        text: "JWT signatures cannot be verified without querying the database on every request.",
      },
      {
        id: "C",
        text: "JWTs cannot transmit user roles or permissions.",
      },
      {
        id: "D",
        text: "JWTs are only compatible with HTTP GET requests.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Because stateless JWTs are self-contained and validated cryptographically via the server's public/secret key, a signed token remains valid until it expires. If a user logs out, changes their password, or their account is compromised, the token cannot be revoked immediately without maintaining a centralized revocation list, which negates the 'stateless' benefit.",
      whyWrong: {
        B: "JWTs are designed specifically to be verified in-memory using public/symmetric keys without database lookups.",
        C: "JWT claims payloads can encode roles, permissions, user IDs, and metadata.",
        D: "JWTs are transmitted in the `Authorization: Bearer <token>` header, compatible with any HTTP method.",
      },
      interviewTakeaway:
        "Practical architecture: short-lived access tokens (5–15 mins) paired with stateful refresh tokens stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies.",
    },
    tags: ["auth-security", "jwt", "sessions", "token-revocation"],
    sourceRefs: ["RFC 7519: JSON Web Token (JWT)"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-auth-002",
    skillId: "auth-security",
    topic: "oauth-pkce",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "Why is Proof Key for Code Exchange (PKCE) required for Single Page Apps (SPAs) and mobile applications using OAuth 2.0 Authorization Code flow?",
    options: [
      {
        id: "A",
        text: "Because public clients cannot securely store a `client_secret`; PKCE dynamically generates a cryptographic `code_verifier` and `code_challenge` to prevent authorization code interception attacks.",
      },
      {
        id: "B",
        text: "To allow OAuth 2.0 to bypass HTTPS requirements on localhost.",
      },
      {
        id: "C",
        text: "To automatically encrypt the user's password in browser memory.",
      },
      {
        id: "D",
        text: "To eliminate the need for an authorization server callback redirect URI.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "SPAs and mobile apps are 'public clients': their source code and memory can be inspected, so embedding a static `client_secret` leaks it. PKCE creates a temporary high-entropy secret (`code_verifier`) and sends its hash (`code_challenge`) with the authorization request. When exchanging the code, the client sends the verifier, proving it was the original requester without needing a static secret.",
      whyWrong: {
        B: "OAuth 2.0 and PKCE strictly require HTTPS in production.",
        C: "PKCE protects the authorization code exchange, not user credentials.",
        D: "Redirect URIs remain mandatory in PKCE.",
      },
      interviewTakeaway:
        "Emphasize: OAuth 2.1 has deprecated the Implicit flow entirely and mandates PKCE for all Authorization Code grant flows.",
    },
    tags: ["auth-security", "oauth2", "pkce", "single-page-apps"],
    sourceRefs: ["RFC 7636: Proof Key for Code Exchange by OAuth Public Clients"],
    version: 1,
    status: "published",
  },

  // --- NETWORKING & HTTP ---
  {
    id: "m2-net-001",
    skillId: "networking-http",
    topic: "http2-vs-http3-quic",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "HTTP/2 introduced multiplexing over a single TCP connection, but can suffer from TCP Head-of-Line (HoL) blocking when packet loss occurs. How does HTTP/3 (QUIC) resolve this?",
    options: [
      {
        id: "A",
        text: "HTTP/3 runs over UDP with QUIC: each multiplexed stream is independent at the transport layer, so losing a packet on Stream A does NOT block Stream B.",
      },
      {
        id: "B",
        text: "HTTP/3 opens hundreds of parallel TCP sockets simultaneously to bypass OS packet buffers.",
      },
      {
        id: "C",
        text: "HTTP/3 requires clients to use raw Ethernet frame broadcasting.",
      },
      {
        id: "D",
        text: "HTTP/3 disables packet retransmissions entirely to reduce latency.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "In HTTP/2, all streams share one TCP connection. If a single TCP segment drops, TCP stops delivering data to the application until the missing segment is retransmitted, stalling all HTTP streams. HTTP/3 replaces TCP with QUIC over UDP, managing loss recovery on individual streams independently so packet drops only impact the affected stream.",
      whyWrong: {
        B: "Opening many TCP connections is HTTP/1.1's approach, which suffers from connection overhead and slow start.",
        C: "HTTP/3 operates at the transport/application layer over IP/UDP, not raw layer 2 Ethernet broadcasts.",
        D: "QUIC provides reliable in-order delivery per stream; it does not disable retransmissions.",
      },
      interviewTakeaway:
        "State the protocol stack clearly: HTTP/1.1 = 1 request per TCP connection; HTTP/2 = multiplexed streams over 1 TCP connection (susceptible to TCP HoL); HTTP/3 = multiplexed streams over QUIC/UDP (no HoL across streams + 0-RTT handshakes).",
    },
    tags: ["networking-http", "http3", "quic", "head-of-line-blocking"],
    sourceRefs: ["RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport"],
    version: 1,
    status: "published",
  },
];
