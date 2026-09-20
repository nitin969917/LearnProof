/**
 * Script to add relevant community hashtags to existing seeded posts in PostgreSQL.
 * Safe & idempotent: checks if the post already has hashtags before appending.
 */

const prisma = require('../src/utils/datingPrisma');

const POST_TAGS = [
  { match: 'LeetCode challenge', tags: ['#LeetCodeDSA', '#Algorithms'] },
  { match: 'SQL vs NoSQL', tags: ['#SystemDesign', '#Databases'] },
  { match: 'capstone project', tags: ['#ReactNodeJS', '#SystemDesign'] },
  { match: 'frustrating bug', tags: ['#WebDev', '#Debugging'] },
  { match: 'TCP vs UDP', tags: ['#OperatingSystems', '#Networking'] },
  { match: 'Cloud Hackathon', tags: ['#CampusHackathon', '#WebDev'] },
  { match: 'Git Rebase', tags: ['#Git', '#WebDev'] },
  { match: 'study notes', tags: ['#StudyTips', '#CareerAdvice'] },
  { match: 'Deadlock Prevention', tags: ['#OperatingSystems', '#CoreCS'] },
  { match: 'React with dark mode', tags: ['#ReactNodeJS', '#WebDev'] },
  { match: 'Caching strategies', tags: ['#SystemDesign', '#DockerDeploy'] },
  { match: 'Campus library vibes', tags: ['#CareerAdvice', '#StudyTips'] },
  { match: 'Essential Linux commands', tags: ['#OperatingSystems', '#DevOps'] },
  { match: 'Docker container', tags: ['#DockerDeploy', '#SystemDesign'] },
  { match: 'Clean code rule', tags: ['#WebDev', '#CleanCode'] },
  { match: 'CSS Grid vs Flexbox', tags: ['#ReactNodeJS', '#WebDev'] },
  { match: 'LeetCode problem a day', tags: ['#LeetCodeDSA', '#CareerAdvice'] },
  { match: 'VS Code extensions', tags: ['#WebDev', '#Tools'] },
  { match: 'Redis Pub/Sub', tags: ['#SystemDesign', '#DockerDeploy'] },
  { match: 'Won 2nd place in the National AI Hackathon', tags: ['#CampusHackathon', '#AI'] },
  { match: 'Monolith vs Microservices', tags: ['#SystemDesign', '#DockerDeploy'] },
  { match: 'Graph algorithms', tags: ['#LeetCodeDSA', '#Algorithms'] },
  { match: 'Resume tip for engineering campus placements', tags: ['#CareerAdvice', '#Placements'] },
  { match: 'TypeScript generics', tags: ['#ReactNodeJS', '#TypeScript'] },
  { match: 'React 19 compiler', tags: ['#ReactNodeJS', '#WebDev'] }
];

async function main() {
  console.log('--- Adding Community Hashtags to Seeded Posts ---');
  const posts = await prisma.post.findMany();
  console.log(`Found ${posts.length} total posts in database.`);

  let updatedCount = 0;
  for (const post of posts) {
    for (const rule of POST_TAGS) {
      if (post.content.includes(rule.match)) {
        // Check if tags are already in content
        const missingTags = rule.tags.filter(t => !post.content.toLowerCase().includes(t.toLowerCase()));
        if (missingTags.length > 0) {
          const newContent = `${post.content.trim()}\n\n${missingTags.join(' ')}`;
          await prisma.post.update({
            where: { id: post.id },
            data: { content: newContent }
          });
          console.log(`Updated post ID ${post.id} with tags: ${missingTags.join(', ')}`);
          updatedCount++;
        }
        break;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} posts with hashtags!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error updating posts:', err);
  process.exit(1);
});
