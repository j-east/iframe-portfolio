// Portfolio Workflow Manager JavaScript - Manual Classification Version
// Handles image processing and manual classification with XML management

class ManualWorkflowManager {
    constructor() {
        this.imageFiles = [];
        this.convertedImages = [];
        this.xmlData = null;
        this.imageClassifications = [];
        this.currentClassificationIndex = 0;
        
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
        document.getElementById('classifyImagesBtn').addEventListener('click', this.startManualClassification.bind(this));
        document.getElementById('loadXmlBtn').addEventListener('click', this.loadXmlFromStorage.bind(this));
        document.getElementById('downloadXmlBtn').addEventListener('click', this.downloadXml.bind(this));
        document.getElementById('updateXmlBtn').addEventListener('click', this.updateXmlWithClassifications.bind(this));
        document.getElementById('previewXmlBtn').addEventListener('click', this.previewXmlChanges.bind(this));

        // Modal event listeners
        document.getElementById('closeModalBtn').addEventListener('click', this.closeClassificationModal.bind(this));
        document.getElementById('skipImageBtn').addEventListener('click', this.skipCurrentImage.bind(this));
        document.getElementById('saveClassificationBtn').addEventListener('click', this.saveCurrentClassification.bind(this));
        document.getElementById('finishClassificationBtn').addEventListener('click', this.finishClassification.bind(this));

        // Category change listener for subcategory suggestions
        document.getElementById('imageCategory').addEventListener('change', this.updateSubcategorySuggestions.bind(this));
    }

    loadStoredData() {
        // Load stored XML
        const storedXml = localStorage.getItem('portfolioXml');
        if (storedXml) {
            this.xmlData = storedXml;
            this.displayXmlPreview(storedXml);
            document.getElementById('downloadXmlBtn').disabled = false;
            document.getElementById('previewXmlBtn').disabled = false;
            this.updateClassifyButton();
        }

        // Load stored classifications
        const storedClassifications = localStorage.getItem('imageClassifications');
        if (storedClassifications) {
            this.imageClassifications = JSON.parse(storedClassifications);
            this.updateButtons();
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
                    <button class="btn" onclick="manualWorkflowManager.removeImageFile(${index})">Remove</button>
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
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            this.convertedImages = [];
            const totalFiles = this.imageFiles.length;
            
            for (let i = 0; i < totalFiles; i++) {
                const file = this.imageFiles[i];
                this.showStatus('conversionStatus', `Converting ${file.name} (${i + 1}/${totalFiles})...`, 'warning');
                
                const convertedFile = await this.convertImageToWebP(file);
                this.convertedImages.push(convertedFile);
            }

            this.showStatus('conversionStatus', `Successfully converted ${totalFiles} images to WebP format`, 'success');
            document.getElementById('downloadImagesBtn').disabled = false;
            this.updateClassifyButton();

        } catch (error) {
            this.showStatus('conversionStatus', `Error converting images: ${error.message}`, 'error');
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to WebP';
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

    updateClassifyButton() {
        const classifyBtn = document.getElementById('classifyImagesBtn');
        const hasImages = this.convertedImages.length > 0;
        const hasXml = !!this.xmlData;
        
        classifyBtn.disabled = !(hasImages && hasXml);
    }

    startManualClassification() {
        if (this.convertedImages.length === 0) {
            this.showStatus('classificationStatus', 'No converted images to classify', 'error');
            return;
        }

        this.currentClassificationIndex = 0;
        this.imageClassifications = [];
        this.showClassificationModal();
    }

    showClassificationModal() {
        const modal = document.getElementById('classificationModal');
        const currentImage = this.convertedImages[this.currentClassificationIndex];
        
        // Update progress indicator
        const progressIndicator = document.getElementById('progressIndicator');
        progressIndicator.textContent = `Image ${this.currentClassificationIndex + 1} of ${this.convertedImages.length}`;
        
        // Show image preview
        const previewImage = document.getElementById('previewImage');
        previewImage.src = URL.createObjectURL(currentImage);
        previewImage.alt = currentImage.name;
        
        // Pre-fill title with filename (without extension)
        const titleInput = document.getElementById('imageTitle');
        titleInput.value = currentImage.name.replace('.webp', '').replace(/[-_]/g, ' ');
        
        // Clear other fields
        document.getElementById('imageCategory').value = '';
        document.getElementById('imageSubcategory').value = '';
        document.getElementById('imageDescription').value = '';
        document.getElementById('imageTags').value = '';
        document.getElementById('imageFeatured').checked = false;
        
        // Show/hide finish button
        const saveBtn = document.getElementById('saveClassificationBtn');
        const finishBtn = document.getElementById('finishClassificationBtn');
        
        if (this.currentClassificationIndex === this.convertedImages.length - 1) {
            saveBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            saveBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
        
        modal.classList.remove('hidden');
    }

    closeClassificationModal() {
        const modal = document.getElementById('classificationModal');
        modal.classList.add('hidden');
        
        // Clean up image URL
        const previewImage = document.getElementById('previewImage');
        if (previewImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage.src);
        }
    }

    skipCurrentImage() {
        this.currentClassificationIndex++;
        
        if (this.currentClassificationIndex >= this.convertedImages.length) {
            this.finishClassification();
        } else {
            this.showClassificationModal();
        }
    }

    saveCurrentClassification() {
        const classification = this.getCurrentClassificationData();
        
        if (!classification.title.trim()) {
            alert('Please enter a title for the image');
            return;
        }
        
        this.imageClassifications.push(classification);
        localStorage.setItem('imageClassifications', JSON.stringify(this.imageClassifications));
        
        this.currentClassificationIndex++;
        
        if (this.currentClassificationIndex >= this.convertedImages.length) {
            this.finishClassification();
        } else {
            this.showClassificationModal();
        }
    }

    finishClassification() {
        const classification = this.getCurrentClassificationData();
        
        if (classification.title.trim()) {
            this.imageClassifications.push(classification);
            localStorage.setItem('imageClassifications', JSON.stringify(this.imageClassifications));
        }
        
        this.closeClassificationModal();
        
        this.showStatus('classificationStatus', 
            `Successfully classified ${this.imageClassifications.length} images`, 'success');
        
        document.getElementById('updateXmlBtn').disabled = false;
        document.getElementById('previewXmlBtn').disabled = false;
    }

    getCurrentClassificationData() {
        const currentImage = this.convertedImages[this.currentClassificationIndex];
        
        return {
            filename: currentImage.name,
            title: document.getElementById('imageTitle').value.trim(),
            category: document.getElementById('imageCategory').value,
            subcategory: document.getElementById('imageSubcategory').value.trim(),
            description: document.getElementById('imageDescription').value.trim(),
            tags: document.getElementById('imageTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            featured: document.getElementById('imageFeatured').checked
        };
    }

    updateSubcategorySuggestions() {
        const category = document.getElementById('imageCategory').value;
        const subcategoryInput = document.getElementById('imageSubcategory');
        
        const suggestions = {
            hardware: 'pcb, enclosure, connector, sensor, actuator',
            software: 'web-app, mobile-app, desktop-app, api, library',
            artwork: 'painting, sculpture, digital-art, woodworking, metalwork',
            electronics: 'circuit, amplifier, power-supply, microcontroller, embedded',
            manufacturing: 'assembly, testing, quality-control, production, tooling',
            design: '3d-model, cad, prototype, concept, rendering'
        };
        
        if (suggestions[category]) {
            subcategoryInput.placeholder = `e.g., ${suggestions[category]}`;
        } else {
            subcategoryInput.placeholder = 'More specific category';
        }
    }

    async loadXmlFile(file) {
        try {
            const text = await file.text();
            this.xmlData = text;
            localStorage.setItem('portfolioXml', text);
            this.displayXmlPreview(text);
            document.getElementById('downloadXmlBtn').disabled = false;
            document.getElementById('previewXmlBtn').disabled = false;
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
            document.getElementById('previewXmlBtn').disabled = false;
            this.showStatus('xmlStatus', 'XML loaded from browser storage', 'success');
            this.updateClassifyButton();
        } else {
            this.showStatus('xmlStatus', 'No XML found in browser storage', 'warning');
        }
    }

    displayXmlPreview(xmlText) {
        const preview = document.getElementById('xmlPreview');
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

    previewXmlChanges() {
        if (!this.xmlData || this.imageClassifications.length === 0) {
            this.showStatus('xmlStatus', 'No classifications to preview', 'warning');
            return;
        }

        const updatedXml = this.generateUpdatedXml();
        this.displayXmlPreview(updatedXml);
        this.showStatus('xmlStatus', 'Showing preview of XML with classifications', 'success');
    }

    updateXmlWithClassifications() {
        if (!this.xmlData || this.imageClassifications.length === 0) {
            this.showStatus('xmlStatus', 'No classifications to update XML with', 'error');
            return;
        }

        try {
            this.xmlData = this.generateUpdatedXml();
            
            // Save to storage and update display
            localStorage.setItem('portfolioXml', this.xmlData);
            this.displayXmlPreview(this.xmlData);
            
            this.showStatus('xmlStatus', 
                `Updated XML with ${this.imageClassifications.length} image classifications`, 'success');
            
        } catch (error) {
            this.showStatus('xmlStatus', `Error updating XML: ${error.message}`, 'error');
        }
    }

    generateUpdatedXml() {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(this.xmlData, 'text/xml');
        
        // Find or create gallery section
        let gallerySection = xmlDoc.querySelector('gallery');
        if (!gallerySection) {
            gallerySection = xmlDoc.createElement('gallery');
            xmlDoc.documentElement.appendChild(gallerySection);
        }

        // Clear existing images in gallery (optional - you might want to keep them)
        // gallerySection.innerHTML = '';

        // Add classified images to gallery
        this.imageClassifications.forEach(classification => {
            const imageElement = xmlDoc.createElement('image');
            imageElement.setAttribute('filename', classification.filename);
            imageElement.setAttribute('category', classification.category || 'uncategorized');
            imageElement.setAttribute('subcategory', classification.subcategory || 'general');
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
        return serializer.serializeToString(xmlDoc);
    }

    updateButtons() {
        if (this.imageClassifications.length > 0) {
            document.getElementById('updateXmlBtn').disabled = false;
            document.getElementById('previewXmlBtn').disabled = false;
        }
    }

    showStatus(elementId, message, type) {
        const statusElement = document.getElementById(elementId);
        statusElement.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Global function for tag suggestions
function addTag(tag) {
    const tagsInput = document.getElementById('imageTags');
    const currentTags = tagsInput.value.trim();
    
    if (currentTags) {
        tagsInput.value = currentTags + ', ' + tag;
    } else {
        tagsInput.value = tag;
    }
}

// Initialize the workflow manager when the page loads
let manualWorkflowManager;
document.addEventListener('DOMContentLoaded', () => {
    manualWorkflowManager = new ManualWorkflowManager();
});