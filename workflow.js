// Portfolio Workflow Manager JavaScript
// Handles image processing, Claude API integration, and XML management

class WorkflowManager {
    constructor() {
        this.imageFiles = [];
        this.convertedImages = [];
        this.xmlData = null;
        this.claudeApiKey = null;
        this.imageClassifications = [];
        
        this.initializeEventListeners();
        this.loadStoredData();
    }

    initializeEventListeners() {
        // Image drop zone
        const imageDropZone = document.getElementById('imageDropZone');
        const imageFileInput = document.getElementById('imageFileInput');
        
        imageDropZone.addEventListener('click', () => imageFileInput.click());
        imageDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        imageDropZone.addEventListener('drop', this.handleImageDrop.bind(this));
        imageFileInput.addEventListener('change', this.handleImageFileSelect.bind(this));

        // XML drop zone
        const xmlDropZone = document.getElementById('xmlDropZone');
        const xmlFileInput = document.getElementById('xmlFileInput');
        
        xmlDropZone.addEventListener('click', () => xmlFileInput.click());
        xmlDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        xmlDropZone.addEventListener('drop', this.handleXmlDrop.bind(this));
        xmlFileInput.addEventListener('change', this.handleXmlFileSelect.bind(this));

        // Button event listeners
        document.getElementById('convertImagesBtn').addEventListener('click', this.convertImages.bind(this));
        document.getElementById('downloadImagesBtn').addEventListener('click', this.downloadConvertedImages.bind(this));
        document.getElementById('saveApiKeyBtn').addEventListener('click', this.saveApiKey.bind(this));
        document.getElementById('testApiKeyBtn').addEventListener('click', this.testApiKey.bind(this));
        document.getElementById('loadXmlBtn').addEventListener('click', this.loadXmlFromStorage.bind(this));
        document.getElementById('downloadXmlBtn').addEventListener('click', this.downloadXml.bind(this));
        document.getElementById('classifyImagesBtn').addEventListener('click', this.classifyImages.bind(this));
        document.getElementById('updateXmlBtn').addEventListener('click', this.updateXmlWithClassifications.bind(this));

        // API key input listener
        document.getElementById('claudeApiKey').addEventListener('input', this.handleApiKeyInput.bind(this));
    }

    loadStoredData() {
        // Load stored API key
        const storedApiKey = localStorage.getItem('claudeApiKey');
        if (storedApiKey) {
            document.getElementById('claudeApiKey').value = storedApiKey;
            this.claudeApiKey = storedApiKey;
            document.getElementById('testApiKeyBtn').disabled = false;
            this.showStatus('apiStatus', 'API key loaded from storage', 'success');
        }

        // Load stored XML
        const storedXml = localStorage.getItem('portfolioXml');
        if (storedXml) {
            this.xmlData = storedXml;
            this.displayXmlPreview(storedXml);
            document.getElementById('downloadXmlBtn').disabled = false;
            this.updateClassifyButton();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleImageDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        this.addImageFiles(files);
    }

    handleImageFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addImageFiles(files);
    }

    handleXmlDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.name.endsWith('.xml'));
        if (files.length > 0) {
            this.loadXmlFile(files[0]);
        }
    }

    handleXmlFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.loadXmlFile(files[0]);
        }
    }

    addImageFiles(files) {
        files.forEach(file => {
            if (!this.imageFiles.find(f => f.name === file.name && f.size === file.size)) {
                this.imageFiles.push(file);
            }
        });
        this.displayImageFiles();
        this.updateConvertButton();
    }

    displayImageFiles() {
        const fileList = document.getElementById('imageFileList');
        fileList.innerHTML = '';

        this.imageFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-details">${this.formatFileSize(file.size)} • ${file.type}</div>
                </div>
                <div class="file-actions">
                    <button class="btn" onclick="workflowManager.removeImageFile(${index})">Remove</button>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        });
    }

    removeImageFile(index) {
        this.imageFiles.splice(index, 1);
        this.displayImageFiles();
        this.updateConvertButton();
    }

    updateConvertButton() {
        const convertBtn = document.getElementById('convertImagesBtn');
        convertBtn.disabled = this.imageFiles.length === 0;
    }

    async convertImages() {
        const convertBtn = document.getElementById('convertImagesBtn');
        const btnText = convertBtn.querySelector('.btn-text');
        const spinner = convertBtn.querySelector('.spinner');
        
        convertBtn.disabled = true;
        btnText.textContent = 'Converting...';
        spinner.classList.remove('hidden');

        try {
            this.convertedImages = [];
            const totalFiles = this.imageFiles.length;
            
            for (let i = 0; i < totalFiles; i++) {
                const file = this.imageFiles[i];
                this.showStatus('conversionStatus', `Converting ${file.name} (${i + 1}/${totalFiles})...`, 'warning');
                
                const convertedFile = await this.convertImageToWebP(file);
                this.convertedImages.push(convertedFile);
                
                // Update progress
                const progress = ((i + 1) / totalFiles) * 100;
                this.updateProgress('conversionStatus', progress);
            }

            this.showStatus('conversionStatus', `Successfully converted ${totalFiles} images to WebP format`, 'success');
            document.getElementById('downloadImagesBtn').disabled = false;
            this.updateClassifyButton();

        } catch (error) {
            this.showStatus('conversionStatus', `Error converting images: ${error.message}`, 'error');
        } finally {
            convertBtn.disabled = false;
            btnText.textContent = 'Convert to WebP';
            spinner.classList.add('hidden');
        }
    }

    async convertImageToWebP(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Set target dimensions (matching Python script defaults)
                const targetWidth = 1000;
                const targetHeight = 1000;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Calculate scaling and cropping for center crop
                const imgAspect = img.width / img.height;
                const targetAspect = targetWidth / targetHeight;
                
                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                
                if (imgAspect > targetAspect) {
                    // Image is wider - fit by height
                    drawHeight = targetHeight;
                    drawWidth = drawHeight * imgAspect;
                    offsetX = (targetWidth - drawWidth) / 2;
                } else {
                    // Image is taller - fit by width
                    drawWidth = targetWidth;
                    drawHeight = drawWidth / imgAspect;
                    offsetY = (targetHeight - drawHeight) / 2;
                }
                
                // Draw the image
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                // Convert to WebP
                canvas.toBlob((blob) => {
                    if (blob) {
                        const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
                        const webpFile = new File([blob], fileName, { type: 'image/webp' });
                        resolve(webpFile);
                    } else {
                        reject(new Error('Failed to convert image to WebP'));
                    }
                }, 'image/webp', 0.85);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    async downloadConvertedImages() {
        if (this.convertedImages.length === 0) return;

        // Create a zip file using JSZip (we'll need to include this library)
        // For now, download individual files
        for (const file of this.convertedImages) {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        this.showStatus('conversionStatus', 'Downloaded all converted images', 'success');
    }

    handleApiKeyInput(e) {
        const apiKey = e.target.value.trim();
        document.getElementById('testApiKeyBtn').disabled = !apiKey;
    }

    saveApiKey() {
        const apiKey = document.getElementById('claudeApiKey').value.trim();
        if (!apiKey) {
            this.showStatus('apiStatus', 'Please enter an API key', 'error');
            return;
        }

        localStorage.setItem('claudeApiKey', apiKey);
        this.claudeApiKey = apiKey;
        document.getElementById('testApiKeyBtn').disabled = false;
        this.showStatus('apiStatus', 'API key saved successfully', 'success');
        this.updateClassifyButton();
    }

    async testApiKey() {
        const testBtn = document.getElementById('testApiKeyBtn');
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hello' }]
                })
            });

            if (response.ok) {
                this.showStatus('apiStatus', 'API key is valid and working', 'success');
            } else {
                const error = await response.json();
                this.showStatus('apiStatus', `API key test failed: ${error.error?.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            this.showStatus('apiStatus', `API key test failed: ${error.message}`, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = 'Test Connection';
        }
    }

    async loadXmlFile(file) {
        try {
            const text = await file.text();
            this.xmlData = text;
            localStorage.setItem('portfolioXml', text);
            this.displayXmlPreview(text);
            document.getElementById('downloadXmlBtn').disabled = false;
            this.showStatus('xmlStatus', 'XML file loaded successfully', 'success');
            this.updateClassifyButton();
        } catch (error) {
            this.showStatus('xmlStatus', `Error loading XML file: ${error.message}`, 'error');
        }
    }

    loadXmlFromStorage() {
        const storedXml = localStorage.getItem('portfolioXml');
        if (storedXml) {
            this.xmlData = storedXml;
            this.displayXmlPreview(storedXml);
            document.getElementById('downloadXmlBtn').disabled = false;
            this.showStatus('xmlStatus', 'XML loaded from browser storage', 'success');
            this.updateClassifyButton();
        } else {
            this.showStatus('xmlStatus', 'No XML found in browser storage', 'warning');
        }
    }

    displayXmlPreview(xmlText) {
        const preview = document.getElementById('xmlPreview');
        // Format XML for display (basic formatting)
        const formatted = this.formatXml(xmlText);
        preview.textContent = formatted.substring(0, 2000) + (formatted.length > 2000 ? '\n...' : '');
    }

    formatXml(xml) {
        const PADDING = ' '.repeat(2);
        const reg = /(>)(<)(\/*)/g;
        let formatted = xml.replace(reg, '$1\r\n$2$3');
        let pad = 0;
        
        return formatted.split('\r\n').map(line => {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (line.match(/^<\/\w/) && pad > 0) {
                pad -= 1;
            } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }
            
            const padding = PADDING.repeat(pad);
            pad += indent;
            return padding + line;
        }).join('\n');
    }

    downloadXml() {
        if (!this.xmlData) return;

        const blob = new Blob([this.xmlData], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-data.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('xmlStatus', 'XML file downloaded', 'success');
    }

    updateClassifyButton() {
        const classifyBtn = document.getElementById('classifyImagesBtn');
        const hasImages = this.convertedImages.length > 0;
        const hasApiKey = !!this.claudeApiKey;
        const hasXml = !!this.xmlData;
        
        classifyBtn.disabled = !(hasImages && hasApiKey && hasXml);
    }

    async classifyImages() {
        const classifyBtn = document.getElementById('classifyImagesBtn');
        const btnText = classifyBtn.querySelector('.btn-text');
        const spinner = classifyBtn.querySelector('.spinner');
        
        classifyBtn.disabled = true;
        btnText.textContent = 'Classifying...';
        spinner.classList.remove('hidden');

        try {
            this.imageClassifications = [];
            const totalImages = this.convertedImages.length;

            for (let i = 0; i < totalImages; i++) {
                const image = this.convertedImages[i];
                this.showStatus('xmlStatus', `Classifying ${image.name} (${i + 1}/${totalImages})...`, 'warning');
                
                const classification = await this.classifyImageWithClaude(image);
                this.imageClassifications.push({
                    filename: image.name,
                    ...classification
                });
            }

            this.showStatus('xmlStatus', `Successfully classified ${totalImages} images`, 'success');
            document.getElementById('updateXmlBtn').disabled = false;

        } catch (error) {
            this.showStatus('xmlStatus', `Error classifying images: ${error.message}`, 'error');
        } finally {
            classifyBtn.disabled = false;
            btnText.textContent = 'Classify Images with Claude';
            spinner.classList.add('hidden');
        }
    }

    async classifyImageWithClaude(imageFile) {
        // Convert image to base64
        const base64 = await this.fileToBase64(imageFile);
        
        const prompt = `Analyze this image and provide classification information for a portfolio website. 
        Please respond with a JSON object containing:
        - category: main category (e.g., "hardware", "software", "artwork", "electronics")
        - subcategory: more specific category
        - title: descriptive title for the image
        - description: brief description of what's shown
        - tags: array of relevant tags
        - featured: boolean indicating if this should be a featured image
        
        Focus on technical and creative aspects that would be relevant for a portfolio showcase.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { 
                            type: 'image', 
                            source: {
                                type: 'base64',
                                media_type: imageFile.type,
                                data: base64
                            }
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        const content = result.content[0].text;
        
        try {
            return JSON.parse(content);
        } catch (e) {
            // If JSON parsing fails, extract information manually
            return {
                category: 'uncategorized',
                subcategory: 'general',
                title: imageFile.name.replace('.webp', ''),
                description: content.substring(0, 200),
                tags: ['portfolio'],
                featured: false
            };
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    updateXmlWithClassifications() {
        if (!this.xmlData || this.imageClassifications.length === 0) return;

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.xmlData, 'text/xml');
            
            // Find or create gallery section
            let gallerySection = xmlDoc.querySelector('gallery');
            if (!gallerySection) {
                gallerySection = xmlDoc.createElement('gallery');
                xmlDoc.documentElement.appendChild(gallerySection);
            }

            // Add classified images to gallery
            this.imageClassifications.forEach(classification => {
                const imageElement = xmlDoc.createElement('image');
                imageElement.setAttribute('filename', classification.filename);
                imageElement.setAttribute('category', classification.category);
                imageElement.setAttribute('subcategory', classification.subcategory);
                imageElement.setAttribute('featured', classification.featured.toString());
                
                const titleElement = xmlDoc.createElement('title');
                titleElement.textContent = classification.title;
                imageElement.appendChild(titleElement);
                
                const descElement = xmlDoc.createElement('description');
                descElement.textContent = classification.description;
                imageElement.appendChild(descElement);
                
                const tagsElement = xmlDoc.createElement('tags');
                tagsElement.textContent = classification.tags.join(', ');
                imageElement.appendChild(tagsElement);
                
                gallerySection.appendChild(imageElement);
            });

            // Serialize back to string
            const serializer = new XMLSerializer();
            this.xmlData = serializer.serializeToString(xmlDoc);
            
            // Save to storage and update display
            localStorage.setItem('portfolioXml', this.xmlData);
            this.displayXmlPreview(this.xmlData);
            
            this.showStatus('xmlStatus', `Updated XML with ${this.imageClassifications.length} image classifications`, 'success');
            
        } catch (error) {
            this.showStatus('xmlStatus', `Error updating XML: ${error.message}`, 'error');
        }
    }

    showStatus(elementId, message, type) {
        const statusElement = document.getElementById(elementId);
        statusElement.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    }

    updateProgress(elementId, percentage) {
        const statusElement = document.getElementById(elementId);
        const progressHtml = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        statusElement.innerHTML = progressHtml;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the workflow manager when the page loads
let workflowManager;
document.addEventListener('DOMContentLoaded', () => {
    workflowManager = new WorkflowManager();
});