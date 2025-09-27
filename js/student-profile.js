import { checkAuth } from './auth.js';
import { getStudents, getAttendanceByStudent, getActivitiesByStudent } from './database.js';

// Get student ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    if (!studentId) {
        alert('No student ID provided');
        goBack();
        return;
    }
    
    await loadStudentProfile(studentId);
});

async function loadStudentProfile(studentId) {
    try {
        // Load student information
        const students = await getStudents();
        const student = students.find(s => s.id === studentId);
        
        if (!student) {
            alert('Student not found');
            goBack();
            return;
        }
        
        // Display basic information
        document.getElementById('student-name').textContent = student.name;
        document.getElementById('student-class').textContent = `Class: ${student.className}`;
        document.getElementById('full-name').textContent = student.name;
        document.getElementById('age').textContent = student.age;
        document.getElementById('class-name').textContent = student.className;
        document.getElementById('parent-name').textContent = student.parentName;
        document.getElementById('contact-parent-name').textContent = student.parentName;
        document.getElementById('parent-username').textContent = student.parentUsername;
        
        // Format enrollment date
        const enrollmentDate = student.createdAt?.toDate ? 
            student.createdAt.toDate() : 
            new Date(student.createdAt);
        document.getElementById('enrollment-date').textContent = enrollmentDate.toLocaleDateString();
        
        // Load attendance data
        await loadAttendanceData(studentId);
        
        // Load activities data
        await loadActivitiesData(studentId);
        
    } catch (error) {
        console.error('Error loading student profile:', error);
        alert('Error loading student profile');
    }
}

async function loadAttendanceData(studentId) {
    try {
        const attendance = await getAttendanceByStudent(studentId);
        
        if (attendance.length === 0) {
            document.getElementById('total-days').textContent = '0';
            return;
        }
        
        // Calculate attendance statistics
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;
        const lateDays = attendance.filter(a => a.status === 'late').length;
        
        // Calculate percentages
        const presentPercentage = Math.round((presentDays / totalDays) * 100);
        const absentPercentage = Math.round((absentDays / totalDays) * 100);
        const latePercentage = Math.round((lateDays / totalDays) * 100);
        
        // Update display
        document.getElementById('total-days').textContent = totalDays;
        document.getElementById('present-percentage').textContent = `${presentPercentage}%`;
        document.getElementById('absent-percentage').textContent = `${absentPercentage}%`;
        document.getElementById('late-percentage').textContent = `${latePercentage}%`;
        
        // Update progress bars
        document.getElementById('present-bar').style.width = `${presentPercentage}%`;
        document.getElementById('absent-bar').style.width = `${absentPercentage}%`;
        document.getElementById('late-bar').style.width = `${latePercentage}%`;
        
    } catch (error) {
        console.error('Error loading attendance data:', error);
    }
}

async function loadActivitiesData(studentId) {
    try {
        const activities = await getActivitiesByStudent(studentId);
        const timelineContainer = document.getElementById('activity-timeline');
        
        if (activities.length === 0) {
            timelineContainer.innerHTML = '<p>No activities recorded yet.</p>';
            return;
        }
        
        // Sort activities by date (most recent first)
        activities.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        // Display recent activities (last 10)
        const recentActivities = activities.slice(0, 10);
        timelineContainer.innerHTML = '';
        
        recentActivities.forEach(activity => {
            const date = activity.createdAt?.toDate ? 
                activity.createdAt.toDate() : 
                new Date(activity.createdAt);
            
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-date">${date.toLocaleDateString()}</div>
                <div class="timeline-content">
                    <div class="timeline-activity">${activity.activityType}</div>
                    <div class="timeline-description">${activity.description}</div>
                </div>
            `;
            timelineContainer.appendChild(timelineItem);
        });
        
    } catch (error) {
        console.error('Error loading activities data:', error);
        document.getElementById('activity-timeline').innerHTML = '<p>Error loading activities.</p>';
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

function sendMessageToParent() {
    // Get parent username from the displayed information
    const parentUsername = document.getElementById('parent-username').textContent;
    
    if (parentUsername && parentUsername !== '-') {
        // Redirect to message sending with pre-filled recipient
        const messageUrl = `send-message.html?recipient=${encodeURIComponent(parentUsername)}`;
        window.location.href = messageUrl;
    } else {
        alert('Parent information not available');
    }
}

// Make functions globally available
window.goBack = goBack;
window.sendMessageToParent = sendMessageToParent;

