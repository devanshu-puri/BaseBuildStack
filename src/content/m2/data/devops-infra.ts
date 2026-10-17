import { M2Question } from "../question-schema";

export const DEVOPS_QUESTIONS: M2Question[] = [
  // --- DOCKER ---
  {
    id: "m2-docker-001",
    skillId: "docker",
    topic: "layer-caching",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "Why is it recommended in a Node.js Dockerfile to copy `package.json` and `package-lock.json` before running `npm install`, and only copy application code (`COPY . .`) afterwards?",
    options: [
      {
        id: "A",
        text: "To leverage Docker's build layer caching: if dependencies haven't changed, Docker reuses the cached `npm install` layer even when application source code changes.",
      },
      {
        id: "B",
        text: "`npm install` crashes if non-dependency files exist in the container filesystem.",
      },
      {
        id: "C",
        text: "To ensure production environment secrets are stripped from the intermediate image.",
      },
      {
        id: "D",
        text: "Because Docker images cannot execute `COPY` commands twice consecutively.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Docker evaluates layer cache based on whether the command and copied files have changed. If you `COPY . .` first, every single code change invalidates all subsequent steps, forcing a slow `npm install` on every build. Copying lockfiles first ensures `npm install` only re-runs when dependencies actually change.",
      whyWrong: {
        B: "`npm install` does not care about application source files being present.",
        C: "Secrets management in Docker requires build secrets (`--secret`), not file copy ordering.",
        D: "Dockerfiles can run as many `COPY` instructions as needed.",
      },
      interviewTakeaway:
        "Order Dockerfile instructions from least frequently changed (OS packages -> language runtimes -> lockfiles -> npm install) to most frequently changed (application source code).",
    },
    tags: ["docker", "layer-caching", "dockerfile", "optimization"],
    sourceRefs: ["Docker Best Practices: Optimize image layers"],
    version: 1,
    status: "published",
  },

  // --- KUBERNETES ---
  {
    id: "m2-k8s-001",
    skillId: "kubernetes",
    topic: "probes-lifecycle",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "What is the operational difference between a Kubernetes `livenessProbe` and a `readinessProbe` failing?",
    options: [
      {
        id: "A",
        text: "A failing `livenessProbe` restarts the container (killing deadlocks); a failing `readinessProbe` temporarily removes the Pod from Service endpoints so it stops receiving client traffic.",
      },
      {
        id: "B",
        text: "A failing `readinessProbe` reboots the physical worker node; a failing `livenessProbe` drains the pod.",
      },
      {
        id: "C",
        text: "Both probes trigger immediate container termination and Pod rescheduling on a different cluster node.",
      },
      {
        id: "D",
        text: "`livenessProbe` is evaluated only during initial container startup; `readinessProbe` runs indefinitely.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`livenessProbe` determines if the container is alive (restarts it if deadlocked or stuck). `readinessProbe` determines if the container is ready to accept user traffic (e.g. warming caches or establishing database connections). Failing readiness keeps the container alive but removes it from Service load balancing until it passes again.",
      whyWrong: {
        B: "Readiness probe failures never reboot physical nodes.",
        C: "Readiness probe failure does NOT terminate or restart the container; it only removes it from Service endpoints.",
        D: "Startup probes handle slow startup times; both liveness and readiness run periodically throughout the container lifecycle.",
      },
      interviewTakeaway:
        "Crucial interview point: Never make `livenessProbe` depend on external services (like downstream databases) — if the DB goes down, all your pods will restart in a catastrophic cascading failure.",
    },
    tags: ["kubernetes", "probes", "reliability", "pod-lifecycle"],
    sourceRefs: ["Kubernetes Documentation: Configure Liveness, Readiness and Startup Probes"],
    version: 1,
    status: "published",
  },

  // --- AWS ---
  {
    id: "m2-aws-001",
    skillId: "aws",
    topic: "vpc-security-groups-nacls",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "What is the key architectural difference between an AWS Security Group and a Network Access Control List (NACL)?",
    options: [
      {
        id: "A",
        text: "Security Groups operate at the instance/ENI level and are stateful (inbound traffic automatically allows return outbound traffic); NACLs operate at the subnet level and are stateless.",
      },
      {
        id: "B",
        text: "Security Groups operate at the subnet level and are stateless; NACLs operate at the instance level and are stateful.",
      },
      {
        id: "C",
        text: "Security Groups support explicit DENY rules, whereas NACLs only support ALLOW rules.",
      },
      {
        id: "D",
        text: "NACLs only filter IPv6 traffic, whereas Security Groups filter IPv4 traffic.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Security Groups are attached to ENIs (Elastic Network Interfaces / EC2 instances) and are stateful: if an inbound rule permits traffic on port 443, the response traffic is automatically allowed regardless of outbound rules. NACLs apply to entire subnets and are stateless (you must explicitly permit both inbound and outbound ephemeral port ranges).",
      whyWrong: {
        B: "This reverses their scope: Security Groups are instance-level; NACLs are subnet-level.",
        C: "Security Groups only support ALLOW rules (everything else is denied by default); NACLs support both numbered ALLOW and DENY rules.",
        D: "Both support IPv4 and IPv6.",
      },
      interviewTakeaway:
        "Remember: Security Groups = Instance level, stateful, allow-only. NACLs = Subnet level, stateless, ordered allow/deny rules.",
    },
    tags: ["aws", "vpc", "security-groups", "nacls", "networking"],
    sourceRefs: ["AWS Documentation: Comparison of Security Groups and Network ACLs"],
    version: 1,
    status: "published",
  },

  // --- CI/CD ---
  {
    id: "m2-cicd-001",
    skillId: "ci-cd",
    topic: "deployment-strategies",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 4,
    prompt:
      "What is the primary operational advantage of a Canary Deployment over a traditional Blue/Green deployment?",
    options: [
      {
        id: "A",
        text: "A Canary deployment rolls out the new version to a small percentage (e.g. 5%) of real users first, allowing real-world telemetry monitoring before full exposure.",
      },
      {
        id: "B",
        text: "Canary deployments do not require maintaining multiple application versions simultaneously.",
      },
      {
        id: "C",
        text: "Canary deployments eliminate the need for backwards-compatible database schema migrations.",
      },
      {
        id: "D",
        text: "Canary deployments execute exclusively in local developer test environments.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Canary releases direct a small fraction of real production traffic to the new revision while monitoring error rates, latency, and business metrics. If an anomaly occurs, only a tiny subset of users is impacted and traffic automatically routes back. Blue/Green flips 100% of traffic at once.",
      whyWrong: {
        B: "Both strategies run multiple versions concurrently during the rollout phase.",
        C: "Both canary and blue/green deployments require backwards-compatible database migrations (expand-and-contract pattern) because both versions run against the database simultaneously.",
        D: "Canary is explicitly a production traffic management strategy.",
      },
      interviewTakeaway:
        "Emphasize the database rule: whenever two application versions run in parallel (Canary or Blue-Green), database changes must follow the Expand and Contract pattern (never drop/rename columns in the same release).",
    },
    tags: ["ci-cd", "canary", "blue-green", "devops"],
    sourceRefs: ["Martin Fowler: CanaryRelease"],
    version: 1,
    status: "published",
  },

  // --- GIT ---
  {
    id: "m2-git-001",
    skillId: "git",
    topic: "rebase-vs-merge",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "What is the fundamental difference in commit history between `git merge main` and `git rebase main` on a feature branch?",
    options: [
      {
        id: "A",
        text: "`git merge` creates a new merge commit combining both histories; `git rebase` replays your feature commits on top of main, creating a linear history.",
      },
      {
        id: "B",
        text: "`git rebase` permanently destroys uncommitted local changes, whereas `git merge` preserves them.",
      },
      {
        id: "C",
        text: "`git merge` modifies existing commit hashes, whereas `git rebase` preserves original commit SHA-1 identifiers.",
      },
      {
        id: "D",
        text: "`git rebase` only works on public shared remote branches.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`git merge` preserves true chronological history by creating a non-destructive merge commit with two parents. `git rebase` rewrites history by creating brand new commits for each feature commit on top of the target branch tip, resulting in a clean, linear commit log.",
      whyWrong: {
        B: "Neither command destroys uncommitted changes if Git's index is clean; both will abort if unstaged changes conflict.",
        C: "Rebase rewrites commit SHAs (because parent commits and timestamps change); merge keeps existing SHAs intact.",
        D: "Golden rule of Git: never rebase public shared branches that others are working on.",
      },
      interviewTakeaway:
        "Explain the team workflow: 'We use rebase for local feature branches before PR submission to keep commit history clean and atomic, but merge commits when integrating into main.'",
    },
    tags: ["git", "rebase", "merge", "version-control"],
    sourceRefs: ["Pro Git Book: Git Branching - Rebasing"],
    version: 1,
    status: "published",
  },

  // --- LINUX ---
  {
    id: "m2-linux-001",
    skillId: "linux",
    topic: "signals-sigterm-sigkill",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "When stopping a process or container gracefully, why should you send `SIGTERM` (signal 15) before `SIGKILL` (signal 9)?",
    options: [
      {
        id: "A",
        text: "`SIGTERM` can be caught and handled by the process, allowing it to close open connections, finish in-flight requests, and flush data; `SIGKILL` forcibly terminates the process immediately without cleanup.",
      },
      {
        id: "B",
        text: "`SIGKILL` corrupts the Linux kernel file table if sent to a root process.",
      },
      {
        id: "C",
        text: "`SIGTERM` only works on daemon processes spawned by systemd.",
      },
      {
        id: "D",
        text: "The OS requires a 30-second delay between any two signals.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`SIGTERM` is the standard graceful termination signal. The process's signal handler catches it, stops accepting new requests, drains existing work, closes database connections, and exits cleanly with 0. `SIGKILL` cannot be caught or ignored; the OS kernel destroys the process immediately, risking data corruption.",
      whyWrong: {
        B: "SIGKILL does not corrupt the OS kernel file table; OS reclaims resources, but in-flight application state is lost.",
        C: "SIGTERM works on any standard process, not only systemd daemons.",
        D: "Signals can be sent at any interval without mandatory OS delays.",
      },
      interviewTakeaway:
        "In Kubernetes and Docker, Pod shutdown starts with `SIGTERM`. If the process has not terminated after `terminationGracePeriodSeconds` (default 30s), K8s sends `SIGKILL`.",
    },
    tags: ["linux", "signals", "sigterm", "sigkill", "graceful-shutdown"],
    sourceRefs: ["Linux Programmer's Manual: signal(7)"],
    version: 1,
    status: "published",
  },
];
