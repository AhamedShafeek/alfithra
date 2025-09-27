import { checkAuth } from './auth.js';
import { getStudents, recordAttendance, getAttendanceByStudent } from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

let allStudents = [];
let allAttendance = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = today;
    document.getElementById('bulk-date').value = today;
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Load data
    await loadStudents();
    await loadAttendance();
    
    // Set up event listeners
    document.getElementById('take-attendance-form').addEventListener('submit', handleTakeAttendance);
    document.getElementById('take-attendance-btn').addEventListener('click', () => {
        document.getElementById('take-attendance-modal').style.display = 'block';
        populateStudentDropdown();
    });
    
    document.getElementById('bulk-attendance-btn').addEventListener('click', () => {
        document.getElementById('bulk-attendance-modal').style.display = 'block';
    });
    
    document.getElementById('bulk-class').addEventListener('change', populateBulkAttendance);
    document.getElementById('save-bulk-attendance').addEventListener('click', handleBulkAttendance);
    
    document.getElementById('attendance-date').addEventListener('change', loadAttendance);
    document.getElementById('attendance-class-filter').addEventListener('change', filterAttendance);
    
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
        updateAttendanceStats();
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadAttendance() {
    try {
        const selectedDate = document.getElementById('attendance-date').value;
        const date = new Date(selectedDate);
        
        // Load attendance for all students for the selected date
        const attendancePromises = allStudents.map(student => 
            getAttendanceByStudent(student.id)
        );
        
        const allStudentAttendance = await Promise.all(attendancePromises);
        allAttendance = allStudentAttendance.flat().filter(record => {
            const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date);
            return recordDate.toDateString() === date.toDateString();
        });
        
        displayAttendance();
        updateAttendanceStats();
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

function displayAttendance() {
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    attendanceTableBody.innerHTML = '';
    
    const classFilter = document.getElementById('attendance-class-filter').value;
    let filteredAttendance = allAttendance;
    
    if (classFilter) {
        filteredAttendance = allAttendance.filter(record => {
            const student = allStudents.find(s => s.id === record.studentId);
            return student && student.className === classFilter;
        });
    }
    
    if (filteredAttendance.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No attendance records found for this date</td></tr>';
        return;
    }
    
    filteredAttendance.forEach(record => {
        const student = allStudents.find(s => s.id === record.studentId);
        if (!student) return;
        
        const row = document.createElement('tr');
        const time = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
        
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.className}</td>
            <td class="status-${record.status}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
            <td>${time.toLocaleTimeString()}</td>
            <td>${record.notes || '-'}</td>
            <td>${record.recordedBy || '-'}</td>
            <td>
                <button class="btn-secondary edit-attendance" data-id="${record.id}">Edit</button>
            </td>
        `;
        attendanceTableBody.appendChild(row);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-attendance').forEach(button => {
        button.addEventListener('click', () => {
            const recordId = button.getAttribute('data-id');
            editAttendance(recordId);
        });
    });
}

function filterAttendance() {
    displayAttendance();
}

function updateAttendanceStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = allAttendance.filter(record => {
        const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date);
        return recordDate.toISOString().split('T')[0] === today;
    });
    
    const present = todayAttendance.filter(r => r.status === 'present').length;
    const absent = todayAttendance.filter(r => r.status === 'absent').length;
    const late = todayAttendance.filter(r => r.status === 'late').length;
    
    document.getElementById('today-present').textContent = present;
    document.getElementById('today-absent').textContent = absent;
    document.getElementById('today-late').textContent = late;
    document.getElementById('total-students').textContent = allStudents.length;
}

async function populateStudentDropdown() {
    const select = document.getElementById('attendance-student');
    select.innerHTML = '<option value="">Select a student</option>';
    
    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.className})`;
        select.appendChild(option);
    });
}

async function handleTakeAttendance(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('attendance-student').value;
    const status = document.getElementById('attendance-status').value;
    const notes = document.getElementById('attendance-notes').value.trim();
    const date = document.getElementById('attendance-date').value;
    
    try {
        const result = await recordAttendance({
            studentId,
            status,
            notes,
            recordedBy: currentUser.username,
            date: new Date(date)
        });
        
        if (result.success) {
            document.getElementById('take-attendance-modal').style.display = 'none';
            document.getElementById('take-attendance-form').reset();
            await loadAttendance();
            alert('Attendance recorded successfully');
        } else {
            alert('Error recording attendance: ' + result.error.message);
        }
        
    } catch (error) {
        console.error('Error recording attendance:', error);
        alert('Error recording attendance. Please try again.');
    }
}

function populateBulkAttendance() {
    const selectedClass = document.getElementById('bulk-class').value;
    const bulkList = document.getElementById('bulk-attendance-list');
    
    if (!selectedClass) {
        bulkList.innerHTML = '<p>Please select a class first</p>';
        return;
    }
    
    const classStudents = allStudents.filter(s => s.className === selectedClass);
    
    if (classStudents.length === 0) {
        bulkList.innerHTML = '<p>No students found in this class</p>';
        return;
    }
    
    bulkList.innerHTML = '';
    
    classStudents.forEach(student => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'form-row';
        studentDiv.style.marginBottom = '15px';
        studentDiv.style.padding = '10px';
        studentDiv.style.border = '1px solid #ddd';
        studentDiv.style.borderRadius = '4px';
        
        studentDiv.innerHTML = `
            <div style="flex: 1;">
                <strong>${student.name}</strong>
            </div>
            <div style="flex: 1;">
                <select class="bulk-status" data-student-id="${student.id}">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                </select>
            </div>
            <div style="flex: 2;">
                <input type="text" class="bulk-notes" data-student-id="${student.id}" placeholder="Notes (optional)">
            </div>
        `;
        
        bulkList.appendChild(studentDiv);
    });
}

async function handleBulkAttendance() {
    const selectedDate = document.getElementById('bulk-date').value;
    const selectedClass = document.getElementById('bulk-class').value;
    
    if (!selectedDate || !selectedClass) {
        alert('Please select both date and class');
        return;
    }
    
    const statusSelects = document.querySelectorAll('.bulk-status');
    const notesInputs = document.querySelectorAll('.bulk-notes');
    
    const attendanceRecords = [];
    
    statusSelects.forEach(select => {
        const studentId = select.getAttribute('data-student-id');
        const status = select.value;
        const notesInput = Array.from(notesInputs).find(input => 
            input.getAttribute('data-student-id') === studentId
        );
        const notes = notesInput ? notesInput.value.trim() : '';
        
        attendanceRecords.push({
            studentId,
            status,
            notes,
            recordedBy: currentUser.username,
            date: new Date(selectedDate)
        });
    });
    
    try {
        // Record all attendance
        const { recordAttendance } = await import('./database.js');
        const promises = attendanceRecords.map(record => recordAttendance(record));
        const results = await Promise.all(promises);
        
        const successCount = results.filter(r => r.success).length;
        
        if (successCount === attendanceRecords.length) {
            document.getElementById('bulk-attendance-modal').style.display = 'none';
            await loadAttendance();
            alert(`Bulk attendance recorded successfully for ${successCount} students`);
        } else {
            alert(`Attendance recorded for ${successCount} out of ${attendanceRecords.length} students`);
        }
        
    } catch (error) {
        console.error('Error recording bulk attendance:', error);
        alert('Error recording bulk attendance. Please try again.');
    }
}

async function editAttendance(recordId) {
    const record = allAttendance.find(r => r.id === recordId);
    if (!record) return;
    
    const newStatus = prompt('Enter new status (present/absent/late):', record.status);
    if (newStatus && ['present', 'absent', 'late'].includes(newStatus.toLowerCase())) {
        try {
            const { db } = await import('./firebase-config.js');
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js');
            
            await updateDoc(doc(db, "attendance", recordId), {
                status: newStatus.toLowerCase(),
                updatedAt: new Date(),
                updatedBy: currentUser.username
            });
            
            alert('Attendance updated successfully');
            await loadAttendance();
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Error updating attendance');
        }
    }
}

