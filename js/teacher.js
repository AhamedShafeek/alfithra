import { checkAuth } from './auth.js';
import { 
    getStudents, updateStudent,
    recordAttendance, logActivity, sendMessage
} from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in and has teacher role
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'teacher') {
    window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Display username in the header
    document.getElementById('user-name').textContent = currentUser.name;
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Load students data
    await loadStudents();
    
    // Set up event listeners
    document.getElementById('take-attendance-form').addEventListener('submit', handleTakeAttendance);
    document.getElementById('log-activity-form').addEventListener('submit', handleLogActivity);
    document.getElementById('send-message-form').addEventListener('submit', handleSendMessage);
    
    // Set up modal triggers
    document.getElementById('take-attendance-btn').addEventListener('click', () => {
        document.getElementById('take-attendance-modal').style.display = 'block';
        populateStudentDropdowns('attendance-student');
    });
    
    document.getElementById('log-activity-btn').addEventListener('click', () => {
        document.getElementById('log-activity-modal').style.display = 'block';
        populateStudentDropdowns('activity-student');
    });
    
    document.getElementById('send-message-btn').addEventListener('click', () => {
        document.getElementById('send-message-modal').style.display = 'block';
        loadParentsForMessaging();
    });
    
    // Set up close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
});

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
                <button class="btn-secondary log-activity" data-id="${student.id}" data-name="${student.name}">Log Activity</button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-student').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            // Logic to view student details
            alert(`View student details for ID: ${studentId}`);
        });
    });
    
    document.querySelectorAll('.log-activity').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            const studentName = button.getAttribute('data-name');
            
            document.getElementById('log-activity-modal').style.display = 'block';
            document.getElementById('activity-student').value = studentId;
            document.getElementById('activity-student-name').textContent = studentName;
        });
    });
    
    // Update stats
    document.getElementById('student-count').textContent = students.length;
}

// Populate student dropdowns
async function populateStudentDropdowns(selectId) {
    const students = await getStudents();
    const select = document.getElementById(selectId);
    
    select.innerHTML = '<option value="">Select a student</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

// Load parents for messaging
async function loadParentsForMessaging() {
    const students = await getStudents();
    const parentSelect = document.getElementById('message-recipient');
    
    parentSelect.innerHTML = '<option value="">Select a parent</option>';
    
    // Create a unique list of parents
    const uniqueParents = {};
    
    students.forEach(student => {
        if (student.parentUsername && !uniqueParents[student.parentUsername]) {
            uniqueParents[student.parentUsername] = student.parentName;
        }
    });
    
    for (const username in uniqueParents) {
        const option = document.createElement('option');
        option.value = username;
        option.textContent = uniqueParents[username];
        parentSelect.appendChild(option);
    }
}

// Handle take attendance form submission
async function handleTakeAttendance(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('attendance-student').value;
    const status = document.getElementById('attendance-status').value;
    const notes = document.getElementById('attendance-notes').value;
    
    const result = await recordAttendance({
        studentId,
        status,
        notes,
        recordedBy: currentUser.username
    });
    
    if (result.success) {
        document.getElementById('take-attendance-modal').style.display = 'none';
        document.getElementById('take-attendance-form').reset();
        alert('Attendance recorded successfully');
    } else {
        alert('Error recording attendance: ' + result.error.message);
    }
}

// Handle log activity form submission
async function handleLogActivity(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('activity-student').value;
    const activityType = document.getElementById('activity-type').value;
    const description = document.getElementById('activity-description').value;
    
    const result = await logActivity({
        studentId,
        activityType,
        description,
        recordedBy: currentUser.username
    });
    
    if (result.success) {
        document.getElementById('log-activity-modal').style.display = 'none';
        document.getElementById('log-activity-form').reset();
        alert('Activity logged successfully');
    } else {
        alert('Error logging activity: ' + result.error.message);
    }
}

// Handle send message form submission
async function handleSendMessage(e) {
    e.preventDefault();
    
    const recipientUsername = document.getElementById('message-recipient').value;
    const subject = document.getElementById('message-subject').value;
    const content = document.getElementById('message-content').value;
    
    const result = await sendMessage({
        senderUsername: currentUser.username,
        senderName: currentUser.name,
        recipientUsername,
        subject,
        content
    });
    
    if (result.success) {
        document.getElementById('send-message-modal').style.display = 'none';
        document.getElementById('send-message-form').reset();
        alert('Message sent successfully');
    } else {
        alert('Error sending message: ' + result.error.message);
    }
}