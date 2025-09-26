import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app } from './firebase-config.js';

const auth = getAuth(app);
const db = getFirestore(app);

// Function to handle user login
async function loginUser(email, password) {
  if (email === 'admin' && password === 'admin') {
    // Hardcoded admin login
    console.log('Admin login successful');
    sessionStorage.setItem('userRole', 'admin');
    window.location.href = 'teacher-dashboard.html';
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User logged in:', user);

    // Fetch user role from Firestore
    const db = getFirestore(app);
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js').then(m => m.getDoc(userDocRef));
    let role = 'parent'; // Default role
    if (userDocSnap && userDocSnap.exists()) {
      role = userDocSnap.data().role;
    }
    sessionStorage.setItem('userRole', role);

    // Redirect based on role
    if (role === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else if (role === 'admin') {
      window.location.href = 'teacher-dashboard.html';
    } else {
      window.location.href = 'parent-dashboard.html';
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Login failed:', errorCode, errorMessage);
    alert('Login failed: ' + errorMessage);
  }
}

// Function to create a new user (for admin)
async function createUser(email, password, role) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User created:', user);

    // Store user role in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: role // 'teacher' or 'parent'
    });

    alert('User created successfully!');
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('User creation failed:', errorCode, errorMessage);
    alert('User creation failed: ' + errorMessage);
  }
}

// Function to create a student profile (for admin/teachers)
async function createStudentProfile(studentData) {
    try {
        // Add a new document with a generated id.
        const docRef = await addDoc(collection(db, "students"), studentData);
        console.log("Document written with ID: ", docRef.id);
        alert('Student profile created successfully!');
    } catch (e) {
        console.error("Error adding document: ", e);
        alert('Error creating student profile.');
    }
}

export { loginUser, createUser, createStudentProfile };
