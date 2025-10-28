require('dotenv').config();
const { Series, Episode } = require('../src/models');
const logger = require('../src/utils/logger');

(async () => {
  try {
    const series = await Series.findAll();
    const episodes = await Episode.count();
    
    console.log(`\n✅ Database has ${series.length} series:`);
    for (const s of series) {
      console.log(`  📺 ${s.title} (${s.total_episodes} episodes, ${s.free_episodes_count} free)`);
    }
    console.log(`\n📊 Total Episodes in DB: ${episodes}\n`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
})();
