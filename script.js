$(document).ready(function() {
    // Show loading state
    $('.container').prepend('<div class="loading">Loading CV data</div>');
    
    // Fetch GitHub user data
    const githubUsername = cvData.contact.githubDisplay.split('/').pop();
    
    $.getJSON(`https://api.github.com/users/${githubUsername}`, function(githubData) {
        // Update profile image from GitHub
        $('#profile-img').attr('src', githubData.avatar_url);
        
        // Optionally update name from GitHub if not set
        if (!cvData.name || cvData.name === '') {
            $('#name').text(githubData.name || githubData.login);
        } else {
            $('#name').text(cvData.name);
        }
        
        // Remove loading state
        $('.loading').remove();
    }).fail(function() {
        // Fallback to local data if GitHub API fails
        console.log('GitHub API unavailable, using local data');
        $('#profile-img').attr('src', cvData.image);
        $('#name').text(cvData.name);
        $('.loading').remove();
    });
    
    // Update page title
    document.title = `${cvData.name} - ${cvData.title}`;
    
    // Populate title and other info
    $('#title').text(cvData.title);
    $('#phone').attr('href', 'tel:' + cvData.contact.phone.replace(/\D/g, '')).attr('data-tooltip', cvData.contact.phone);
    $('#email').attr('href', 'mailto:' + cvData.contact.email).attr('data-tooltip', cvData.contact.email);
    $('#address').attr('href', cvData.contact.addressLink).attr('data-tooltip', cvData.contact.address);
    $('#linkedin').attr('href', cvData.contact.linkedin).attr('data-tooltip', cvData.contact.linkedinDisplay);
    $('#github').attr('href', cvData.contact.github).attr('data-tooltip', cvData.contact.githubDisplay);
    
    // Populate summary
    $('#summary').text(cvData.summary);
    
    // Populate skills
    $.each(cvData.skills, function(index, skill) {
        var skillHTML = `
            <div class="skill-item">
                <h3>${skill.category}</h3>
                <p>${skill.items}</p>
            </div>
        `;
        $('#skills').append(skillHTML);
    });
    
    // Populate experience
    $.each(cvData.experience, function(index, exp) {
        var projectsHTML = '<div class="projects"><h4>Key Projects:</h4>';
        
        $.each(exp.projects, function(projIndex, project) {
            projectsHTML += `
                <div class="project">
                    <h5><i class="fas fa-folder"></i> ${project.name}</h5>
                    <p>${project.description}</p>
                </div>
            `;
        });
        
        projectsHTML += '</div>';
        
        var companyLogo = exp.companyLogo 
            ? `<img src="${exp.companyLogo}" alt="${exp.company}" class="company-logo">`
            : `<span class="company">${exp.company}</span>`;
        
        var companyHTML = exp.companyLink 
            ? `<a href="${exp.companyLink}" target="_blank" class="company" data-tooltip="${exp.company}">${companyLogo}</a>`
            : `<span class="company" data-tooltip="${exp.company}">${companyLogo}</span>`;
        
        var experienceHTML = `
            <div class="experience-item">
                <div class="experience-header">
                    <h3>${exp.position}</h3>
                    ${companyHTML}
                    <span class="date">${exp.date}</span>
                </div>
                <p class="experience-summary">${exp.summary}</p>
                ${projectsHTML}
            </div>
        `;
        $('#experience').append(experienceHTML);
    });
    
    // Populate education
    $.each(cvData.education, function(index, edu) {
        var universityHTML = edu.universityLink 
            ? `<a href="${edu.universityLink}" target="_blank" class="university-link">${edu.university} <i class="fas fa-external-link-alt" style="font-size: 0.7em; margin-left: 5px;"></i></a>`
            : `<p class="university">${edu.university}</p>`;
        
        var educationHTML = `
            <div class="education-item">
                <h3>${edu.degree}</h3>
                ${universityHTML}
                <p class="cgpa">CGPA: ${edu.cgpa}</p>
                <p class="date">${edu.date}</p>
            </div>
        `;
        $('#education').append(educationHTML);
    });
    
    // Populate additional information
    $.each(cvData.additionalInfo, function(index, info) {
        var titleHTML = info.link 
            ? `<a href="${info.link}" target="_blank" class="info-title"><i class="fas fa-${info.icon}"></i> ${info.title} <i class="fas fa-external-link-alt" style="font-size: 0.7em; margin-left: 8px;"></i></a>`
            : `<h3><i class="fas fa-${info.icon}"></i> ${info.title}</h3>`;
        
        var infoHTML = `
            <div class="additional-item">
                ${titleHTML}
                <p>${info.description}</p>
            </div>
        `;
        $('#additional-info').append(infoHTML);
    });
    
    // Populate footer copyright
    const currentYear = new Date().getFullYear();
    $('#footer-copyright').text(`&copy; ${currentYear} ${cvData.name}. All rights reserved.`);
    
    // Add fade-in animation to sections
    $('.section').hide().fadeIn(500);
    
    // Add smooth scroll behavior
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 20
            }, 800);
        }
    });
});
