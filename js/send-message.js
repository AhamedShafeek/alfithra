import { checkAuth } from './auth.js';
import { sendMessage, getUsers, getStudents } from './database.js';

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

// Get recipient from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const preSelectedRecipient = urlParams.get('recipient');

document.addEventListener('DOMContentLoaded', async function() {
    await loadRecipients();
    
    // Set up form event listeners
    document.getElementById('send-message-form').addEventListener('submit', handleSendMessage);
    document.getElementById('message-recipient').addEventListener('change', handleRecipientChange);
    
    // Set up character counters
    document.getElementById('message-subject').addEventListener('input', updateCharacterCount);
    document.getElementById('message-content').addEventListener('input', updateCharacterCount);
    
    // Pre-select recipient if provided in URL
    if (preSelectedRecipient) {
        document.getElementById('message-recipient').value = preSelectedRecipient;
        handleRecipientChange();
    }
});

async function loadRecipients() {
    try {
        const users = await getUsers();
        const students = await getStudents();
        const recipientSelect = document.getElementById('message-recipient');
        
        // Clear existing options except the first one
        recipientSelect.innerHTML = '<option value="">Select recipient...</option>';
        
        // Add users based on current user's role
        if (currentUser.role === 'admin') {
            // Admin can message anyone
            users.forEach(user => {
                if (user.username !== currentUser.username) {
                    const option = document.createElement('option');
                    option.value = user.username;
                    option.textContent = `${user.name} (${user.role})`;
                    option.dataset.role = user.role;
                    option.dataset.name = user.name;
                    recipientSelect.appendChild(option);
                }
            });
        } else if (currentUser.role === 'teacher') {
            // Teachers can message parents
            users.forEach(user => {
                if (user.role === 'parent') {
                    const option = document.createElement('option');
                    option.value = user.username;
                    option.textContent = `${user.name} (Parent)`;
                    option.dataset.role = user.role;
                    option.dataset.name = user.name;
                    recipientSelect.appendChild(option);
                }
            });
        } else if (currentUser.role === 'parent') {
            // Parents can message teachers
            users.forEach(user => {
                if (user.role === 'teacher') {
                    const option = document.createElement('option');
                    option.value = user.username;
                    option.textContent = `${user.name} (Teacher)`;
                    option.dataset.role = user.role;
                    option.dataset.name = user.name;
                    recipientSelect.appendChild(option);
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading recipients:', error);
        showErrorMessage('Error loading recipients. Please try again.');
    }
}

function handleRecipientChange() {
    const recipientSelect = document.getElementById('message-recipient');
    const selectedOption = recipientSelect.options[recipientSelect.selectedIndex];
    const recipientInfo = document.getElementById('recipient-info');
    
    if (selectedOption.value) {
        const recipientName = selectedOption.dataset.name;
        const recipientRole = selectedOption.dataset.role;
        
        document.getElementById('recipient-name').textContent = recipientName;
        document.getElementById('recipient-role').textContent = `Role: ${recipientRole.charAt(0).toUpperCase() + recipientRole.slice(1)}`;
        
        // Add additional details based on role
        if (recipientRole === 'parent') {
            document.getElementById('recipient-details').textContent = 'You can send updates about their child\'s progress, attendance, and activities.';
        } else if (recipientRole === 'teacher') {
            document.getElementById('recipient-details').textContent = 'You can ask questions about your child\'s education and activities.';
        } else {
            document.getElementById('recipient-details').textContent = 'Administrative communication.';
        }
        
        recipientInfo.style.display = 'block';
    } else {
        recipientInfo.style.display = 'none';
    }
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const recipientUsername = document.getElementById('message-recipient').value;
    const subject = document.getElementById('message-subject').value.trim();
    const content = document.getElementById('message-content').value.trim();
    const priority = document.getElementById('message-priority').value;
    
    // Validation
    if (!recipientUsername) {
        showErrorMessage('Please select a recipient');
        return;
    }
    
    if (!subject) {
        showErrorMessage('Please enter a subject');
        return;
    }
    
    if (!content) {
        showErrorMessage('Please enter a message');
        return;
    }
    
    if (content.length < 10) {
        showErrorMessage('Message must be at least 10 characters long');
        return;
    }
    
    try {
        const result = await sendMessage({
            senderUsername: currentUser.username,
            senderName: currentUser.name,
            recipientUsername,
            subject,
            content,
            priority,
            read: false,
            createdAt: new Date()
        });
        
        if (result.success) {
            showSuccessMessage('Message sent successfully!');
            
            // Clear form
            document.getElementById('send-message-form').reset();
            document.getElementById('recipient-info').style.display = 'none';
            updateCharacterCount();
            
            // Redirect after 2 seconds
            setTimeout(() => {
                goBack();
            }, 2000);
            
        } else {
            showErrorMessage(result.error.message || 'Failed to send message. Please try again.');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showErrorMessage('An error occurred while sending the message. Please try again.');
    }
}

function updateCharacterCount() {
    const subjectField = document.getElementById('message-subject');
    const contentField = document.getElementById('message-content');
    const subjectCount = document.getElementById('subject-count');
    const contentCount = document.getElementById('content-count');
    
    const subjectLength = subjectField.value.length;
    const contentLength = contentField.value.length;
    
    // Update subject count
    subjectCount.textContent = `${subjectLength}/100`;
    if (subjectLength > 80) {
        subjectCount.className = 'character-count warning';
    } else if (subjectLength >= 100) {
        subjectCount.className = 'character-count error';
    } else {
        subjectCount.className = 'character-count';
    }
    
    // Update content count
    contentCount.textContent = `${contentLength}/1000`;
    if (contentLength > 800) {
        contentCount.className = 'character-count warning';
    } else if (contentLength >= 1000) {
        contentCount.className = 'character-count error';
    } else {
        contentCount.className = 'character-count';
    }
}

function goBack() {
    // Determine which dashboard to go back to based on user role
    switch (currentUser.role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'teacher':
            window.location.href = 'teacher-dashboard.html';
            break;
        case 'parent':
            window.location.href = 'parent-dashboard.html';
            break;
        default:
            window.location.href = '../index.html';
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

function hideSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

function hideErrorMessage() {
    document.getElementById('error-message').style.display = 'none';
}

// Make functions globally available
window.goBack = goBack;


