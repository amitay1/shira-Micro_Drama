// Mock data for series and episodes with real Unsplash images

export interface Series {
  id: string;
  title: string;
  description: string;
  genre: string;
  rating: number;
  totalEpisodes: number;
  thumbnailUrl: string;
  bannerUrl: string;
  releaseYear: number;
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  description: string;
  duration: number;
  isFree: boolean;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
}

export const mockSeries: Series[] = [
  {
    id: 'series-1',
    title: 'אהבה אסורה',
    description: 'סיפור אהבה מרגש בין שני אנשים ממעמדות שונים',
    genre: 'רומנטיקה',
    rating: 4.8,
    totalEpisodes: 24,
    thumbnailUrl: 'https://images.pexels.com/photos/2072179/pexels-photo-2072179.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    bannerUrl: 'https://images.pexels.com/photos/2072179/pexels-photo-2072179.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
    releaseYear: 2024,
  },
  {
    id: 'series-2',
    title: 'המנהל שלי',
    description: 'קומדיה רומנטית על עובדת צעירה ומנהל מסתורי',
    genre: 'קומדיה רומנטית',
    rating: 4.6,
    totalEpisodes: 20,
    thumbnailUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    bannerUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
    releaseYear: 2024,
  },
  {
    id: 'series-3',
    title: 'נקמה מתוקה',
    description: 'דרמה מותחת על אישה שחוזרת לנקום באויביה',
    genre: 'דרמה',
    rating: 4.9,
    totalEpisodes: 30,
    thumbnailUrl: 'https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    bannerUrl: 'https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
    releaseYear: 2024,
  },
  {
    id: 'series-4',
    title: 'נשיא ההייטק',
    description: 'סיפור על יזם צעיר ומזכירתו המבריקה',
    genre: 'עסקים',
    rating: 4.7,
    totalEpisodes: 25,
    thumbnailUrl: 'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    bannerUrl: 'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
    releaseYear: 2024,
  },
  {
    id: 'series-5',
    title: 'זיכרון אבוד',
    description: 'מותחן פסיכולוגי על אישה שאיבדה את זכרונה',
    genre: 'מותחן',
    rating: 4.5,
    totalEpisodes: 18,
    thumbnailUrl: 'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    bannerUrl: 'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
    releaseYear: 2024,
  },
  {
    id: 'series-6',
    title: 'הכוכב שלי',
    description: 'דרמה מרגשת על עולם התהילה והמחיר שלה',
    genre: 'דרמה',
    rating: 4.8,
    totalEpisodes: 22,
    thumbnailUrl: 'https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
    bannerUrl: 'https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
    releaseYear: 2024,
  },
];

// Generate episodes for each series
export const generateEpisodesForSeries = (series: Series): Episode[] => {
  const episodes: Episode[] = [];
  const freeEpisodesCount = 10;
  
  // Romantic/Drama themed images for each series
  const episodeImages = {
    'series-1': [ // Romance
      'https://images.pexels.com/photos/2072179/pexels-photo-2072179.jpeg',
      'https://images.pexels.com/photos/2787341/pexels-photo-2787341.jpeg',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg',
      'https://images.pexels.com/photos/1586003/pexels-photo-1586003.jpeg',
      'https://images.pexels.com/photos/3756164/pexels-photo-3756164.jpeg',
    ],
    'series-2': [ // Office Romance
      'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg',
      'https://images.pexels.com/photos/5325890/pexels-photo-5325890.jpeg',
      'https://images.pexels.com/photos/3184425/pexels-photo-3184425.jpeg',
      'https://images.pexels.com/photos/7289714/pexels-photo-7289714.jpeg',
      'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg',
    ],
    'series-3': [ // Drama
      'https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg',
      'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg',
      'https://images.pexels.com/photos/2100063/pexels-photo-2100063.jpeg',
      'https://images.pexels.com/photos/3936894/pexels-photo-3936894.jpeg',
      'https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg',
    ],
    'series-4': [ // Business
      'https://images.pexels.com/photos/3758105/pexels-photo-3758105.jpeg',
      'https://images.pexels.com/photos/6804581/pexels-photo-6804581.jpeg',
      'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
      'https://images.pexels.com/photos/3184432/pexels-photo-3184432.jpeg',
      'https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg',
    ],
    'series-5': [ // Thriller
      'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg',
      'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg',
      'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg',
      'https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg',
      'https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg',
    ],
    'series-6': [ // Celebrity
      'https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg',
      'https://images.pexels.com/photos/3586798/pexels-photo-3586798.jpeg',
      'https://images.pexels.com/photos/3771071/pexels-photo-3771071.jpeg',
      'https://images.pexels.com/photos/3394310/pexels-photo-3394310.jpeg',
      'https://images.pexels.com/photos/3756684/pexels-photo-3756684.jpeg',
    ],
  };

  const images = episodeImages[series.id as keyof typeof episodeImages] || episodeImages['series-1'];
  
  for (let i = 0; i < series.totalEpisodes; i++) {
    const imageUrl = images[i % images.length];
    episodes.push({
      id: `${series.id}-ep-${i + 1}`,
      seriesId: series.id,
      episodeNumber: i + 1,
      title: `${series.title} - פרק ${i + 1}`,
      description: `פרק ${i + 1}: ${getEpisodeDescription(i + 1)}`,
      duration: 300 + Math.floor(Math.random() * 300), // 5-10 minutes
      isFree: i < freeEpisodesCount,
      thumbnailUrl: `${imageUrl}?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop`,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      views: Math.floor(Math.random() * 100000) + 10000,
    });
  }
  
  return episodes;
};

function getEpisodeDescription(episodeNumber: number): string {
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

export const getAllEpisodes = (): Episode[] => {
  return mockSeries.flatMap(series => generateEpisodesForSeries(series));
};

export const getEpisodesBySeriesId = (seriesId: string): Episode[] => {
  const series = mockSeries.find(s => s.id === seriesId);
  if (!series) return [];
  return generateEpisodesForSeries(series);
};
