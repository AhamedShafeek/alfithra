# Preschool Management System

A comprehensive web-based management system for preschools built with Firebase and vanilla JavaScript.

## Features

### Admin Dashboard
- **User Management**: Create and manage teachers and parents
- **Student Management**: Add, view, and manage student records
- **Statistics**: View counts of teachers, parents, students, and classes
- **System Overview**: Complete control over the preschool system

### Teacher Dashboard
- **Student View**: View all students in the preschool
- **Attendance Management**: Record daily attendance for students
- **Activity Logging**: Log student activities and progress
- **Communication**: Send messages to parents
- **Statistics**: View student counts and activity summaries

### Parent Dashboard
- **Child Information**: View information about their children
- **Attendance Tracking**: Monitor child's attendance records
- **Activity Reports**: View detailed activity logs for their children
- **Communication**: Receive and send messages to teachers
- **Tabbed Interface**: Easy navigation between different sections

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project with Firestore database enabled
- Web server (for local development, you can use Live Server extension in VS Code)

### Installation

1. **Clone or download** the project files to your local machine

2. **Set up Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Firestore Database
   - Get your Firebase configuration

3. **Configure Firebase**:
   - Open `js/firebase-config.js`
   - Replace the configuration object with your Firebase project settings:
   ```javascript
   const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-sender-id",
       appId: "your-app-id"
   };
   ```

4. **Set up Firestore Security Rules**:
   - In Firebase Console, go to Firestore Database > Rules
   - Use these rules for development (adjust for production):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

5. **Start the application**:
   - Open `index.html` in your web browser
   - Or use a local web server for better development experience

### Default Login Credentials

The system will automatically create a default admin user on first run:
- **Username**: `admin`
- **Password**: `admin`

**Important**: Change these credentials immediately after first login for security.

## Usage Guide

### For Administrators

1. **Login** with admin credentials
2. **Add Users**:
   - Click "Add User" button
   - Fill in username, password, name, and role (teacher/parent)
   - Click "Create User"

3. **Add Students**:
   - Click "Add Student" button
   - Fill in student details and parent information
   - Click "Add Student"

4. **Monitor System**:
   - View statistics on the dashboard
   - Manage users and students through the tables

### For Teachers

1. **Login** with teacher credentials
2. **Take Attendance**:
   - Click "Take Attendance" button
   - Select student and mark status (Present/Absent/Late)
   - Add notes if needed
   - Click "Record Attendance"

3. **Log Activities**:
   - Click "Log Activity" button
   - Select student and activity type
   - Add description
   - Click "Log Activity"

4. **Send Messages**:
   - Click "Send Message" button
   - Select parent recipient
   - Add subject and message
   - Click "Send Message"

### For Parents

1. **Login** with parent credentials
2. **View Children**:
   - See all your children listed in the Students tab
   - Click "View Attendance" or "View Activities" for detailed information

3. **Check Messages**:
   - Go to Messages tab to see communications from teachers
   - Mark messages as read
   - Send messages back to teachers

## File Structure

```
preschool-management/
├── index.html              # Main login page
├── test.html              # Firebase connection test page
├── css/
│   └── styles.css         # All styling
├── js/
│   ├── firebase-config.js # Firebase configuration
│   ├── auth.js            # Authentication logic
│   ├── database.js       # Database operations
│   ├── admin.js          # Admin dashboard functionality
│   ├── teacher.js        # Teacher dashboard functionality
│   └── parent.js         # Parent dashboard functionality
└── pages/
    ├── admin-dashboard.html
    ├── teacher-dashboard.html
    └── parent-dashboard.html
```

## Database Structure

The system uses the following Firestore collections:

- **users**: Stores user accounts (admin, teachers, parents)
- **students**: Stores student information
- **attendance**: Stores daily attendance records
- **activities**: Stores student activity logs
- **messages**: Stores communication between teachers and parents

## Testing

1. **Open `test.html`** in your browser
2. **Run tests** to verify Firebase connection and basic functionality
3. **Check browser console** for any error messages

## Troubleshooting

### Common Issues

1. **Firebase Connection Errors**:
   - Verify your Firebase configuration in `firebase-config.js`
   - Check Firestore security rules
   - Ensure Firestore is enabled in your Firebase project

2. **Login Issues**:
   - Make sure the default admin user is created
   - Check browser console for error messages
   - Verify Firestore permissions

3. **Data Not Loading**:
   - Check Firestore security rules
   - Verify collection names match the code
   - Check browser console for errors

### Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Considerations

⚠️ **Important Security Notes**:

1. **Change Default Credentials**: Immediately change the default admin username and password
2. **Firestore Rules**: Implement proper security rules for production
3. **Password Hashing**: In production, implement proper password hashing
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: Add server-side validation for production use

## Development

### Adding New Features

1. **Database Functions**: Add new functions to `database.js`
2. **UI Components**: Add HTML to appropriate dashboard files
3. **Styling**: Add CSS to `styles.css`
4. **JavaScript Logic**: Add functionality to appropriate JS files

### Customization

- **Styling**: Modify `css/styles.css` for different themes
- **User Roles**: Add new roles in the authentication system
- **Data Fields**: Extend student/user data structures as needed

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Firebase configuration and permissions
3. Test with the provided `test.html` file
4. Review this documentation for common solutions

## License

This project is provided as-is for educational and development purposes.

