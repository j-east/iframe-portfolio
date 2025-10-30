// XML Portfolio Parser
// Parses portfolio-data.xml and integrates with the existing portfolio component

class PortfolioXMLParser {
    constructor() {
        this.portfolioData = null;
        this.assetBasePath = './portfolio-template/assets/images/';
    }
    
    async loadPortfolioData(xmlPath = 'portfolio-template/portfolio-data.xml') {
        try {
            const response = await fetch(xmlPath);
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML parsing error: ' + parseError.textContent);
            }
            
            this.portfolioData = this.parsePortfolioXML(xmlDoc);
            return this.portfolioData;
        } catch (error) {
            console.error('Error loading portfolio data:', error);
            throw error;
        }
    }
    
    parsePortfolioXML(xmlDoc) {
        const portfolio = xmlDoc.querySelector('portfolio');
        if (!portfolio) {
            throw new Error('Invalid portfolio XML: missing root portfolio element');
        }
        
        const data = {
            meta: this.parseMeta(portfolio.querySelector('meta')),
            skills: this.parseSkills(portfolio.querySelector('skills')),
            projects: this.parseProjects(portfolio.querySelectorAll('project')),
            interludes: this.parseInterludes(portfolio.querySelectorAll('interlude'))
        };
        
        return data;
    }
    
    parseMeta(metaElement) {
        if (!metaElement) return null;
        
        return {
            name: this.getElementText(metaElement, 'name'),
            tagline: this.getElementText(metaElement, 'tagline'),
            description: this.getElementText(metaElement, 'description'),
            contact: {
                github: this.getElementText(metaElement, 'contact github'),
                email: this.getElementText(metaElement, 'contact email'),
                linkedin: this.getElementText(metaElement, 'contact linkedin')
            }
        };
    }
    
    parseProjects(projectElements) {
        return Array.from(projectElements).map(project => {
            const projectData = {
                id: project.getAttribute('id'),
                featured: project.getAttribute('featured') === 'true',
                title: this.getElementText(project, 'title'),
                subtitle: this.getElementText(project, 'subtitle'),
                timeframe: this.getElementText(project, 'timeframe'),
                category: this.getElementText(project, 'category'),
                description: this.getElementText(project, 'description'),
                skills: this.getElementText(project, 'skills'),
                highlights: this.parseHighlights(project.querySelector('highlights')),
                links: this.parseLinks(project.querySelector('links')),
                images: this.parseImages(project.querySelector('images')),
                gallery: this.parseGallery(project.querySelector('gallery'))
            };
            
            return projectData;
        });
    }
    
    parseSkills(skillsElement) {
        if (!skillsElement) return null;
        
        return {
            summary: this.getElementText(skillsElement, 'summary'),
            programming_languages: this.parseSkillItems(skillsElement.querySelector('programming_languages')),
            technical_domains: this.parseDomainItems(skillsElement.querySelector('technical_domains')),
            specialized_skills: this.parseSkillItems(skillsElement.querySelector('specialized_skills'))
        };
    }
    
    parseSkillItems(skillsContainer) {
        if (!skillsContainer) return [];
        
        const skills = skillsContainer.querySelectorAll('skill');
        return Array.from(skills).map(skill => ({
            name: skill.getAttribute('name'),
            years: skill.getAttribute('years'),
            proficiency: skill.getAttribute('proficiency'),
            frameworks: skill.getAttribute('frameworks'),
            platforms: skill.getAttribute('platforms'),
            variants: skill.getAttribute('variants'),
            contexts: skill.getAttribute('contexts')
        }));
    }
    
    parseDomainItems(domainsContainer) {
        if (!domainsContainer) return [];
        
        const domains = domainsContainer.querySelectorAll('domain');
        return Array.from(domains).map(domain => ({
            name: domain.getAttribute('name'),
            years: domain.getAttribute('years'),
            level: domain.getAttribute('level'),
            description: domain.getAttribute('description')
        }));
    }
    
    parseInterludes(interludeElements) {
        return Array.from(interludeElements).map(interlude => ({
            id: interlude.getAttribute('id'),
            title: this.getElementText(interlude, 'title'),
            timeframe: this.getElementText(interlude, 'timeframe'),
            note: this.getElementText(interlude, 'note')
        }));
    }
    
    parseHighlights(highlightsElement) {
        if (!highlightsElement) return [];
        
        const highlights = highlightsElement.querySelectorAll('highlight');
        return Array.from(highlights).map(highlight => ({
            text: highlight.textContent.trim(),
            type: highlight.getAttribute('type') || null
        }));
    }
    
    parseLinks(linksElement) {
        if (!linksElement) return [];
        
        const links = linksElement.querySelectorAll('link');
        return Array.from(links).map(link => ({
            url: link.textContent.trim(),
            type: link.getAttribute('type'),
            label: link.getAttribute('label') || link.getAttribute('type')
        }));
    }
    
    parseImages(imagesElement) {
        if (!imagesElement) return [];
        
        const images = imagesElement.querySelectorAll('image');
        return Array.from(images).map(image => ({
            src: this.assetBasePath + 'gallery/' + image.textContent.trim(),
            thumbnail: this.assetBasePath + 'gallery/thumbnails/' + image.textContent.trim(),
            rank: image.getAttribute('rank') || 'standard',
            description: image.getAttribute('description') || ''
        }));
    }
    
    parseGallery(galleryElement) {
        if (!galleryElement) return [];
        
        const items = galleryElement.querySelectorAll('item');
        return Array.from(items).map(item => ({
            src: this.assetBasePath + 'gallery/' + item.textContent.trim(),
            type: item.getAttribute('type')
        }));
    }
    
    getElementText(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }
    
    // Convert parsed data to format expected by existing portfolio component
    convertToPortfolioFormat() {
        if (!this.portfolioData) {
            throw new Error('No portfolio data loaded. Call loadPortfolioData() first.');
        }
        
        const { meta, projects } = this.portfolioData;
        
        return {
            title: meta.name.toUpperCase(),
            about: this.generateAboutHTML(meta),
            projects: this.convertProjectsFormat(projects.filter(p => p.featured)),
            skills: this.portfolioData.skills ? this.convertSkillsFormat(this.portfolioData.skills) : this.generateSkillsFromProjects(projects),
            contact: {
                email: meta.contact.email,
                github: 'github.com/' + meta.contact.github,
                linkedin: meta.contact.linkedin || null
            }
        };
    }
    
    generateAboutHTML(meta) {
        return `
            <p>Hello! I'm ${meta.name}.</p>
            <p>${meta.tagline}</p>
            <p class="highlight">${meta.description || 'Passionate about creating innovative solutions and bringing ideas to life through engineering and code.'}</p>
        `;
    }
    
    convertProjectsFormat(projects) {
        return projects.map(project => ({
            id: project.id,
            title: project.title,
            status: project.timeframe.includes('Current') ? 'ACTIVE' : 'COMPLETED',
            description: project.description,
            technologies: project.skills.split(',').map(s => s.trim()).slice(0, 3), // First 3 skills
            thumbnail: this.getProjectThumbnail(project) // Add thumbnail path
        }));
    }
    
    convertSkillsFormat(skillsData) {
        // Convert structured skills data to format expected by existing portfolio component
        const programming = skillsData.programming_languages || [];
        const domains = skillsData.technical_domains || [];
        const specialized = skillsData.specialized_skills || [];
        
        return {
            programming: programming.map(skill => ({
                name: skill.name,
                level: skill.proficiency === 'expert' ? 95 :
                       skill.proficiency === 'advanced' ? 85 : 75
            })),
            domains: domains.map(domain => ({
                name: domain.name,
                level: domain.level === 'expert' ? 95 :
                       domain.level === 'advanced' ? 85 : 75
            })),
            specialized: specialized.map(skill => ({
                name: skill.name,
                level: skill.proficiency === 'expert' ? 95 :
                       skill.proficiency === 'advanced' ? 85 : 75
            }))
        };
    }
    
    generateSkillsFromProjects(projects) {
        const allSkills = projects.flatMap(p =>
            p.skills.split(',').map(s => s.trim())
        );
        
        const skillCounts = {};
        allSkills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
        
        const sortedSkills = Object.entries(skillCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([skill, count]) => ({
                name: skill,
                level: Math.min(95, 60 + (count * 10)) // Scale based on frequency
            }));
        
        // Group into categories (simplified)
        const frontend = sortedSkills.filter(s =>
            ['JavaScript', 'HTML', 'CSS', 'React', 'Vue.js', 'Web Development'].includes(s.name)
        ).slice(0, 4);
        
        const backend = sortedSkills.filter(s =>
            ['Node.js', 'Python', 'C/C++', 'Embedded Systems', 'Firmware Development'].includes(s.name)
        ).slice(0, 4);
        
        return {
            frontend: frontend.length > 0 ? frontend : [
                { name: 'JavaScript', level: 85 },
                { name: 'HTML/CSS', level: 90 }
            ],
            backend: backend.length > 0 ? backend : [
                { name: 'Node.js', level: 75 },
                { name: 'Python', level: 70 }
            ]
        };
    }
    
    // Method to get detailed project data for expanded views
    getProjectDetails(projectId) {
        if (!this.portfolioData) return null;
        
        return this.portfolioData.projects.find(p => p.id === projectId);
    }
    
    // Method to get the best thumbnail image for a project
    getProjectThumbnail(project) {
        if (!project.images || project.images.length === 0) return null;
        
        // Priority order: hero > featured > standard
        const heroImage = project.images.find(img => img.rank === 'hero');
        if (heroImage) return heroImage.thumbnail;
        
        const featuredImage = project.images.find(img => img.rank === 'featured');
        if (featuredImage) return featuredImage.thumbnail;
        
        // Fallback to first image
        return project.images[0].thumbnail;
    }
    
    // Method to get all projects (including non-featured)
    getAllProjects() {
        return this.portfolioData ? this.portfolioData.projects : [];
    }
    
    // Method to get interludes
    getInterludes() {
        return this.portfolioData ? this.portfolioData.interludes : [];
    }
}

// Integration with existing portfolio controller
if (typeof window !== 'undefined') {
    window.PortfolioXMLParser = PortfolioXMLParser;
    
    // Auto-initialize and populate portfolio
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit for the main script to initialize
        setTimeout(async () => {
            try {
                const parser = new PortfolioXMLParser();
                await parser.loadPortfolioData('portfolio-template/portfolio-data.xml');
                
                // Populate the portfolio immediately
                populatePortfolioFromXML(parser);
                
                // Also update portfolio controller if it exists
                if (window.portfolioController) {
                    const portfolioContent = parser.convertToPortfolioFormat();
                    window.portfolioController.updateContent(portfolioContent);
                }
            } catch (error) {
                console.error('Could not load XML portfolio data:', error);
                showErrorMessage();
            }
        }, 100);
    });
    
    // Function to populate HTML directly from XML data
    function populatePortfolioFromXML(parser) {
        const data = parser.portfolioData;
        
        // Update header
        const titleElement = document.querySelector('.portfolio-title');
        const statusElement = document.querySelector('.status-text');
        if (titleElement && data.meta) {
            titleElement.textContent = data.meta.name.toUpperCase();
            statusElement.textContent = 'Interactive Portfolio v1.0';
        }
        
        // Populate about section
        populateAboutSection(data.meta);
        
        // Populate projects section
        populateProjectsSection(data.projects.filter(p => p.featured), this);
        
        // Populate skills section
        populateSkillsSection(data.skills, data.projects);
        
        // Populate contact section
        populateContactSection(data.meta.contact);
    }
    
    function populateAboutSection(meta) {
        const outputText = document.querySelector('#intro .intro-content .output-text');
        if (outputText && meta) {
            outputText.innerHTML = `
                <p>Hello! I'm ${meta.name}.</p>
                <p>${meta.tagline}</p>
                <p class="highlight">${meta.description || 'Passionate about creating innovative solutions and bringing ideas to life through engineering and code.'}</p>
            `;
        }
    }
    
    function populateProjectsSection(projects, parser) {
        console.log('🏗️ populateProjectsSection called with:', projects);
        console.log('🏗️ Projects array length:', projects.length);
        console.log('🏗️ Projects array type:', typeof projects);
        console.log('🏗️ Is projects an array?', Array.isArray(projects));
        
        const projectsGrid = document.querySelector('.projects-grid');
        console.log('🎯 Projects grid element:', projectsGrid);
        
        if (!projectsGrid) {
            console.error('❌ No projects grid found!');
            return;
        }
        
        if (!projects.length) {
            console.warn('⚠️ No projects to display');
            return;
        }
        
        console.log('✅ Ready to create project cards...');
        
        projectsGrid.innerHTML = '';
        
        projects.forEach((project, index) => {
            console.log(`🎯 Creating project card ${index + 1}:`);
            console.log(`  - Raw project object:`, project);
            console.log(`  - project.id type:`, typeof project.id);
            console.log(`  - project.id value:`, project.id);
            console.log(`  - project.id === undefined:`, project.id === undefined);
            console.log(`  - project.id === null:`, project.id === null);
            console.log(`  - project.id === '':`, project.id === '');
            console.log(`  - Object.keys(project):`, Object.keys(project));
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            console.log(`🔧 About to set dataset.projectId to:`, project.id);
            projectCard.dataset.projectId = project.id;
            console.log(`✅ Project card dataset.projectId set to:`, projectCard.dataset.projectId);
            console.log(`🔍 Full dataset after setting:`, projectCard.dataset);
            
            // Double-check by reading the attribute directly
            console.log(`📋 data-project-id attribute:`, projectCard.getAttribute('data-project-id'));
            
            const status = project.timeframe.toLowerCase().includes('current') ? 'ACTIVE' : 'COMPLETED';
            const skills = project.skills.split(',').map(s => s.trim()).slice(0, 3);
            
            // Get thumbnail image using the parser instance
            const thumbnailSrc = parser && parser.getProjectThumbnail ? parser.getProjectThumbnail(project) : null;
            // Create image-thumbnail div wrapper with image inside
            const thumbnailHtml = `
                <div class="image-thumbnail">
                    <img src="${thumbnailSrc || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiM0MDQwNDAiLz48dGV4dCB4PSI2MCIgeT0iNDAiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}" alt="${project.title}" class="project-thumbnail">
                </div>`;
            
            // Debug logging
            console.log(`🖼️ Project ${project.id} thumbnail:`, thumbnailSrc);
            console.log(`🖼️ Project ${project.id} images:`, project.images);
            console.log(`🖼️ Thumbnail HTML:`, thumbnailHtml);
            
            projectCard.innerHTML = `
                <div class="project-content">
                    ${thumbnailHtml}
                    <div class="project-info">
                        <div class="project-header">
                            <h3 class="project-title">${project.title}</h3>
                            <div class="project-status">${status}</div>
                        </div>
                        <div class="project-description">
                            ${project.description}
                        </div>
                        <div class="project-tech">
                            ${skills.map(skill => `<span class="tech-tag">${skill}</span>`).join('')}
                        </div>
                        <div class="project-links">
                            <span class="project-link">VIEW DETAILS →</span>
                            ${project.links.length > 0 ? project.links.map(link => `
                                <a href="${link.url}" target="_blank" class="project-link" onclick="event.stopPropagation();">
                                    ${link.label || link.type}
                                </a>
                            `).join('') : ''}
                        </div>
                    </div>
                </div>
            `;
            
            projectsGrid.appendChild(projectCard);
        });
    }
    
    function populateSkillsSection(skillsData, projects) {
        const skillsMatrix = document.querySelector('.skills-matrix');
        if (!skillsMatrix) return;
        
        skillsMatrix.innerHTML = '';
        
        // If we have structured skills data, use it
        if (skillsData && skillsData.programming_languages) {
            // Programming Languages
            if (skillsData.programming_languages.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'skill-category';
                categoryDiv.innerHTML = `
                    <h3 class="category-title">PROGRAMMING</h3>
                    <div class="skill-bars">
                        ${skillsData.programming_languages.map(skill => {
                            const level = skill.proficiency === 'expert' ? 95 :
                                         skill.proficiency === 'advanced' ? 85 : 75;
                            return `
                                <div class="skill-item">
                                    <span class="skill-name">${skill.name}</span>
                                    <div class="skill-bar">
                                        <div class="skill-progress" data-level="${level}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                skillsMatrix.appendChild(categoryDiv);
            }
            
            // Technical Domains
            if (skillsData.technical_domains && skillsData.technical_domains.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'skill-category';
                categoryDiv.innerHTML = `
                    <h3 class="category-title">TECHNICAL DOMAINS</h3>
                    <div class="skill-bars">
                        ${skillsData.technical_domains.slice(0, 4).map(domain => {
                            const level = domain.level === 'expert' ? 95 :
                                         domain.level === 'advanced' ? 85 : 75;
                            return `
                                <div class="skill-item">
                                    <span class="skill-name">${domain.name}</span>
                                    <div class="skill-bar">
                                        <div class="skill-progress" data-level="${level}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                skillsMatrix.appendChild(categoryDiv);
            }
            
            // Specialized Skills
            if (skillsData.specialized_skills && skillsData.specialized_skills.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'skill-category';
                categoryDiv.innerHTML = `
                    <h3 class="category-title">SPECIALIZED</h3>
                    <div class="skill-bars">
                        ${skillsData.specialized_skills.map(skill => {
                            const level = skill.proficiency === 'expert' ? 95 :
                                         skill.proficiency === 'advanced' ? 85 : 75;
                            return `
                                <div class="skill-item">
                                    <span class="skill-name">${skill.name}</span>
                                    <div class="skill-bar">
                                        <div class="skill-progress" data-level="${level}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                skillsMatrix.appendChild(categoryDiv);
            }
        } else {
            // Fallback to project-based skills extraction
            if (!projects || !projects.length) return;
            
            const allSkills = projects.flatMap(p =>
                p.skills.split(',').map(s => s.trim())
            );
            
            const skillCounts = {};
            allSkills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
            
            const categories = {
                'HARDWARE': ['PCB Design', 'CNC Manufacturing', 'Embedded Systems', 'nRF52 Development', 'Battery Management'],
                'SOFTWARE': ['JavaScript', 'Python', 'C/C++', 'React', 'Vue.js', 'Node.js', 'Computer Vision'],
                'ENGINEERING': ['Product Design', 'Mechanical Design', 'Fusion 360', 'CAD', 'GIS/Mapping']
            };
            
            Object.entries(categories).forEach(([categoryName, categorySkills]) => {
                const relevantSkills = categorySkills
                    .filter(skill => skillCounts[skill])
                    .map(skill => ({
                        name: skill,
                        level: Math.min(95, 60 + (skillCounts[skill] * 15))
                    }))
                    .slice(0, 4);
                
                if (relevantSkills.length > 0) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'skill-category';
                    categoryDiv.innerHTML = `
                        <h3 class="category-title">${categoryName}</h3>
                        <div class="skill-bars">
                            ${relevantSkills.map(skill => `
                                <div class="skill-item">
                                    <span class="skill-name">${skill.name}</span>
                                    <div class="skill-bar">
                                        <div class="skill-progress" data-level="${skill.level}"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    skillsMatrix.appendChild(categoryDiv);
                }
            });
        }
    }
    
    function populateContactSection(contact) {
        const contactMethods = document.querySelector('.contact-methods');
        if (!contactMethods || !contact) return;
        
        contactMethods.innerHTML = `
            <div class="contact-item">
                <span class="contact-label">EMAIL:</span>
                <span class="contact-value">${contact.email}</span>
            </div>
            <div class="contact-item">
                <span class="contact-label">GITHUB:</span>
                <a href="https://github.com/${contact.github}" target="_blank" class="contact-value contact-link">github.com/${contact.github}</a>
            </div>
            ${contact.linkedin ? `
            <div class="contact-item">
                <span class="contact-label">LINKEDIN:</span>
                <a href="${contact.linkedin}" target="_blank" class="contact-value contact-link">${contact.linkedin.replace('https://', '').replace('http://', '')}</a>
            </div>
            ` : ''}
        `;
    }
    
    function showErrorMessage() {
        const outputText = document.querySelector('#intro .intro-content .output-text');
        if (outputText) {
            outputText.innerHTML = `
                <p class="highlight">Error loading portfolio data.</p>
                <p>Please check that portfolio-data.xml exists and is valid.</p>
            `;
        }
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioXMLParser;
}