import { db } from './firebase-config.js';
import { 
    collection, doc, setDoc, addDoc, updateDoc, deleteDoc, 
    getDocs, getDoc, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// User management functions
export async function createUser(username, password, role, name) {
    try {
        // Check if user already exists
        const userRef = doc(db, "users", username);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { success: false, error: { message: "User already exists" } };
        }
        
        await setDoc(userRef, {
            username,
            password, // In real app, this should be hashed
            role,
            name,
            createdAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: { message: error.message || "Failed to create user" } };
    }
}

export async function getUsers() {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Don't include password in the returned data
            const { password, ...userWithoutPassword } = userData;
            users.push({
                id: doc.id,
                ...userWithoutPassword
            });
        });
        return users;
    } catch (error) {
        console.error("Error getting users:", error);
        return [];
    }
}

// Student management functions
export async function createStudent(studentData) {
    try {
        const docRef = await addDoc(collection(db, "students"), {
            ...studentData,
            createdAt: new Date()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating student:", error);
        return { success: false, error: { message: error.message || "Failed to create student" } };
    }
}

export async function getStudents() {
    try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const students = [];
        studentsSnapshot.forEach(doc => {
            students.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return students;
    } catch (error) {
        console.error("Error getting students:", error);
        return [];
    }
}

export async function getStudentsByParent(parentUsername) {
    try {
        const q = query(
            collection(db, "students"), 
            where("parentUsername", "==", parentUsername)
        );
        const studentsSnapshot = await getDocs(q);
        const students = [];
        studentsSnapshot.forEach(doc => {
            students.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return students;
    } catch (error) {
        console.error("Error getting students by parent:", error);
        return [];
    }
}

export async function updateStudent(studentId, studentData) {
    try {
        await updateDoc(doc(db, "students", studentId), studentData);
        return { success: true };
    } catch (error) {
        console.error("Error updating student:", error);
        return { success: false, error };
    }
}

// Attendance functions
export async function recordAttendance(attendanceData) {
    try {
        const docRef = await addDoc(collection(db, "attendance"), {
            ...attendanceData,
            date: new Date(),
            createdAt: new Date()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error recording attendance:", error);
        return { success: false, error };
    }
}

export async function getAttendanceByStudent(studentId) {
    try {
        const q = query(
            collection(db, "attendance"),
            where("studentId", "==", studentId)
        );
        const attendanceSnapshot = await getDocs(q);
        const attendance = [];
        attendanceSnapshot.forEach(doc => {
            attendance.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Sort by date in descending order after fetching
        attendance.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });
        return attendance;
    } catch (error) {
        console.error("Error getting attendance:", error);
        return [];
    }
}

// Activity functions
export async function logActivity(activityData) {
    try {
        const docRef = await addDoc(collection(db, "activities"), {
            ...activityData,
            createdAt: new Date()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error logging activity:", error);
        return { success: false, error };
    }
}

export async function getActivitiesByStudent(studentId) {
    try {
        const q = query(
            collection(db, "activities"),
            where("studentId", "==", studentId)
        );
        const activitiesSnapshot = await getDocs(q);
        const activities = [];
        activitiesSnapshot.forEach(doc => {
            activities.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Sort by createdAt in descending order after fetching
        activities.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        return activities;
    } catch (error) {
        console.error("Error getting activities:", error);
        return [];
    }
}

// Message functions
export async function sendMessage(messageData) {
    try {
        const docRef = await addDoc(collection(db, "messages"), {
            ...messageData,
            read: false,
            createdAt: new Date()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error };
    }
}

export async function getMessagesByUser(username) {
    try {
        const q = query(
            collection(db, "messages"),
            where("recipientUsername", "==", username)
        );
        const messagesSnapshot = await getDocs(q);
        const messages = [];
        messagesSnapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Sort by createdAt in descending order after fetching
        messages.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        return messages;
    } catch (error) {
        console.error("Error getting messages:", error);
        return [];
    }
}

export async function markMessageAsRead(messageId) {
    try {
        await updateDoc(doc(db, "messages", messageId), {
            read: true
        });
        return { success: true };
    } catch (error) {
        console.error("Error marking message as read:", error);
        return { success: false, error };
    }
}

// Get all attendance records
export async function getAllAttendance() {
    try {
        const attendanceSnapshot = await getDocs(collection(db, "attendance"));
        const attendance = [];
        attendanceSnapshot.forEach(doc => {
            attendance.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Sort by date in descending order
        attendance.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });
        return attendance;
    } catch (error) {
        console.error("Error getting all attendance:", error);
        return [];
    }
}

// Get all activities
export async function getAllActivities() {
    try {
        const activitiesSnapshot = await getDocs(collection(db, "activities"));
        const activities = [];
        activitiesSnapshot.forEach(doc => {
            activities.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Sort by createdAt in descending order
        activities.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        return activities;
    } catch (error) {
        console.error("Error getting all activities:", error);
        return [];
    }
}

// Get all messages
export async function getAllMessages() {
    try {
        const messagesSnapshot = await getDocs(collection(db, "messages"));
        const messages = [];
        messagesSnapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Sort by createdAt in descending order
        messages.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        return messages;
    } catch (error) {
        console.error("Error getting all messages:", error);
        return [];
    }
}

// Get attendance by date range
export async function getAttendanceByDateRange(startDate, endDate) {
    try {
        const q = query(
            collection(db, "attendance"),
            where("date", ">=", startDate),
            where("date", "<=", endDate)
        );
        const attendanceSnapshot = await getDocs(q);
        const attendance = [];
        attendanceSnapshot.forEach(doc => {
            attendance.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return attendance;
    } catch (error) {
        console.error("Error getting attendance by date range:", error);
        return [];
    }
}

// Get activities by date range
export async function getActivitiesByDateRange(startDate, endDate) {
    try {
        const q = query(
            collection(db, "activities"),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate)
        );
        const activitiesSnapshot = await getDocs(q);
        const activities = [];
        activitiesSnapshot.forEach(doc => {
            activities.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return activities;
    } catch (error) {
        console.error("Error getting activities by date range:", error);
        return [];
    }
}

// Get messages by date range
export async function getMessagesByDateRange(startDate, endDate) {
    try {
        const q = query(
            collection(db, "messages"),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate)
        );
        const messagesSnapshot = await getDocs(q);
        const messages = [];
        messagesSnapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return messages;
    } catch (error) {
        console.error("Error getting messages by date range:", error);
        return [];
    }
}

// Delete student
export async function deleteStudent(studentId) {
    try {
        await deleteDoc(doc(db, "students", studentId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting student:", error);
        return { success: false, error };
    }
}

// Delete user
export async function deleteUser(username) {
    try {
        await deleteDoc(doc(db, "users", username));
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error };
    }
}

// Update user
export async function updateUser(username, userData) {
    try {
        await updateDoc(doc(db, "users", username), userData);
        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error };
    }
}