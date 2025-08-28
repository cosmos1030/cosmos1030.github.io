// Content Manager - Dynamically loads and populates website content
class ContentManager {
    constructor() {
        this.data = {};
    }

    // Initialize content loading
    async init() {
        await this.loadAllData();
        this.populateContent();
    }

    // Load all data files
    async loadAllData() {
        try {
            // Load data using fetch method
            this.data.personal = await this.loadData('data/personal.js');
            this.data.research = await this.loadData('data/research.js');
            this.data.publications = await this.loadData('data/publications.js');
            this.data.projects = await this.loadData('data/projects.js');
            
            console.log('All data loaded successfully:', this.data);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback: show error message to user
            document.querySelector('.hero-title').textContent = 'Error loading content';
            document.querySelector('.hero-subtitle').textContent = 'Please check console for details';
        }
    }

    // Load data from script using fetch
    async loadData(src) {
        try {
            console.log(`Loading data from: ${src}`);
            const response = await fetch(src);
            const scriptText = await response.text();
            
            // Execute the script in a safe context
            const scriptFunction = new Function(scriptText + '; return typeof sitePersonalInfo !== "undefined" ? sitePersonalInfo : typeof siteResearchExperience !== "undefined" ? siteResearchExperience : typeof sitePublications !== "undefined" ? sitePublications : siteProjects;');
            const data = scriptFunction();
            
            console.log(`Data from ${src}:`, data);
            return data;
        } catch (error) {
            console.error(`Failed to load data from ${src}:`, error);
            return null;
        }
    }

    // Populate all content
    populateContent() {
        this.populatePersonalInfo();
        this.populateAbout();
        this.populateResearch();
        this.populatePublications();
        this.populateProjects();
        this.populateSkills();
        this.populateContact();
    }

    // Populate personal information
    populatePersonalInfo() {
        console.log('populatePersonalInfo called, this.data.personal:', this.data.personal);
        
        if (!this.data.personal) {
            console.error('Personal data is undefined');
            return;
        }
        
        const { name, title, description, contact } = this.data.personal;
        
        // Hero section (title handled by typing animation)
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroDescription = document.querySelector('.hero-description');
        
        if (heroSubtitle) heroSubtitle.textContent = title;
        if (heroDescription) heroDescription.textContent = description;

        // Update social links
        const socialLinks = document.querySelector('.social-links');
        if (socialLinks) {
            socialLinks.innerHTML = `
                <a href="${contact.linkedin}" target="_blank" aria-label="LinkedIn">
                    <i class="fab fa-linkedin"></i>
                </a>
                <a href="${contact.github}" target="_blank" aria-label="GitHub">
                    <i class="fab fa-github"></i>
                </a>
                <a href="mailto:${contact.email}" aria-label="Email">
                    <i class="fas fa-envelope"></i>
                </a>
            `;
        }
    }

    // Populate about section
    populateAbout() {
        const { about, education } = this.data.personal;
        
        // About text
        const aboutText = document.querySelector('.about-text');
        if (aboutText) {
            aboutText.innerHTML = about.map(paragraph => `<p>${paragraph}</p>`).join('');
        }

        // Education
        const educationCard = document.querySelector('.education-card');
        if (educationCard) {
            const educationHTML = education.map(edu => `
                <div class="education-item">
                    <h4>${edu.institution}</h4>
                    <p>${edu.degree}</p>
                    <p>${edu.gpa}</p>
                    <span class="date">${edu.period}</span>
                </div>
            `).join('');
            
            educationCard.innerHTML = `
                <h3>Education</h3>
                ${educationHTML}
            `;
        }
    }

    // Populate research section
    populateResearch() {
        const timeline = document.querySelector('.timeline');
        if (!timeline || !this.data.research) return;

        const researchHTML = this.data.research.map(item => {
            let advisorHTML = '';
            if (item.advisor) {
                // Single advisor (old format)
                advisorHTML = `<p class="advisor">Advised by <a href="${item.advisor.url}" target="_blank">${item.advisor.name}</a></p>`;
            } else if (item.advisors) {
                // Multiple advisors (new format)
                const advisorLinks = item.advisors.map(advisor => 
                    `<a href="${advisor.url}" target="_blank">${advisor.name}</a>`
                ).join(' and ');
                advisorHTML = `<p class="advisor">Co-advised by ${advisorLinks}</p>`;
            }
            
            return `
                <div class="timeline-item">
                    <div class="timeline-date">${item.period}</div>
                    <div class="timeline-content">
                        <h3>${item.institution}</h3>
                        ${advisorHTML}
                        ${item.description ? `<p>${item.description}</p>` : ''}
                        ${item.projects ? `<ul>${item.projects.map(project => `<li>${project}</li>`).join('')}</ul>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        timeline.innerHTML = researchHTML;
    }

    // Populate publications section
    populatePublications() {
        const publicationsGrid = document.querySelector('.publications-grid');
        if (!publicationsGrid || !this.data.publications) return;

        const publicationsHTML = this.data.publications.map(pub => `
            <div class="publication-card ${pub.type === 'in-prep' ? 'in-prep' : ''}">
                <div class="publication-status">${pub.status}</div>
                <h3>${pub.title}</h3>
                <p class="authors">${pub.authors}</p>
                ${pub.note ? `<p class="note">${pub.note}</p>` : ''}
                ${pub.links.length > 0 ? `
                    <div class="publication-links">
                        ${pub.links.map(link => `<a href="${link.url}" target="_blank">${link.type}</a>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        publicationsGrid.innerHTML = publicationsHTML;
    }

    // Populate projects section
    populateProjects() {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid || !this.data.projects) return;

        const projectsHTML = this.data.projects.map(project => `
            <div class="project-card">
                <h3>${project.title}</h3>
                <p class="project-period">${project.period}</p>
                <p>${project.description}</p>
                <div class="project-links">
                    ${project.links.map(link => `<a href="${link.url}" target="_blank">${link.type}</a>`).join('')}
                </div>
            </div>
        `).join('');

        projectsGrid.innerHTML = projectsHTML;
    }

    // Populate skills section
    populateSkills() {
        const skillsGrid = document.querySelector('.skills-grid');
        if (!skillsGrid || !this.data.personal.skills) return;

        const skillsHTML = Object.entries(this.data.personal.skills).map(([category, skills]) => `
            <div class="skill-category">
                <h3>${category}</h3>
                <div class="skill-tags">
                    ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `).join('');

        skillsGrid.innerHTML = skillsHTML;
    }

    // Populate contact section
    populateContact() {
        const { contact } = this.data.personal;
        const contactInfo = document.querySelector('.contact-info');
        
        if (contactInfo) {
            contactInfo.innerHTML = `
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <a href="mailto:${contact.email}">${contact.email}</a>
                </div>
                <div class="contact-item">
                    <i class="fab fa-linkedin"></i>
                    <a href="${contact.linkedin}" target="_blank">LinkedIn</a>
                </div>
                <div class="contact-item">
                    <i class="fab fa-github"></i>
                    <a href="${contact.github}" target="_blank">GitHub</a>
                </div>
            `;
        }
    }
}

// Initialize content manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.contentManager = new ContentManager();
    await window.contentManager.init();
});