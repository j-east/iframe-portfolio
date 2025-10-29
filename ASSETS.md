# Asset Structure Guide

This guide explains how to organize your portfolio assets for the iframe portfolio component.

## Directory Structure

```
your-portfolio-folder/
├── portfolio-data.xml          # Your portfolio content (required)
├── assets/                     # Asset directory
│   ├── images/
│   │   ├── projects/          # Project-specific images
│   │   │   ├── project1-screenshot.jpg
│   │   │   ├── project1-diagram.png
│   │   │   └── project2-demo.gif
│   │   ├── gallery/           # Gallery items (artwork, furniture, etc.)
│   │   │   ├── painting-01.jpg
│   │   │   ├── furniture-01.jpg
│   │   │   └── sculpture-01.jpg
│   │   └── icons/             # Custom icons (optional)
│   │       ├── github.svg
│   │       └── external-link.svg
│   └── documents/             # Optional: PDFs, datasheets, etc.
│       ├── project1-datasheet.pdf
│       └── resume.pdf
```

## Image Guidelines

### Project Images
- **Location**: `assets/images/projects/`
- **Naming**: Use descriptive names matching your XML `<image>` tags
- **Format**: JPG, PNG, GIF, WebP
- **Size**: Recommended max width 1200px for performance
- **Aspect Ratio**: 16:9 or 4:3 work best for the layout

### Gallery Items
- **Location**: `assets/images/gallery/`
- **Naming**: Match your XML `<item>` tags in `<gallery>` sections
- **Format**: JPG, PNG preferred
- **Size**: Square (1:1) or portrait (3:4) ratios work well
- **Quality**: Higher quality for artwork/detailed work

### Optimization Tips
- Compress images for web (use tools like TinyPNG, ImageOptim)
- Consider WebP format for better compression
- Provide alt text in your descriptions
- Use progressive JPEG for larger images

## XML Reference Examples

### Basic Project with Images
```xml
<project id="my-project" featured="true">
    <title>My Amazing Project</title>
    <!-- ... other fields ... -->
    <images>
        <image>my-project-main.jpg</image>
        <image>my-project-detail.png</image>
        <image>my-project-demo.gif</image>
    </images>
</project>
```

### Gallery Project (Art/Furniture)
```xml
<project id="artwork" featured="true">
    <title>My Artwork Collection</title>
    <!-- ... other fields ... -->
    <gallery>
        <item type="painting">sunset-landscape.jpg</item>
        <item type="painting">abstract-01.jpg</item>
        <item type="sculpture">bronze-figure.jpg</item>
        <item type="furniture">custom-table.jpg</item>
    </gallery>
</project>
```

### Project with Links
```xml
<project id="open-source" featured="true">
    <title>Open Source Project</title>
    <!-- ... other fields ... -->
    <links>
        <link type="github" label="Source Code">https://github.com/username/project</link>
        <link type="website" label="Live Demo">https://project-demo.com</link>
        <link type="hackaday" label="Hackaday Feature">https://hackaday.io/project/12345</link>
        <link type="youtube" label="Demo Video">https://youtube.com/watch?v=abc123</link>
    </links>
</project>
```

## Asset Loading

The portfolio component automatically:
- Loads images from the `assets/images/` directory
- Handles missing images gracefully (shows placeholder or hides)
- Supports lazy loading for performance
- Scales images responsively

## GitHub Pages Deployment

When deploying to GitHub Pages:

1. **Commit all assets** to your repository
2. **Check file sizes** - GitHub has a 100MB file limit
3. **Use relative paths** - the component uses `./assets/` automatically
4. **Test locally first** using a local server

### Large Files
For large image collections:
- Consider using Git LFS for files >50MB
- Or host images externally (Imgur, Cloudinary) and use full URLs in XML
- Compress images before committing

## External Asset Hosting

You can also host assets externally by using full URLs:

```xml
<images>
    <image>https://your-cdn.com/images/project-screenshot.jpg</image>
    <image>https://imgur.com/abc123.png</image>
</images>
```

## Troubleshooting

### Images Not Loading
1. Check file paths match XML exactly (case-sensitive)
2. Verify files are committed to repository
3. Check browser console for 404 errors
4. Ensure images are in correct directory structure

### Performance Issues
1. Compress large images
2. Use appropriate formats (WebP > PNG > JPG)
3. Consider lazy loading for many images
4. Optimize for mobile viewing

### CORS Issues (Local Development)
If testing locally, serve files through a local server:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## Best Practices

1. **Consistent Naming**: Use descriptive, consistent file names
2. **Backup Assets**: Keep originals separate from web-optimized versions
3. **Version Control**: Commit assets with meaningful commit messages
4. **Documentation**: Document special assets or requirements
5. **Testing**: Test on different devices and connection speeds

---

Need help? Check the main README.md or open an issue on GitHub!