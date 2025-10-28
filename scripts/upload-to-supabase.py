"""
Upload Demo Videos to Supabase Storage
This script uploads all downloaded videos to Supabase Storage buckets
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://vuverbxxstnpdslqwxxf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dmVyYnh4c3RucGRzbHF3eHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc0MTgsImV4cCI6MjA3NDc1MzQxOH0.rVpNTRDyKBLIGejf-R4i067pkue26rN0c37TXK4fwYY"

# Directories
VIDEOS_DIR = Path(__file__).parent.parent / "public" / "demo-videos"
IMAGES_DIR = Path(__file__).parent.parent / "public" / "demo-images"

# Supabase Storage buckets
VIDEOS_BUCKET = "videos"
IMAGES_BUCKET = "images"


def init_supabase() -> Client:
    """Initialize Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_file(supabase: Client, bucket: str, file_path: Path, storage_path: str) -> bool:
    """Upload a single file to Supabase Storage"""
    try:
        print(f"  Uploading {file_path.name}...")
        
        # Read file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload to Supabase
        response = supabase.storage.from_(bucket).upload(
            storage_path,
            file_data,
            file_options={"content-type": get_content_type(file_path)}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket).get_public_url(storage_path)
        
        print(f"  ✓ Uploaded: {storage_path}")
        print(f"    URL: {public_url}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error uploading {file_path.name}: {e}")
        return False


def get_content_type(file_path: Path) -> str:
    """Get content type based on file extension"""
    ext = file_path.suffix.lower()
    content_types = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
    }
    return content_types.get(ext, 'application/octet-stream')


def upload_series_videos(supabase: Client, series_slug: str) -> int:
    """Upload all videos for a series"""
    series_dir = VIDEOS_DIR / series_slug
    
    if not series_dir.exists():
        print(f"  ✗ Directory not found: {series_dir}")
        return 0
    
    video_files = sorted(series_dir.glob("ep*.mp4"))
    uploaded = 0
    
    print(f"\n  Found {len(video_files)} videos")
    
    for video_file in video_files:
        # Storage path: series-slug/ep01.mp4
        storage_path = f"{series_slug}/{video_file.name}"
        
        if upload_file(supabase, VIDEOS_BUCKET, video_file, storage_path):
            uploaded += 1
    
    return uploaded


def generate_thumbnails(series_slug: str) -> bool:
    """Generate thumbnail images from videos (placeholder)"""
    print(f"  📸 Generating thumbnails for {series_slug}...")
    print(f"  ℹ️  Note: Using placeholder images for now")
    print(f"  ℹ️  You can generate real thumbnails with ffmpeg later")
    return True


def update_database_urls(supabase: Client) -> bool:
    """Update database with correct video URLs"""
    try:
        print(f"\n{'='*60}")
        print(f"Updating database with video URLs...")
        print(f"{'='*60}")
        
        series_list = [
            "urban-dreams",
            "love-and-coffee",
            "tech-life"
        ]
        
        for series_slug in series_list:
            print(f"\n  Series: {series_slug}")
            
            # Get series ID
            series_result = supabase.table('series').select('id').eq('slug', series_slug).execute()
            if not series_result.data:
                print(f"    ✗ Series not found")
                continue
            
            series_id = series_result.data[0]['id']
            print(f"    Series ID: {series_id}")
            
            # Get all episodes for this series
            episodes_result = supabase.table('episodes').select('id, episode_number').eq('series_id', series_id).execute()
            episodes = episodes_result.data
            
            print(f"    Found {len(episodes)} episodes")
            
            # Update each episode with video URL
            for episode in episodes:
                ep_num = episode['episode_number']
                episode_id = episode['id']
                
                # Generate URLs
                video_url = supabase.storage.from_(VIDEOS_BUCKET).get_public_url(
                    f"{series_slug}/ep{ep_num:02d}.mp4"
                )
                thumbnail_url = supabase.storage.from_(IMAGES_BUCKET).get_public_url(
                    f"episodes/{series_slug}-ep{ep_num:02d}.jpg"
                )
                
                # Update episode
                supabase.table('episodes').update({
                    'video_url': video_url,
                    'thumbnail_url': thumbnail_url
                }).eq('id', episode_id).execute()
                
                print(f"      ✓ Episode {ep_num:02d} URLs updated")
        
        print(f"\n  ✓ Database URLs updated successfully!")
        return True
        
    except Exception as e:
        print(f"  ✗ Error updating database: {e}")
        return False


def main():
    """Main function"""
    print("\n" + "="*60)
    print("SUPABASE STORAGE UPLOADER - Shira Demo Content")
    print("="*60)
    print(f"\n📁 Videos directory: {VIDEOS_DIR}")
    print(f"☁️  Supabase URL: {SUPABASE_URL}")
    print(f"🪣 Videos bucket: {VIDEOS_BUCKET}")
    print(f"🪣 Images bucket: {IMAGES_BUCKET}")
    
    # Check if videos directory exists
    if not VIDEOS_DIR.exists():
        print(f"\n❌ ERROR: Videos directory not found!")
        print(f"📝 Please run download-demo-videos.py first")
        return
    
    # Initialize Supabase
    print(f"\n🔌 Connecting to Supabase...")
    try:
        supabase = init_supabase()
        print(f"  ✓ Connected successfully!")
    except Exception as e:
        print(f"  ✗ Connection failed: {e}")
        return
    
    # Upload videos for each series
    series_config = [
        ("urban-dreams", "Urban Dreams"),
        ("love-and-coffee", "Love & Coffee"),
        ("tech-life", "Tech Life")
    ]
    
    total_uploaded = 0
    
    for series_slug, series_name in series_config:
        print(f"\n{'='*60}")
        print(f"Series: {series_name} ({series_slug})")
        print(f"{'='*60}")
        
        uploaded = upload_series_videos(supabase, series_slug)
        total_uploaded += uploaded
        
        print(f"\n  ✓ Uploaded {uploaded} videos for {series_name}")
    
    # Update database with URLs
    update_database_urls(supabase)
    
    print("\n" + "="*60)
    print("UPLOAD COMPLETE!")
    print("="*60)
    print(f"✓ Uploaded: {total_uploaded} videos")
    print(f"☁️  Storage: Supabase")
    print(f"🌐 Videos are now publicly accessible")
    print("\n📝 Next steps:")
    print("1. Test video playback in the app")
    print("2. Deploy to Vercel")
    print("3. Share demo URL!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
