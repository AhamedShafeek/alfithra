import { checkAuth } from './auth.js';
import { 
    createUser, getUsers, createStudent, 
    getStudents, updateStudent 
} from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in and has admin role
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Display username in the header
    document.getElementById('user-name').textContent = currentUser.name;
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Load users and students data
    await loadUsers();
    await loadStudents();
    
    // Set up event listeners
    document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
    document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
    
    // Set up modal triggers
    document.getElementById('add-user-btn').addEventListener('click', () => {
        document.getElementById('add-user-modal').style.display = 'block';
    });
    
    document.getElementById('add-student-btn').addEventListener('click', () => {
        document.getElementById('add-student-modal').style.display = 'block';
    });
    
    // Set up close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
});

// Load users data
async function loadUsers() {
    const users = await getUsers();
    const userTableBody = document.querySelector('#users-table tbody');
    userTableBody.innerHTML = '';
    
    users.forEach(user => {
        if (user.username === 'admin') return; // Skip the admin user
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td>${new Date(user.createdAt?.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary view-user" data-username="${user.username}">View</button>
                <button class="btn-secondary edit-user" data-username="${user.username}">Edit</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
    
    // Add event listeners to view and edit buttons
    document.querySelectorAll('.view-user').forEach(button => {
        button.addEventListener('click', () => {
            const username = button.getAttribute('data-username');
            viewUserDetails(username);
        });
    });
    
    document.querySelectorAll('.edit-user').forEach(button => {
        button.addEventListener('click', () => {
            const username = button.getAttribute('data-username');
            editUser(username);
        });
    });
    
    // Update stats
    const teacherCount = users.filter(user => user.role === 'teacher').length;
    const parentCount = users.filter(user => user.role === 'parent').length;
    
    document.getElementById('teacher-count').textContent = teacherCount;
    document.getElementById('parent-count').textContent = parentCount;
}

// Load students data
async function loadStudents() {
    const students = await getStudents();
    const studentTableBody = document.querySelector('#students-table tbody');
    studentTableBody.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.age}</td>
            <td>${student.className}</td>
            <td>${student.parentName}</td>
            <td>
                <button class="btn-secondary view-student" data-id="${student.id}">View</button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-student').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            // Logic to view student details
            alert(`View student details for ID: ${studentId}`);
        });
    });
    
    // Update stats
    document.getElementById('student-count').textContent = students.length;
}

// Handle add user form submission
async function handleAddUser(e) {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const name = document.getElementById('new-name').value;
    const role = document.getElementById('new-role').value;
    
    const result = await createUser(username, password, role, name);
    
    if (result.success) {
        document.getElementById('add-user-modal').style.display = 'none';
        document.getElementById('add-user-form').reset();
        await loadUsers();
        alert('User created successfully');
    } else {
        alert('Error creating user: ' + result.error.message);
    }
}

// Handle add student form submission
async function handleAddStudent(e) {
    e.preventDefault();
    
    const name = document.getElementById('student-name').value;
    const age = document.getElementById('student-age').value;
    const className = document.getElementById('student-class').value;
    const parentUsername = document.getElementById('parent-username').value;
    const parentName = document.getElementById('parent-name').value;
    
    const result = await createStudent({
        name,
        age,
        className,
        parentUsername,
        parentName
    });
    
    if (result.success) {
        document.getElementById('add-student-modal').style.display = 'none';
        document.getElementById('add-student-form').reset();
        await loadStudents();
        alert('Student added successfully');
    } else {
        alert('Error adding student: ' + result.error.message);
    }
}

// View user details
async function viewUserDetails(username) {
    try {
        const users = await getUsers();
        const user = users.find(u => u.username === username);
        
        if (user) {
            const details = `
                Username: ${user.username}
                Name: ${user.name}
                Role: ${user.role}
                Created: ${new Date(user.createdAt?.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleDateString()}
            `;
            alert(details);
        }
    } catch (error) {
        console.error('Error viewing user details:', error);
        alert('Error loading user details');
    }
}

// Edit user
async function editUser(username) {
    try {
        const users = await getUsers();
        const user = users.find(u => u.username === username);
        
        if (user) {
            const newName = prompt('Enter new name:', user.name);
            if (newName && newName.trim() !== user.name) {
                // Update user name
                const { db } = await import('./firebase-config.js');
                const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js');
                
                await updateDoc(doc(db, "users", username), {
                    name: newName.trim(),
                    updatedAt: new Date()
                });
                
                alert('User updated successfully');
                await loadUsers();
            }
        }
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Error updating user');
    }
}