// Blog Post Common Functionality

// Load post metadata (loaded from posts-data.js)
function loadPostMetadata() {
    // This function is defined in posts-data.js
    if (typeof loadPostMetadataFromData === 'function') {
        loadPostMetadataFromData();
    }
}

// Load author information from data.js
function loadAuthorInfo() {
    const authorSection = document.getElementById('author-section');
    
    if (!authorSection) return; // Exit if element doesn't exist
    
    if (typeof cvData !== 'undefined' && cvData.name && cvData.title && cvData.summary) {
        // Fetch GitHub profile image
        const githubUsername = cvData.contact.githubDisplay.split('/').pop();
        
        fetch(`https://api.github.com/users/${githubUsername}`)
            .then(response => response.json())
            .then(githubData => {
                // Create LinkedIn and GitHub links
                const linkedinLink = cvData.contact && cvData.contact.linkedin 
                    ? `<a href="${cvData.contact.linkedin}" target="_blank" style="color: #3498db; text-decoration: none; margin-right: 15px;">LinkedIn</a>`
                    : '';
                
                const githubLink = cvData.contact && cvData.contact.github 
                    ? `<a href="${cvData.contact.github}" target="_blank" style="color: #3498db; text-decoration: none;">GitHub</a>`
                    : '';
                
                // Update author section with profile image from GitHub
                authorSection.innerHTML = `
                    <div class="author-avatar" style="background: url('${githubData.avatar_url}') center/cover;"></div>
                    <div class="author-info">
                        <h4>${cvData.name}</h4>
                        <p style="margin-bottom: 10px; font-weight: 600; color: #2c3e50;">${cvData.title}</p>
                        <p>${cvData.summary}</p>
                        <p style="margin-top: 10px;">
                            ${linkedinLink}
                            ${githubLink}
                        </p>
                    </div>
                `;
            })
            .catch(error => {
                console.log('GitHub API unavailable, using fallback');
                
                // Get initials for avatar as fallback
                const initials = cvData.name.split(' ').map(n => n[0]).join('').toUpperCase();
                
                // Create LinkedIn and GitHub links
                const linkedinLink = cvData.contact && cvData.contact.linkedin 
                    ? `<a href="${cvData.contact.linkedin}" target="_blank" style="color: #3498db; text-decoration: none; margin-right: 15px;">LinkedIn</a>`
                    : '';
                
                const githubLink = cvData.contact && cvData.contact.github 
                    ? `<a href="${cvData.contact.github}" target="_blank" style="color: #3498db; text-decoration: none;">GitHub</a>`
                    : '';
                
                // Update author section with initials as fallback
                authorSection.innerHTML = `
                    <div class="author-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">${initials}</div>
                    <div class="author-info">
                        <h4>${cvData.name}</h4>
                        <p style="margin-bottom: 10px; font-weight: 600; color: #2c3e50;">${cvData.title}</p>
                        <p>${cvData.summary}</p>
                        <p style="margin-top: 10px;">
                            ${linkedinLink}
                            ${githubLink}
                        </p>
                    </div>
                `;
            });
    }
}

// Load footer from data.js
function loadFooter() {
    const footerElement = document.getElementById('footer-copyright');
    
    if (!footerElement) return; // Exit if element doesn't exist
    
    if (typeof cvData !== 'undefined' && cvData.name) {
        const currentYear = new Date().getFullYear();
        footerElement.innerHTML = 
            `&copy; ${currentYear} ${cvData.name}. All rights reserved. | 
             <a href="${cvData.contact.github}" target="_blank">GitHub</a> | 
             <a href="${cvData.contact.linkedin}" target="_blank">LinkedIn</a>`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadPostMetadata();    // Load post metadata from posts-data.js
    loadAuthorInfo();    // Load author info from data.js
    loadFooter();        // Load footer from data.js
});
