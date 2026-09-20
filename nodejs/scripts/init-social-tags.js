/**
 * Initialize social_tags table in PostgreSQL and populate it with existing tags
 * from social_posts and common educational topics.
 */
const prisma = require('../src/utils/datingPrisma');

const DEFAULT_TAGS = [
  'LeetCodeDSA',
  'SystemDesign',
  'ReactNodeJS',
  'OperatingSystems',
  'DockerDeploy',
  'CampusHackathon',
  'WebDev',
  'Python',
  'CareerAdvice',
  'MachineLearning',
  'Algorithms',
  'TypeScript',
  'JavaScript',
  'OpenSource',
  'StudyTips',
  'DataStructures',
  'InterviewPrep',
  'CloudComputing',
  'CleanCode',
  'Databases',
  'Networking',
  'CoreCS',
  'Git',
  'DevOps',
  'AI',
  'Placements'
];

async function main() {
  console.log('--- Initializing social_tags table ---');
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "social_tags" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT UNIQUE NOT NULL,
      "postCount" INT NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "social_tags_name_idx" ON "social_tags"("name");
  `);
  console.log('✓ social_tags table ready.');

  // Extract all hashtags from existing posts
  const posts = await prisma.post.findMany({ select: { content: true } });
  const tagCounts = new Map();

  // Seed default tags with count = 1
  for (const tag of DEFAULT_TAGS) {
    tagCounts.set(tag.toLowerCase(), { name: tag, count: 1 });
  }

  // Count from actual post content
  for (const post of posts) {
    const matches = post.content.match(/#[a-zA-Z0-9_]+/g) || [];
    for (const match of matches) {
      const clean = match.replace(/^#/, '').trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (tagCounts.has(lower)) {
        tagCounts.get(lower).count += 1;
      } else {
        tagCounts.set(lower, { name: clean, count: 1 });
      }
    }
  }

  console.log(`Found ${tagCounts.size} unique community tags.`);

  for (const [_, item] of tagCounts) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "social_tags" ("name", "postCount", "updatedAt")
      VALUES ($1, $2, NOW())
      ON CONFLICT ("name") 
      DO UPDATE SET "postCount" = EXCLUDED."postCount", "updatedAt" = NOW();
    `, item.name, item.count);
  }

  const allTags = await prisma.$queryRawUnsafe(`SELECT * FROM "social_tags" ORDER BY "postCount" DESC;`);
  console.log(`✓ Total tags in database: ${allTags.length}`);
  console.log('Top 10 tags:', allTags.slice(0, 10).map(t => `#${t.name} (${t.postCount})`).join(', '));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Failed to init tags:', err);
  process.exit(1);
});
