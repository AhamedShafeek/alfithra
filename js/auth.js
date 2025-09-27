import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Initialize the app with default admin user if needed
async function initializeApp() {
    try {
        // Check if admin user already exists
        const adminRef = doc(db, "users", "admin");
        const adminSnap = await getDoc(adminRef);
        
        if (!adminSnap.exists()) {
            // Create default admin user in Firestore
            await setDoc(doc(db, "users", "admin"), {
                username: "admin",
                password: "admin", // In real app, this should be hashed
                role: "admin",
                name: "System Administrator",
                createdAt: new Date()
            });
            console.log("Default admin user created");
        }
    } catch (error) {
        console.error("Error initializing app:", error);
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add logout event listener to all logout buttons
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', handleLogout);
    });
});

// Custom login function (without Firebase Auth)
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    // Basic validation
    if (!username || !password) {
        errorMessage.textContent = "Please enter both username and password";
        return;
    }
    
    try {
        // Query Firestore to find the user with the given username
        const userRef = doc(db, "users", username);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().password === password) {
            const userData = userSnap.data();
            
            // Store user data in session storage
            sessionStorage.setItem('currentUser', JSON.stringify({
                username: username,
                role: userData.role,
                name: userData.name
            }));
            
            // Redirect based on role
            switch (userData.role) {
                case 'admin':
                    window.location.href = 'pages/admin-dashboard.html';
                    break;
                case 'teacher':
                    window.location.href = 'pages/teacher-dashboard.html';
                    break;
                case 'parent':
                    window.location.href = 'pages/parent-dashboard.html';
                    break;
                default:
                    errorMessage.textContent = "Unknown user role";
            }
        } else {
            errorMessage.textContent = "Invalid username or password";
        }
    } catch (error) {
        console.error("Error logging in:", error);
        errorMessage.textContent = "Login failed. Please try again.";
    }
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    
    // Redirect to login page
    window.location.href = '../index.html';
}

// Check if user is logged in (for protected pages)
export function checkAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = '../index.html';
        return null;
    }
    
    return JSON.parse(currentUser);
}