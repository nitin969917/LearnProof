/**
 * Script to seed high-quality educational and student community posts
 * into LearnProof Social Hub (PostgreSQL via Prisma).
 *
 * Adds 25 realistic posts across existing student users with:
 * - Varied topics: LeetCode/DSA, System Design, Web Dev, OS/Networks, Hardware, Study Tips
 * - High quality educational & workspace imagery
 * - Organic likes from real user accounts
 * - Authentic discussion comments
 * - Staggered timestamps over the last 5 days
 */

const prisma = require('../src/utils/datingPrisma');
let redisClient = null;
try {
  const { redis } = require('../src/utils/redis');
  redisClient = redis;
} catch (e) {
  console.log('Redis client not loaded, will skip redis cache clearing in script if not available.');
}

const POSTS_DATA = [
  {
    authorId: 5, // Jayesh Jain
    hoursAgo: 110,
    content: `🚀 Finally wrapped up my 60-day LeetCode challenge! Covered 120+ problems across Graphs, Dynamic Programming, and Heaps.\n\nThe biggest breakthrough was shifting from 'memorizing patterns' to actually drawing out recursion trees on paper before writing any code. If anyone wants my curated problem list or handwritten notes, let me know!`,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 6, hoursAgo: 108, content: "Super inspiring Jayesh! How did you tackle hard DP problems like 2D grid pathing?" },
      { authorId: 5, hoursAgo: 106, content: "@Vivek Dagale Started with plain recursion + memoization first. Once the state transitions clicked, converting to bottom-up tabular was much easier." }
    ]
  },
  {
    authorId: 23, // Vaishnavi Sabale
    hoursAgo: 102,
    content: `Quick SQL vs NoSQL mental model that helped me ace our database systems viva today:\n\n📌 Relational (PostgreSQL / MySQL): Best when you need ACID compliance, structured schemas, foreign keys, and complex JOIN queries.\n📌 Document (MongoDB): Best for hierarchical, polymorphic, or rapidly changing event data.\n\nWhat's your go-to database for your side projects?`,
    image: null,
    comments: [
      { authorId: 13, hoursAgo: 100, content: "PostgreSQL all the way! Especially with JSONB support, you get the best of both worlds." },
      { authorId: 21, hoursAgo: 98, content: "Bookmarking this! Super clean summary." }
    ]
  },
  {
    authorId: 30, // Avishkar Kakade
    hoursAgo: 94,
    content: `Working on our college capstone project — an AI-assisted lecture note organizer! 💻✨\n\nLate night engineering setup. Building the backend with Node.js and PostgreSQL. We're integrating vector search for lecture transcriptions so students can search any keyword or topic spoken in class.`,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 7, hoursAgo: 92, content: "This looks incredible Avishkar! Which embedding model are you guys testing?" },
      { authorId: 30, hoursAgo: 90, content: "@Durvesh We're testing sentence-transformers and Gemini embeddings. Results look super promising!" }
    ]
  },
  {
    authorId: 9, // NIDHI DHYANI
    hoursAgo: 88,
    content: `A small reminder for anyone feeling stuck on a frustrating bug today:\n\nStep away, take a 10-minute walk, drink some water, and come back.\n80% of the time, the bug turns out to be a missing await, an off-by-one index, or a typo in an environment variable.\nDon't burn out yourself over a syntax error!`,
    image: null,
    comments: [
      { authorId: 17, hoursAgo: 86, content: "Literally spent 2 hours yesterday just to realize my .env had a trailing space 😅 So true!" },
      { authorId: 33, hoursAgo: 84, content: "Needed to hear this today haha 🙌" }
    ]
  },
  {
    authorId: 6, // Vivek Dagale
    hoursAgo: 82,
    content: `Computer Networks placement revision sheet:\n\n⚡ TCP vs UDP\n• TCP: Connection-oriented, guarantees delivery, flow & congestion control (3-way handshake: SYN -> SYN-ACK -> ACK).\n• UDP: Connectionless, zero delivery guarantee, minimal latency (ideal for VoIP, live streaming, DNS queries).\n\nKeep this fresh in mind for technical interviews!`,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 39, hoursAgo: 80, content: "Crisp revision note. Thanks for sharing Vivek!" },
      { authorId: 14, hoursAgo: 79, content: "UDP is also used in multiplayer game state sync for fast updates." }
    ]
  },
  {
    authorId: 7, // Durvesh Bharambe
    hoursAgo: 76,
    content: `Participated in the 24-hour Web & Cloud Hackathon over the weekend! 🛠️\n\nOur team built an automated real-time verification system for certificates. The adrenaline rush at 3 AM when all microservices finally connected was unmatched. Even though we had bugs right until demo time, the learning curve was huge!`,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 5, hoursAgo: 74, content: "Proud of you guys! Hackathons teach you more in 24 hours than weeks of theoretical lectures." },
      { authorId: 15, hoursAgo: 72, content: "Congrats Durvesh! That demo looked slick." }
    ]
  },
  {
    authorId: 14, // ishaan choudhary
    hoursAgo: 70,
    content: `Why Git Rebase vs Git Merge?\n\n• Merge preserves full chronological history exactly as it happened with a merge commit.\n• Rebase gives you a clean, linear commit history that makes tracking down bugs with 'git bisect' effortless.\n\nGolden rule: Rebase your local feature branch on main before opening a PR, never rebase shared public branches!`,
    image: null,
    comments: [
      { authorId: 21, hoursAgo: 68, content: "Golden rule! Once made the mistake of force-pushing to a shared team branch, never again 😂" }
    ]
  },
  {
    authorId: 17, // Vaidehi Mulewar
    hoursAgo: 64,
    content: `Organized my semester study notes today 📚\n\nFinding that creating mind-maps and summary flashcards right after lectures saves so much stress during midterms. What's your favorite study technique? Pomodoro or 90-min deep-work blocks?`,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 9, hoursAgo: 62, content: "Love the clean layout! 50 min study + 10 min break works best for me." },
      { authorId: 34, hoursAgo: 60, content: "Same here! Consistency beats cramming every single time." }
    ]
  },
  {
    authorId: 13, // Prathamesh Mane
    hoursAgo: 58,
    content: `Important Operating Systems concept: Deadlock Prevention vs Avoidance\n\nDeadlock requires 4 Coffman conditions:\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\n\nBreak ANY one of these four conditions, and deadlock is mathematically impossible! Banker's algorithm is the classic avoidance technique.`,
    image: null,
    comments: [
      { authorId: 35, hoursAgo: 56, content: "Classic interview question for core CS companies. Great quick refresher." }
    ]
  },
  {
    authorId: 15, // Nakshatra Shegaonkar
    hoursAgo: 52,
    content: `Weekend project: Created a sleek UI dashboard in React with dark mode support 🌙\n\nLearned how to properly handle theme toggling using CSS variables and local storage without hydration flickers. Here's a preview of the layout and typography!`,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 43, hoursAgo: 50, content: "The color palette looks so clean! Are you using Tailwind?" },
      { authorId: 15, hoursAgo: 48, content: "@Yash Yes, Tailwind with custom CSS variables for smooth theme transitions." }
    ]
  },
  {
    authorId: 21, // Akash Singh
    hoursAgo: 46,
    content: `System Design 101: Understanding Caching strategies ⚡\n\n1. Cache-Aside (Lazy loading): App queries cache first; on miss, fetches from DB and populates cache.\n2. Write-Through: App writes to cache and DB simultaneously. Consistent, but slightly higher write latency.\n3. Write-Back (Write-Behind): Write to cache first, write to DB asynchronously after a delay.\n\nWhich caching strategy do you use in your backend?`,
    image: null,
    comments: [
      { authorId: 5, hoursAgo: 44, content: "Cache-aside with Redis is definitely the most practical for 90% of web apps." }
    ]
  },
  {
    authorId: 16, // Rajyavardhan Padvi
    hoursAgo: 42,
    content: `Campus library vibes during exam season 📖\n\nEveryone grinding hard for the upcoming placement drives and semester finals. Wishing all the third and fourth year folks the best of luck with their interviews!`,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 20, hoursAgo: 40, content: "All the best everyone! Let's crack it." },
      { authorId: 31, hoursAgo: 39, content: "Library grind with good peers is unmatched." }
    ]
  },
  {
    authorId: 20, // Pravin Gaikwad
    hoursAgo: 38,
    content: `Essential Linux commands every CS student should know by heart:\n\n• grep -rnI 'term' . (find any code instantly)\n• htop (inspect CPU & memory utilization)\n• lsof -i :port (identify what process is blocking your port)\n• tail -f logs.txt (stream live server output)\n• chmod +x script.sh (make scripts executable)\n\nBookmark these for your terminal workflow!`,
    image: null,
    comments: [
      { authorId: 12, hoursAgo: 36, content: "lsof -i :PORT has saved my life hundreds of times when kill -9 was needed haha." }
    ]
  },
  {
    authorId: 12, // Deepakkumar Thakur
    hoursAgo: 34,
    content: `Deep dive into Docker multi-stage builds today 🐳\n\nManaged to reduce our Node.js container image size from 1.2 GB down to just 160 MB!\nThe key is using a build stage for npm dependencies and compilation, and copying only production assets to a lightweight alpine runtime image.`,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 30, hoursAgo: 32, content: "That's huge! Multi-stage builds are such an underrated optimization." }
    ]
  },
  {
    authorId: 25, // Shwet Raj
    hoursAgo: 30,
    content: `Finished reading 'Designing Data-Intensive Applications' by Martin Kleppmann 📖\n\nHands down the best engineering book I have ever read. The chapters on replication lag, consensus algorithms (Raft/Paxos), and partition tolerance completely changed how I think about backend architecture. Highly recommended for every software engineer!`,
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 6, hoursAgo: 28, content: "It's literally the bible of distributed systems. Fantastic read!" },
      { authorId: 47, hoursAgo: 27, content: "Adding this to my reading list for this semester." }
    ]
  },
  {
    authorId: 27, // Darshan Chavan
    hoursAgo: 26,
    content: `Quick JavaScript tip: 'structuredClone(obj)' is now natively supported in all modern browsers and Node 17+!\n\nNo more 'JSON.parse(JSON.stringify(obj))' that loses Date objects, Maps, Sets, and undefined values, and no need for lodash cloneDeep just for deep copies.`,
    image: null,
    comments: [
      { authorId: 14, hoursAgo: 25, content: "Good reminder! So glad we don't need heavy third-party libs for deep cloning anymore." }
    ]
  },
  {
    authorId: 31, // Sai Khedekar
    hoursAgo: 22,
    content: `Morning coffee and working through Dijkstra's Shortest Path algorithm ☕\n\nUsing a Priority Queue (Min-Heap) brings time complexity down to O((V + E) log V). The trickiest part is always remembering how to skip stale visited nodes in the heap!`,
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 5, hoursAgo: 20, content: "A classic! Pairing it with A* search heuristic for game pathfinding is really fun too." }
    ]
  },
  {
    authorId: 33, // Rahul Devadkar
    hoursAgo: 18,
    content: `Anyone interested in forming a weekly System Design & Architecture discussion group?\n\nWe can pick one topic every Sunday (e.g. TinyURL, Rate Limiter, Notification Service, Uber backend) and do a 45-minute whiteboard session. Drop a comment below if you want to participate!`,
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 13, hoursAgo: 16, content: "Count me in! Would love to prep together." },
      { authorId: 23, hoursAgo: 15, content: "I'm interested too! Let's set up a time." },
      { authorId: 7, hoursAgo: 14, content: "+1 let's do this!" }
    ]
  },
  {
    authorId: 34, // payal karad
    hoursAgo: 14,
    content: `Mastering Git branch workflows:\n\nA feature branching strategy keeps the main branch always production-ready:\n1. git checkout -b feature/user-profile\n2. Commit small, logical units of work\n3. Pull latest main with rebase\n4. Push and open Pull Request for peer code review\n\nKeep commit messages clear, descriptive, and imperative!`,
    image: null,
    comments: [
      { authorId: 9, hoursAgo: 12, content: "Clear commit messages make code review so much faster. Great tips Payal!" }
    ]
  },
  {
    authorId: 35, // Bharat Shinde
    hoursAgo: 11,
    content: `Understanding HTTP API response status codes at a glance:\n\n• 200 OK - Successful GET/PUT\n• 201 Created - Successful POST\n• 204 No Content - Successful DELETE\n• 400 Bad Request - Client validation failed\n• 401 Unauthorized - Missing or invalid auth token\n• 403 Forbidden - Authenticated, but lacks permission\n• 404 Not Found - Resource does not exist\n• 500 Internal Server Error - Server crash or uncaught exception`,
    image: null,
    comments: [
      { authorId: 36, hoursAgo: 9, content: "The distinction between 401 and 403 is asked so frequently in interviews!" }
    ]
  },
  {
    authorId: 39, // Pratik Gaikwad
    hoursAgo: 8,
    content: `Late night hardware testing and telemetry lab! ⚡\n\nMeasuring signal timing and logic state transitions on our embedded robotics project. Combining hardware microcontrollers with cloud IoT telemetry is challenging, but seeing the servos actuate on command is priceless.`,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 30, hoursAgo: 7, content: "Awesome hardware setup Pratik! What microcontroller are you running?" },
      { authorId: 39, hoursAgo: 6, content: "@Avishkar We're using ESP32 with MQTT protocol for lightweight telemetry." }
    ]
  },
  {
    authorId: 43, // Yash Dhobe
    hoursAgo: 5,
    content: `5 VS Code extensions that save me hours of development every week:\n\n1. Error Lens (highlights errors inline)\n2. GitLens (see commit history line-by-line)\n3. Prettier (auto-formats code on save)\n4. Auto Rename Tag (renames paired HTML/JSX tags)\n5. Thunder Client (lightweight API testing inside VS Code)\n\nWhich extension can you not live without?`,
    image: null,
    comments: [
      { authorId: 15, hoursAgo: 4, content: "Error Lens is an absolute game-changer. Saves so much hovering time." }
    ]
  },
  {
    authorId: 47, // Arpit Rao
    hoursAgo: 3,
    content: `Completed the Computer Architecture and Microprocessor module today! 🖥️\n\nUnderstanding how registers, ALU, program counter, and cache lines cooperate at the clock-cycle level makes you appreciate modern compilers and operating systems so much more.`,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    comments: [
      { authorId: 35, hoursAgo: 2, content: "Assembly language is painful at first, but gives you superpowers when diagnosing performance." }
    ]
  },
  {
    authorId: 26, // Daneshwa Jandla
    hoursAgo: 2,
    content: `Consistency is key. Whether it's 1 LeetCode problem a day, 10 pages of a technical book, or committing to a personal project — small daily efforts create massive compounding results in 6 months. Keep pushing everyone! 💪`,
    image: null,
    comments: [
      { authorId: 5, hoursAgo: 1, content: "100%! Compound interest of knowledge is real." },
      { authorId: 6, hoursAgo: 1, content: "Facts! Keep grinding 🔥" }
    ]
  },
  {
    authorId: 57, // Abhijay Pal
    hoursAgo: 1,
    content: `Clean code rule that transformed my engineering style:\n\n'Functions should do one thing, and do it well.'\n\nIf your function is longer than 25 lines or has more than 2 levels of nested if-else statements, it's usually begging to be decomposed into smaller, composable helper functions.`,
    image: null,
    comments: [
      { authorId: 25, hoursAgo: 0.5, content: "Refactoring messy 200-line functions into clean 10-line composable helpers is the most therapeutic feeling in programming." }
    ]
  }
];

async function seedPosts() {
  console.log('--- Starting Social Hub Seeding ---');

  // Verify available users for liking posts
  const allUsers = await prisma.user.findMany({
    where: {
      name: { notIn: ["LearnProof AI", "****", "Gpn Interns", "QUANTIS", "Nuage Laboratoire"] }
    },
    select: { id: true }
  });

  const allUserIds = allUsers.map(u => u.id);
  console.log(`Found ${allUserIds.length} candidate users for likes and comments.`);

  const now = Date.now();
  let createdPosts = 0;
  let createdComments = 0;
  let totalLikes = 0;

  for (const postData of POSTS_DATA) {
    const postCreatedAt = new Date(now - postData.hoursAgo * 60 * 60 * 1000);

    // Pick 5 to 14 random users to like this post
    const shuffled = [...allUserIds].sort(() => 0.5 - Math.random());
    const likeCount = Math.floor(Math.random() * 10) + 5; // 5 to 14 likes
    const likerIds = shuffled.slice(0, Math.min(likeCount, shuffled.length));

    // Create the post
    const post = await prisma.post.create({
      data: {
        content: postData.content,
        image: postData.image || null,
        visibility: 'public',
        authorId: postData.authorId,
        createdAt: postCreatedAt,
        updatedAt: postCreatedAt,
        likes: {
          connect: likerIds.map(id => ({ id }))
        }
      }
    });

    createdPosts++;
    totalLikes += likerIds.length;

    // Create comments if any
    if (postData.comments && postData.comments.length > 0) {
      for (const commentData of postData.comments) {
        const commentCreatedAt = new Date(now - commentData.hoursAgo * 60 * 60 * 1000);
        await prisma.comment.create({
          data: {
            content: commentData.content,
            authorId: commentData.authorId,
            postId: post.id,
            createdAt: commentCreatedAt,
            updatedAt: commentCreatedAt
          }
        });
        createdComments++;
      }
    }
  }

  console.log(`Successfully created:`);
  console.log(`- ${createdPosts} posts`);
  console.log(`- ${createdComments} comments`);
  console.log(`- ${totalLikes} likes attributed`);

  // Clear Redis feed cache if redis is running
  if (redisClient) {
    try {
      const keys = await redisClient.keys('user:feed:*');
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Cleared ${keys.length} cached feed keys from Redis.`);
      } else {
        console.log('No user:feed:* keys found in Redis cache.');
      }
    } catch (err) {
      console.warn('Redis cache clear warning:', err.message);
    }
  }

  console.log('--- Seeding Completed Successfully ---');
}

seedPosts()
  .catch(err => {
    console.error('Error seeding posts:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
