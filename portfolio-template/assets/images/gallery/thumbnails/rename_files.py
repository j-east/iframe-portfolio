#!/usr/bin/env python3
"""
File renaming script that renames files according to a predefined mapping.
Handles spaces in filenames by replacing them with underscores for matching.
"""

import os
import sys

# File renaming mapping
RENAME_MAP = {
    "Capture.webp": "jevons-camera_gaze-indicator-demo_feature.webp",
    "Capture2-2.webp": "jevons-camera_eye-gaze-interface_feature.webp",
    "IMG_0030.webp": "artwork-furniture_tropical-beach-painting_standard.webp",
    "IMG_0141.webp": "artwork-furniture_sailboat-sunset-painting_standard.webp",
    "IMG_0277.webp": "circuit-assembly_purple-pcb-array_feature.webp",
    "IMG_0369.webp": "circuit-assembly_pcb-closeup_standard.webp",
    "IMG_0380.webp": "circuit-assembly_pick-and-place-machine_feature.webp",
    "IMG_0396-1-e1620738338136.webp": "circuit-assembly_fine-pitch-connector_standard.webp",
    "IMG_0841.webp": "artwork-furniture_swamp-sunset-painting_hero.webp",
    "IMG_0843.webp": "artwork-furniture_white-sails-painting_standard.webp",
    "IMG_0844.webp": "artwork-furniture_snowy-mountains-painting_standard.webp",
    "IMG_0846.webp": "artwork-furniture_sailboat-mountains-painting_standard.webp",
    "IMG_0847.webp": "artwork-furniture_racing-sailboats_standard.webp",
    "IMG_0848.webp": "artwork-furniture_dramatic-sunset-seascape_standard.webp",
    "IMG_0957.webp": "parachute-altimeter_stacked-pcb-module_hero.webp",
    "IMG_1176.webp": "artwork-furniture_geometric-wood-table_feature.webp",
    "IMG_1434.webp": "artwork-furniture_beach-waves-seagulls_standard.webp",
    "IMG_1834.webp": "artwork-furniture_coastal-cabin-landscape_standard.webp",
    "IMG_1920.webp": "artwork-furniture_alien-mountains-sailboat_standard.webp",
    "IMG_4821.webp": "sailboat-refit_custom-teak-table_hero.webp",
    "IMG_4964.webp": "artwork-furniture_golf-swing-sight-tool_standard.webp",
    "IMG_4965.webp": "artwork-furniture_golf-swing-sight-closeup_standard.webp",
    "IMG_5256.webp": "sailboat-refit_salon-interior-wide_feature.webp",
    "IMG_5274.webp": "parachute-altimeter_wrist-display-map_feature.webp",
    "IMG_5276.webp": "parachute-altimeter_dev-board-ribbon-cable_standard.webp",
    "IMG_5579.webp": "artwork-furniture_pelicans-sailboats-beach_standard.webp",
    "IMG_8250.webp": "artwork-furniture_coastal-overlook-with-dog_standard.webp",
    "IMG_8275.webp": "artwork-furniture_schooner-sunset-reflection_standard.webp",
    "IMG_8887.webp": "artwork-furniture_stormy-sailboat_standard.webp",
    "IMG_20190521_222804_01.webp": "parachute-altimeter_stacked-module-side_standard.webp",
    "IMG_20190910_221245_01.webp": "downeastaudio_amplifier-pcb-detail_feature.webp",
    "IMG_20191119_190711_01.webp": "parachute-altimeter_florida-vector-map_standard.webp",
    "IMG_20191122_090718_01.webp": "parachute-altimeter_maine-coastline-gis_standard.webp",
    "IMG_20191122_101318_531.webp": "parachute-altimeter_florida-render-presentation_standard.webp",
    "MG_0516.webp": "downeastaudio_wooden-bluetooth-speaker_hero.webp",
    "down-east-audio_1.webp": "downeastaudio_mahogany-speaker-angle_feature.webp",
    "downeast-audio-1.webp": "downeastaudio_branding-closeup_standard.webp",
    "downeast-audio-amp.webp": "downeastaudio_top-view-closeup_standard.webp",
    "downeast-audio-new-with-curve-custom-gift.webp": "downeastaudio_sailboat-engraving-gift_feature.webp",
    "downeast-audio-new-with-curve.webp": "downeastaudio_front-view-detail_standard.webp",
    "eyetracking.webp": "jevons-camera_head-mounted-prototype_feature.webp",
    "image-20190522_211208.webp": "parachute-altimeter_altimeter-pcb-cable_standard.webp",
    "jacksonville-downeast-audio-custom-amplifier-6.webp": "downeastaudio_compass-engraving-back_standard.webp",
    "MG_0656.webp": "jevons-camera_glasses-mounted-system_feature.webp",
    "MG_2122.webp": "downeastaudio_control-panel-detail_feature.webp",
    "MG_3210.webp": "downeastaudio_waterproof-speaker-lifestyle_standard.webp",
    "Screenshot_2025-04-28_115005.webp": "downeastaudio_port-connector-3d-model_standard.webp",
    "Screenshot_2025-04-30_095719.webp": "downeastaudio_port-connector-print_standard.webp",
    "Screenshot_2025-08-16_163933.webp": "downeastaudio_amplifier-pcb-layout_standard.webp",
    "Screenshot_2025-08-16_164045.webp": "downeastaudio_pcb-design-detail_standard.webp",
    "Screenshot_2025-08-16_164055.webp": "downeastaudio_pcb-back-layout_standard.webp",
    "waterproof-speakers-downeast-audio.webp": "downeastaudio_control-panel-macro_standard.webp",
    "WSC-August-2018-92-of-1.webp": "jevons-camera_eyetracking-glasses-hardware_standard.webp",
}


def normalize_filename(filename):
    """Replace spaces with underscores in filename for matching"""
    return filename.replace(' ', '_')


def rename_files(directory='.', dry_run=True):
    """
    Rename files in the specified directory according to RENAME_MAP.
    
    Args:
        directory: Directory containing files to rename (default: current directory)
        dry_run: If True, only print what would be renamed without actually renaming
    """
    # Create a normalized lookup map
    normalized_map = {}
    for old_name, new_name in RENAME_MAP.items():
        normalized_key = normalize_filename(old_name)
        normalized_map[normalized_key] = (old_name, new_name)
    
    renamed_count = 0
    not_found = []
    
    print(f"{'DRY RUN - ' if dry_run else ''}Scanning directory: {directory}\n")
    
    # Get all files in directory
    try:
        files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
    except FileNotFoundError:
        print(f"Error: Directory '{directory}' not found")
        return
    
    # Check each file against the mapping
    for filename in files:
        normalized_filename = normalize_filename(filename)
        
        if normalized_filename in normalized_map:
            old_name, new_name = normalized_map[normalized_filename]
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_name)
            
            # Check if target already exists
            if os.path.exists(new_path):
                print(f"⚠️  SKIP: {filename} -> {new_name} (target already exists)")
                continue
            
            if dry_run:
                print(f"✓ WOULD RENAME: {filename} -> {new_name}")
            else:
                try:
                    os.rename(old_path, new_path)
                    print(f"✓ RENAMED: {filename} -> {new_name}")
                    renamed_count += 1
                except Exception as e:
                    print(f"✗ ERROR: Failed to rename {filename}: {e}")
        
    # Report files in mapping that weren't found
    found_normalized = {normalize_filename(f) for f in files}
    for normalized_key in normalized_map:
        if normalized_key not in found_normalized:
            original_name = normalized_map[normalized_key][0]
            not_found.append(original_name)
    
    # Summary
    print(f"\n{'=' * 60}")
    print(f"Summary:")
    print(f"  Files {'that would be' if dry_run else ''} renamed: {renamed_count if not dry_run else len([f for f in files if normalize_filename(f) in normalized_map])}")
    print(f"  Files in mapping but not found: {len(not_found)}")
    
    if not_found:
        print(f"\nFiles in mapping but not found in directory:")
        for filename in not_found:
            print(f"  - {filename}")


if __name__ == "__main__":
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] in ['-h', '--help']:
            print("Usage: python3 rename_files.py [directory] [--execute]")
            print("  directory: Directory containing files to rename (default: current directory)")
            print("  --execute: Actually perform the rename (default: dry run)")
            sys.exit(0)
        
        directory = sys.argv[1] if not sys.argv[1].startswith('--') else '.'
        execute = '--execute' in sys.argv
    else:
        directory = '.'
        execute = False
    
    dry_run = not execute
    
    if dry_run:
        print("=" * 60)
        print("DRY RUN MODE - No files will be renamed")
        print("Add --execute flag to actually rename files")
        print("=" * 60)
        print()
    
    rename_files(directory, dry_run)
    
    if dry_run:
        print("\nTo execute the renaming, run:")
        print(f"  python3 rename_files.py {directory if directory != '.' else ''} --execute")