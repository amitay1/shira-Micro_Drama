// Load environment variables
require('dotenv').config();

const { sequelize } = require('../src/config/database');
const { Series, Season, Episode } = require('../src/models');
const logger = require('../src/utils/logger');

// Series data based on the frontend mock
const seriesData = [
  {
    title: 'אהבה אסורה',
    slug: 'forbidden-love',
    description: 'סיפור אהבה מרגש בין שני אנשים ממעמדות שונים',
    genre: ['רומנטיקה', 'דרמה'],
    thumbnail_url: 'https://images.pexels.com/photos/2072179/pexels-photo-2072179.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    published_date: '2024-01-01',
    total_episodes: 24,
    free_episodes_count: 10,
    season_pass_price: 99,
    status: 'live',
    age_rating: '16+',
  },
  {
    title: 'המנהל שלי',
    slug: 'my-boss',
    description: 'קומדיה רומנטית על עובדת צעירה ומנהל מסתורי',
    genre: ['קומדיה רומנטית', 'דרמה'],
    thumbnail_url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    published_date: '2024-02-01',
    total_episodes: 20,
    free_episodes_count: 10,
    season_pass_price: 89,
    status: 'live',
    age_rating: '13+',
  },
  {
    title: 'נקמה מתוקה',
    slug: 'sweet-revenge',
    description: 'דרמה מותחת על אישה שחוזרת לנקום באויביה',
    genre: ['דרמה', 'מותחן'],
    thumbnail_url: 'https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    published_date: '2024-03-01',
    total_episodes: 30,
    free_episodes_count: 10,
    season_pass_price: 119,
    status: 'live',
    age_rating: '18+',
  },
  {
    title: 'נשיא ההייטק',
    slug: 'tech-president',
    description: 'סיפור על יזם צעיר ומזכירתו המבריקה',
    genre: ['עסקים', 'רומנטיקה'],
    thumbnail_url: 'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    published_date: '2024-04-01',
    total_episodes: 25,
    free_episodes_count: 10,
    season_pass_price: 99,
    status: 'live',
    age_rating: '13+',
  },
  {
    title: 'זיכרון אבוד',
    slug: 'lost-memory',
    description: 'מותחן פסיכולוגי על אישה שאיבדה את זכרונה',
    genre: ['מותחן', 'דרמה'],
    thumbnail_url: 'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    published_date: '2024-05-01',
    total_episodes: 18,
    free_episodes_count: 10,
    season_pass_price: 79,
    status: 'live',
    age_rating: '16+',
  },
  {
    title: 'הכוכב שלי',
    slug: 'my-star',
    description: 'דרמה מרגשת על עולם התהילה והמחיר שלה',
    genre: ['דרמה', 'רומנטיקה'],
    thumbnail_url: 'https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    published_date: '2024-06-01',
    total_episodes: 22,
    free_episodes_count: 10,
    season_pass_price: 99,
    status: 'live',
    age_rating: '16+',
  },
];

// Episode images by series
const episodeImages = {
  0: [ // Series 1
    'https://images.pexels.com/photos/2072179/pexels-photo-2072179.jpeg',
    'https://images.pexels.com/photos/2787341/pexels-photo-2787341.jpeg',
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg',
    'https://images.pexels.com/photos/1586003/pexels-photo-1586003.jpeg',
    'https://images.pexels.com/photos/3756164/pexels-photo-3756164.jpeg',
  ],
  1: [ // Series 2
    'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg',
    'https://images.pexels.com/photos/5325890/pexels-photo-5325890.jpeg',
    'https://images.pexels.com/photos/3184425/pexels-photo-3184425.jpeg',
    'https://images.pexels.com/photos/7289714/pexels-photo-7289714.jpeg',
    'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg',
  ],
  2: [ // Series 3
    'https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg',
    'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg',
    'https://images.pexels.com/photos/2100063/pexels-photo-2100063.jpeg',
    'https://images.pexels.com/photos/3936894/pexels-photo-3936894.jpeg',
    'https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg',
  ],
  3: [ // Series 4
    'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg',
    'https://images.pexels.com/photos/6804581/pexels-photo-6804581.jpeg',
    'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
    'https://images.pexels.com/photos/3184432/pexels-photo-3184432.jpeg',
    'https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg',
  ],
  4: [ // Series 5
    'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg',
    'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg',
    'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg',
    'https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg',
    'https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg',
  ],
  5: [ // Series 6
    'https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg',
    'https://images.pexels.com/photos/3586798/pexels-photo-3586798.jpeg',
    'https://images.pexels.com/photos/3771071/pexels-photo-3771071.jpeg',
    'https://images.pexels.com/photos/3394310/pexels-photo-3394310.jpeg',
    'https://images.pexels.com/photos/3756684/pexels-photo-3756684.jpeg',
  ],
};

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seed...');
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: false });
    logger.info('✅ Database models synced');

    // Check if series already exist
    const existingSeries = await Series.count();
    if (existingSeries > 0) {
      logger.warn(`⚠️  Database already has ${existingSeries} series. Skipping seed.`);
      logger.info('💡 To re-seed, first clear the database or use --force flag');
      return;
    }

    // Create series with seasons and episodes
    for (let i = 0; i < seriesData.length; i++) {
      const seriesInfo = seriesData[i];
      const images = episodeImages[i];

      logger.info(`📺 Creating series: ${seriesInfo.title}`);

      // Create series
      const series = await Series.create(seriesInfo);

      // Create season
      const season = await Season.create({
        series_id: series.id,
        season_number: 1,
        title: `עונה 1`,
        description: seriesInfo.description,
        total_episodes: seriesInfo.total_episodes,
        thumbnail_url: seriesInfo.thumbnail_url,
        status: 'live',
      });

      // Create episodes
      logger.info(`  📼 Creating ${seriesInfo.total_episodes} episodes...`);
      
      for (let ep = 1; ep <= seriesInfo.total_episodes; ep++) {
        const imageUrl = images[ep % images.length];
        const isFree = ep <= seriesInfo.free_episodes_count;
        
        await Episode.create({
          series_id: series.id,
          season_id: season.id,
          episode_number: ep,
          slug: `${seriesInfo.slug}-ep-${ep}`,
          title: `${seriesInfo.title} - פרק ${ep}`,
          description: `פרק ${ep}: ${getEpisodeDescription(ep)}`,
          thumbnail_url: `${imageUrl}?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop`,
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: 300 + Math.floor(Math.random() * 300), // 5-10 minutes
          is_locked: !isFree,
          status: 'live',
          unlock_type: isFree ? 'free' : 'subscription',
          unlock_cost: isFree ? 0 : 0,
        });
      }

      logger.info(`  ✅ Series "${seriesInfo.title}" created with ${seriesInfo.total_episodes} episodes`);
    }

    logger.info('✨ Database seed completed successfully!');
    logger.info(`📊 Created ${seriesData.length} series with their episodes`);
    
    // Close database connection
    await sequelize.close();
    logger.info('👋 Database connection closed');

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
}

function getEpisodeDescription(episodeNumber) {
  const descriptions = [
    'ההתחלה המרגשת',
    'סודות נחשפים',
    'מפנה בלתי צפוי',
    'קונפליקט גדול',
    'רגעי אמת',
    'החלטה קשה',
    'עימות דרמטי',
    'גילויים מפתיעים',
    'נקודת מפנה',
    'דרמה רגשית',
    'משבר עמוק',
    'תקווה חדשה',
    'אתגר גדול',
    'רגע מכריע',
    'שינוי בלתי צפוי',
  ];
  
  return descriptions[episodeNumber % descriptions.length];
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('👋 Seed script finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
