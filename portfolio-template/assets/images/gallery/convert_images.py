#!/usr/bin/env python3
"""
Interactive Image Converter to WebP with Thumbnail Generation

Features:
- Converts images to WebP format (best compression for web)
- Normalizes image sizes to 1920x1080 (or custom)
- Generates 200x200 thumbnails
- Interactive cropping preview with arrow key navigation
- Preserves aspect ratios or allows custom cropping
"""

import os
import sys
from pathlib import Path
from PIL import Image
import argparse

# Try to import pillow-heif for HEIC support
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HAS_HEIF = True
except ImportError:
    HAS_HEIF = False
    print("Warning: pillow-heif not installed. HEIC/HEIF files will be skipped.")
    print("Install with: pip3 install pillow-heif --break-system-packages")

# Try to import opencv for interactive preview
try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    print("Warning: opencv-python not installed. Interactive cropping disabled.")
    print("Install with: pip3 install opencv-python --break-system-packages")


class ImageConverter:
    def __init__(self, input_dir, output_dir, target_size=(1000, 1000), 
                 thumb_size=(200, 200), quality=85, interactive=False):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.target_size = target_size
        self.thumb_size = thumb_size
        self.quality = quality
        self.interactive = interactive and HAS_CV2
        
        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / "thumbnails").mkdir(exist_ok=True)
        
        # Supported input formats
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.heic', '.heif'}
    
    def get_crop_region_interactive(self, img_path):
        """Interactive cropping using arrow keys"""
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"Error loading {img_path} with OpenCV")
            return None
        
        height, width = img.shape[:2]
        target_w, target_h = self.target_size
        target_aspect = target_w / target_h
        
        # Calculate maximum crop size maintaining target aspect ratio
        if width / height > target_aspect:
            # Image is wider - limit by height
            crop_h = height
            crop_w = int(height * target_aspect)
        else:
            # Image is taller - limit by width
            crop_w = width
            crop_h = int(width / target_aspect)
        
        # Start centered
        x = (width - crop_w) // 2
        y = (height - crop_h) // 2
        
        step = 10  # pixels to move per key press
        
        print(f"\n{'='*60}")
        print(f"File: {img_path.name}")
        print(f"Original size: {width}x{height}")
        print(f"Crop size: {crop_w}x{crop_h} (aspect ratio {target_aspect:.2f})")
        print(f"{'='*60}")
        print("\nControls:")
        print("  Arrow Keys: Move crop region")
        print("  ENTER: Accept crop")
        print("  'c': Center crop")
        print("  's': Skip this image")
        print("  'q': Quit")
        print(f"{'='*60}\n")
        
        while True:
            # Create display image
            display = img.copy()
            
            # Draw crop rectangle
            cv2.rectangle(display, (x, y), (x + crop_w, y + crop_h), (0, 255, 0), 3)
            
            # Add semi-transparent overlay outside crop area
            overlay = display.copy()
            cv2.rectangle(overlay, (0, 0), (width, height), (0, 0, 0), -1)
            cv2.rectangle(overlay, (x, y), (x + crop_w, y + crop_h), (0, 0, 0), -1)
            cv2.addWeighted(display, 0.7, overlay, 0.3, 0, display)
            cv2.rectangle(display, (x, y), (x + crop_w, y + crop_h), (0, 255, 0), 3)
            
            # Add text info
            info_text = f"Position: ({x}, {y}) | Use arrow keys to adjust"
            cv2.putText(display, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.7, (0, 255, 0), 2)
            
            # Resize for display if too large
            max_display = 1200
            if width > max_display or height > max_display:
                scale = min(max_display / width, max_display / height)
                display_w = int(width * scale)
                display_h = int(height * scale)
                display_resized = cv2.resize(display, (display_w, display_h))
            else:
                display_resized = display
            
            cv2.imshow('Crop Preview - Arrow Keys to Move', display_resized)
            
            key = cv2.waitKey(0) & 0xFF
            
            if key == 13:  # Enter
                cv2.destroyAllWindows()
                return (x, y, x + crop_w, y + crop_h)
            elif key == ord('s'):  # Skip
                cv2.destroyAllWindows()
                return None
            elif key == ord('q'):  # Quit
                cv2.destroyAllWindows()
                sys.exit(0)
            elif key == ord('c'):  # Center
                x = (width - crop_w) // 2
                y = (height - crop_h) // 2
            elif key == 81:  # Left arrow
                x = max(0, x - step)
            elif key == 83:  # Right arrow
                x = min(width - crop_w, x + step)
            elif key == 82:  # Up arrow
                y = max(0, y - step)
            elif key == 84:  # Down arrow
                y = min(height - crop_h, y + step)
    
    def smart_crop(self, img):
        """Automatically crop image to target aspect ratio (center crop)"""
        width, height = img.size
        target_w, target_h = self.target_size
        target_aspect = target_w / target_h
        current_aspect = width / height
        
        if abs(current_aspect - target_aspect) < 0.01:
            # Already correct aspect ratio
            return img
        
        if current_aspect > target_aspect:
            # Image is wider - crop width
            new_width = int(height * target_aspect)
            left = (width - new_width) // 2
            return img.crop((left, 0, left + new_width, height))
        else:
            # Image is taller - crop height
            new_height = int(width / target_aspect)
            top = (height - new_height) // 2
            return img.crop((0, top, width, top + new_height))
    
    def create_thumbnail(self, img):
        """Create square thumbnail with center crop"""
        width, height = img.size
        size = min(width, height)
        
        # Center crop to square
        left = (width - size) // 2
        top = (height - size) // 2
        img_square = img.crop((left, top, left + size, top + size))
        
        # Resize to thumbnail size
        img_square.thumbnail(self.thumb_size, Image.Resampling.LANCZOS)
        
        return img_square
    
    def process_image(self, img_path):
        """Process a single image"""
        print(f"\nProcessing: {img_path.name}")
        
        try:
            # Check if it's a HEIC file and warn if library not available
            if img_path.suffix.lower() in ['.heic', '.heif'] and not HAS_HEIF:
                print(f"  ✗ Error: HEIC file but pillow-heif not installed")
                print(f"    Install with: pip3 install pillow-heif --break-system-packages")
                return False
            
            # Open image
            img = Image.open(img_path)
            print(f"  Opened: {img.format} {img.size} {img.mode}")
            
            # Fix EXIF orientation (prevents rotation issues)
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass  # If no EXIF data, continue normally
            
            # Convert to RGB if necessary (for transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Interactive or automatic cropping
            if self.interactive:
                crop_region = self.get_crop_region_interactive(img_path)
                if crop_region is None:
                    print("  Skipped by user")
                    return False
                img = img.crop(crop_region)
            else:
                img = self.smart_crop(img)
            
            # Resize to target size
            img_resized = img.resize(self.target_size, Image.Resampling.LANCZOS)
            
            # Create thumbnail
            thumb = self.create_thumbnail(img)
            
            # Save files
            output_name = img_path.stem + '.webp'
            output_path = self.output_dir / output_name
            thumb_path = self.output_dir / "thumbnails" / output_name
            
            img_resized.save(output_path, 'WEBP', quality=self.quality, method=6)
            thumb.save(thumb_path, 'WEBP', quality=self.quality, method=6)
            
            # Get file sizes
            original_size = img_path.stat().st_size / 1024
            new_size = output_path.stat().st_size / 1024
            thumb_size = thumb_path.stat().st_size / 1024
            
            print(f"  ✓ Saved: {output_name}")
            print(f"    Original: {original_size:.1f} KB → Full: {new_size:.1f} KB | Thumb: {thumb_size:.1f} KB")
            
            return True
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            return False
    
    def process_directory(self):
        """Process all images in the input directory"""
        # Find all supported images (case-insensitive)
        images = []
        for ext in self.supported_formats:
            # Add both lowercase and uppercase versions
            images.extend(self.input_dir.glob(f"*{ext}"))
            images.extend(self.input_dir.glob(f"*{ext.upper()}"))
            # Also try mixed case for HEIC (common on iOS)
            if ext in ['.heic', '.heif']:
                images.extend(self.input_dir.glob(f"*{ext.capitalize()}"))
        
        images = sorted(set(images))
        
        # Debug: Show what we found
        if images:
            print(f"\nFound files:")
            for img in images:
                print(f"  - {img.name} ({img.suffix})")
        else:
            print(f"\nNo files found. Checked extensions: {self.supported_formats}")
        
        if not images:
            print(f"No supported images found in {self.input_dir}")
            print(f"Supported formats: {', '.join(self.supported_formats)}")
            return
        
        print(f"\nFound {len(images)} images to process")
        print(f"Output directory: {self.output_dir}")
        print(f"Target size: {self.target_size[0]}x{self.target_size[1]}")
        print(f"Thumbnail size: {self.thumb_size[0]}x{self.thumb_size[1]}")
        print(f"Interactive mode: {'ON' if self.interactive else 'OFF'}")
        
        if self.interactive:
            input("\nPress Enter to start interactive processing...")
        
        # Process each image
        processed = 0
        for img_path in images:
            if self.process_image(img_path):
                processed += 1
        
        print(f"\n{'='*60}")
        print(f"Conversion complete!")
        print(f"Successfully processed: {processed}/{len(images)} images")
        print(f"Output location: {self.output_dir.absolute()}")
        print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Convert images to normalized WebP format with thumbnails',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic conversion (auto-crop)
  python convert_images.py ./photos ./output
  
  # Interactive cropping mode
  python convert_images.py ./photos ./output --interactive
  
  # Custom sizes
  python convert_images.py ./photos ./output --size 2560 1440 --thumb 300 300
  
  # High quality
  python convert_images.py ./photos ./output --quality 95
        """
    )
    
    parser.add_argument('input_dir', help='Input directory containing images')
    parser.add_argument('output_dir', help='Output directory for converted images')
    parser.add_argument('--size', nargs=2, type=int, metavar=('WIDTH', 'HEIGHT'),
                       default=[1000, 1000], help='Target size (default: 1000 1000)')
    parser.add_argument('--thumb', nargs=2, type=int, metavar=('WIDTH', 'HEIGHT'),
                       default=[200, 200], help='Thumbnail size (default: 200 200)')
    parser.add_argument('--quality', type=int, default=85, 
                       help='WebP quality 1-100 (default: 85)')
    parser.add_argument('--interactive', '-i', action='store_true',
                       help='Enable interactive cropping with arrow keys')
    
    args = parser.parse_args()
    
    # Validate directories
    if not Path(args.input_dir).exists():
        print(f"Error: Input directory '{args.input_dir}' does not exist")
        sys.exit(1)
    
    # Create converter and process
    converter = ImageConverter(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        target_size=tuple(args.size),
        thumb_size=tuple(args.thumb),
        quality=args.quality,
        interactive=args.interactive
    )
    
    converter.process_directory()


if __name__ == '__main__':
    main()