// Blog Posts Data - Centralized metadata for all blog posts

const postsData = {
    "rate-limiting-feature": {
        "title": "Building a Robust API Rate Limiting System for Multi-Tenant E-Commerce Platform",
        "date": "January 3, 2026",
        "category": "Engineering, API Design",
        "tags": "Rate Limiting, .NET 8, Multi-Tenant, E-Commerce, API Security",
        "readingTime": "15 minutes",
        "slug": "rate-limiting-feature-blog-post"
    },
    "disposable-and-using": {
        "title": "Mastering IDisposable and Using Statements in C#: A Complete Guide to Resource Management",
        "date": "January 3, 2026",
        "category": "Engineering, C#",
        "tags": "IDisposable, Using Statement, Resource Management, .NET, Best Practices",
        "readingTime": "12 minutes",
        "slug": "disposable-and-using-blog-post"
    }
};

// Function to load post metadata based on current page
function loadPostMetadataFromData() {
    // Get current file name without extension
    const path = window.location.pathname;
    const fileName = path.split('/').pop().replace('.html', '');
    
    // Find matching post in data
    const postKey = Object.keys(postsData).find(key => postsData[key].slug === fileName);
    
    if (postKey && postsData[postKey]) {
        const post = postsData[postKey];
        
        // Load basic metadata
        const dateElement = document.getElementById('post-date');
        const categoryElement = document.getElementById('post-category');
        const readingTimeElement = document.getElementById('post-reading-time');
        
        if (dateElement) dateElement.textContent = post.date;
        if (categoryElement) categoryElement.textContent = post.category;
        if (readingTimeElement) readingTimeElement.textContent = post.readingTime;
        
        // Load tags
        const tagsContainer = document.getElementById('post-tags');
        if (tagsContainer && post.tags) {
            tagsContainer.innerHTML = ''; // Clear existing content
            
            const tags = post.tags.split(',');
            tags.forEach((tag, index) => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag.trim();
                tagsContainer.appendChild(tagElement);
                // Add space between tags except last one
                if (index < tags.length - 1) {
                    tagsContainer.appendChild(document.createTextNode(' '));
                }
            });
        }
    }
}
