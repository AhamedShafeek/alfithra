import { checkAuth } from './auth.js';
import { createStudent, getStudents, updateStudent } from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

let allStudents = [];
let filteredStudents = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Load students data
    await loadStudents();
    
    // Set up event listeners
    document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
    document.getElementById('add-student-btn').addEventListener('click', () => {
        document.getElementById('add-student-modal').style.display = 'block';
    });
    
    // Set up close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Set up search and filter
    document.getElementById('search-student').addEventListener('input', filterStudents);
    document.getElementById('filter-class').addEventListener('change', filterStudents);
    document.getElementById('filter-age').addEventListener('change', filterStudents);
});

async function loadStudents() {
    try {
        allStudents = await getStudents();
        filteredStudents = [...allStudents];
        displayStudents(filteredStudents);
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Error loading students');
    }
}

function displayStudents(students) {
    const studentTableBody = document.querySelector('#students-table tbody');
    studentTableBody.innerHTML = '';
    
    if (students.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No students found</td></tr>';
        return;
    }
    
    students.forEach(student => {
        const row = document.createElement('tr');
        const enrollmentDate = student.createdAt?.toDate ? 
            student.createdAt.toDate() : 
            new Date(student.createdAt);
            
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.age}</td>
            <td>${student.className}</td>
            <td>${student.parentName}</td>
            <td>${enrollmentDate.toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary view-student" data-id="${student.id}">View</button>
                <button class="btn-secondary edit-student" data-id="${student.id}">Edit</button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-student').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            window.location.href = `student-profile.html?id=${studentId}`;
        });
    });
    
    document.querySelectorAll('.edit-student').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            editStudent(studentId);
        });
    });
}

function filterStudents() {
    const searchTerm = document.getElementById('search-student').value.toLowerCase();
    const classFilter = document.getElementById('filter-class').value;
    const ageFilter = document.getElementById('filter-age').value;
    
    filteredStudents = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm);
        const matchesClass = !classFilter || student.className === classFilter;
        const matchesAge = !ageFilter || student.age.toString() === ageFilter;
        
        return matchesSearch && matchesClass && matchesAge;
    });
    
    displayStudents(filteredStudents);
}

async function handleAddStudent(e) {
    e.preventDefault();
    
    const name = document.getElementById('student-name').value.trim();
    const age = parseInt(document.getElementById('student-age').value);
    const className = document.getElementById('student-class').value;
    const parentUsername = document.getElementById('parent-username').value.trim();
    const parentName = document.getElementById('parent-name').value.trim();
    const notes = document.getElementById('student-notes').value.trim();
    
    // Validation
    if (!name || !age || !className || !parentUsername || !parentName) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (age < 2 || age > 6) {
        alert('Age must be between 2 and 6 years');
        return;
    }
    
    try {
        const studentData = {
            name,
            age,
            className,
            parentUsername,
            parentName,
            notes: notes || ''
        };
        
        const result = await createStudent(studentData);
        
        if (result.success) {
            document.getElementById('add-student-modal').style.display = 'none';
            document.getElementById('add-student-form').reset();
            await loadStudents();
            alert('Student added successfully');
        } else {
            alert('Error adding student: ' + result.error.message);
        }
        
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student. Please try again.');
    }
}

async function editStudent(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    
    const newName = prompt('Enter new name:', student.name);
    if (newName && newName.trim() !== student.name) {
        try {
            const result = await updateStudent(studentId, { name: newName.trim() });
            if (result.success) {
                alert('Student updated successfully');
                await loadStudents();
            } else {
                alert('Error updating student');
            }
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Error updating student');
        }
    }
}

