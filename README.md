# Iframe Portfolio Component

An embeddable portfolio component with a warm analog tech aesthetic, featuring circuit board traces, glowing effects, and interactive animations. Designed to be hosted on GitHub Pages and embedded as an iframe on any website.

## XML-Based Content Management

This portfolio uses a structured XML data format for easy content management and LLM-assisted editing:

### Portfolio Data Structure
- **XML Configuration**: All portfolio content is defined in [`portfolio-template/portfolio-data.xml`](portfolio-template/portfolio-data.xml)
- **Schema Validation**: Content structure validated against [`portfolio-schema.xsd`](portfolio-schema.xsd)
- **LLM-Friendly**: XML format is easily understood and edited by Large Language Models like Claude, ChatGPT, or local models
- **Image Management**: Structured image references with descriptions for AI-assisted content generation

### Easy Content Updates with AI
The XML structure makes it simple to update portfolio content using LLMs:

```xml
<project id="your-project" featured="true">
    <title>Project Name</title>
    <subtitle>Brief Description</subtitle>
    <timeframe>When it happened</timeframe>
    <category>tags,for,organization</category>
    <description>Detailed project description</description>
    <highlights>
        <highlight>Key achievement or feature</highlight>
        <highlight>Another important point</highlight>
    </highlights>
    <skills>Relevant Skills, Technologies, Tools</skills>
    <images>
        <image rank="hero" description="AI-friendly image description">filename.webp</image>
        <image rank="featured" description="Another key image">filename2.webp</image>
    </images>
</project>
```

### Automated Image Processing
- **Image Classification**: Uses AI services (like Anthropic's Claude Vision) to automatically generate image descriptions
- **Batch Processing**: Scripts available for processing entire image galleries
- **Optimized Formats**: WebP format for optimal loading performance
- **Responsive Thumbnails**: Automatic thumbnail generation for different display contexts

Simply provide your images and let AI generate the descriptions and organize the content structure!

## Design Features

- **Warm Analog Tech Aesthetic**: Amber glows, cathode cyan highlights, and phosphor green accents
- **Circuit Board Background**: Subtle animated circuit traces and nodes
- **Interactive Elements**: Smooth transitions, hover effects, and animated skill bars
- **Oscilloscope Animation**: Real-time animated waveform display in the contact section
- **Responsive Design**: Adapts seamlessly from desktop to mobile layouts
- **Floating Particles**: Ambient background effects for enhanced atmosphere

## Quick Start

### Basic Embedding

```html
<iframe
    src="https://j-east.github.io/iframe-portfolio/"
    width="800"
    height="600"
    frameborder="0"
    title="Portfolio">
</iframe>
```

### Recommended Sizes

| Size | Width | Height | Use Case |
|------|-------|--------|----------|
| **Desktop** | 800px | 600px | Full-featured display |
| **Tablet** | 600px | 500px | Compact layout |
| **Mobile** | 400px | 500px | Mobile-optimized |
| **Sidebar** | 350px | 600px | Narrow sidebar widget |

## Responsive Breakpoints

- **Desktop (>768px)**: Side-by-side navigation and content layout
- **Mobile (≤768px)**: Stacked layout with horizontal navigation buttons
- **Small Mobile (≤480px)**: Optimized spacing and typography

## Customization

### XML-Based Content Management

The portfolio loads content from the structured XML data file. To customize:

1. **Edit the XML**: Modify [`portfolio-template/portfolio-data.xml`](portfolio-template/portfolio-data.xml) with your content
2. **Use AI Assistance**: The XML format is designed to be easily understood and edited by LLMs
3. **Validate Structure**: The XSD schema ensures your content follows the correct format
4. **Process Images**: Use the included scripts to generate AI descriptions for your images

### Dynamic Content Updates (Optional)

For advanced use cases, the portfolio also supports real-time content updates via JavaScript messaging:

```javascript
// Get reference to the iframe
const portfolioIframe = document.getElementById('portfolio-iframe');

// Send content update (overrides XML data)
portfolioIframe.contentWindow.postMessage({
    type: 'portfolioUpdate',
    content: {
        // Your dynamic content structure
    }
}, '*');
```

### Color Scheme

The component uses CSS custom properties for easy theming:

```css
:root {
    /* Primary Warm Tones */
    --amber-glow: #FF9966;
    --amber-deep: #E87A4A;
    --coral-dust: #D9876B;
    --salmon-shadow: #C97A5E;
    
    /* Cold Cathode Cyan */
    --cathode-cyan: #4DD9D9;
    --cathode-cyan-deep: #3BBFBF;
    
    /* Phosphor Greens */
    --phosphor-green: #7FBF5F;
    --phosphor-green-deep: #6B9F4F;
    --terminal-green: #4DFF88;
    --mint-glow: #7FD9A6;
    --amber-green: #99B366;
    
    /* Neutrals */
    --cream: #F2E6D9;
    --manila: #E6D4C4;
    --peach-sky: #F2C4A6;
    --peach-haze: #FFCCB3;
    
    /* Darks & Anchors */
    --umber-deep: #4A3528;
    --umber-dark: #3D2A1F;
    --brass: #BF8F6B;
    --copper: #A67959;
}
```

## Development Setup

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/j-east/iframe-portfolio.git
cd iframe-portfolio
```

2. Open `index.html` in your browser or serve with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. For iframe testing, open `iframe-test.html` to see various embedding scenarios.

### File Structure

```
iframe-portfolio/
├── index.html                    # Main portfolio component
├── styles.css                    # Analog tech styling and animations
├── script.js                     # Interactive functionality
├── xml-parser.js                 # XML data processing
├── iframe-test.html              # Testing page for iframe integration
├── portfolio-schema.xsd          # XML schema validation
├── portfolio-template/
│   ├── portfolio-data.xml        # Main content data (edit this!)
│   └── assets/
│       └── images/
│           └── gallery/          # Project images
│               ├── *.webp        # Optimized images
│               └── thumbnails/   # Auto-generated thumbnails
├── README.md                     # This documentation
├── LICENSE                       # GPL-2.0 License
└── .gitignore                    # Git ignore rules
```

## GitHub Pages Deployment

### Automatic Deployment

1. Push your code to the `main` branch
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → `main` → `/ (root)`
4. Your portfolio will be available at: `https://j-east.github.io/iframe-portfolio/`

### Branch Strategy

- **`main`**: Library/component code (this repository)
- **`portfolio-gh-pages`**: Example implementation with real content

### Custom Domain (Optional)

1. Add a `CNAME` file with your domain:
```
portfolio.yourdomain.com
```

2. Configure DNS with your domain provider:
```
Type: CNAME
Name: portfolio
Value: j-east.github.io
```

## Integration Examples

### WordPress

```html
<!-- In a WordPress post/page -->
<div style="text-align: center; margin: 20px 0;">
    <iframe
        src="https://j-east.github.io/iframe-portfolio/"
        width="800"
        height="600"
        frameborder="0"
        style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
    </iframe>
</div>
```

### React Component

```jsx
import React from 'react';

const PortfolioEmbed = ({ width = 800, height = 600 }) => {
    return (
        <div className="portfolio-embed">
            <iframe
                src="https://j-east.github.io/iframe-portfolio/"
                width={width}
                height={height}
                frameBorder="0"
                title="Interactive Portfolio"
                style={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    maxWidth: '100%'
                }}
            />
        </div>
    );
};

export default PortfolioEmbed;
```

### Vue Component

```vue
<template>
    <div class="portfolio-embed">
        <iframe
            :src="portfolioUrl"
            :width="width"
            :height="height"
            frameborder="0"
            title="Interactive Portfolio"
            class="portfolio-iframe"
        />
    </div>
</template>

<script>
export default {
    name: 'PortfolioEmbed',
    props: {
        width: { type: Number, default: 800 },
        height: { type: Number, default: 600 },
        portfolioUrl: {
            type: String,
            default: 'https://j-east.github.io/iframe-portfolio/'
        }
    }
}
</script>

<style scoped>
.portfolio-iframe {
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    max-width: 100%;
}
</style>
```

## Browser Compatibility

- **Chrome**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅
- **Edge**: Full support ✅
- **Mobile Browsers**: Responsive support ✅

## Performance

The portfolio is designed as a static component that loads efficiently:

- **Static Content**: Loads when it loads - no complex loading states or spinners
- **Optimized Images**: WebP format with responsive thumbnails
- **Minimal Dependencies**: Pure HTML, CSS, and JavaScript
- **Smooth Animations**: Hardware-accelerated CSS animations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the GPL-2.0 License - see the [LICENSE](LICENSE) file for details.

## Design Credits

Inspired by vintage analog computing aesthetics, nixie tubes, oscilloscopes, and retro terminal interfaces. Color palette designed for warm, nostalgic tech vibes while maintaining modern accessibility standards.

## Support

- **Issues**: [GitHub Issues](https://github.com/j-east/iframe-portfolio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/j-east/iframe-portfolio/discussions)


---

Made with ❤️ and lots of ☕ for the developer community.
