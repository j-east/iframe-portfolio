// Analog Tech Portfolio - Interactive JavaScript
class PortfolioController {
    constructor() {
        this.oscilloscopeCanvas = null;
        this.oscilloscopeCtx = null;
        this.animationFrame = null;
        this.waveOffset = 0;
        this.projects = [];
        
        this.init();
    }
    
    init() {
        this.setupProjectNavigation();
        this.setupSkillBars();
        this.setupOscilloscope();
        this.setupAmbientEffects();
        this.setupResponsiveHandling();
        this.setupScrollAnimations();
        this.setupBackButtonHandling();
        
        // Initialize animations
        this.triggerSectionAnimation('intro');
        
    }
    
    setupProjectNavigation() {
        // Set up project card click handlers
        document.addEventListener('click', (e) => {
            // Check if click was on thumbnail image
            const thumbnailImage = e.target.closest('.image-thumbnail');
            if (thumbnailImage) {
                e.stopPropagation(); // Prevent project card click
                const projectCard = thumbnailImage.closest('.project-card');
                if (projectCard) {
                    const projectId = projectCard.dataset.projectId;
                    if (projectId && projectId !== 'undefined') {
                        this.openThumbnailImage(projectId);
                    }
                }
                return;
            }
            
            // Handle regular project card clicks
            const projectCard = e.target.closest('.project-card');
            if (projectCard) {
                const projectId = projectCard.dataset.projectId;
                if (projectId && projectId !== 'undefined') {
                    this.navigateToProject(projectId);
                }
            }
        });
    }
    
    openThumbnailImage(projectId) {
        // Get project data and open just the hero/thumbnail image in fullscreen
        if (window.PortfolioXMLParser) {
            const parser = new window.PortfolioXMLParser();
            parser.loadPortfolioData('portfolio-template/portfolio-data.xml')
                .then(() => {
                    const projectData = parser.getProjectDetails(projectId);
                    if (projectData && projectData.images && projectData.images.length > 0) {
                        // Find the best image to show (hero > featured > first available)
                        const heroImage = projectData.images.find(img => img.rank === 'hero');
                        const featuredImage = projectData.images.find(img => img.rank === 'featured');
                        const imageToShow = heroImage || featuredImage || projectData.images[0];
                        
                        this.openFullscreenImage(imageToShow.src, imageToShow.description || projectData.title);
                    }
                })
                .catch(error => {
                    console.error('Error loading project data for thumbnail:', error);
                });
        }
    }
    
    navigateToProject(projectId) {
        // Always show project details as modal overlay for embeddable component
        this.showProjectDetails(projectId);
    }
    
    showProjectDetails(projectId) {
        // Get project data from XML parser if available
        if (window.PortfolioXMLParser) {
            // Create a temporary parser instance to get project data
            const parser = new window.PortfolioXMLParser();
            parser.loadPortfolioData('portfolio-template/portfolio-data.xml')
                .then(() => {
                    const projectData = parser.getProjectDetails(projectId);
                    if (projectData) {
                        this.renderInlineProjectDetails(projectData);
                    } else {
                        this.showProjectNotFoundError(projectId);
                    }
                })
                .catch(error => {
                    console.error('Error loading project data:', error);
                    this.showProjectNotFoundError(projectId);
                });
        } else {
            this.showProjectNotFoundError(projectId);
        }
    }
    
    showProjectNotFoundError(projectId) {
        // Create a simple error overlay
        let overlay = document.getElementById('project-detail-overlay');
        if (!overlay) {
            overlay = this.createProjectDetailOverlay();
        }
        
        overlay.querySelector('.project-detail-title').textContent = 'Project Not Found';
        overlay.querySelector('.project-detail-subtitle').textContent = `Project ID: ${projectId}`;
        overlay.querySelector('.project-detail-content').innerHTML = `
            <div class="project-detail-section">
                <p style="color: var(--medium-gray-text);">
                    The requested project could not be loaded. This might be due to:
                </p>
                <ul style="color: var(--medium-gray-text); margin-left: 20px;">
                    <li>Invalid project ID</li>
                    <li>Missing project data</li>
                    <li>Network connectivity issues</li>
                </ul>
                <p style="color: var(--cathode-cyan); margin-top: 20px;">
                    Please try again or return to the main portfolio.
                </p>
            </div>
        `;
        
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    renderInlineProjectDetails(project) {
        // Create or get project detail overlay
        let overlay = document.getElementById('project-detail-overlay');
        if (!overlay) {
            overlay = this.createProjectDetailOverlay();
        }
        
        // Populate the overlay with project data
        overlay.querySelector('.project-detail-title').textContent = project.title;
        overlay.querySelector('.project-detail-subtitle').textContent = project.subtitle || '';
        overlay.querySelector('.project-detail-description').textContent = project.description || '';
        
        // Show timeframe and category
        const metaInfo = overlay.querySelector('.project-detail-meta');
        metaInfo.innerHTML = `
            <div class="meta-item">
                <span class="meta-label">TIMEFRAME:</span>
                <span class="meta-value">${project.timeframe || 'N/A'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">CATEGORY:</span>
                <span class="meta-value">${project.category || 'N/A'}</span>
            </div>
        `;
        
        // Show image gallery
        this.renderProjectGallery(project, overlay);
        
        // Show highlights
        const highlightsList = overlay.querySelector('.project-detail-highlights');
        if (project.highlights && project.highlights.length > 0) {
            highlightsList.innerHTML = project.highlights.map(highlight =>
                `<li>${highlight.text || highlight}</li>`
            ).join('');
        } else {
            highlightsList.innerHTML = '<li>No highlights available</li>';
        }
        
        // Show skills
        const skillsContainer = overlay.querySelector('.project-detail-skills');
        if (project.skills) {
            const skills = project.skills.split(',').map(s => s.trim());
            skillsContainer.innerHTML = skills.map(skill =>
                `<span class="tech-tag">${skill}</span>`
            ).join('');
        }
        
        // Show links
        const linksContainer = overlay.querySelector('.project-detail-links');
        if (project.links && project.links.length > 0) {
            linksContainer.innerHTML = project.links.map(link =>
                `<a href="${link.url}" target="_blank" class="project-link-detail">${link.label || link.type}</a>`
            ).join('');
        } else {
            linksContainer.innerHTML = '<p>No external links available</p>';
        }
        
        // Show the overlay
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    renderProjectGallery(project, overlay) {
        const galleryContainer = overlay.querySelector('.project-detail-gallery');
        
        if (!project.images || project.images.length === 0) {
            galleryContainer.innerHTML = '<p class="no-images">No images available for this project.</p>';
            return;
        }
        
        // Sort images by rank priority: hero > featured > standard
        const rankOrder = { 'hero': 0, 'featured': 1, 'standard': 2 };
        const sortedImages = [...project.images].sort((a, b) => {
            const rankA = rankOrder[a.rank] || 3;
            const rankB = rankOrder[b.rank] || 3;
            return rankA - rankB;
        });
        
        // Find hero image
        const heroImage = sortedImages.find(img => img.rank === 'hero');
        const featuredImages = sortedImages.filter(img => img.rank === 'featured');
        const standardImages = sortedImages.filter(img => img.rank === 'standard');
        
        let galleryHTML = '';
        
        // Hero image section (large, prominent display)
        if (heroImage) {
            galleryHTML += `
                <div class="gallery-hero-section">
                    <div class="gallery-hero-image" onclick="portfolioController.openFullscreenImage('${heroImage.src}', '${heroImage.description}')">
                        <img src="${heroImage.src}" alt="${heroImage.description}" class="hero-image">
                        <div class="image-overlay">
                            <div class="image-rank-badge hero-badge">HERO</div>
                            <div class="image-description">${heroImage.description}</div>
                            <div class="fullscreen-hint">Click to view fullscreen</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Featured and standard images grid
        const otherImages = [...featuredImages, ...standardImages];
        if (otherImages.length > 0) {
            galleryHTML += `
                <div class="gallery-grid-section">
                    <div class="gallery-grid">
                        ${otherImages.map(image => `
                            <div class="gallery-grid-item ${image.rank}" onclick="portfolioController.openFullscreenImage('${image.src}', '${image.description}')">
                                <img src="${image.src}" alt="${image.description}" class="grid-image">
                                <div class="image-overlay">
                                    <div class="image-rank-badge ${image.rank}-badge">${image.rank.toUpperCase()}</div>
                                    <div class="image-description">${image.description}</div>
                                    <div class="fullscreen-hint">Click to enlarge</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        galleryContainer.innerHTML = galleryHTML;
    }
    
    openFullscreenImage(imageSrc, description) {
        console.log('🖼️ Opening fullscreen image:', imageSrc);
        console.log('🖼️ Description:', description);
        
        // Create fullscreen overlay with higher z-index than project modal
        const fullscreenOverlay = document.createElement('div');
        fullscreenOverlay.className = 'fullscreen-image-overlay';
        fullscreenOverlay.style.display = 'flex'; // Ensure it's visible
        fullscreenOverlay.style.zIndex = '999999'; // Force very high z-index
        fullscreenOverlay.style.position = 'fixed'; // Ensure it's positioned correctly
        fullscreenOverlay.innerHTML = `
            <div class="fullscreen-image-container">
                <button class="close-fullscreen" onclick="portfolioController.closeFullscreenImage()">×</button>
                <img src="${imageSrc}" alt="${description}" class="fullscreen-image" onload="console.log('✅ Image loaded successfully')" onerror="console.error('❌ Image failed to load:', this.src)">
                <div class="fullscreen-description">${description}</div>
            </div>
        `;
        
        document.body.appendChild(fullscreenOverlay);
        console.log('🖼️ Fullscreen overlay added to DOM');
        
        // Animate in
        setTimeout(() => {
            fullscreenOverlay.classList.add('active');
            console.log('🖼️ Active class added to fullscreen overlay');
        }, 10);
        
        // Close on background click
        fullscreenOverlay.addEventListener('click', (e) => {
            if (e.target === fullscreenOverlay) {
                this.closeFullscreenImage();
            }
        });
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFullscreenImage();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    closeFullscreenImage() {
        const fullscreenOverlay = document.querySelector('.fullscreen-image-overlay');
        if (fullscreenOverlay) {
            fullscreenOverlay.classList.remove('active');
            setTimeout(() => {
                if (fullscreenOverlay.parentNode) {
                    fullscreenOverlay.parentNode.removeChild(fullscreenOverlay);
                }
            }, 300);
        }
    }
    
    createProjectDetailOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'project-detail-overlay';
        overlay.innerHTML = `
            <div class="project-detail-modal">
                <div class="project-detail-header">
                    <h2 class="project-detail-title">Loading...</h2>
                    <button class="close-project-detail" onclick="portfolioController.closeProjectDetails()">×</button>
                </div>
                <div class="project-detail-content">
                    <p class="project-detail-subtitle"></p>
                    <div class="project-detail-meta"></div>
                    <div class="project-detail-section">
                        <h3>Description</h3>
                        <p class="project-detail-description"></p>
                    </div>
                    <div class="project-detail-section">
                        <h3>Key Highlights</h3>
                        <ul class="project-detail-highlights"></ul>
                    </div>
                    <div class="project-detail-section">
                        <h3>Technologies</h3>
                        <div class="project-detail-skills"></div>
                    </div>
                    <div class="project-detail-section">
                        <h3>Links</h3>
                        <div class="project-detail-links"></div>
                    </div>
                    <div class="project-detail-section project-gallery-section">
                        <h3>Project Gallery</h3>
                        <div class="project-detail-gallery"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add overlay click-to-close functionality
        overlay.addEventListener('click', (e) => {
            // Only close if clicking on the overlay background, not the modal content
            if (e.target === overlay) {
                this.closeProjectDetails();
            }
        });
        
        document.body.appendChild(overlay);
        return overlay;
    }
    
    closeProjectDetails() {
        const overlay = document.getElementById('project-detail-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
            
            // Remove the history state if it was added
            if (this.modalHistoryState) {
                history.back();
                this.modalHistoryState = false;
            }
        }
    }
    
    setupBackButtonHandling() {
        // Handle browser back button to close modal
        window.addEventListener('popstate', (event) => {
            const overlay = document.getElementById('project-detail-overlay');
            if (overlay && overlay.style.display === 'flex') {
                // Modal is open, close it instead of navigating
                overlay.style.display = 'none';
                document.body.style.overflow = ''; // Restore scrolling
                this.modalHistoryState = false;
            }
        });
    }
    
    setupScrollAnimations() {
        // Intersection Observer for scroll-based animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.triggerSectionAnimation(sectionId);
                }
            });
        }, observerOptions);
        
        // Observe all sections
        const sections = document.querySelectorAll('.content-section, .portfolio-header');
        sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    createRippleEffect(element) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.width = '4px';
        ripple.style.height = '4px';
        ripple.style.background = 'var(--cathode-cyan)';
        ripple.style.borderRadius = '50%';
        ripple.style.filter = 'var(--glow-cyan)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple-expand 0.6s ease-out forwards';
        
        const rect = element.getBoundingClientRect();
        ripple.style.left = '10px';
        ripple.style.top = '50%';
        ripple.style.transform = 'translateY(-50%)';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    setupSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        // Animate skill bars when skills section is shown
        const animateSkills = () => {
            skillBars.forEach((bar, index) => {
                setTimeout(() => {
                    const level = bar.dataset.level;
                    bar.style.width = level + '%';
                    
                    // Add pulse effect
                    bar.style.animation = `skill-load 1.5s ease-out forwards, skill-pulse 2s ease-in-out infinite ${index * 0.2}s`;
                }, index * 200);
            });
        };
        
        // Store animation function for later use
        this.animateSkills = animateSkills;
    }
    
    setupOscilloscope() {
        this.oscilloscopeCanvas = document.getElementById('oscilloscope-canvas');
        if (!this.oscilloscopeCanvas) return;
        
        this.oscilloscopeCtx = this.oscilloscopeCanvas.getContext('2d');
        this.startOscilloscope();
    }
    
    startOscilloscope() {
        const canvas = this.oscilloscopeCanvas;
        const ctx = this.oscilloscopeCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        const drawWave = () => {
            // Clear canvas
            ctx.fillStyle = '#1A1A1A'; // black
            ctx.fillRect(0, 0, width, height);
            
            // Draw grid
            ctx.strokeStyle = '#404040'; // gray-dark
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]);
            
            // Vertical grid lines
            for (let x = 0; x < width; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            
            // Horizontal grid lines
            for (let y = 0; y < height; y += 30) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            
            ctx.setLineDash([]);
            
            // Draw oscilloscope wave
            ctx.strokeStyle = '#7FBF5F'; // phosphor-green
            ctx.lineWidth = 2;
            ctx.shadowColor = '#7FBF5F';
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            
            for (let x = 0; x < width; x++) {
                const frequency1 = 0.02;
                const frequency2 = 0.05;
                const amplitude1 = 30;
                const amplitude2 = 15;
                
                const y1 = Math.sin((x + this.waveOffset) * frequency1) * amplitude1;
                const y2 = Math.sin((x + this.waveOffset * 1.5) * frequency2) * amplitude2;
                const y = height / 2 + y1 + y2;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            this.waveOffset += 2;
            
            this.animationFrame = requestAnimationFrame(drawWave);
        };
        
        drawWave();
    }
    
    setupAmbientEffects() {
        // Create additional floating particles dynamically
        const ambientContainer = document.querySelector('.ambient-effects');
        
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.setProperty('--delay', Math.random() * 5 + 's');
            particle.style.setProperty('--duration', (8 + Math.random() * 8) + 's');
            
            // Random color variation
            const colors = ['var(--cathode-cyan)', 'var(--amber-glow)', 'var(--phosphor-green)'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = randomColor;
            
            ambientContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 16000);
        };
        
        // Create particles periodically
        setInterval(createParticle, 3000);
        
        // Initial particles
        for (let i = 0; i < 3; i++) {
            setTimeout(createParticle, i * 1000);
        }
    }
    
    triggerSectionAnimation(sectionId) {
        switch (sectionId) {
            case 'intro':
                this.typewriterEffect();
                break;
            case 'projects':
                this.animateProjectCards();
                break;
            case 'skills':
                if (this.animateSkills) {
                    this.animateSkills();
                }
                break;
            case 'contact':
                this.pulseContactItems();
                break;
        }
    }
    
    typewriterEffect() {
        const outputText = document.querySelector('.output-text');
        if (!outputText) return;
        
        const paragraphs = outputText.querySelectorAll('p');
        paragraphs.forEach((p, index) => {
            const text = p.textContent;
            p.textContent = '';
            p.style.opacity = '1';
            
            setTimeout(() => {
                let charIndex = 0;
                const typeInterval = setInterval(() => {
                    p.textContent += text[charIndex];
                    charIndex++;
                    
                    if (charIndex >= text.length) {
                        clearInterval(typeInterval);
                    }
                }, 30);
            }, index * 1000);
        });
    }
    
    animateProjectCards() {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }
    
    pulseContactItems() {
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'pulse-glow 1s ease-in-out';
            }, index * 300);
        });
    }
    
    setupResponsiveHandling() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }
    
    handleResize() {
        // Restart oscilloscope with new dimensions
        if (this.oscilloscopeCanvas) {
            const rect = this.oscilloscopeCanvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
                this.startOscilloscope();
            }
        }
    }
    
    // Public method to update portfolio content
    updateContent(newContent) {
        if (newContent.title) {
            const titleElement = document.querySelector('.portfolio-title');
            if (titleElement) {
                titleElement.textContent = newContent.title;
            }
        }
        
        if (newContent.about) {
            const aboutSection = document.querySelector('#about .output-text');
            if (aboutSection) {
                aboutSection.innerHTML = newContent.about;
            }
        }
        
        if (newContent.projects) {
            this.updateProjects(newContent.projects);
        }
        
        if (newContent.skills) {
            this.updateSkills(newContent.skills);
        }
        
        if (newContent.contact) {
            this.updateContact(newContent.contact);
        }
    }
    
    updateProjects(projects) {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;
        
        projectsGrid.innerHTML = '';
        this.projects = projects; // Store projects for navigation
        
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.dataset.projectId = project.id;
            projectCard.innerHTML = `
                <div class="project-content">
                    <div class="image-thumbnail">
                        <img src="${project.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiM0MDQwNDAiLz48dGV4dCB4PSI2MCIgeT0iNDAiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}" alt="${project.title}" class="project-thumbnail">
                    </div>
                    <div class="project-info">
                        <div class="project-header">
                            <h3 class="project-title">${project.title}</h3>
                            <div class="project-status">${project.status || 'FEATURED'}</div>
                        </div>
                        <div class="project-description">
                            ${project.description}
                        </div>
                        <div class="project-tech">
                            ${project.technologies ? project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('') : ''}
                        </div>
                        <div class="project-links">
                            <span class="project-link">EXPLORE PROJECT →</span>
                        </div>
                    </div>
                </div>
            `;
            projectsGrid.appendChild(projectCard);
        });
    }
    
    updateSkills(skills) {
        const skillsMatrix = document.querySelector('.skills-matrix');
        if (!skillsMatrix) return;
        
        skillsMatrix.innerHTML = '';
        
        Object.keys(skills).forEach(category => {
            const skillCategory = document.createElement('div');
            skillCategory.className = 'skill-category';
            skillCategory.innerHTML = `
                <h3 class="category-title">${category.toUpperCase()}</h3>
                <div class="skill-bars">
                    ${skills[category].map(skill => `
                        <div class="skill-item">
                            <span class="skill-name">${skill.name}</span>
                            <div class="skill-bar">
                                <div class="skill-progress" data-level="${skill.level}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            skillsMatrix.appendChild(skillCategory);
        });
        
        this.setupSkillBars();
    }
    
    updateContact(contact) {
        const contactMethods = document.querySelector('.contact-methods');
        if (!contactMethods) return;
        
        contactMethods.innerHTML = '';
        
        Object.keys(contact).forEach(method => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <span class="contact-label">${method.toUpperCase()}:</span>
                <span class="contact-value">${contact[method]}</span>
            `;
            contactMethods.appendChild(contactItem);
        });
    }
}

// Additional CSS animations via JavaScript
const additionalStyles = `
@keyframes ripple-expand {
    0% {
        width: 4px;
        height: 4px;
        opacity: 1;
    }
    100% {
        width: 20px;
        height: 20px;
        opacity: 0;
    }
}

@keyframes skill-pulse {
    0%, 100% {
        filter: var(--glow-cyan);
    }
    50% {
        filter: var(--glow-cyan) brightness(1.3);
    }
}

@keyframes pulse-glow {
    0%, 100% {
        filter: none;
    }
    50% {
        filter: drop-shadow(0 0 2px rgba(153, 102, 51, 0.2)) drop-shadow(0 0 4px rgba(204, 136, 68, 0.2)) drop-shadow(0 0 8px rgba(255, 179, 102, 0.06));
    }
}

/* Project Detail Overlay Styles */
#project-detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 20px;
    box-sizing: border-box;
}

.project-detail-modal {
    background: var(--black-pure);
    border: 1px solid var(--cathode-cyan);
    border-radius: 8px;
    max-width: 800px;
    max-height: 95vh;
    width: 100%;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(77, 217, 217, 0.3);
}

.project-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--brass);
    background: var(--black);
}

.project-detail-title {
    color: #F5F5F5;
    font-weight: 300;
    text-shadow:
        0 0 2px rgba(255, 179, 102, 0.8),
        0 0 4px rgba(255, 153, 102, 0.6),
        0 0 6px rgba(204, 136, 68, 0.4),
        0 1px 0 rgba(153, 102, 51, 0.3),
        0 2px 3px rgba(0, 0, 0, 0.2);
    font-family: var(--font-mono);
    font-size: 1.5rem;
    margin: 0;
    filter: brightness(1.01);
}

.close-project-detail {
    background: none;
    border: 1px solid var(--cathode-cyan);
    color: var(--cathode-cyan);
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    filter: var(--glow-cyan);
}

.close-project-detail:hover {
    background: rgba(77, 217, 217, 0.1);
    transform: scale(1.1);
}

.project-detail-content {
    padding: 20px;
}

.project-detail-subtitle {
    color: var(--cathode-cyan);
    font-family: var(--font-mono);
    font-size: 1.1rem;
    margin-bottom: 20px;
    filter: var(--glow-cyan);
}

.project-detail-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: var(--black);
    border-radius: 8px;
    border: 1px solid var(--copper);
}

.meta-item {
    text-align: center;
}

.meta-label {
    display: block;
    color: var(--terminal-green);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    margin-bottom: 5px;
    filter: var(--glow-terminal);
}

.meta-value {
    color: #F5F5F5;
    font-weight: 300;
    text-shadow:
        0 0 0.5px rgba(255, 179, 102, 0.4),
        0 0 1.5px rgba(255, 153, 102, 0.3),
        0 0 2.5px rgba(204, 136, 68, 0.2);
    font-family: var(--font-mono);
}

.project-detail-section {
    margin-bottom: 25px;
}

.project-detail-section h3 {
    color: #F5F5F5;
    font-weight: 300;
    text-shadow:
        0 0 2px rgba(255, 179, 102, 0.8),
        0 0 4px rgba(255, 153, 102, 0.6),
        0 0 6px rgba(204, 136, 68, 0.4),
        0 1px 0 rgba(153, 102, 51, 0.3),
        0 2px 3px rgba(0, 0, 0, 0.2);
    font-family: var(--font-mono);
    font-size: 1.2rem;
    margin-bottom: 15px;
    filter: brightness(1.01);
    display: flex;
    align-items: center;
    gap: 10px;
}

.project-detail-section h3::before {
    content: '>';
    color: var(--cathode-cyan);
    filter: var(--glow-cyan);
}

.project-detail-description {
    color: #F5F5F5;
    font-weight: 300;
    text-shadow:
        0 0 0.5px rgba(255, 179, 102, 0.4),
        0 0 1.5px rgba(255, 153, 102, 0.3),
        0 0 2.5px rgba(204, 136, 68, 0.2);
    line-height: 1.6;
    margin: 0;
}

.project-detail-highlights {
    list-style: none;
    padding: 0;
    margin: 0;
}

.project-detail-highlights li {
    color: #F5F5F5;
    font-weight: 300;
    text-shadow:
        0 0 0.5px rgba(255, 179, 102, 0.4),
        0 0 1.5px rgba(255, 153, 102, 0.3),
        0 0 2.5px rgba(204, 136, 68, 0.2);
    margin-bottom: 10px;
    padding-left: 20px;
    position: relative;
}

.project-detail-highlights li::before {
    content: '▶';
    color: var(--terminal-green);
    filter: var(--glow-terminal);
    position: absolute;
    left: 0;
}

.project-detail-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.project-detail-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.project-link-detail {
    background: var(--cathode-cyan);
    color: var(--black-pure);
    padding: 8px 16px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    text-decoration: none;
    filter: var(--glow-cyan);
    transition: all 0.3s ease;
}

.project-link-detail:hover {
    background: var(--cathode-cyan-deep);
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .project-detail-modal {
        margin: 10px;
        max-height: 95vh;
    }
    
    .project-detail-header {
        padding: 15px;
    }
    
    .project-detail-title {
        font-size: 1.2rem;
    }
    
    .project-detail-content {
        padding: 15px;
    }
    
    .project-detail-meta {
        grid-template-columns: 1fr;
    }
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioController = new PortfolioController();
});

// Export for iframe integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioController;
}

// Global function for external iframe communication
window.updatePortfolioContent = function(content) {
    if (window.portfolioController) {
        window.portfolioController.updateContent(content);
    }
};

// Iframe resize handling
window.addEventListener('message', (event) => {
    if (event.data.type === 'portfolioUpdate') {
        window.updatePortfolioContent(event.data.content);
    }
});
