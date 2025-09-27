import { checkAuth } from './auth.js';
import { getStudents, logActivity, getActivitiesByStudent } from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

let allStudents = [];
let allActivities = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activity-date-filter').value = today;
    
    // Load data
    await loadStudents();
    await loadActivities();
    
    // Set up event listeners
    document.getElementById('log-activity-form').addEventListener('submit', handleLogActivity);
    document.getElementById('log-activity-btn').addEventListener('click', () => {
        document.getElementById('log-activity-modal').style.display = 'block';
        populateStudentDropdowns();
    });
    
    document.getElementById('activity-date-filter').addEventListener('change', loadActivities);
    document.getElementById('activity-type-filter').addEventListener('change', filterActivities);
    document.getElementById('activity-student-filter').addEventListener('change', filterActivities);
    
    document.getElementById('export-activities-btn').addEventListener('click', exportActivities);
    
    // Set up close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
});

async function loadStudents() {
    try {
        allStudents = await getStudents();
        populateStudentFilter();
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadActivities() {
    try {
        const selectedDate = document.getElementById('activity-date-filter').value;
        const date = new Date(selectedDate);
        
        // Load activities for all students
        const activityPromises = allStudents.map(student => 
            getActivitiesByStudent(student.id)
        );
        
        const allStudentActivities = await Promise.all(activityPromises);
        allActivities = allStudentActivities.flat().filter(activity => {
            const activityDate = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
            return activityDate.toDateString() === date.toDateString();
        });
        
        displayActivities();
        updateActivityStats();
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function displayActivities() {
    const activitiesTableBody = document.querySelector('#activities-table tbody');
    activitiesTableBody.innerHTML = '';
    
    const typeFilter = document.getElementById('activity-type-filter').value;
    const studentFilter = document.getElementById('activity-student-filter').value;
    
    let filteredActivities = allActivities;
    
    if (typeFilter) {
        filteredActivities = filteredActivities.filter(activity => activity.activityType === typeFilter);
    }
    
    if (studentFilter) {
        filteredActivities = filteredActivities.filter(activity => activity.studentId === studentFilter);
    }
    
    // Sort by creation time (newest first)
    filteredActivities.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
    });
    
    if (filteredActivities.length === 0) {
        activitiesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No activities found for this date</td></tr>';
        return;
    }
    
    filteredActivities.forEach(activity => {
        const student = allStudents.find(s => s.id === activity.studentId);
        if (!student) return;
        
        const row = document.createElement('tr');
        const date = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
        
        row.innerHTML = `
            <td>${student.name}</td>
            <td><span class="activity-type-badge activity-${activity.activityType.toLowerCase()}">${activity.activityType}</span></td>
            <td>${activity.description}</td>
            <td>${date.toLocaleString()}</td>
            <td>${activity.recordedBy || '-'}</td>
            <td>
                <button class="btn-secondary view-activity" data-id="${activity.id}">View</button>
                <button class="btn-secondary edit-activity" data-id="${activity.id}">Edit</button>
            </td>
        `;
        activitiesTableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-activity').forEach(button => {
        button.addEventListener('click', () => {
            const activityId = button.getAttribute('data-id');
            viewActivity(activityId);
        });
    });
    
    document.querySelectorAll('.edit-activity').forEach(button => {
        button.addEventListener('click', () => {
            const activityId = button.getAttribute('data-id');
            editActivity(activityId);
        });
    });
}

function filterActivities() {
    displayActivities();
}

function updateActivityStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayActivities = allActivities.filter(activity => {
        const activityDate = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
        return activityDate.toISOString().split('T')[0] === today;
    });
    
    const weekActivities = allActivities.filter(activity => {
        const activityDate = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
        return activityDate >= weekAgo;
    });
    
    const learningActivities = allActivities.filter(a => a.activityType === 'Learning').length;
    const playActivities = allActivities.filter(a => a.activityType === 'Play').length;
    
    document.getElementById('today-activities').textContent = todayActivities.length;
    document.getElementById('week-activities').textContent = weekActivities.length;
    document.getElementById('learning-activities').textContent = learningActivities;
    document.getElementById('play-activities').textContent = playActivities;
}

function populateStudentFilter() {
    const select = document.getElementById('activity-student-filter');
    select.innerHTML = '<option value="">All Students</option>';
    
    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.className})`;
        select.appendChild(option);
    });
}

function populateStudentDropdowns() {
    const select = document.getElementById('activity-student');
    select.innerHTML = '<option value="">Select a student</option>';
    
    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.className})`;
        select.appendChild(option);
    });
}

async function handleLogActivity(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('activity-student').value;
    const activityType = document.getElementById('activity-type').value;
    const description = document.getElementById('activity-description').value.trim();
    const duration = document.getElementById('activity-duration').value;
    const notes = document.getElementById('activity-notes').value.trim();
    
    // Validation
    if (!studentId || !activityType || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (description.length < 10) {
        alert('Description must be at least 10 characters long');
        return;
    }
    
    try {
        const activityData = {
            studentId,
            activityType,
            description,
            recordedBy: currentUser.username,
            duration: duration ? parseInt(duration) : null,
            notes: notes || ''
        };
        
        const result = await logActivity(activityData);
        
        if (result.success) {
            document.getElementById('log-activity-modal').style.display = 'none';
            document.getElementById('log-activity-form').reset();
            await loadActivities();
            alert('Activity logged successfully');
        } else {
            alert('Error logging activity: ' + result.error.message);
        }
        
    } catch (error) {
        console.error('Error logging activity:', error);
        alert('Error logging activity. Please try again.');
    }
}

function viewActivity(activityId) {
    const activity = allActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    const student = allStudents.find(s => s.id === activity.studentId);
    const date = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
    
    const details = `
Activity Details:
Student: ${student ? student.name : 'Unknown'}
Type: ${activity.activityType}
Description: ${activity.description}
Date: ${date.toLocaleString()}
Duration: ${activity.duration ? activity.duration + ' minutes' : 'Not specified'}
Notes: ${activity.notes || 'None'}
Recorded By: ${activity.recordedBy || 'Unknown'}
    `;
    
    alert(details);
}

async function editActivity(activityId) {
    const activity = allActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    const newDescription = prompt('Enter new description:', activity.description);
    if (newDescription && newDescription.trim() !== activity.description) {
        try {
            const { db } = await import('./firebase-config.js');
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js');
            
            await updateDoc(doc(db, "activities", activityId), {
                description: newDescription.trim(),
                updatedAt: new Date(),
                updatedBy: currentUser.username
            });
            
            alert('Activity updated successfully');
            await loadActivities();
        } catch (error) {
            console.error('Error updating activity:', error);
            alert('Error updating activity');
        }
    }
}

function exportActivities() {
    if (allActivities.length === 0) {
        alert('No activities to export');
        return;
    }
    
    const csvContent = [
        ['Student', 'Activity Type', 'Description', 'Date', 'Recorded By'].join(','),
        ...allActivities.map(activity => {
            const student = allStudents.find(s => s.id === activity.studentId);
            const date = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
            return [
                student ? student.name : 'Unknown',
                activity.activityType,
                `"${activity.description.replace(/"/g, '""')}"`,
                date.toLocaleDateString(),
                activity.recordedBy || 'Unknown'
            ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

