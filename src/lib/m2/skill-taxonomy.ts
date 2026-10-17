export interface CanonicalSkill {
  id: string;
  slug: string;
  name: string;
  category:
    | "languages"
    | "frontend"
    | "backend"
    | "databases"
    | "cloud_devops"
    | "cs_fundamentals"
    | "ai_ml";
  aliases: string[];
  icon: string;
  isActive: boolean;
}

export interface TargetRole {
  id: string;
  name: string;
  description: string;
  recommendedSkills: string[];
}

export const CANONICAL_SKILLS: CanonicalSkill[] = [
  // Languages
  {
    id: "javascript",
    slug: "javascript",
    name: "JavaScript",
    category: "languages",
    aliases: ["js", "es6", "ecmascript", "javascript", "vanilla js"],
    icon: "⚡",
    isActive: true,
  },
  {
    id: "typescript",
    slug: "typescript",
    name: "TypeScript",
    category: "languages",
    aliases: ["ts", "typescript"],
    icon: "🔷",
    isActive: true,
  },
  {
    id: "python",
    slug: "python",
    name: "Python",
    category: "languages",
    aliases: ["py", "python3", "python"],
    icon: "🐍",
    isActive: true,
  },
  {
    id: "go",
    slug: "go",
    name: "Go",
    category: "languages",
    aliases: ["golang", "go"],
    icon: "🐹",
    isActive: true,
  },
  {
    id: "rust",
    slug: "rust",
    name: "Rust",
    category: "languages",
    aliases: ["rust", "rust-lang"],
    icon: "🦀",
    isActive: true,
  },
  {
    id: "java",
    slug: "java",
    name: "Java",
    category: "languages",
    aliases: ["java", "jvm", "jdk"],
    icon: "☕",
    isActive: true,
  },
  {
    id: "csharp",
    slug: "csharp",
    name: "C#",
    category: "languages",
    aliases: ["c#", "csharp", "c-sharp"],
    icon: "🎯",
    isActive: true,
  },
  {
    id: "cpp",
    slug: "cpp",
    name: "C++",
    category: "languages",
    aliases: ["c++", "cpp"],
    icon: "⚙️",
    isActive: true,
  },
  {
    id: "kotlin",
    slug: "kotlin",
    name: "Kotlin",
    category: "languages",
    aliases: ["kotlin", "kt"],
    icon: "🟣",
    isActive: true,
  },
  {
    id: "swift",
    slug: "swift",
    name: "Swift",
    category: "languages",
    aliases: ["swift", "swiftui"],
    icon: "🕊️",
    isActive: true,
  },

  // Frontend
  {
    id: "html-css",
    slug: "html-css",
    name: "HTML & CSS",
    category: "frontend",
    aliases: ["html", "html5", "css", "css3", "sass", "scss", "flexbox", "grid"],
    icon: "🌐",
    isActive: true,
  },
  {
    id: "react",
    slug: "react",
    name: "React",
    category: "frontend",
    aliases: ["reactjs", "react.js", "react"],
    icon: "⚛️",
    isActive: true,
  },
  {
    id: "nextjs",
    slug: "nextjs",
    name: "Next.js",
    category: "frontend",
    aliases: ["nextjs", "next.js", "next"],
    icon: "▲",
    isActive: true,
  },
  {
    id: "vue",
    slug: "vue",
    name: "Vue",
    category: "frontend",
    aliases: ["vue", "vuejs", "vue.js", "nuxt", "nuxtjs"],
    icon: "🟢",
    isActive: true,
  },
  {
    id: "angular",
    slug: "angular",
    name: "Angular",
    category: "frontend",
    aliases: ["angular", "angularjs", "ng"],
    icon: "🔺",
    isActive: true,
  },
  {
    id: "tailwind-css",
    slug: "tailwind-css",
    name: "Tailwind CSS",
    category: "frontend",
    aliases: ["tailwind", "tailwindcss"],
    icon: "🌊",
    isActive: true,
  },
  {
    id: "react-native",
    slug: "react-native",
    name: "React Native",
    category: "frontend",
    aliases: ["react native", "react-native", "rn"],
    icon: "📱",
    isActive: true,
  },
  {
    id: "flutter",
    slug: "flutter",
    name: "Flutter",
    category: "frontend",
    aliases: ["flutter", "dart"],
    icon: "🦋",
    isActive: true,
  },

  // Backend
  {
    id: "nodejs",
    slug: "nodejs",
    name: "Node.js",
    category: "backend",
    aliases: ["node", "nodejs", "node.js"],
    icon: "🟩",
    isActive: true,
  },
  {
    id: "express",
    slug: "express",
    name: "Express",
    category: "backend",
    aliases: ["express", "expressjs", "express.js"],
    icon: "🚂",
    isActive: true,
  },
  {
    id: "nestjs",
    slug: "nestjs",
    name: "NestJS",
    category: "backend",
    aliases: ["nest", "nestjs", "nest.js"],
    icon: "🐱",
    isActive: true,
  },
  {
    id: "django",
    slug: "django",
    name: "Django",
    category: "backend",
    aliases: ["django", "django-rest-framework", "drf"],
    icon: "🎸",
    isActive: true,
  },
  {
    id: "fastapi",
    slug: "fastapi",
    name: "FastAPI",
    category: "backend",
    aliases: ["fastapi", "fast-api"],
    icon: "⚡",
    isActive: true,
  },
  {
    id: "flask",
    slug: "flask",
    name: "Flask",
    category: "backend",
    aliases: ["flask"],
    icon: "🧪",
    isActive: true,
  },
  {
    id: "spring-boot",
    slug: "spring-boot",
    name: "Spring Boot",
    category: "backend",
    aliases: ["spring", "spring boot", "springboot"],
    icon: "🍃",
    isActive: true,
  },
  {
    id: "dotnet",
    slug: "dotnet",
    name: ".NET",
    category: "backend",
    aliases: [".net", "dotnet", "asp.net", "aspnet", "asp.net core"],
    icon: "🔷",
    isActive: true,
  },
  {
    id: "rest-apis",
    slug: "rest-apis",
    name: "REST APIs",
    category: "backend",
    aliases: ["rest", "rest api", "rest apis", "restful", "restful apis"],
    icon: "🔌",
    isActive: true,
  },
  {
    id: "graphql",
    slug: "graphql",
    name: "GraphQL",
    category: "backend",
    aliases: ["graphql", "apollo", "gql"],
    icon: "🌸",
    isActive: true,
  },
  {
    id: "grpc",
    slug: "grpc",
    name: "gRPC",
    category: "backend",
    aliases: ["grpc", "protobuf", "protocol buffers"],
    icon: "📡",
    isActive: true,
  },

  // Databases & Storage
  {
    id: "sql",
    slug: "sql",
    name: "SQL",
    category: "databases",
    aliases: ["sql", "rdbms", "relational database"],
    icon: "🗄️",
    isActive: true,
  },
  {
    id: "postgresql",
    slug: "postgresql",
    name: "PostgreSQL",
    category: "databases",
    aliases: ["postgres", "postgresql", "psql"],
    icon: "🐘",
    isActive: true,
  },
  {
    id: "mysql",
    slug: "mysql",
    name: "MySQL",
    category: "databases",
    aliases: ["mysql", "mariadb"],
    icon: "🐬",
    isActive: true,
  },
  {
    id: "mongodb",
    slug: "mongodb",
    name: "MongoDB",
    category: "databases",
    aliases: ["mongo", "mongodb", "nosql"],
    icon: "🍃",
    isActive: true,
  },
  {
    id: "redis",
    slug: "redis",
    name: "Redis",
    category: "databases",
    aliases: ["redis", "in-memory cache", "valkey"],
    icon: "🔴",
    isActive: true,
  },
  {
    id: "kafka",
    slug: "kafka",
    name: "Kafka",
    category: "databases",
    aliases: ["kafka", "apache kafka", "event stream"],
    icon: "📬",
    isActive: true,
  },
  {
    id: "rabbitmq",
    slug: "rabbitmq",
    name: "RabbitMQ",
    category: "databases",
    aliases: ["rabbitmq", "amqp", "message queue"],
    icon: "🐇",
    isActive: true,
  },

  // Cloud & DevOps
  {
    id: "docker",
    slug: "docker",
    name: "Docker",
    category: "cloud_devops",
    aliases: ["docker", "containers", "containerization"],
    icon: "🐳",
    isActive: true,
  },
  {
    id: "kubernetes",
    slug: "kubernetes",
    name: "Kubernetes",
    category: "cloud_devops",
    aliases: ["kubernetes", "k8s", "k8"],
    icon: "☸️",
    isActive: true,
  },
  {
    id: "aws",
    slug: "aws",
    name: "AWS",
    category: "cloud_devops",
    aliases: ["aws", "amazon web services", "ec2", "s3", "lambda"],
    icon: "☁️",
    isActive: true,
  },
  {
    id: "gcp",
    slug: "gcp",
    name: "GCP",
    category: "cloud_devops",
    aliases: ["gcp", "google cloud", "google cloud platform"],
    icon: "🌈",
    isActive: true,
  },
  {
    id: "azure",
    slug: "azure",
    name: "Azure",
    category: "cloud_devops",
    aliases: ["azure", "microsoft azure"],
    icon: "🟦",
    isActive: true,
  },
  {
    id: "terraform",
    slug: "terraform",
    name: "Terraform",
    category: "cloud_devops",
    aliases: ["terraform", "iac", "infrastructure as code"],
    icon: "🏗️",
    isActive: true,
  },
  {
    id: "ci-cd",
    slug: "ci-cd",
    name: "CI/CD",
    category: "cloud_devops",
    aliases: ["ci/cd", "cicd", "github actions", "gitlab ci", "jenkins"],
    icon: "🔄",
    isActive: true,
  },
  {
    id: "git",
    slug: "git",
    name: "Git",
    category: "cloud_devops",
    aliases: ["git", "github", "version control"],
    icon: "🐙",
    isActive: true,
  },
  {
    id: "linux",
    slug: "linux",
    name: "Linux",
    category: "cloud_devops",
    aliases: ["linux", "bash", "unix", "shell scripting"],
    icon: "🐧",
    isActive: true,
  },
  {
    id: "nginx",
    slug: "nginx",
    name: "Nginx",
    category: "cloud_devops",
    aliases: ["nginx", "reverse proxy"],
    icon: "🟢",
    isActive: true,
  },

  // CS Fundamentals & Architecture
  {
    id: "system-design",
    slug: "system-design",
    name: "System Design",
    category: "cs_fundamentals",
    aliases: ["system design", "distributed systems", "high availability", "scalability"],
    icon: "📐",
    isActive: true,
  },
  {
    id: "dsa",
    slug: "dsa",
    name: "DSA",
    category: "cs_fundamentals",
    aliases: ["dsa", "data structures", "algorithms", "problem solving"],
    icon: "🌳",
    isActive: true,
  },
  {
    id: "oop-design-patterns",
    slug: "oop-design-patterns",
    name: "OOP & Design Patterns",
    category: "cs_fundamentals",
    aliases: ["oop", "object oriented programming", "design patterns", "solid principles"],
    icon: "🧩",
    isActive: true,
  },
  {
    id: "networking-http",
    slug: "networking-http",
    name: "Networking & HTTP",
    category: "cs_fundamentals",
    aliases: ["networking", "http", "http/2", "http/3", "tcp/ip", "dns", "websockets", "tls"],
    icon: "🌐",
    isActive: true,
  },
  {
    id: "auth-security",
    slug: "auth-security",
    name: "Auth & Security",
    category: "cs_fundamentals",
    aliases: ["auth", "security", "oauth", "jwt", "saml", "authentication", "authorization", "owasp"],
    icon: "🔐",
    isActive: true,
  },
  {
    id: "testing",
    slug: "testing",
    name: "Testing",
    category: "cs_fundamentals",
    aliases: ["testing", "unit testing", "jest", "vitest", "playwright", "cypress", "tdd"],
    icon: "🧪",
    isActive: true,
  },

  // AI & ML
  {
    id: "tensorflow-pytorch",
    slug: "tensorflow-pytorch",
    name: "TensorFlow/PyTorch",
    category: "ai_ml",
    aliases: ["pytorch", "tensorflow", "keras", "deep learning", "machine learning"],
    icon: "🔥",
    isActive: true,
  },
  {
    id: "llms-rag",
    slug: "llms-rag",
    name: "LLMs & RAG",
    category: "ai_ml",
    aliases: ["llm", "llms", "rag", "langchain", "llamaindex", "embeddings", "vector db", "vector databases"],
    icon: "🧠",
    isActive: true,
  },
];

// Target roles mapped to top-10 recommended canonical skills
export const TARGET_ROLES: TargetRole[] = [
  {
    id: "frontend",
    name: "Frontend Engineer",
    description: "Web UI, component architecture, state management, and modern browser APIs.",
    recommendedSkills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "HTML & CSS",
      "Tailwind CSS",
      "Testing",
      "REST APIs",
      "GraphQL",
      "System Design",
    ],
  },
  {
    id: "backend",
    name: "Backend Engineer",
    description: "Distributed systems, APIs, database design, caching, and server runtimes.",
    recommendedSkills: [
      "Node.js",
      "Python",
      "Go",
      "PostgreSQL",
      "Redis",
      "Docker",
      "REST APIs",
      "System Design",
      "Kafka",
      "SQL",
    ],
  },
  {
    id: "fullstack",
    name: "Full Stack Engineer",
    description: "End-to-end product engineering from React frontends to database infrastructure.",
    recommendedSkills: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "Docker",
      "Tailwind CSS",
      "REST APIs",
      "System Design",
    ],
  },
  {
    id: "mobile",
    name: "Mobile Engineer",
    description: "Cross-platform and native mobile architectures, offline sync, and app performance.",
    recommendedSkills: [
      "React Native",
      "Flutter",
      "TypeScript",
      "Kotlin",
      "Swift",
      "REST APIs",
      "GraphQL",
      "Auth & Security",
      "Testing",
      "Git",
    ],
  },
  {
    id: "devops",
    name: "DevOps & Cloud Engineer",
    description: "Container orchestration, CI/CD pipelines, infrastructure as code, and observability.",
    recommendedSkills: [
      "Docker",
      "Kubernetes",
      "AWS",
      "CI/CD",
      "Terraform",
      "Linux",
      "Git",
      "Nginx",
      "Networking & HTTP",
      "Auth & Security",
    ],
  },
  {
    id: "ai_ml",
    name: "AI & ML Engineer",
    description: "LLMs, vector databases, model deployment, RAG pipelines, and Python data science.",
    recommendedSkills: [
      "Python",
      "TensorFlow/PyTorch",
      "LLMs & RAG",
      "FastAPI",
      "Docker",
      "PostgreSQL",
      "Redis",
      "Git",
      "Linux",
      "REST APIs",
    ],
  },
];

export const POPULAR_STACK_CHIPS: string[] = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Go",
  "Java",
  "Rust",
  "PostgreSQL",
  "Redis",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "AWS",
  "GraphQL",
  "System Design",
  "DSA",
  "Tailwind CSS",
  "Kafka",
  "FastAPI",
  "Git",
  "Linux",
  "REST APIs",
];

// Build alias lookup map once
const ALIAS_MAP = new Map<string, CanonicalSkill>();
for (const skill of CANONICAL_SKILLS) {
  ALIAS_MAP.set(skill.name.toLowerCase(), skill);
  ALIAS_MAP.set(skill.slug.toLowerCase(), skill);
  ALIAS_MAP.set(skill.id.toLowerCase(), skill);
  for (const alias of skill.aliases) {
    ALIAS_MAP.set(alias.toLowerCase(), skill);
  }
}

/**
 * Normalizes any freeform skill string or alias into its CanonicalSkill definition.
 * Returns null if the skill is outside the canonical taxonomy.
 */
export function normalizeSkillAlias(term: string): CanonicalSkill | null {
  if (!term || typeof term !== "string") return null;
  const clean = term.trim().toLowerCase();
  return ALIAS_MAP.get(clean) || null;
}

export function getSkillBySlug(slug: string): CanonicalSkill | null {
  if (!slug) return null;
  const clean = slug.trim().toLowerCase();
  return CANONICAL_SKILLS.find((s) => s.slug === clean || s.id === clean) || null;
}

// Backwards-compatible dictionary for existing extractors and tests
export const KNOWN_TECH_DICTIONARY: Record<string, string> = {};
for (const [alias, skill] of ALIAS_MAP.entries()) {
  KNOWN_TECH_DICTIONARY[alias] = skill.name;
}
