const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { generateGeminiContent, repairAIJSONString, MODELS } = require('./ai.service');
const prisma = require('../lib/prisma');

/**
 * Clean AI JSON response (removes ```json ... ``` blocks if present)
 */
const cleanAIJSON = (text) => {
    try {
        if (!text) return '';
        let trimmed = text.trim();
        if (trimmed.startsWith('```json')) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith('```')) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith('```')) {
            trimmed = trimmed.substring(0, trimmed.length - 3);
        }
        return repairAIJSONString(trimmed.trim());
    } catch (e) {
        return text;
    }
};

// Comprehensive Curated Curriculum Fallbacks for Core Engineering & Academic Subjects
const SUBJECT_CURRICULA = {
    dbms: {
        matches: ['database', 'dbms', 'sql', 'relational', 'korth', 'navathe', 'silberschatz', 'postgres', 'mysql'],
        bookTitle: 'Database Management Systems',
        chapters: [
            {
                id: 1,
                title: 'Chapter 1: Database Systems Architecture & Foundations',
                pages: 'Pages 1-32',
                description: 'Database vs File Systems, 3-Schema Architecture, Data Independence, DBA Roles, Data Models',
                topics: [
                    'Database vs Traditional File Systems & Data Redundancy',
                    'Three-Schema Architecture & View Levels',
                    'Physical vs Logical Data Independence',
                    'Database Administrators (DBA) Roles & System Privileges',
                    'Data Models (Relational, Network, Hierarchical, NoSQL)'
                ]
            },
            {
                id: 2,
                title: 'Chapter 2: Relational Data Model & Integrity Constraints',
                pages: 'Pages 33-72',
                description: 'Relations, Tuples, Candidate & Primary Keys, Foreign Keys, Referential Integrity Constraints',
                topics: [
                    'Relation Schemas, Tuples & Attribute Domains',
                    'Keys: Super Keys, Candidate Keys & Primary Key Selection',
                    'Foreign Key Constraints & Referential Integrity Rules',
                    'Referential Action Rules (CASCADE, SET NULL, RESTRICT)',
                    'Mapping ER Diagrams to Relational Schemas'
                ]
            },
            {
                id: 3,
                title: 'Chapter 3: Entity-Relationship (ER) & EER Modeling',
                pages: 'Pages 73-116',
                description: 'Entity Sets, Relationships, Cardinality & Modality, Weak Entities, Specialization, Generalization',
                topics: [
                    'Entity Sets & Attributes (Composite, Multi-valued, Derived)',
                    'Relationship Types, Degree & Structural Constraints',
                    'Cardinality Ratios (1:1, 1:N, M:N) & Participation Constraints',
                    'Weak Entity Sets & Identifying Relationship Types',
                    'Enhanced ER (EER): Specialization, Generalization & Aggregation'
                ]
            },
            {
                id: 4,
                title: 'Chapter 4: SQL Fundamentals: DDL, DML & Basic Queries',
                pages: 'Pages 117-164',
                description: 'CREATE, ALTER, DROP, SELECT, WHERE, ORDER BY, GROUP BY, HAVING, Aggregate Functions (COUNT, SUM, AVG)',
                topics: [
                    'DDL: CREATE TABLE, ALTER, DROP, TRUNCATE & Schema Constraints',
                    'DML: INSERT, UPDATE, DELETE & Data Integrity Verification',
                    'Basic Queries: SELECT, DISTINCT, WHERE & Pattern Matching (LIKE)',
                    'Aggregate Functions: COUNT, SUM, AVG, MIN, MAX & NULL Handling',
                    'Grouped Aggregations: GROUP BY Syntax & HAVING Filtering Rules'
                ]
            },
            {
                id: 5,
                title: 'Chapter 5: Advanced SQL: Joins, Subqueries & Views',
                pages: 'Pages 165-218',
                description: 'INNER, LEFT/RIGHT/FULL OUTER JOINs, Natural Joins, Correlated Subqueries, Common Table Expressions (CTEs), Views',
                topics: [
                    'INNER JOIN vs Cartesian Product Mechanics',
                    'LEFT, RIGHT & FULL OUTER JOINs with Missing Data Handling',
                    'Natural Joins, Cross Joins & Join Predicates',
                    'Nested & Correlated Subqueries (IN, EXISTS, ALL, ANY)',
                    'Common Table Expressions (CTEs / WITH clause)',
                    'Database Views, Updatable Views & SQL Triggers'
                ]
            },
            {
                id: 6,
                title: 'Chapter 6: Relational Algebra & Relational Calculus',
                pages: 'Pages 219-262',
                description: 'Selection (σ), Projection (π), Cartesian Product (×), Joins (⋈), Set Operations, TRC and DRC',
                topics: [
                    'Unary Operators: Selection (σ) & Projection (π)',
                    'Set Theory Operators: Union (∪), Intersection (∩), Difference (−)',
                    'Cartesian Product (×) & Joins (Theta, Equi, Natural Join ⋈)',
                    'Division Operator (÷) for Relational Queries',
                    'Tuple Relational Calculus (TRC) & Domain Relational Calculus (DRC)'
                ]
            },
            {
                id: 7,
                title: 'Chapter 7: Schema Refinement & Functional Dependencies',
                pages: 'Pages 263-304',
                description: 'Functional Dependencies, Armstrong\'s Axioms, Attribute Closure (X+), Canonical Cover, Lossless Join',
                topics: [
                    'Functional Dependencies (FDs) & Semantic Integrity',
                    'Armstrong\'s Axioms (Reflexivity, Augmentation, Transitivity)',
                    'Attribute Set Closure (X+) & Candidate Key Finding Algorithm',
                    'Minimal / Canonical Cover Computation',
                    'Lossless Join Decomposition & Dependency Preservation Checks'
                ]
            },
            {
                id: 8,
                title: 'Chapter 8: Relational Normalization (1NF to BCNF, 4NF)',
                pages: 'Pages 305-356',
                description: 'Anomalies (Insertion, Deletion, Update), 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), Multi-valued Dependencies',
                topics: [
                    'Update, Insertion & Deletion Anomalies in Un-normalized Relations',
                    'First Normal Form (1NF) & Non-Atomic Attribute Elimination',
                    'Second Normal Form (2NF) & Partial Functional Dependencies',
                    'Third Normal Form (3NF) & Transitive Dependencies',
                    'Boyce-Codd Normal Form (BCNF) Violations & Decomposition',
                    'Multi-valued Dependencies (MVD) & Fourth Normal Form (4NF)'
                ]
            },
            {
                id: 9,
                title: 'Chapter 9: Storage, File Organization & Indexing',
                pages: 'Pages 357-400',
                description: 'Record Formats, Heap Files, Primary vs Secondary Indexes, Dense vs Sparse Indexing, Clustered Indexes',
                topics: [
                    'Record Formats, Page Headers & Slotted-Page Architecture',
                    'Heap Files vs Sorted Files & Cost Comparison',
                    'Primary, Secondary, and Clustering Indexes',
                    'Dense vs Sparse Indexing Tradeoffs',
                    'Static & Extendible Hashing Techniques'
                ]
            },
            {
                id: 10,
                title: 'Chapter 10: Tree-Structured Indexing: B-Trees & B+ Trees',
                pages: 'Pages 401-448',
                description: 'B+ Tree Search, Node Splitting on Overflow, Deletion & Merging, Index Fanout, Disk I/O Cost Analysis',
                topics: [
                    'B-Tree vs B+ Tree Node Layout & Range Query Differences',
                    'B+ Tree Search Algorithm & Binary Search within Nodes',
                    'B+ Tree Node Insertion & Splitting on Overflow',
                    'B+ Tree Deletion, Redistribution & Merging on Underflow',
                    'Index Fanout, Tree Height & Disk I/O Cost Analysis'
                ]
            },
            {
                id: 11,
                title: 'Chapter 11: Transaction Processing & ACID Properties',
                pages: 'Pages 449-496',
                description: 'Atomicity, Consistency, Isolation, Durability, Transaction States, Read/Write Conflicts, Dirty & Phantom Reads',
                topics: [
                    'ACID Properties: Atomicity, Consistency, Isolation, Durability',
                    'Transaction States (Active, Partially Committed, Failed, Aborted)',
                    'Concurrent Execution Anomalies (Dirty Read, Non-repeatable, Phantom)',
                    'Schedules: Serial, Equivalent, Recoverable & Cascadeless'
                ]
            },
            {
                id: 12,
                title: 'Chapter 12: Concurrency Control & Serializability',
                pages: 'Pages 497-548',
                description: 'Conflict & View Serializability, Two-Phase Locking (2PL & Strict 2PL), Deadlocks, Wait-For Graphs',
                topics: [
                    'Conflict Serializability & Precedence (Serialization) Graphs',
                    'View Serializability & Blind Writes',
                    'Two-Phase Locking (Basic 2PL, Conservative, Strict, Rigorous 2PL)',
                    'Deadlock Prevention (Wait-Die, Wound-Wait Protocols)',
                    'Deadlock Detection via Wait-For Graphs & Cycle Breaking'
                ]
            },
            {
                id: 13,
                title: 'Chapter 13: Database Recovery Systems & Protocols',
                pages: 'Pages 549-592',
                description: 'Write-Ahead Logging (WAL), Checkpointing, Undo/Redo Protocols, ARIES Recovery Algorithm',
                topics: [
                    'Write-Ahead Logging (WAL) Protocol & Steal/No-Steal Rules',
                    'Deferred vs Immediate Database Modification',
                    'Checkpointing Mechanisms (Fuzzy Checkpoints)',
                    'ARIES Recovery Algorithm: Analysis, Redo & Undo Phases'
                ]
            },
            {
                id: 14,
                title: 'Chapter 14: Query Processing & Optimization Techniques',
                pages: 'Pages 593-638',
                description: 'Query Evaluation, Heuristic Query Trees, Cost Estimation, Join Algorithms (Hash Join, Sort-Merge Join)',
                topics: [
                    'Steps in Query Processing: Parsing, Translation, Optimization',
                    'Relational Algebra Equivalence Rules & Heuristic Optimization Trees',
                    'Join Implementations: Nested Loop, Block Nested, Index Nested',
                    'Sort-Merge Join & Hash Join Algorithms',
                    'Cost-based Optimization using Catalog Statistics & Histograms'
                ]
            },
            {
                id: 15,
                title: 'Chapter 15: NoSQL & Distributed Database Architecture',
                pages: 'Pages 639-685',
                description: 'CAP Theorem, BASE Model, Document Stores, Key-Value Stores, Two-Phase Commit Protocol (2PC)',
                topics: [
                    'CAP Theorem: Consistency, Availability, Partition Tolerance',
                    'ACID vs BASE (Basically Available, Soft State, Eventual Consistency)',
                    'Document Stores (JSON/MongoDB) vs Relational Tables',
                    'Key-Value Stores (Redis) & Column-Family Stores (Cassandra)',
                    'Distributed Consensus & Two-Phase Commit Protocol (2PC)'
                ]
            }
        ]
    },
    os: {
        matches: ['operating system', 'os', 'galvin', 'tanenbaum', 'kernel', 'linux'],
        bookTitle: 'Operating System Concepts',
        chapters: [
            { id: 1, title: 'Chapter 1: Operating System Services & Kernel Architectures', pages: 'Pages 1-35', description: 'Monolithic vs Microkernel, System Calls, Dual-Mode Operation, OS Services' },
            { id: 2, title: 'Chapter 2: Process Management & Process Control Blocks (PCB)', pages: 'Pages 36-75', description: 'Process States, Context Switching, Process Creation (fork/exec), Inter-Process Communication (IPC)' },
            { id: 3, title: 'Chapter 3: Threads & Multi-Threading Models', pages: 'Pages 76-115', description: 'User vs Kernel Threads, Thread Pools, Multicore Programming, Concurrency Issues' },
            { id: 4, title: 'Chapter 4: CPU Scheduling Algorithms', pages: 'Pages 116-160', description: 'FCFS, SJF, SRTF, Round Robin (RR), Priority Scheduling, Multilevel Feedback Queues' },
            { id: 5, title: 'Chapter 5: Process Synchronization & Race Conditions', pages: 'Pages 161-210', description: 'Critical Section Problem, Peterson\'s Algorithm, Mutex Locks, Semaphores (Counting & Binary)' },
            { id: 6, title: 'Chapter 6: Classical Synchronization Problems', pages: 'Pages 211-255', description: 'Producer-Consumer Problem, Readers-Writers Problem, Dining Philosophers Problem' },
            { id: 7, title: 'Chapter 7: Deadlocks: Characterization & Avoidance', pages: 'Pages 256-300', description: 'Necessary Conditions (Coffman), Resource Allocation Graphs, Banker\'s Algorithm, Detection & Recovery' },
            { id: 8, title: 'Chapter 8: Main Memory Management & Paging', pages: 'Pages 301-350', description: 'Contiguous Allocation, Paging, Translation Lookaside Buffer (TLB), Multi-level Paging, Segmentation' },
            { id: 9, title: 'Chapter 9: Virtual Memory & Page Replacement', pages: 'Pages 351-405', description: 'Demand Paging, Page Faults, Page Replacement (FIFO, LRU, Optimal), Belady\'s Anomaly, Thrashing' },
            { id: 10, title: 'Chapter 10: File System Interface & Internal Implementation', pages: 'Pages 406-455', description: 'File Attributes, Directory Structures, Inodes, Contiguous vs Linked vs Indexed Allocation' },
            { id: 11, title: 'Chapter 11: Secondary Storage & Disk Scheduling', pages: 'Pages 456-500', description: 'Disk Geometry, FCFS, SSTF, SCAN, C-SCAN, LOOK Disk Scheduling, RAID Levels (0, 1, 5, 6)' }
        ]
    },
    cn: {
        matches: ['network', 'networks', 'computer network', 'tanenbaum', 'kurose', 'tcp', 'ip'],
        bookTitle: 'Computer Networking: Principles & Protocols',
        chapters: [
            { id: 1, title: 'Chapter 1: Computer Networks & The Internet Architecture', pages: 'Pages 1-40', description: 'Network Edge, Packet Switching vs Circuit Switching, Delay, Loss, Throughput, OSI & TCP/IP 5-Layer Models' },
            { id: 2, title: 'Chapter 2: Physical Layer & Transmission Media', pages: 'Pages 41-80', description: 'Guided vs Unguided Media, Modulation, Bandwidth, Nyquist & Shannon Capacity Theorems, Multiplexing' },
            { id: 3, title: 'Chapter 3: Data Link Layer & Framing Protocols', pages: 'Pages 81-125', description: 'Framing, Error Detection (CRC, Checksum, Hamming Code), Flow Control (Stop-and-Wait, Sliding Window)' },
            { id: 4, title: 'Chapter 4: Medium Access Control (MAC) Sublayer', pages: 'Pages 126-170', description: 'ALOHA (Pure & Slotted), CSMA, CSMA/CD (Ethernet), CSMA/CA (Wi-Fi), Collision Avoidance' },
            { id: 5, title: 'Chapter 5: Network Layer: IPv4, IPv6 & Subnetting', pages: 'Pages 171-225', description: 'Datagram vs Virtual Circuit, IPv4 Header, Subnetting, CIDR, NAT, IPv6 Header & Transition Strategies' },
            { id: 6, title: 'Chapter 6: Routing Algorithms & Protocols', pages: 'Pages 226-275', description: 'Distance-Vector Routing (Bellman-Ford), Link-State Routing (Dijkstra/OSPF), BGP Inter-domain Routing' },
            { id: 7, title: 'Chapter 7: Transport Layer: UDP & Reliable TCP', pages: 'Pages 276-330', description: 'Port Numbers, Multiplexing, UDP Mechanics, TCP Header, 3-Way Handshake, Connection Teardown' },
            { id: 8, title: 'Chapter 8: TCP Congestion Control & Flow Control', pages: 'Pages 331-380', description: 'TCP Sliding Window Flow Control, Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery (AIMD)' },
            { id: 9, title: 'Chapter 9: Application Layer Protocols', pages: 'Pages 381-430', description: 'DNS (Domain Name System), HTTP/1.1 vs HTTP/2 vs HTTP/3, SMTP, FTP, Socket Programming' },
            { id: 10, title: 'Chapter 10: Network Security & Cryptography', pages: 'Pages 431-480', description: 'Symmetric (AES) vs Asymmetric (RSA) Encryption, Hashing (SHA-256), SSL/TLS Handshake, Firewalls' }
        ]
    },
    dsa: {
        matches: ['data structure', 'algorithm', 'dsa', 'cormen', 'clrs', 'leetcode'],
        bookTitle: 'Data Structures and Algorithms',
        chapters: [
            { id: 1, title: 'Chapter 1: Algorithm Analysis & Asymptotic Notations', pages: 'Pages 1-35', description: 'Big-O, Omega, Theta Notations, Time & Space Complexity, Recurrence Relations, Master Theorem' },
            { id: 2, title: 'Chapter 2: Arrays, Dynamic Arrays & Two-Pointer Techniques', pages: 'Pages 36-75', description: 'Memory layout, Sliding Window, Two Pointers, Prefix Sums, Kadane\'s Algorithm' },
            { id: 3, title: 'Chapter 3: Singly, Doubly & Circular Linked Lists', pages: 'Pages 76-115', description: 'Node manipulation, Reversing Linked Lists, Cycle Detection (Floyd\'s Tortoise and Hare), Fast/Slow Pointers' },
            { id: 4, title: 'Chapter 4: Stacks, Queues & Monotonic Data Structures', pages: 'Pages 116-160', description: 'LIFO & FIFO Operations, Infix to Postfix Conversion, Next Greater Element, Sliding Window Maximum' },
            { id: 5, title: 'Chapter 5: Binary Trees, BSTs & Tree Traversals', pages: 'Pages 161-215', description: 'Inorder, Preorder, Postorder, Level-Order (BFS), BST Properties, Insertion, Deletion, Lowest Common Ancestor' },
            { id: 6, title: 'Chapter 6: Balanced Search Trees (AVL & Red-Black Trees)', pages: 'Pages 216-265', description: 'AVL Rotations (LL, RR, LR, RL), Balance Factor, Red-Black Properties, Guaranteed O(log N) operations' },
            { id: 7, title: 'Chapter 7: Priority Queues, Binary Heaps & Heap Sort', pages: 'Pages 266-310', description: 'Min-Heap and Max-Heap, Heapify Algorithm, Priority Queue Operations, Heap Sort' },
            { id: 8, title: 'Chapter 8: Hashing, Hash Tables & Collision Resolution', pages: 'Pages 311-355', description: 'Hash Functions, Chaining, Open Addressing (Linear/Quadratic Probing, Double Hashing), Load Factor' },
            { id: 9, title: 'Chapter 9: Graph Fundamentals & BFS/DFS Traversals', pages: 'Pages 356-410', description: 'Adjacency Matrix vs List, Breadth-First Search (BFS), Depth-First Search (DFS), Topological Sorting, Cycle Detection' },
            { id: 10, title: 'Chapter 10: Shortest Path & Minimum Spanning Tree Algorithms', pages: 'Pages 411-460', description: 'Dijkstra\'s Algorithm, Bellman-Ford, Floyd-Warshall, Prim\'s Algorithm, Kruskal\'s Algorithm with Disjoint Set Union' },
            { id: 11, title: 'Chapter 11: Dynamic Programming: 1D & 2D Optimization', pages: 'Pages 461-520', description: 'Memoization vs Tabulation, 0/1 Knapsack, Longest Common Subsequence (LCS), Longest Increasing Subsequence (LIS)' }
        ]
    }
};

/**
 * Helper to match textbook/subject to curated curriculum
 */
const getCuratedCurriculum = (title, workspace) => {
    const combined = `${title || ''} ${workspace || ''}`.toLowerCase();
    for (const key of Object.keys(SUBJECT_CURRICULA)) {
        const item = SUBJECT_CURRICULA[key];
        if (item.matches.some(m => combined.includes(m))) {
            return {
                bookTitle: item.bookTitle,
                chapters: item.chapters
            };
        }
    }
    return null;
};

const ensureChapterTopics = (ch) => {
    let topics = [];
    if (Array.isArray(ch.topics) && ch.topics.length > 0) {
        topics = ch.topics;
    } else if (ch.description) {
        topics = ch.description
            .split(/[,;•|]/)
            .map(t => t.trim())
            .filter(t => t.length > 2);
    }
    if (topics.length === 0) {
        topics = [
            `${ch.title} - Core Principles & Foundations`,
            `${ch.title} - Key Mechanics, Theorems & Rules`,
            `${ch.title} - Practical Implementations & Solved Examples`
        ];
    }
    return {
        ...ch,
        topics
    };
};

/**
 * Extract Table of Contents / Outline from an uploaded textbook PDF or text document.
 * If the PDF has an index, it parses it; otherwise it scans headers or synthesizes
 * the authoritative chapter breakdown for the exact textbook title.
 */
const extractBookOutline = async (filePath, sourceName = '', workspaceName = '') => {
    const cleanTitle = (sourceName || workspaceName || 'Course Textbook')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();

    // Check if we have an instant curated curriculum match
    const curated = getCuratedCurriculum(cleanTitle, workspaceName);

    try {
        let rawText = '';

        // 1. If local file exists, try reading the actual PDF / text contents
        if (filePath && fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.pdf') {
                try {
                    const dataBuffer = fs.readFileSync(filePath);
                    const parsed = await pdfParse(dataBuffer, { max: 30 });
                    rawText = parsed.text || '';
                } catch (e) {
                    console.warn('[FlowPilot] Local pdf-parse warning:', e.message);
                }
            } else if (['.txt', '.md'].includes(ext)) {
                try {
                    rawText = fs.readFileSync(filePath, 'utf8').substring(0, 20000);
                } catch (e) {
                    console.warn('[FlowPilot] Local text read warning:', e.message);
                }
            }
        }

        // 2. Build intelligent indexing prompt for Gemini
        let outlinePrompt = '';
        if (rawText && rawText.trim().length > 150) {
            outlinePrompt = `Analyze the beginning of this textbook/document and extract the Table of Contents (Index).
Extract a clean list of chapters with estimated or actual page numbers and core topic descriptions.
Document title: "${cleanTitle}"
Document sample:
"""
${rawText.substring(0, 12000)}
"""

Return STRICTLY a JSON object with this format (no markdown):
{
  "bookTitle": "${cleanTitle}",
  "totalChaptersFound": 12,
  "chapters": [
    {
      "id": 1,
      "title": "Chapter 1: Title here",
      "pages": "Pages 1-35",
      "description": "Brief 1-line summary of key topics covered",
      "topics": [
        "Topic 1: Specific subtopic name",
        "Topic 2: Specific subtopic name",
        "Topic 3: Specific subtopic name"
      ]
    }
  ]
}`;
        } else {
            // Intelligent authoritative curriculum synthesis for any course textbook/document
            outlinePrompt = `You are an expert academic curriculum and textbook indexing AI.
The student is studying the course textbook: "${cleanTitle}" in the subject "${workspaceName || cleanTitle}".
Generate the authoritative, comprehensive Table of Contents listing all standard chapters (10 to 16 chapters) with estimated page numbers, descriptions, and 4 to 6 specific subtopics per chapter.

Return STRICTLY a JSON object with this format (no markdown):
{
  "bookTitle": "${cleanTitle}",
  "totalChaptersFound": 12,
  "chapters": [
    {
      "id": 1,
      "title": "Chapter 1: Chapter Name Here",
      "pages": "Pages 1-35",
      "description": "Key topics, formulas, and concepts in this chapter",
      "topics": [
        "Topic 1: Specific subtopic name",
        "Topic 2: Specific subtopic name",
        "Topic 3: Specific subtopic name"
      ]
    }
  ]
}`;
        }

        // Use fast Lite model with short timeout (8s) so the UI responds immediately
        const rawResult = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, outlinePrompt, {
            temperature: 0.2,
            responseMimeType: 'application/json',
            timeout: 8000
        });

        const cleaned = cleanAIJSON(rawResult);
        const parsedJSON = JSON.parse(cleaned);
        const rawChapters = parsedJSON.chapters || [];
        if (rawChapters.length > 0) {
            const normalizedChapters = rawChapters.map(ensureChapterTopics);
            return {
                hasOutline: true,
                bookTitle: parsedJSON.bookTitle || cleanTitle,
                totalChaptersFound: normalizedChapters.length,
                chapters: normalizedChapters
            };
        }
    } catch (error) {
        console.warn('[FlowPilot Service] extractBookOutline AI generation fallback:', error.message);
    }

    // 3. Resilient Fallback: If AI fails or times out, use curated or synthesized curriculum
    if (curated) {
        const normalizedChapters = curated.chapters.map(ensureChapterTopics);
        return {
            hasOutline: true,
            bookTitle: curated.bookTitle,
            totalChaptersFound: normalizedChapters.length,
            chapters: normalizedChapters
        };
    }

    // Dynamic fallback generation for any other book
    const defaultChapters = [
        { id: 1, title: `Chapter 1: Introduction to ${cleanTitle}`, pages: 'Pages 1-30', description: `Foundations, Core Principles & Motivation of ${cleanTitle}` },
        { id: 2, title: `Chapter 2: Fundamental Concepts & Architecture`, pages: 'Pages 31-70', description: 'Core models, building blocks, and architectural framework' },
        { id: 3, title: `Chapter 3: Core Theoretical Foundations`, pages: 'Pages 71-115', description: 'Fundamental theorems, laws, formulas, and baseline definitions' },
        { id: 4, title: `Chapter 4: Methods, Protocols & Practical Procedures`, pages: 'Pages 116-160', description: 'Operational workflows, standard procedures, and execution steps' },
        { id: 5, title: `Chapter 5: Advanced Analysis & Complex Mechanisms`, pages: 'Pages 161-210', description: 'Deep mechanics, inter-relationships, and specialized analysis' },
        { id: 6, title: `Chapter 6: Optimization, Design & Performance`, pages: 'Pages 211-260', description: 'Performance criteria, efficiency tradeoffs, and design rules' },
        { id: 7, title: `Chapter 7: Real-world Applications & Case Studies`, pages: 'Pages 261-310', description: 'Practical industry implementations, problems, and applied solutions' },
        { id: 8, title: `Chapter 8: Modern Extensions & Emerging Trends`, pages: 'Pages 311-360', description: 'State-of-the-art advances, future directions, and modern tools' }
    ].map(ensureChapterTopics);

    return {
        hasOutline: true,
        bookTitle: cleanTitle,
        totalChaptersFound: defaultChapters.length,
        chapters: defaultChapters
    };
};

/**
 * Generate the 4-Rung Cognitive Study Plan for a topic or selected chapters/subtopics.
 * Supports Multi-Topic Sequential Modules if multiple topics or a full chapter is selected.
 */
const generateSprintPlan = async ({ 
    topic, 
    selectedChapters = [], 
    selectedTopics = [], 
    contextText, 
    targetPersona = 'general', 
    duration = 25 
}) => {
    try {
        const personaGuidelines = {
            kids: 'Target Persona: Middle school / kids (Ages 8-13). Tone: Playful, vivid, curious, friendly metaphors, simple numbers.',
            boards: 'Target Persona: High School Board Exam Student (CBSE/ICSE/State Boards). Tone: Exam-oriented, focus on derivations, exact keywords, SI units, and board trap warnings.',
            college: 'Target Persona: University / Engineering / Medical / CA / UPSC student. Tone: Rigorous, first-principles logic, mathematical derivations, edge cases, and university exam rubrics.',
            general: 'Target Persona: High School to College student. Balance intuitive visual models with rigorous mechanics and exam tips.'
        };

        const personaContext = personaGuidelines[targetPersona] || personaGuidelines.general;

        // Determine discrete topics to master
        let topicsToCover = [];
        if (Array.isArray(selectedTopics) && selectedTopics.length > 0) {
            topicsToCover = selectedTopics.slice(0, 3); // Max 3 focused modules per sprint to maintain high cognitive density
        } else if (topic && !topic.toLowerCase().startsWith('chapter')) {
            topicsToCover = [topic];
        } else if (selectedChapters && selectedChapters.length > 0) {
            // If whole chapter selected without specific subtopics, pick 2-3 essential concepts from that chapter
            topicsToCover = [
                `${topic || selectedChapters[0]} - Core Foundations & Rules`,
                `${topic || selectedChapters[0]} - Advanced Execution & Edge Cases`
            ];
        } else {
            topicsToCover = [topic || 'Core Intuition & Problem Solving'];
        }

        const isMultiModule = topicsToCover.length > 1;

        const systemPrompt = `You are FlowPilot, an elite cognitive tutor built to prepare university and board exam students for 100% mastery.
The student is studying: "${topic || topicsToCover.join(' • ')}" from the curriculum.
Target Persona: ${persona} (exam board standard, high conceptual rigor).
Sprint Duration: ${duration} minutes.

Focus Topic(s) / Concepts to Master:
"""
${topicsToCover.map((t, idx) => `Module ${idx + 1}: ${t}`).join('\n')}
"""
${contextText ? `Source Material Reference (Use this context):\n"""\n${contextText.substring(0, 10000)}\n"""` : ''}

CRITICAL INSTRUCTION:
Students CANNOT pass exams with superficial summaries. You MUST teach in DEEP, EXHAUSTIVE, EXAM-GRADE DETAIL.
For every concept, the student must learn:
1. The Core Conceptual Model & Real-world Mapping
2. The Official Exam Notations & Drawing Guide (exact shapes, line styles, underlining rules)
3. The Step-by-Step Construction Algorithm (the exact 4-step execution recipe examiners grade by)
4. A Fully Worked Apprenticeship Case Study (a complete solved example demonstrating the recipe)
5. The Governing Formula or Clean Code Syntax
6. Common Exam Traps where 75%+ of students lose marks
7. A Final Rigorous Pen-and-Paper Proof Problem with official Step-by-Step Marking Rubric.

You MUST generate a structured sequential progression of ${topicsToCover.length} Topic Module(s).
For EACH Topic Module, build a rigorous, distinct 5-Pillar Cognitive Masterclass:

1. Rung 1 - Core Intuition:
   - "title": Catchy title
   - "visualAnalogy": A vivid, physical or visual analogy (2-3 sentences max) explaining the "WHY".
   - "mentalPicture": A 1-sentence memorable mental model.
   - "realWorldMapping": A clear 2-3 sentence mapping showing how real-world objects map directly to the technical components.
   - "checkQuestion": A 10-second rapid check question to verify intuition.
   - "checkAnswer": Expected correct answer for the checkpoint.

2. Rung 2 - Core Mechanism & 5-Pillar Masterclass:
   - "title": Detailed topic title
   - "explanation": Crisp, in-depth breakdown of how the moving parts, theory, and rules interact. Use markdown with clear bullet points.
   - "examNotations": An array of 4-6 essential official board/university exam notations and symbols:
     [
       {
         "name": "e.g. Strong Entity Set / Normal Form Rule",
         "shape": "e.g. Solid Rectangle [___]",
         "meaning": "Official textbook meaning and role in data modeling",
         "howToDraw": "Exact pen-and-paper drawing instruction (e.g. Draw a single solid rectangle with singular noun inside; underline primary key attributes)."
       }
     ]
   - "stepByStepAlgorithm": An array of 4 sequential steps describing the exact recipe examiners expect to solve or draw this from an exam prompt:
     [
       {
         "stepNumber": 1,
         "title": "e.g. Step 1: Linguistic Noun-Verb Extraction",
         "rule": "Concrete actionable rule on how to extract and isolate components from raw exam text.",
         "proTip": "Insider examiner marking tip or warning."
       }
     ]
   - "workedExample": A complete solved exam problem demonstrating the entire algorithm:
     {
       "title": "e.g. Solved Case Study: Hospital Patient Management",
       "problemPrompt": "A realistic exam scenario prompt (2-3 sentences).",
       "stepBreakdown": [
         "Step 1: Entities identified...",
         "Step 2: Attributes & Primary Keys designated (with underlines)...",
         "Step 3: Relationships & Cardinalities mapped (1:N, M:N)...",
         "Step 4: Constraints & Final Layout..."
       ],
       "solutionSummary": "Clear explanation of the final model.",
       "diagramCode": "A valid Mermaid flowchart (graph TD) using Chen shapes: Rectangles ([Entity]), Diamonds ({Relationship}), Ovals (([Attribute]))"
     }
   - "formulaLatex": Key equation or core syntax. For math/physics, clean LaTeX without $$ (e.g. "W = \\Delta K"). For computer science/SQL/code, provide clean code syntax without LaTeX tags (e.g. "ALTER TABLE table_name ADD column_name datatype;"). DO NOT wrap in \\texttt or $$.
   - "diagramType": "mermaid"
   - "diagramCode": A valid Mermaid flowchart (graph TD). For E-R diagrams, use Chen notation with shapes: [Entity Rectangle], {Relationship Diamond}, ([Attribute Oval]), ((Multivalued Oval)). DO NOT use erDiagram with quotes; use graph TD so it renders cleanly and graphically!
   - "voiceCheckpoint": {
       "question": "A quick 10-second spoken check question about relationships in the formula/mechanism",
       "expectedKeywords": ["keyword1", "keyword2"],
       "idealAnswer": "Short 1-sentence ideal verbal response"
     }

3. Rung 3 - The Exam Trap Detector:
   - "title": "Common Exam Traps & Pitfalls"
   - "traps": [
       {
         "trap": "Exact mistake 70%+ of students make in board/college exams",
         "whyStudentsLoseMarks": "Why marks are deducted by examiners",
         "howToAvoid": "Actionable memory rule to avoid it"
       }
     ]

4. Rung 4 - Pen-and-Paper Proof Problem:
   - "title": "Final Physical Solve Challenge"
   - "examQuestion": A realistic exam-standard numerical, derivation, or diagram design question the student must solve on physical paper with pen.
   - "totalMarks": 5
   - "markingRubric": [
       { "step": "Step 1: Entities & Notations", "marks": 1, "criterion": "Correctly draws rectangular entities with capital names" },
       { "step": "Step 2: Attributes & Primary Keys", "marks": 1, "criterion": "Identifies primary keys and explicitly underlines them" },
       { "step": "Step 3: Relationship Diamonds", "marks": 1, "criterion": "Correctly places relationship diamonds between entities" },
       { "step": "Step 4: Cardinality Ratios (1:N)", "marks": 1, "criterion": "Accurately specifies 1:1, 1:N, or M:N mappings on lines" },
       { "step": "Step 5: Overall Accuracy & Cleanliness", "marks": 1, "criterion": "Valid end-to-end diagram adhering to standard board conventions" }
     ],
   - "modelSolution": "Step-by-step model answer showing full marks layout"
}

Return STRICTLY a JSON object matching this schema without markdown fences:
{
  "topic": "${topic || topicsToCover.join(' • ')}",
  "estimatedMinutes": ${duration},
  "totalModules": ${topicsToCover.length},
  "topicModules": [
    {
      "moduleId": 1,
      "topicName": "${topicsToCover[0]}",
      "rung1_intuition": {
        "title": "...",
        "visualAnalogy": "...",
        "mentalPicture": "...",
        "realWorldMapping": "...",
        "checkQuestion": "...",
        "checkAnswer": "..."
      },
      "rung2_mechanism": {
        "title": "...",
        "explanation": "...",
        "examNotations": [
          { "name": "...", "shape": "...", "meaning": "...", "howToDraw": "..." }
        ],
        "stepByStepAlgorithm": [
          { "stepNumber": 1, "title": "...", "rule": "...", "proTip": "..." }
        ],
        "workedExample": {
          "title": "...",
          "problemPrompt": "...",
          "stepBreakdown": ["..."],
          "solutionSummary": "...",
          "diagramCode": "graph TD\\n..."
        },
        "formulaLatex": "...",
        "diagramType": "mermaid",
        "diagramCode": "graph TD\\n...",
        "voiceCheckpoint": {
          "question": "...",
          "expectedKeywords": ["..."],
          "idealAnswer": "..."
        }
      },
      "rung3_traps": {
        "title": "Common Exam Traps & Pitfalls",
        "traps": [
          { "trap": "...", "whyStudentsLoseMarks": "...", "howToAvoid": "..." }
        ]
      },
      "rung4_proof": {
        "title": "...",
        "examQuestion": "...",
        "totalMarks": 5,
        "markingRubric": [
          { "step": "Step 1", "marks": 1, "criterion": "..." },
          { "step": "Step 2", "marks": 1, "criterion": "..." },
          { "step": "Step 3", "marks": 1, "criterion": "..." },
          { "step": "Step 4", "marks": 1, "criterion": "..." },
          { "step": "Step 5", "marks": 1, "criterion": "..." }
        ],
        "modelSolution": "..."
      }
    }
  ]
}`;

        console.log(`[FlowPilot Service] Generating ${topicsToCover.length}-module study plan for: "${topic || topicsToCover.join(', ')}"...`);
        const rawResult = await generateGeminiContent(MODELS.GEMINI_FLASH, systemPrompt, {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            timeout: 60000
        });

        const cleaned = cleanAIJSON(rawResult);
        const parsed = JSON.parse(cleaned);

        // Ensure topicModules exists and is properly populated
        if (parsed.topicModules && parsed.topicModules.length > 0) {
            parsed.rung1_intuition = parsed.topicModules[0].rung1_intuition;
            parsed.rung2_mechanism = parsed.topicModules[0].rung2_mechanism;
            parsed.rung3_traps = parsed.topicModules[0].rung3_traps;
            parsed.rung4_proof = parsed.topicModules[0].rung4_proof;
        } else {
            parsed.topicModules = [
                {
                    moduleId: 1,
                    topicName: parsed.topic || topic,
                    rung1_intuition: parsed.rung1_intuition,
                    rung2_mechanism: parsed.rung2_mechanism,
                    rung3_traps: parsed.rung3_traps,
                    rung4_proof: parsed.rung4_proof
                }
            ];
        }

        return {
            success: true,
            plan: parsed
        };
    } catch (error) {
        console.error('[FlowPilot Service] generateSprintPlan error:', error.message);
        // Rich emergency fallback for ER Modeling & DBMS to guarantee complete pedagogical depth
        const fallbackTopic = topic || topicsToCover[0] || 'Entity-Relationship (ER) Modeling';
        const isER = /E-?R|Entity|Relationship|Cardinality/i.test(fallbackTopic);
        
        const fallbackPlan = {
            topic: fallbackTopic,
            estimatedMinutes: duration,
            totalModules: 1,
            topicModules: [
                {
                    moduleId: 1,
                    topicName: fallbackTopic,
                    rung1_intuition: {
                        title: isER ? 'The Blueprint Architecture of Data' : 'Core Conceptual Foundations',
                        visualAnalogy: isER 
                            ? 'Imagine designing a smart airport. Before laying bricks, you create an architectural blueprint: who are the passengers (Entities), what passes do they hold (Attributes), and how do they board flights (Relationships). An E-R diagram is that exact master blueprint for software.' 
                            : 'Think of this topic as a master recipe: every ingredient has an exact purpose, and assembling them in order produces reliable results.',
                        mentalPicture: isER ? 'Entities are real-world nouns, Attributes are descriptive adjectives, and Relationships are connecting action verbs.' : 'Clear mental model linking theory to practice.',
                        realWorldMapping: isER ? 'A Student enrolling in a University course maps directly to a Student Entity connected via an ENROLLS relationship diamond to a Course Entity.' : 'Core real-world mappings.',
                        checkQuestion: isER ? 'If an examiner asks you for an E-R model, what are the three foundational building blocks you must draw?' : 'What is the core purpose of this concept?',
                        checkAnswer: isER ? 'Entities (Rectangles), Attributes (Ovals/Ellipses), and Relationships (Diamonds).' : 'To provide structured data representation.'
                    },
                    rung2_mechanism: {
                        title: isER ? 'Chen Notation, Drawing Rules & Construction Mechanics' : 'Core Mechanics & Systematic Process',
                        explanation: isER 
                            ? 'An Entity-Relationship (E-R) diagram represents the conceptual schema of a database using Peter Chen\'s official graphical notation. Every diagram is built on rigorous geometric rules:\n\n1. **Entity Sets (Rectangles)**: Objects with independent existence. Strong entities have a primary key; weak entities depend on an owner entity.\n2. **Attributes (Ovals)**: Properties attached via solid lines. Primary Keys MUST be underlined. Multivalued attributes use double ovals; derived attributes use dashed ovals.\n3. **Relationship Sets (Diamonds)**: Associations between entities. The degree represents the number of participating entities (unary, binary, ternary).\n4. **Cardinality Ratios**: Numerical mapping constraints (1:1, 1:N, M:N) written directly on relationship edges.\n5. **Participation Constraints**: Total participation (every entity instance participates) is drawn as a **DOUBLE LINE**; Partial is a single line.'
                            : 'Detailed step-by-step technical explanation of principles, rules, and operations.',
                        examNotations: isER ? [
                            { name: 'Strong Entity Set', shape: 'Solid Rectangle [___]', meaning: 'Independent real-world object (e.g. Student, Doctor)', howToDraw: 'Draw a single-line rectangle. Label in CAPITAL letters.' },
                            { name: 'Weak Entity Set', shape: 'Double Rectangle [[___]]', meaning: 'Entity lacking a primary key of its own; depends on owner entity', howToDraw: 'Draw two concentric rectangles. Must connect to identifying relationship.' },
                            { name: 'Primary Key Attribute', shape: 'Underlined Ellipse (_Key_)', meaning: 'Attribute that uniquely identifies each entity tuple', howToDraw: 'Draw an oval and explicitly UNDERLINE the text. Examiners deduct marks if underline is omitted.' },
                            { name: 'Multivalued Attribute', shape: 'Double Ellipse ((___))', meaning: 'Attribute having multiple values for one entity (e.g. Phone, Skills)', howToDraw: 'Draw two concentric ovals attached to the entity.' },
                            { name: 'Derived Attribute', shape: 'Dashed Ellipse (- - -)', meaning: 'Attribute computed dynamically from another attribute (e.g. Age from DOB)', howToDraw: 'Draw a dashed or dotted oval boundary.' },
                            { name: 'Relationship Diamond', shape: 'Diamond <___>', meaning: 'Association connecting participating entities', howToDraw: 'Draw a diamond with active verb inside. Annotate lines with cardinality (1, N, M).' }
                        ] : [
                            { name: 'Core Operator', shape: 'Symbol / Keyword', meaning: 'Primary operation rule', howToDraw: 'Apply standard board syntax.' }
                        ],
                        stepByStepAlgorithm: isER ? [
                            { stepNumber: 1, title: 'Linguistic Noun & Verb Extraction', rule: 'Read the exam prompt carefully. Underline all NOUNS (these become candidate Entity Rectangles) and circle all VERBS (these become Relationship Diamonds).', proTip: 'Do not make an attribute an entity (e.g., Student_Age is an attribute oval, not an entity).' },
                            { stepNumber: 2, title: 'Designate Attributes & Primary Keys', rule: 'Attach attribute ovals to their respective entities. Identify the unique attribute and UNDERLINE it (e.g. Roll_No, Dept_ID).', proTip: 'Check for composite attributes (branch them out) and multivalued attributes (double oval).' },
                            { stepNumber: 3, title: 'Map Directional Cardinalities (1:1, 1:N, M:N)', rule: 'Ask both directions: Can 1 Department have many Students? (Yes -> N). Can 1 Student belong to many Departments? (No -> 1). Mark 1 on Department side and N on Student side.', proTip: 'Examiners award distinct marks for having correct 1, N, M letters on lines.' },
                            { stepNumber: 4, title: 'Identify Participation (Total vs Partial)', rule: 'Ask: Must EVERY student belong to a department? If yes, draw a DOUBLE LINE between Student and relationship diamond.', proTip: 'Weak entities always have total participation (double lines).' }
                        ] : [
                            { stepNumber: 1, title: 'Identify Inputs & Preconditions', rule: 'Isolate variables.', proTip: 'Check edge cases.' },
                            { stepNumber: 2, title: 'Apply Governing Rule', rule: 'Execute formula step-by-step.', proTip: 'Keep units consistent.' }
                        ],
                        workedExample: isER ? {
                            title: 'Solved Board Exam Problem: University Department System',
                            problemPrompt: 'A University has Students and Departments. Each Student has Roll_No (unique), Name, and Phone (multiple). Each Department has Dept_ID (unique) and Dept_Name. A student belongs to one department, but a department employs multiple students. Draw the complete E-R diagram with full Chen notation.',
                            stepBreakdown: [
                                'Step 1: Entities identified -> STUDENT, DEPARTMENT (drawn as 2 rectangles).',
                                'Step 2: Attributes -> STUDENT has Roll_No (underlined PK), Name (oval), Phone (double oval). DEPARTMENT has Dept_ID (underlined PK), Dept_Name (oval).',
                                'Step 3: Relationship -> BELONGS_TO diamond connecting STUDENT and DEPARTMENT.',
                                'Step 4: Cardinality -> 1 Department has N Students. Cardinality 1:N.'
                            ],
                            solutionSummary: 'Final model contains 2 strong entities, 1 binary relationship with 1:N cardinality, 1 multivalued attribute, and 2 underlined primary keys.',
                            diagramCode: 'graph TD\nSTUDENT[\"STUDENT (Entity)\"] --- BELONGS{\"BELONGS_TO (1:N)\"} --- DEPT[\"DEPARTMENT (Entity)\"]\nSTUDENT --- S_ROLL([\"Roll_No (PK Underlined)\"])\nSTUDENT --- S_NAME([\"Name\"])\nSTUDENT --- S_PHONE(((\"Phone (Multivalued)\")))\nDEPT --- D_ID([\"Dept_ID (PK Underlined)\"])\nDEPT --- D_NAME([\"Dept_Name\"])'
                        } : {
                            title: 'Standard Worked Example',
                            problemPrompt: 'Standard exam problem scenario.',
                            stepBreakdown: ['Step 1 applied', 'Step 2 applied'],
                            solutionSummary: 'Complete derivation.',
                            diagramCode: 'graph TD\nA[\"Input\"] --> B[\"Operation\"] --> C[\"Result\"]'
                        },
                        formulaLatex: isER ? 'Cardinality Ratio: 1 : N \\quad | \\quad Modality \\in \\{0, 1\\}' : 'F = ma',
                        diagramType: 'mermaid',
                        diagramCode: isER 
                            ? 'graph TD\nSTUDENT[\"STUDENT (Entity)\"] --- BELONGS{\"BELONGS_TO (1:N)\"} --- DEPT[\"DEPARTMENT (Entity)\"]\nSTUDENT --- S_ROLL([\"Roll_No (PK Underlined)\"])\nSTUDENT --- S_NAME([\"Name\"])\nDEPT --- D_ID([\"Dept_ID (PK Underlined)\"])\nDEPT --- D_NAME([\"Dept_Name\"])'
                            : 'graph TD\nA[\"Entity\"] --> B[\"Relationship\"]',
                        voiceCheckpoint: {
                            question: isER ? 'What shape is used for an entity, an attribute, and a relationship in Chen notation?' : 'What is the governing principle?',
                            expectedKeywords: isER ? ['rectangle', 'oval', 'diamond'] : ['principle'],
                            idealAnswer: isER ? 'Rectangles represent entities, ovals represent attributes, and diamonds represent relationships.' : 'Standard rule.'
                        }
                    },
                    rung3_traps: {
                        title: 'Common Exam Traps & Pitfalls',
                        traps: [
                            {
                                trap: isER ? 'Forgetting to underline Primary Key attributes.' : 'Unit conversion omission.',
                                whyStudentsLoseMarks: isER ? 'Examiners deduct 1 whole mark because an un-underlined attribute cannot be distinguished from a normal attribute.' : 'Leads to incorrect magnitude.',
                                howToAvoid: isER ? 'Always double-check every entity rectangle: ensure at least one attached oval has an underline.' : 'Check units at start.'
                            },
                            {
                                trap: isER ? 'Confusing Cardinality (1:N) with Participation (Total/Partial).' : 'Sign errors in derivation.',
                                whyStudentsLoseMarks: isER ? 'Cardinality is the maximum number of links (1 or N); Participation is whether 0 is allowed (single line) or 1+ is mandatory (double line).' : 'Reverses the outcome.',
                                howToAvoid: isER ? 'Use numbers/letters (1, N) for cardinality, and line thickness (single vs double) for participation.' : 'Review signs carefully.'
                            },
                            {
                                trap: isER ? 'Drawing an attribute directly connecting to another attribute.' : 'Missing edge cases.',
                                whyStudentsLoseMarks: isER ? 'Attributes can ONLY attach to Entity rectangles or Relationship diamonds (except composite attributes).' : 'Fails border conditions.',
                                howToAvoid: isER ? 'Ensure every oval connects directly to a rectangle or diamond.' : 'Verify boundary values.'
                            }
                        ]
                    },
                    rung4_proof: {
                        title: isER ? 'Draw Complete E-R Diagram for Hospital Patient System' : 'Final Numerical & Proof Challenge',
                        examQuestion: isER 
                            ? 'A hospital database manages **Doctors**, **Patients**, and **Departments**.\n- Each Doctor has a unique `Doc_ID`, `Name`, and `Specialization`.\n- Each Patient has a unique `Patient_ID`, `Name`, and multiple `Emergency_Contacts`.\n- A Doctor `treats` multiple Patients, and a Patient can be treated by multiple Doctors.\n- Each Doctor `belongs_to` exactly one Department (with `Dept_ID` and `Dept_Name`), but a Department employs multiple Doctors.\n\n**Task:** On physical paper with pen, draw the complete Chen E-R Diagram showing all Entities, Attributes (underline PKs), Relationships, and Cardinalities.'
                            : 'Solve the problem on physical paper and verify your steps.',
                        totalMarks: 5,
                        markingRubric: [
                            { step: 'Step 1: Entity Rectangles', marks: 1, criterion: 'Correctly draws DOCTOR, PATIENT, and DEPARTMENT as solid rectangles with capital names' },
                            { step: 'Step 2: Primary Keys Underlined', marks: 1, criterion: 'Explicitly underlines Doc_ID, Patient_ID, and Dept_ID' },
                            { step: 'Step 3: Relationship Diamonds', marks: 1, criterion: 'Draws TREATS diamond between Doctor & Patient, and BELONGS_TO between Doctor & Department' },
                            { step: 'Step 4: Cardinality Ratios', marks: 1, criterion: 'Correctly labels M:N on TREATS and 1:N on BELONGS_TO' },
                            { step: 'Step 5: Multivalued Attribute & Cleanliness', marks: 1, criterion: 'Draws Emergency_Contacts with double oval and produces clean, examiner-ready layout' }
                        ],
                        modelSolution: 'DOCTOR [Doc_ID (PK), Name, Specialization] ---<BELONGS_TO (N:1)>--- DEPARTMENT [Dept_ID (PK), Dept_Name]. DOCTOR ---<TREATS (M:N)>--- PATIENT [Patient_ID (PK), Name, ((Emergency_Contacts))].'
                    }
                }
            ]
        };

        fallbackPlan.rung1_intuition = fallbackPlan.topicModules[0].rung1_intuition;
        fallbackPlan.rung2_mechanism = fallbackPlan.topicModules[0].rung2_mechanism;
        fallbackPlan.rung3_traps = fallbackPlan.topicModules[0].rung3_traps;
        fallbackPlan.rung4_proof = fallbackPlan.topicModules[0].rung4_proof;

        return {
            success: true,
            plan: fallbackPlan
        };
    }
};

/**
 * Evaluate student's spoken voice answer for the Socratic pulse (<1 second latency)
 */
const evaluateVoiceAnswer = async ({ question, idealAnswer, expectedKeywords = [], studentSpeech }) => {
    try {
        if (!studentSpeech || !studentSpeech.trim()) {
            return {
                isCorrect: false,
                feedback: 'No speech detected. Please speak into your microphone.',
                score: 0
            };
        }

        const prompt = `You are a real-time Socratic study coach evaluating a student's spoken 10-second response.
Question asked: "${question}"
Ideal answer: "${idealAnswer}"
Expected keywords: ${JSON.stringify(expectedKeywords)}
Student's spoken answer: "${studentSpeech}"

Determine if the student grasped the concept. Be encouraging, concise, and focused on intuition rather than exact wording.
Return STRICTLY a JSON object:
{
  "isCorrect": true or false,
  "score": 0 to 100,
  "shortFeedback": "1 sentence warm feedback explaining why it is correct or giving the quick fix.",
  "praiseWord": "Spot on!" or "Almost there!" or "Nice intuition!"
}`;

        const rawResult = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, prompt, {
            temperature: 0.2,
            maxOutputTokens: 500,
            responseMimeType: 'application/json'
        });

        const cleaned = cleanAIJSON(rawResult);
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('[FlowPilot Service] evaluateVoiceAnswer error:', error.message);
        // Fallback keyword matching
        const speechLower = (studentSpeech || '').toLowerCase();
        const matches = expectedKeywords.filter(kw => speechLower.includes(kw.toLowerCase()));
        const isCorrect = matches.length > 0;
        return {
            isCorrect,
            score: isCorrect ? 90 : 50,
            shortFeedback: isCorrect ? 'Great answer! Concept verified.' : 'Good effort! Remember the core formula relation.',
            praiseWord: isCorrect ? 'Spot on!' : 'Keep going!'
        };
    }
};

/**
 * Instant S.O.S. Doubt Dissolver (<5 seconds)
 * When student hits Spacebar, returns a child-simple 15-second analogy and visual breakdown
 */
const dissolveDoubt = async ({ contextTopic, studentQuestion }) => {
    try {
        const prompt = `A student is in deep study flow on "${contextTopic || 'General Study'}" and got stuck on this exact question/concept:
"${studentQuestion}"

Your job as FlowPilot S.O.S. is to DISSOLVE their doubt in 15 SECONDS.
Rules:
1. Start with a crystal-clear, unforgettable real-world analogy.
2. Explain the core intuition in 2-3 short, punchy sentences.
3. Show the practical takeaway.
4. Keep it ultra-concise so they immediately return to their study flow without getting distracted.

Return STRICTLY a JSON object:
{
  "analogyHeadline": "e.g. Think of it like a 4-way traffic junction...",
  "visualAnalogy": "2-sentence clear metaphor",
  "technicalExplanation": "1-2 sentence core reason",
  "quickRuleToRemember": "The 1 golden rule to remember in exams"
}`;

        const rawResult = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, prompt, {
            temperature: 0.3,
            maxOutputTokens: 600,
            responseMimeType: 'application/json'
        });

        const cleaned = cleanAIJSON(rawResult);
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('[FlowPilot Service] dissolveDoubt error:', error.message);
        return {
            analogyHeadline: 'Key Concept Breakdown',
            visualAnalogy: 'Break down the concept into basic cause and effect.',
            technicalExplanation: 'Review the underlying formula variables step-by-step.',
            quickRuleToRemember: 'Focus on conservation of fundamental quantities.'
        };
    }
};

/**
 * Grade student's physical handwritten solution using Gemini 1.5 Flash Vision
 * Maps handwriting to the step-marking rubric and calculates partial marks
 */
const gradeHandwrittenProof = async ({ examQuestion, markingRubric = [], imageBase64, mimeType = 'image/jpeg' }) => {
    try {
        if (!imageBase64) {
            throw new Error('No image data provided for handwritten grading');
        }

        // Clean base64 string if it contains data URI prefix
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

        const prompt = `You are a senior board/university examiner grading a student's physical handwritten paper submission.
Exam Question:
"""
${examQuestion}
"""

Official Step-Marking Rubric:
"""
${JSON.stringify(markingRubric, null, 2)}
"""

Carefully inspect the handwritten student submission in the image.
1. Read the handwritten equations, diagrams, and calculations step-by-step.
2. Award marks for each step in the rubric. If a step is partially correct, award partial marks.
3. If an error occurred (e.g. arithmetic mistake, wrong sign, missing units, missing label), identify the exact line where it happened.
4. Calculate the total awarded marks.
5. Provide a warm, constructive examiner tip to help them score 100% on board exams.

Return STRICTLY a JSON object:
{
  "totalPossibleMarks": 3,
  "awardedMarks": 2.5,
  "stepEvaluations": [
    {
      "stepName": "Step 1: Formula and Given values",
      "maxMarks": 1,
      "awarded": 1,
      "comment": "Identified correct formula with correct units."
    }
  ],
  "handwrittenTranscriptionSummary": "Brief summary of what was written on the student paper",
  "mistakeDetected": "Exact step or line where deduction happened, or 'None' if full marks",
  "examinerTip": "Actionable advice for the final exam hall"
}`;

        const contents = [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType || 'image/jpeg',
                            data: cleanBase64
                        }
                    }
                ]
            }
        ];

        console.log('[FlowPilot Service] Grading handwritten student paper via Gemini Multimodal Vision...');
        const rawResult = await generateGeminiContent(MODELS.GEMINI_FLASH, contents, {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
        });

        const cleaned = cleanAIJSON(rawResult);
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('[FlowPilot Service] gradeHandwrittenProof error:', error.message);
        throw error;
    }
};

module.exports = {
    extractBookOutline,
    generateSprintPlan,
    evaluateVoiceAnswer,
    dissolveDoubt,
    gradeHandwrittenProof
};
