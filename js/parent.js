import { checkAuth } from './auth.js';
import { 
    getStudentsByParent, getAttendanceByStudent,
    getActivitiesByStudent, getMessagesByUser,
    markMessageAsRead, sendMessage
} from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in and has parent role
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'parent') {
    window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Display username in the header
    document.getElementById('user-name').textContent = currentUser.name;
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Load data
    await loadStudents();
    await loadMessages();
    
    // Set up event listeners
    document.getElementById('send-message-form').addEventListener('submit', handleSendMessage);
    
    // Set up modal triggers
    document.getElementById('send-message-btn').addEventListener('click', () => {
        document.getElementById('send-message-modal').style.display = 'block';
    });
    
    // Set up close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Set up tab navigation
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to current tab
            tab.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Show current tab content
            const contentId = tab.getAttribute('data-tab');
            document.getElementById(contentId).style.display = 'block';
        });
    });
    
    // Activate first tab by default
    tabs[0].click();
});

// Load students data
async function loadStudents() {
    const students = await getStudentsByParent(currentUser.username);
    const studentsList = document.getElementById('students-list');
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
        studentsList.innerHTML = '<p>No students found.</p>';
        return;
    }
    
    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'card';
        studentCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${student.name}</h3>
            </div>
            <div class="student-details">
                <p><strong>Age:</strong> ${student.age}</p>
                <p><strong>Class:</strong> ${student.className}</p>
            </div>
            <div class="student-actions">
                <button class="btn-secondary view-attendance" data-id="${student.id}">View Attendance</button>
                <button class="btn-secondary view-activities" data-id="${student.id}">View Activities</button>
            </div>
        `;
        studentsList.appendChild(studentCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-attendance').forEach(button => {
        button.addEventListener('click', async () => {
            const studentId = button.getAttribute('data-id');
            await loadAttendance(studentId);
            
            // Switch to attendance tab
            document.querySelector('[data-tab="attendance-tab"]').click();
        });
    });
    
    document.querySelectorAll('.view-activities').forEach(button => {
        button.addEventListener('click', async () => {
            const studentId = button.getAttribute('data-id');
            await loadActivities(studentId);
            
            // Switch to activities tab
            document.querySelector('[data-tab="activities-tab"]').click();
        });
    });
    
    // Update stats
    document.getElementById('student-count').textContent = students.length;
}

// Load attendance data
async function loadAttendance(studentId) {
    const attendanceList = document.getElementById('attendance-list');
    attendanceList.innerHTML = '<p>Loading attendance data...</p>';
    
    const attendance = await getAttendanceByStudent(studentId);
    
    attendanceList.innerHTML = '';
    
    if (attendance.length === 0) {
        attendanceList.innerHTML = '<p>No attendance records found.</p>';
        return;
    }
    
    attendance.forEach(record => {
        const date = new Date(record.date?.toDate ? record.date.toDate() : record.date).toLocaleDateString();
        const attendanceCard = document.createElement('div');
        attendanceCard.className = 'card';
        attendanceCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">Date: ${date}</h3>
            </div>
            <div class="attendance-details">
                <p><strong>Status:</strong> ${record.status}</p>
                <p><strong>Notes:</strong> ${record.notes || 'None'}</p>
            </div>
        `;
        attendanceList.appendChild(attendanceCard);
    });
}

// Load activities data
async function loadActivities(studentId) {
    const activitiesList = document.getElementById('activities-list');
    activitiesList.innerHTML = '<p>Loading activities data...</p>';
    
    const activities = await getActivitiesByStudent(studentId);
    
    activitiesList.innerHTML = '';
    
    if (activities.length === 0) {
        activitiesList.innerHTML = '<p>No activities found.</p>';
        return;
    }
    
    activities.forEach(activity => {
        const date = new Date(activity.createdAt?.toDate ? activity.createdAt.toDate() : activity.createdAt).toLocaleDateString();
        const activityCard = document.createElement('div');
        activityCard.className = 'card';
        activityCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${activity.activityType}</h3>
                <span>${date}</span>
            </div>
            <div class="activity-details">
                <p>${activity.description}</p>
            </div>
        `;
        activitiesList.appendChild(activityCard);
    });
}

// Load messages
async function loadMessages() {
    const messages = await getMessagesByUser(currentUser.username);
    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';
    
    if (messages.length === 0) {
        messagesList.innerHTML = '<p>No messages found.</p>';
        return;
    }
    
    messages.forEach(message => {
        const date = new Date(message.createdAt?.toDate ? message.createdAt.toDate() : message.createdAt).toLocaleDateString();
        const messageCard = document.createElement('div');
        messageCard.className = `card ${message.read ? '' : 'unread'}`;
        messageCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${message.subject}</h3>
                <span>${date}</span>
            </div>
            <div class="message-details">
                <p><strong>From:</strong> ${message.senderName}</p>
                <p>${message.content}</p>
            </div>
        `;
        
        // If message is unread, add a button to mark it as read
        if (!message.read) {
            const readButton = document.createElement('button');
            readButton.className = 'btn-secondary';
            readButton.textContent = 'Mark as Read';
            readButton.addEventListener('click', async () => {
                const result = await markMessageAsRead(message.id);
                if (result.success) {
                    messageCard.classList.remove('unread');
                    readButton.remove();
                    // Update unread count
                    const unreadCount = document.querySelectorAll('.card.unread').length;
                    document.getElementById('unread-count').textContent = unreadCount;
                }
            });
            messageCard.querySelector('.message-details').appendChild(readButton);
        }
        
        messagesList.appendChild(messageCard);
    });
    
    // Update unread count
    const unreadCount = messages.filter(message => !message.read).length;
    document.getElementById('unread-count').textContent = unreadCount;
}

// Handle send message form submission
async function handleSendMessage(e) {
    e.preventDefault();
    
    // In the parent's case, we'll assume they're sending messages to teachers
    const subject = document.getElementById('message-subject').value;
    const content = document.getElementById('message-content').value;
    
    // Here we would need to get teachers from the database
    // For simplicity, we're hardcoding a recipient
    const recipientUsername = "teacher"; // This should be dynamic in a real app
    
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