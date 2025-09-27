import { checkAuth } from './auth.js';
import { getStudents, getAttendanceByStudent, getActivitiesByStudent, getMessagesByUser } from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in and has appropriate permissions
const currentUser = checkAuth();
if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
    window.location.href = '../index.html';
}

let reportData = {
    students: [],
    attendance: [],
    activities: [],
    messages: []
};

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Set up event listeners
    document.getElementById('report-period').addEventListener('change', handlePeriodChange);
    document.getElementById('start-date').addEventListener('change', updateDateRange);
    document.getElementById('end-date').addEventListener('change', updateDateRange);
    
    // Generate initial report
    await generateReport();
});

function handlePeriodChange() {
    const period = document.getElementById('report-period').value;
    const customRange = document.getElementById('custom-date-range');
    const customEndDate = document.getElementById('custom-end-date');
    
    if (period === 'custom') {
        customRange.style.display = 'block';
        customEndDate.style.display = 'block';
    } else {
        customRange.style.display = 'none';
        customEndDate.style.display = 'none';
    }
}

function updateDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date');
        document.getElementById('end-date').value = '';
    }
}

async function generateReport() {
    try {
        showLoading();
        
        // Get date range
        const dateRange = getDateRange();
        
        // Load all data
        await Promise.all([
            loadStudentsData(),
            loadAttendanceData(dateRange),
            loadActivitiesData(dateRange),
            loadMessagesData(dateRange)
        ]);
        
        // Generate reports
        generateSummaryStats();
        generateAttendanceReport();
        generateActivityReport();
        generateMessageReport();
        
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Error generating report. Please try again.');
    }
}

function getDateRange() {
    const period = document.getElementById('report-period').value;
    const now = new Date();
    
    switch (period) {
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return { start: weekAgo, end: now };
        case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return { start: monthAgo, end: now };
        case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            return { start: quarterAgo, end: now };
        case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return { start: yearAgo, end: now };
        case 'custom':
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            if (startDate && endDate) {
                return { start: new Date(startDate), end: new Date(endDate) };
            }
            return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
        default:
            return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    }
}

async function loadStudentsData() {
    const students = await getStudents();
    const classFilter = document.getElementById('class-filter').value;
    
    if (classFilter) {
        reportData.students = students.filter(s => s.className === classFilter);
    } else {
        reportData.students = students;
    }
}

async function loadAttendanceData(dateRange) {
    const attendancePromises = reportData.students.map(student => 
        getAttendanceByStudent(student.id)
    );
    
    const allAttendance = await Promise.all(attendancePromises);
    
    // Filter by date range
    reportData.attendance = allAttendance.flat().filter(record => {
        const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date);
        return recordDate >= dateRange.start && recordDate <= dateRange.end;
    });
}

async function loadActivitiesData(dateRange) {
    const activitiesPromises = reportData.students.map(student => 
        getActivitiesByStudent(student.id)
    );
    
    const allActivities = await Promise.all(activitiesPromises);
    
    // Filter by date range
    reportData.activities = allActivities.flat().filter(activity => {
        const activityDate = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
        return activityDate >= dateRange.start && activityDate <= dateRange.end;
    });
}

async function loadMessagesData(dateRange) {
    // Get all users to load messages
    const { getUsers } = await import('./database.js');
    const users = await getUsers();
    
    const messagePromises = users.map(user => 
        getMessagesByUser(user.username)
    );
    
    const allMessages = await Promise.all(messagePromises);
    
    // Filter by date range
    reportData.messages = allMessages.flat().filter(message => {
        const messageDate = message.createdAt?.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
        return messageDate >= dateRange.start && messageDate <= dateRange.end;
    });
}

function generateSummaryStats() {
    // Total students
    document.getElementById('total-students').textContent = reportData.students.length;
    
    // Attendance rate
    const totalAttendanceRecords = reportData.attendance.length;
    const presentRecords = reportData.attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendanceRecords > 0 ? 
        Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;
    document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
    
    // Total activities
    document.getElementById('total-activities').textContent = reportData.activities.length;
    
    // Total messages
    document.getElementById('total-messages').textContent = reportData.messages.length;
}

function generateAttendanceReport() {
    const attendanceTable = document.getElementById('attendance-table');
    
    if (reportData.attendance.length === 0) {
        attendanceTable.innerHTML = '<div class="no-data">No attendance data found for the selected period.</div>';
        return;
    }
    
    // Group attendance by student
    const attendanceByStudent = {};
    reportData.attendance.forEach(record => {
        if (!attendanceByStudent[record.studentId]) {
            attendanceByStudent[record.studentId] = [];
        }
        attendanceByStudent[record.studentId].push(record);
    });
    
    // Create table
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance Rate</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.students.forEach(student => {
        const studentAttendance = attendanceByStudent[student.id] || [];
        const present = studentAttendance.filter(a => a.status === 'present').length;
        const absent = studentAttendance.filter(a => a.status === 'absent').length;
        const late = studentAttendance.filter(a => a.status === 'late').length;
        const total = present + absent + late;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        tableHTML += `
            <tr>
                <td>${student.name}</td>
                <td>${student.className}</td>
                <td class="status-present">${present}</td>
                <td class="status-absent">${absent}</td>
                <td class="status-late">${late}</td>
                <td>${rate}%</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    attendanceTable.innerHTML = tableHTML;
}

function generateActivityReport() {
    const activitySummary = document.getElementById('activity-summary');
    
    if (reportData.activities.length === 0) {
        activitySummary.innerHTML = '<div class="no-data">No activity data found for the selected period.</div>';
        return;
    }
    
    // Group activities by type
    const activitiesByType = {};
    reportData.activities.forEach(activity => {
        if (!activitiesByType[activity.activityType]) {
            activitiesByType[activity.activityType] = 0;
        }
        activitiesByType[activity.activityType]++;
    });
    
    // Create summary
    let summaryHTML = '<div class="chart-container">';
    summaryHTML += '<h4>Activity Distribution</h4>';
    
    Object.entries(activitiesByType).forEach(([type, count]) => {
        const percentage = Math.round((count / reportData.activities.length) * 100);
        summaryHTML += `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${type}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="background: #4a6fa5; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    });
    
    summaryHTML += '</div>';
    activitySummary.innerHTML = summaryHTML;
}

function generateMessageReport() {
    const messageSummary = document.getElementById('message-summary');
    
    if (reportData.messages.length === 0) {
        messageSummary.innerHTML = '<div class="no-data">No message data found for the selected period.</div>';
        return;
    }
    
    // Group messages by sender role
    const messagesByRole = {};
    reportData.messages.forEach(message => {
        const role = message.senderName || 'Unknown';
        if (!messagesByRole[role]) {
            messagesByRole[role] = 0;
        }
        messagesByRole[role]++;
    });
    
    // Create summary
    let summaryHTML = '<div class="chart-container">';
    summaryHTML += '<h4>Message Statistics</h4>';
    summaryHTML += `<p><strong>Total Messages:</strong> ${reportData.messages.length}</p>`;
    summaryHTML += '<h5>Messages by Sender:</h5>';
    
    Object.entries(messagesByRole).forEach(([sender, count]) => {
        summaryHTML += `<p>${sender}: ${count} messages</p>`;
    });
    
    summaryHTML += '</div>';
    messageSummary.innerHTML = summaryHTML;
}

function exportAttendance(format) {
    if (reportData.attendance.length === 0) {
        alert('No attendance data to export');
        return;
    }
    
    if (format === 'csv') {
        exportToCSV('attendance', reportData.attendance);
    } else if (format === 'pdf') {
        alert('PDF export functionality would be implemented here');
    }
}

function exportActivities(format) {
    if (reportData.activities.length === 0) {
        alert('No activity data to export');
        return;
    }
    
    if (format === 'csv') {
        exportToCSV('activities', reportData.activities);
    }
}

function exportMessages(format) {
    if (reportData.messages.length === 0) {
        alert('No message data to export');
        return;
    }
    
    if (format === 'csv') {
        exportToCSV('messages', reportData.messages);
    }
}

function exportToCSV(type, data) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            if (value && typeof value === 'object' && value.toDate) {
                return value.toDate().toLocaleDateString();
            }
            return `"${value || ''}"`;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        default:
            window.location.href = '../index.html';
    }
}

function showLoading() {
    document.getElementById('attendance-table').innerHTML = '<div class="loading">Loading attendance data...</div>';
    document.getElementById('activity-summary').innerHTML = '<div class="loading">Loading activity data...</div>';
    document.getElementById('message-summary').innerHTML = '<div class="loading">Loading message data...</div>';
}

function showError(message) {
    alert(message);
}

// Make functions globally available
window.generateReport = generateReport;
window.exportAttendance = exportAttendance;
window.exportActivities = exportActivities;
window.exportMessages = exportMessages;
window.goBack = goBack;


