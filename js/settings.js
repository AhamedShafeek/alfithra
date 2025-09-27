import { checkAuth } from './auth.js';
import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Display user information
    document.getElementById('user-display-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    
    // Load user profile data
    await loadUserProfile();
    
    // Set up form event listeners
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
    
    // Set up notification toggles
    setupNotificationToggles();
});

async function loadUserProfile() {
    try {
        // Try to get additional user details
        const userDetailsRef = doc(db, "userDetails", currentUser.username);
        const userDetailsSnap = await getDoc(userDetailsRef);
        
        if (userDetailsSnap.exists()) {
            const userDetails = userDetailsSnap.data();
            
            // Populate form fields
            document.getElementById('first-name').value = userDetails.firstName || '';
            document.getElementById('last-name').value = userDetails.lastName || '';
            document.getElementById('email').value = userDetails.email || '';
            document.getElementById('phone').value = userDetails.phone || '';
            
            // Load notification preferences
            document.getElementById('email-notifications').checked = userDetails.emailNotifications !== false;
            document.getElementById('attendance-alerts').checked = userDetails.attendanceAlerts !== false;
            document.getElementById('activity-updates').checked = userDetails.activityUpdates !== false;
            document.getElementById('message-notifications').checked = userDetails.messageNotifications !== false;
        } else {
            // If no additional details exist, try to parse name
            const nameParts = currentUser.name.split(' ');
            document.getElementById('first-name').value = nameParts[0] || '';
            document.getElementById('last-name').value = nameParts.slice(1).join(' ') || '';
        }
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        showErrorMessage('Error loading profile data');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!firstName || !lastName) {
        showErrorMessage('First name and last name are required');
        return;
    }
    
    try {
        // Update user details
        const userDetailsRef = doc(db, "userDetails", currentUser.username);
        await setDoc(userDetailsRef, {
            firstName,
            lastName,
            email,
            phone,
            updatedAt: new Date()
        }, { merge: true });
        
        // Update main user record
        const userRef = doc(db, "users", currentUser.username);
        await updateDoc(userRef, {
            name: `${firstName} ${lastName}`,
            updatedAt: new Date()
        });
        
        // Update session storage
        sessionStorage.setItem('currentUser', JSON.stringify({
            ...currentUser,
            name: `${firstName} ${lastName}`
        }));
        
        showSuccessMessage('Profile updated successfully!');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showErrorMessage('Error updating profile. Please try again.');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showErrorMessage('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        showErrorMessage('New password must be at least 6 characters long');
        return;
    }
    
    try {
        // Verify current password
        const userRef = doc(db, "users", currentUser.username);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            showErrorMessage('User not found');
            return;
        }
        
        const userData = userSnap.data();
        if (userData.password !== currentPassword) {
            showErrorMessage('Current password is incorrect');
            return;
        }
        
        // Update password
        await updateDoc(userRef, {
            password: newPassword,
            updatedAt: new Date()
        });
        
        showSuccessMessage('Password changed successfully!');
        document.getElementById('password-form').reset();
        
    } catch (error) {
        console.error('Error changing password:', error);
        showErrorMessage('Error changing password. Please try again.');
    }
}

function setupNotificationToggles() {
    const toggles = [
        'email-notifications',
        'attendance-alerts',
        'activity-updates',
        'message-notifications'
    ];
    
    toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        toggle.addEventListener('change', async () => {
            await updateNotificationPreference(toggleId, toggle.checked);
        });
    });
}

async function updateNotificationPreference(preference, value) {
    try {
        const userDetailsRef = doc(db, "userDetails", currentUser.username);
        await setDoc(userDetailsRef, {
            [preference]: value,
            updatedAt: new Date()
        }, { merge: true });
        
    } catch (error) {
        console.error('Error updating notification preference:', error);
        // Revert the toggle
        document.getElementById(preference).checked = !value;
        showErrorMessage('Error updating notification preference');
    }
}

function deleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (confirmed) {
        const doubleConfirmed = confirm('This will permanently delete your account and all associated data. Are you absolutely sure?');
        
        if (doubleConfirmed) {
            // In a real application, you would implement proper account deletion
            alert('Account deletion functionality would be implemented here. For security reasons, please contact the administrator.');
        }
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
    
    // Hide after 5 seconds
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    hideSuccessMessage();
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

function hideErrorMessage() {
    document.getElementById('error-message').style.display = 'none';
}

// Make functions globally available
window.goBack = goBack;
window.deleteAccount = deleteAccount;

