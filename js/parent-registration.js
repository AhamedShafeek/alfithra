import { createUser } from '../js/database.js';

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('parent-registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleParentRegistration);
    }
    
    // Add password confirmation validation
    const passwordField = document.getElementById('parent-password');
    const confirmPasswordField = document.getElementById('parent-confirm-password');
    
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
    }
});

async function handleParentRegistration(e) {
    e.preventDefault();
    
    // Clear previous messages
    hideMessages();
    
    // Get form data
    const firstName = document.getElementById('parent-firstname').value.trim();
    const lastName = document.getElementById('parent-lastname').value.trim();
    const email = document.getElementById('parent-email').value.trim();
    const phone = document.getElementById('parent-phone').value.trim();
    const username = document.getElementById('parent-username').value.trim();
    const password = document.getElementById('parent-password').value;
    const confirmPassword = document.getElementById('parent-confirm-password').value;
    const emergencyContactName = document.getElementById('emergency-contact-name').value.trim();
    const emergencyContactPhone = document.getElementById('emergency-contact-phone').value.trim();
    const emergencyContactRelation = document.getElementById('emergency-contact-relation').value;
    const termsAgreement = document.getElementById('terms-agreement').checked;
    
    // Validation
    if (!validateForm(firstName, lastName, email, phone, username, password, confirmPassword, 
                     emergencyContactName, emergencyContactPhone, emergencyContactRelation, termsAgreement)) {
        return;
    }
    
    try {
        // Create parent user
        const result = await createUser(username, password, 'parent', `${firstName} ${lastName}`);
        
        if (result.success) {
            // Store additional parent information
            await storeParentDetails(username, {
                firstName,
                lastName,
                email,
                phone,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelation,
                registrationDate: new Date()
            });
            
            showSuccessMessage('Account created successfully! You can now login with your credentials.');
            
            // Clear form
            document.getElementById('parent-registration-form').reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 3000);
            
        } else {
            showErrorMessage(result.error.message || 'Failed to create account. Please try again.');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage('An error occurred during registration. Please try again.');
    }
}

function validateForm(firstName, lastName, email, phone, username, password, confirmPassword, 
                     emergencyContactName, emergencyContactPhone, emergencyContactRelation, termsAgreement) {
    
    if (!firstName || !lastName) {
        showErrorMessage('Please enter your first and last name.');
        return false;
    }
    
    if (!email || !isValidEmail(email)) {
        showErrorMessage('Please enter a valid email address.');
        return false;
    }
    
    if (!phone || phone.length < 10) {
        showErrorMessage('Please enter a valid phone number.');
        return false;
    }
    
    if (!username || username.length < 3) {
        showErrorMessage('Username must be at least 3 characters long.');
        return false;
    }
    
    if (password.length < 6) {
        showErrorMessage('Password must be at least 6 characters long.');
        return false;
    }
    
    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match.');
        return false;
    }
    
    if (!emergencyContactName || !emergencyContactPhone || !emergencyContactRelation) {
        showErrorMessage('Please fill in all emergency contact information.');
        return false;
    }
    
    if (!termsAgreement) {
        showErrorMessage('Please agree to the terms and conditions.');
        return false;
    }
    
    return true;
}

function validatePasswordMatch() {
    const password = document.getElementById('parent-password').value;
    const confirmPassword = document.getElementById('parent-confirm-password').value;
    
    if (confirmPassword && password !== confirmPassword) {
        document.getElementById('parent-confirm-password').style.borderColor = '#e74c3c';
    } else {
        document.getElementById('parent-confirm-password').style.borderColor = '#ddd';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function storeParentDetails(username, details) {
    try {
        const { db } = await import('../js/firebase-config.js');
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js');
        
        await setDoc(doc(db, "parentDetails", username), details);
    } catch (error) {
        console.error('Error storing parent details:', error);
    }
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    hideErrorMessage();
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    hideSuccessMessage();
}

function hideMessages() {
    hideSuccessMessage();
    hideErrorMessage();
}

function hideSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

function hideErrorMessage() {
    document.getElementById('error-message').style.display = 'none';
}

// Terms and Privacy functions
window.showTerms = function() {
    alert('Terms and Conditions:\n\n1. Parents are responsible for providing accurate information.\n2. The preschool reserves the right to update policies.\n3. Parents must notify the school of any changes in contact information.\n4. The school will maintain confidentiality of student information.\n5. Parents agree to follow school policies and procedures.');
};

window.showPrivacy = function() {
    alert('Privacy Policy:\n\n1. We collect information necessary for student care and communication.\n2. Information is stored securely and not shared with third parties.\n3. Parents can request to view or update their information.\n4. We use information only for educational and communication purposes.\n5. Data is retained according to educational record requirements.');
};

