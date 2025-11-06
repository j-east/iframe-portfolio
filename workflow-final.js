// Complete Serverless Portfolio Workflow Manager
// Replicates the Python convert_images.py functionality in the browser
// Plus OpenRouter AI classification and XML management

// Step enum
const WorkflowStep = {
    API_KEY: 1,
    BUILD_XML: 2,
    PROCESS_IMAGES: 3,
    FINALIZE_XML: 4
};

class ServerlessWorkflowManager {
    constructor() {
        this.imageFiles = [];
        this.convertedImages = [];
        this.thumbnails = [];
        this.xmlData = null;
        this.openrouterApiKey = null;
        this.imageClassifications = [];
        this.currentClassificationIndex = 0;
        this.currentStep = WorkflowStep.API_KEY;
        this.chatHistory = [];
        
        // Conversion settings (matching Python script defaults)
        this.targetSize = { width: 1000, height: 1000 };
        this.thumbSize = { width: 200, height: 200 };
        this.quality = 0.85;
        this.generateThumbnails = true;
        
        this.initializeEventListeners();
        this.loadStoredData();
        this.updateSliderValues();
    }

    initializeEventListeners() {
        // Step navigation buttons
        document.getElementById('nextToStep2Btn').addEventListener('click', () => this.proceedToStep2());
        document.getElementById('nextToStep3Btn').addEventListener('click', () => this.goToStep(WorkflowStep.PROCESS_IMAGES));
        document.getElementById('nextToStep4Btn').addEventListener('click', () => this.goToStep(WorkflowStep.FINALIZE_XML));
        document.getElementById('backToStep1Btn').addEventListener('click', () => this.goToStep(WorkflowStep.API_KEY));
        document.getElementById('backToStep2Btn').addEventListener('click', () => this.goToStep(WorkflowStep.BUILD_XML));
        document.getElementById('backToStep3Btn').addEventListener('click', () => this.goToStep(WorkflowStep.PROCESS_IMAGES));

        // Image drop zone
        const imageDropZone = document.getElementById('imageDropZone');
        const imageFileInput = document.getElementById('imageFileInput');
        
        imageDropZone.addEventListener('click', () => imageFileInput.click());
        imageDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        imageDropZone.addEventListener('drop', this.handleImageDrop.bind(this));
        imageFileInput.addEventListener('change', this.handleImageFileSelect.bind(this));

        // XML file upload
        const xmlFileInput = document.getElementById('xmlFileInput');
        const xmlUploadBtn = document.getElementById('xmlUploadBtn');
        if (xmlUploadBtn) {
            xmlUploadBtn.addEventListener('click', () => xmlFileInput.click());
        }
        if (xmlFileInput) {
            xmlFileInput.addEventListener('change', this.handleXmlFileSelect.bind(this));
        }

        // Chat functionality
        document.getElementById('sendChatBtn').addEventListener('click', this.sendChatMessage.bind(this));
        // Note: Removed Enter key submit since chatInput is now a textarea for multiline input
        document.getElementById('createNewXmlBtn').addEventListener('click', this.createNewXml.bind(this));

        // Slider controls
        document.getElementById('widthSlider').addEventListener('input', this.updateSliderValues.bind(this));
        document.getElementById('heightSlider').addEventListener('input', this.updateSliderValues.bind(this));
        document.getElementById('qualitySlider').addEventListener('input', this.updateSliderValues.bind(this));
        document.getElementById('generateThumbnails').addEventListener('change', this.updateSliderValues.bind(this));

        // Button event listeners
        document.getElementById('convertImagesBtn').addEventListener('click', this.convertImages.bind(this));
        document.getElementById('downloadImagesBtn').addEventListener('click', this.downloadAllImages.bind(this));
        document.getElementById('saveApiKeyBtn').addEventListener('click', this.saveApiKey.bind(this));
        document.getElementById('testApiKeyBtn').addEventListener('click', this.testApiKey.bind(this));
        document.getElementById('classifyImagesBtn').addEventListener('click', this.classifyImages.bind(this));
        document.getElementById('manualClassifyBtn').addEventListener('click', this.startManualClassification.bind(this));
        document.getElementById('loadXmlBtn').addEventListener('click', this.loadXmlFromStorage.bind(this));
        document.getElementById('downloadXmlBtn').addEventListener('click', this.downloadXml.bind(this));
        document.getElementById('updateXmlBtn').addEventListener('click', this.updateXmlWithClassifications.bind(this));
        document.getElementById('previewXmlBtn').addEventListener('click', this.previewXmlChanges.bind(this));
        document.getElementById('resetClassificationsBtn').addEventListener('click', this.resetClassifications.bind(this));
        document.getElementById('downloadPackageBtn').addEventListener('click', this.downloadCompletePackage.bind(this));
        document.getElementById('downloadFinalXmlBtn').addEventListener('click', this.downloadXml.bind(this));

        // API key input listener
        document.getElementById('openrouterApiKey').addEventListener('input', this.handleApiKeyInput.bind(this));
    }

    async proceedToStep2() {
        const nextBtn = document.getElementById('nextToStep2Btn');
        const originalText = nextBtn.textContent;
        
        nextBtn.disabled = true;
        nextBtn.textContent = 'Testing API Key...';
        
        try {
            const model = document.getElementById('aiModel').value;
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Portfolio Workflow Manager'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Hello! Just testing the connection.' }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                this.showStatus('apiStatus', 'API key verified! ✓ Proceeding to XML builder...', 'success');
                setTimeout(() => this.goToStep(WorkflowStep.BUILD_XML), 500);
            } else {
                const error = await response.json();
                this.showStatus('apiStatus', `API test failed: ${error.error?.message || 'Unknown error'}. Please check your key.`, 'error');
                nextBtn.disabled = false;
                nextBtn.textContent = originalText;
            }
        } catch (error) {
            this.showStatus('apiStatus', `API test failed: ${error.message}. Please check your key.`, 'error');
            nextBtn.disabled = false;
            nextBtn.textContent = originalText;
        }
    }

    goToStep(step) {
        // Hide all step contents
        document.querySelectorAll('.step-content').forEach(el => el.style.display = 'none');
        
        // Show the target step
        document.getElementById(`step${step}`).style.display = 'block';
        
        // Update step indicators
        document.querySelectorAll('.step').forEach(el => {
            const stepNum = parseInt(el.dataset.step);
            el.classList.remove('active', 'completed');
            if (stepNum === step) {
                el.classList.add('active');
            } else if (stepNum < step) {
                el.classList.add('completed');
            }
        });
        
        this.currentStep = step;
        
        // Auto-load XML from storage when entering step 2
        if (step === WorkflowStep.BUILD_XML && !this.xmlData) {
            this.loadXmlFromStorage();
        }
        
        // Update UI based on current step
        if (step === WorkflowStep.FINALIZE_XML) {
            this.updateFinalizationView();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateSliderValues() {
        // Update display values
        const width = document.getElementById('widthSlider').value;
        const height = document.getElementById('heightSlider').value;
        const quality = document.getElementById('qualitySlider').value;
        
        document.getElementById('widthValue').textContent = width;
        document.getElementById('heightValue').textContent = height;
        document.getElementById('qualityValue').textContent = quality;
        
        // Update internal settings
        this.targetSize = { width: parseInt(width), height: parseInt(height) };
        this.quality = parseInt(quality) / 100;
        this.generateThumbnails = document.getElementById('generateThumbnails').checked;
    }

    loadStoredData() {
        // Load stored API key
        const storedApiKey = localStorage.getItem('openrouterApiKey');
        if (storedApiKey) {
            document.getElementById('openrouterApiKey').value = storedApiKey;
            this.openrouterApiKey = storedApiKey;
            document.getElementById('testApiKeyBtn').disabled = false;
            this.showStatus('apiStatus', 'API key loaded from storage', 'success');
        }

        // Load stored XML
        const storedXml = localStorage.getItem('portfolioXml');
        if (storedXml) {
            this.xmlData = storedXml;
            this.displayXmlPreview(storedXml);
            document.getElementById('downloadXmlBtn').disabled = false;
            document.getElementById('previewXmlBtn').disabled = false;
            this.updateButtons();
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
                    <button class="btn" onclick="serverlessWorkflowManager.removeImageFile(${index})">Remove</button>
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
            this.thumbnails = [];
            const totalFiles = this.imageFiles.length;
            
            for (let i = 0; i < totalFiles; i++) {
                const file = this.imageFiles[i];
                this.showStatus('conversionStatus', `Converting ${file.name} (${i + 1}/${totalFiles})...`, 'warning');
                
                const result = await this.convertImageToWebP(file);
                this.convertedImages.push(result.main);
                
                if (this.generateThumbnails && result.thumbnail) {
                    this.thumbnails.push(result.thumbnail);
                }
                
                // Update progress
                const progress = ((i + 1) / totalFiles) * 100;
                this.updateProgress('conversionStatus', progress);
            }

            const message = this.generateThumbnails 
                ? `Successfully converted ${totalFiles} images to WebP with thumbnails`
                : `Successfully converted ${totalFiles} images to WebP`;
            
            this.showStatus('conversionStatus', message, 'success');
            document.getElementById('downloadImagesBtn').disabled = false;
            this.updateButtons();

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
            const img = new Image();
            
            img.onload = () => {
                try {
                    // Main image conversion (replicating Python smart_crop logic)
                    const mainResult = this.processMainImage(img, file.name);
                    
                    // Thumbnail generation (replicating Python create_thumbnail logic)
                    let thumbnailResult = null;
                    if (this.generateThumbnails) {
                        thumbnailResult = this.createThumbnail(img, file.name);
                    }
                    
                    resolve({
                        main: mainResult,
                        thumbnail: thumbnailResult
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            img.src = URL.createObjectURL(file);
        });
    }

    processMainImage(img, originalName) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set target dimensions
        canvas.width = this.targetSize.width;
        canvas.height = this.targetSize.height;
        
        // Calculate smart crop (matching Python logic)
        const targetAspect = this.targetSize.width / this.targetSize.height;
        const currentAspect = img.width / img.height;
        
        let cropX = 0, cropY = 0, cropWidth = img.width, cropHeight = img.height;
        
        if (Math.abs(currentAspect - targetAspect) > 0.01) {
            if (currentAspect > targetAspect) {
                // Image is wider - crop width (center crop)
                cropWidth = Math.floor(img.height * targetAspect);
                cropX = Math.floor((img.width - cropWidth) / 2);
            } else {
                // Image is taller - crop height (center crop)
                cropHeight = Math.floor(img.width / targetAspect);
                cropY = Math.floor((img.height - cropHeight) / 2);
            }
        }
        
        // Draw the cropped and resized image
        ctx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,  // Source rectangle
            0, 0, this.targetSize.width, this.targetSize.height  // Destination rectangle
        );
        
        // Convert to WebP blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const fileName = originalName.replace(/\.[^/.]+$/, '.webp');
                const webpFile = new File([blob], fileName, { type: 'image/webp' });
                resolve(webpFile);
            }, 'image/webp', this.quality);
        });
    }

    createThumbnail(img, originalName) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set thumbnail dimensions (square)
        canvas.width = this.thumbSize.width;
        canvas.height = this.thumbSize.height;
        
        // Calculate center crop to square (matching Python logic)
        const size = Math.min(img.width, img.height);
        const cropX = Math.floor((img.width - size) / 2);
        const cropY = Math.floor((img.height - size) / 2);
        
        // Draw the square thumbnail
        ctx.drawImage(
            img,
            cropX, cropY, size, size,  // Source square
            0, 0, this.thumbSize.width, this.thumbSize.height  // Destination square
        );
        
        // Convert to WebP blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const fileName = originalName.replace(/\.[^/.]+$/, '.webp');
                const webpFile = new File([blob], fileName, { type: 'image/webp' });
                resolve(webpFile);
            }, 'image/webp', this.quality);
        });
    }

    async downloadAllImages() {
        if (this.convertedImages.length === 0) return;

        // Download main images
        for (const file of this.convertedImages) {
            const resolvedFile = await file; // Handle promise if needed
            this.downloadFile(resolvedFile);
        }

        // Download thumbnails if generated
        if (this.generateThumbnails && this.thumbnails.length > 0) {
            for (const file of this.thumbnails) {
                const resolvedFile = await file; // Handle promise if needed
                const thumbnailName = 'thumb_' + resolvedFile.name;
                const thumbnailFile = new File([resolvedFile], thumbnailName, { type: 'image/webp' });
                this.downloadFile(thumbnailFile);
            }
        }

        this.showStatus('conversionStatus', 'Downloaded all converted images', 'success');
    }

    downloadFile(file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleApiKeyInput(e) {
        const apiKey = e.target.value.trim();
        document.getElementById('testApiKeyBtn').disabled = !apiKey;
        document.getElementById('nextToStep2Btn').disabled = !apiKey;
    }

    saveApiKey() {
        const apiKey = document.getElementById('openrouterApiKey').value.trim();
        if (!apiKey) {
            this.showStatus('apiStatus', 'Please enter an API key', 'error');
            return;
        }

        localStorage.setItem('openrouterApiKey', apiKey);
        this.openrouterApiKey = apiKey;
        document.getElementById('testApiKeyBtn').disabled = false;
        this.showStatus('apiStatus', 'API key saved successfully', 'success');
        this.updateButtons();
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (!this.openrouterApiKey) {
            this.showStatus('xmlStatus', 'Please configure your API key first', 'error');
            return;
        }

        // Add user message to chat
        this.addChatMessage('user', message);
        input.value = '';

        const sendBtn = document.getElementById('sendChatBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Thinking...';

        try {
            const model = document.getElementById('aiModel').value;
            
            // Build conversation context
            const messages = this.chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const systemPrompt = `You are an AI assistant helping to build portfolio XML files. 
The user needs help creating or modifying their portfolio-data.xml file.
Provide clear, actionable advice and XML snippets when appropriate.
Current XML: ${this.xmlData ? 'exists' : 'none yet'}`;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Portfolio Workflow Manager'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages
                    ],
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const result = await response.json();
            const aiResponse = result.choices[0].message.content;
            
            this.addChatMessage('assistant', aiResponse);

        } catch (error) {
            this.showStatus('xmlStatus', `Chat error: ${error.message}`, 'error');
            this.addChatMessage('assistant', `Error: ${error.message}`);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
    }

    addChatMessage(role, content) {
        this.chatHistory.push({ role, content });
        
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        messageDiv.textContent = content;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    createNewXml() {
        const template = `<?xml version="1.0" encoding="UTF-8"?>
<portfolio>
    <metadata>
        <title>My Portfolio</title>
        <author>Your Name</author>
        <description>Portfolio description</description>
    </metadata>
    <gallery>
        <!-- Images will be added here -->
    </gallery>
</portfolio>`;
        
        this.xmlData = template;
        localStorage.setItem('portfolioXml', template);
        this.displayXmlPreview(template);
        this.showStatus('xmlStatus', 'New XML template created', 'success');
        this.updateButtons();
    }

    async testApiKey() {
        const testBtn = document.getElementById('testApiKeyBtn');
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        try {
            const model = document.getElementById('aiModel').value;
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Portfolio Workflow Manager'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Hello! Just testing the connection.' }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                this.showStatus('apiStatus', 'API key is valid and working with OpenRouter! ✓', 'success');
                this.updateButtons();
            } else {
                const error = await response.json();
                this.showStatus('apiStatus', `API test failed: ${error.error?.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            this.showStatus('apiStatus', `API test failed: ${error.message}`, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = 'Test Connection';
        }
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
            const model = document.getElementById('aiModel').value;

            for (let i = 0; i < totalImages; i++) {
                const imageFile = await this.convertedImages[i];
                this.showStatus('classificationStatus', `Classifying ${imageFile.name} (${i + 1}/${totalImages})...`, 'warning');
                
                const classification = await this.classifyImageWithAI(imageFile, model);
                this.imageClassifications.push({
                    filename: imageFile.name,
                    ...classification
                });
                
                // Update preview as we go
                this.updateClassificationPreview();
            }

            localStorage.setItem('imageClassifications', JSON.stringify(this.imageClassifications));
            this.showStatus('classificationStatus', `Successfully classified ${totalImages} images with AI`, 'success');
            this.updateButtons();

        } catch (error) {
            this.showStatus('classificationStatus', `Error classifying images: ${error.message}`, 'error');
        } finally {
            classifyBtn.disabled = false;
            btnText.textContent = 'Classify Images with AI';
            spinner.classList.add('hidden');
        }
    }

    updateClassificationPreview() {
        const previewDiv = document.getElementById('classificationPreview');
        if (this.imageClassifications.length > 0) {
            let previewHtml = '<div style="font-family: monospace; font-size: 0.85em;">';
            
            this.imageClassifications.forEach((classification, index) => {
                previewHtml += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(0,255,0,0.05); border-left: 2px solid #00ff00;">`;
                previewHtml += `<strong>${classification.filename}</strong><br>`;
                previewHtml += `${classification.category} / ${classification.subcategory}<br>`;
                previewHtml += `<em>${classification.title}</em>`;
                previewHtml += `</div>`;
            });
            previewHtml += '</div>';
            previewDiv.innerHTML = previewHtml;
        }
    }

    async classifyImageWithAI(imageFile, model) {
        // Convert image to base64
        const base64 = await this.fileToBase64(imageFile);
        
        const prompt = `Analyze this portfolio image and provide classification information as JSON:

{
  "category": "main category (hardware/software/artwork/electronics/manufacturing/design)",
  "subcategory": "specific subcategory",
  "title": "descriptive title for the image",
  "description": "brief description of what's shown",
  "tags": ["array", "of", "relevant", "tags"],
  "featured": false
}

Focus on technical and creative aspects relevant for a professional portfolio.`;

        const messages = [
            { role: 'user', content: prompt }
        ];

        // Add image for vision models
        if (model.includes('vision') || model.includes('claude')) {
            messages[0].content = [
                { type: 'text', text: prompt },
                { 
                    type: 'image_url', 
                    image_url: { url: `data:${imageFile.type};base64,${base64}` }
                }
            ];
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openrouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Portfolio Workflow Manager'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
        try {
            // Try to parse JSON response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        } catch (e) {
            // Fallback if JSON parsing fails
            return {
                category: 'uncategorized',
                subcategory: 'general',
                title: imageFile.name.replace('.webp', '').replace(/[-_]/g, ' '),
                description: content.substring(0, 200),
                tags: ['portfolio', 'ai-classified'],
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

    startManualClassification() {
        // Implement manual classification modal (similar to previous implementation)
        this.showStatus('apiStatus', 'Manual classification mode - coming soon!', 'warning');
    }

    async loadXmlFile(file) {
        try {
            const text = await file.text();
            this.xmlData = text;
            localStorage.setItem('portfolioXml', text);
            this.displayXmlPreview(text);
            this.updateButtons();
            this.showStatus('xmlStatus', 'XML file loaded successfully', 'success');
        } catch (error) {
            this.showStatus('xmlStatus', `Error loading XML file: ${error.message}`, 'error');
        }
    }

    loadXmlFromStorage() {
        const storedXml = localStorage.getItem('portfolioXml');
        if (storedXml) {
            this.xmlData = storedXml;
            this.displayXmlPreview(storedXml);
            this.updateButtons();
            this.showStatus('xmlStatus', 'XML loaded from browser storage', 'success');
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

        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc);
    }

    resetClassifications() {
        this.imageClassifications = [];
        localStorage.removeItem('imageClassifications');
        this.showStatus('xmlStatus', 'Classifications reset', 'success');
        this.updateButtons();
    }

    downloadCompletePackage() {
        // Create a comprehensive package with all files
        this.showStatus('xmlStatus', 'Package download feature - coming soon!', 'warning');
    }

    updateButtons() {
        const hasImages = this.convertedImages.length > 0;
        const hasApiKey = !!this.openrouterApiKey;
        const hasXml = !!this.xmlData;
        const hasClassifications = this.imageClassifications.length > 0;
        
        // Step 1 buttons - enable if API key is entered (will test on click)
        const apiKeyInput = document.getElementById('openrouterApiKey').value.trim();
        document.getElementById('nextToStep2Btn').disabled = !apiKeyInput;
        
        // Step 2 buttons
        document.getElementById('nextToStep3Btn').disabled = !hasXml;
        
        // Step 3 buttons
        document.getElementById('classifyImagesBtn').disabled = !(hasImages && hasApiKey);
        document.getElementById('manualClassifyBtn').disabled = !hasImages;
        document.getElementById('nextToStep4Btn').disabled = !(hasImages && hasClassifications);
        
        // Step 4 buttons
        document.getElementById('updateXmlBtn').disabled = !(hasXml && hasClassifications);
        document.getElementById('previewXmlBtn').disabled = !(hasXml && hasClassifications);
        document.getElementById('downloadXmlBtn').disabled = !hasXml;
        document.getElementById('downloadFinalXmlBtn').disabled = !hasXml;
        document.getElementById('downloadPackageBtn').disabled = !(hasImages || hasXml);
    }

    updateFinalizationView() {
        // Update classification summary
        const summaryDiv = document.getElementById('classificationSummary');
        if (this.imageClassifications.length > 0) {
            let summaryHtml = '<div style="font-family: monospace;">';
            summaryHtml += `<strong>Total Images Classified: ${this.imageClassifications.length}</strong><br><br>`;
            
            this.imageClassifications.forEach((classification, index) => {
                summaryHtml += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(0,255,0,0.05); border-left: 2px solid #00ff00;">`;
                summaryHtml += `<strong>${index + 1}. ${classification.filename}</strong><br>`;
                summaryHtml += `Category: ${classification.category} / ${classification.subcategory}<br>`;
                summaryHtml += `Title: ${classification.title}<br>`;
                summaryHtml += `Featured: ${classification.featured ? 'Yes' : 'No'}<br>`;
                summaryHtml += `Tags: ${classification.tags.join(', ')}`;
                summaryHtml += `</div>`;
            });
            summaryHtml += '</div>';
            summaryDiv.innerHTML = summaryHtml;
        } else {
            summaryDiv.innerHTML = '<div style="opacity: 0.5; text-align: center;">No classifications yet</div>';
        }

        // Update final XML preview
        if (this.xmlData && this.imageClassifications.length > 0) {
            const updatedXml = this.generateUpdatedXml();
            const finalPreview = document.getElementById('finalXmlPreview');
            const formatted = this.formatXml(updatedXml);
            finalPreview.textContent = formatted.substring(0, 2000) + (formatted.length > 2000 ? '\n...' : '');
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
let serverlessWorkflowManager;
document.addEventListener('DOMContentLoaded', () => {
    serverlessWorkflowManager = new ServerlessWorkflowManager();
});