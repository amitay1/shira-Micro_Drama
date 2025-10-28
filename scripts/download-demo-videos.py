"""
Download Demo Videos from Pexels
This script downloads 45 free vertical (9:16) videos for the demo
"""

import os
import requests
import time
from pathlib import Path

# Pexels API (Free tier - 200 requests/hour)
PEXELS_API_KEY = "gqEis2HkN2zFbGHRGlgUaDDccKjqNz41SMtETVYUVL2H6arGnaGkU2TQ"  # Get free key from https://www.pexels.com/api/

# Video configuration
VIDEOS_PER_SERIES = 15
TOTAL_SERIES = 3
VIDEO_DURATION = "short"  # short = under 5 minutes
ORIENTATION = "portrait"  # 9:16 vertical
QUALITY = "hd"  # HD quality

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "demo-videos"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Series themes and search queries
SERIES_CONFIG = [
    {
        "slug": "urban-dreams",
        "name": "Urban Dreams",
        "queries": [
            "city life", "urban street", "city night", "modern life",
            "walking city", "urban culture", "city view", "metropolitan",
            "downtown", "city lights", "urban lifestyle", "cityscape",
            "street scene", "urban architecture", "city traffic"
        ]
    },
    {
        "slug": "love-and-coffee",
        "name": "Love & Coffee",
        "queries": [
            "coffee shop", "cafe interior", "barista", "coffee cup",
            "latte art", "coffee making", "cafe culture", "morning coffee",
            "espresso", "coffee beans", "romantic cafe", "coffee date",
            "coffee brewing", "cappuccino", "coffee lifestyle"
        ]
    },
    {
        "slug": "tech-life",
        "name": "Tech Life",
        "queries": [
            "office work", "startup office", "coding", "computer work",
            "tech startup", "modern office", "meeting room", "coworking",
            "developer", "programming", "tech company", "office space",
            "business meeting", "laptop work", "tech workplace"
        ]
    }
]


def download_video(url: str, filepath: Path) -> bool:
    """Download a single video file"""
    try:
        print(f"  Downloading to {filepath.name}...")
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"  ✓ Downloaded {filepath.name} ({filepath.stat().st_size / 1024 / 1024:.1f} MB)")
        return True
    except Exception as e:
        print(f"  ✗ Error downloading {filepath.name}: {e}")
        return False


def search_pexels_videos(query: str, per_page: int = 5) -> list:
    """Search for videos on Pexels"""
    url = "https://api.pexels.com/videos/search"
    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": query,
        "orientation": ORIENTATION,
        "size": "medium",
        "per_page": per_page
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("videos", [])
    except Exception as e:
        print(f"  ✗ Error searching Pexels: {e}")
        return []


def get_best_video_file(video_files: list) -> str:
    """Get the best quality video file URL (HD, portrait)"""
    # Try to find HD portrait video
    for file in video_files:
        if file.get("quality") == "hd" and file.get("height", 0) > file.get("width", 0):
            return file.get("link")
    
    # Fallback: any portrait video
    for file in video_files:
        if file.get("height", 0) > file.get("width", 0):
            return file.get("link")
    
    # Last resort: first video file
    return video_files[0].get("link") if video_files else None


def download_series_videos(series_config: dict, series_index: int) -> int:
    """Download all videos for a series"""
    series_slug = series_config["slug"]
    series_name = series_config["name"]
    queries = series_config["queries"]
    
    print(f"\n{'='*60}")
    print(f"Series {series_index + 1}: {series_name} ({series_slug})")
    print(f"{'='*60}")
    
    # Create series directory
    series_dir = OUTPUT_DIR / series_slug
    series_dir.mkdir(parents=True, exist_ok=True)
    
    downloaded = 0
    query_index = 0
    
    for episode_num in range(1, VIDEOS_PER_SERIES + 1):
        filepath = series_dir / f"ep{episode_num:02d}.mp4"
        
        # Skip if already downloaded
        if filepath.exists():
            print(f"\nEpisode {episode_num:02d}: Already exists, skipping")
            downloaded += 1
            continue
        
        print(f"\nEpisode {episode_num:02d}: Searching for videos...")
        
        # Try current query
        query = queries[query_index % len(queries)]
        print(f"  Query: '{query}'")
        
        videos = search_pexels_videos(query, per_page=5)
        
        if not videos:
            print(f"  ✗ No videos found, trying next query...")
            query_index += 1
            continue
        
        # Get first available video
        video = videos[0]
        video_files = video.get("video_files", [])
        
        if not video_files:
            print(f"  ✗ No video files available")
            query_index += 1
            continue
        
        # Get best quality video URL
        video_url = get_best_video_file(video_files)
        
        if not video_url:
            print(f"  ✗ No suitable video URL found")
            query_index += 1
            continue
        
        # Download video
        if download_video(video_url, filepath):
            downloaded += 1
        
        # Move to next query
        query_index += 1
        
        # Rate limiting: wait 2 seconds between requests
        time.sleep(2)
    
    return downloaded


def main():
    """Main function"""
    print("\n" + "="*60)
    print("PEXELS VIDEO DOWNLOADER - Shira Demo Content")
    print("="*60)
    
    if PEXELS_API_KEY == "YOUR_PEXELS_API_KEY":
        print("\n❌ ERROR: Please set your Pexels API key!")
        print("\n📝 Steps:")
        print("1. Go to https://www.pexels.com/api/")
        print("2. Sign up for free API key")
        print("3. Replace 'YOUR_PEXELS_API_KEY' in this script")
        print("4. Run again")
        return
    
    print(f"\n📁 Output directory: {OUTPUT_DIR}")
    print(f"📹 Total videos to download: {TOTAL_SERIES * VIDEOS_PER_SERIES}")
    print(f"⏱️  Estimated time: ~30-45 minutes")
    print("\n" + "="*60)
    
    total_downloaded = 0
    start_time = time.time()
    
    for i, series in enumerate(SERIES_CONFIG):
        downloaded = download_series_videos(series, i)
        total_downloaded += downloaded
        
        # Sleep between series
        if i < len(SERIES_CONFIG) - 1:
            print(f"\n⏸️  Waiting 10 seconds before next series...")
            time.sleep(10)
    
    elapsed_time = time.time() - start_time
    
    print("\n" + "="*60)
    print("DOWNLOAD COMPLETE!")
    print("="*60)
    print(f"✓ Downloaded: {total_downloaded}/{TOTAL_SERIES * VIDEOS_PER_SERIES} videos")
    print(f"⏱️  Time taken: {elapsed_time / 60:.1f} minutes")
    print(f"📁 Location: {OUTPUT_DIR}")
    print("\n📝 Next steps:")
    print("1. Review downloaded videos")
    print("2. Run upload script to upload to Supabase Storage")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
