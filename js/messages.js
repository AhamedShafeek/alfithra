import { checkAuth } from './auth.js';
import { getMessagesByUser, markMessageAsRead, sendMessage, getUsers } from './database.js';
import { initializeMobileMenu, showToast } from './mobile-menu.js';

// Check if user is logged in
const currentUser = checkAuth();
if (!currentUser) {
    window.location.href = '../index.html';
}

let allMessages = [];
let filteredMessages = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Load messages
    await loadMessages();
    
    // Set up event listeners
    document.getElementById('compose-message-btn').addEventListener('click', () => {
        window.location.href = 'send-message.html';
    });
    
    document.getElementById('mark-all-read-btn').addEventListener('click', markAllAsRead);
    document.getElementById('refresh-messages-btn').addEventListener('click', loadMessages);
    
    document.getElementById('message-status-filter').addEventListener('change', filterMessages);
    document.getElementById('message-sender-filter').addEventListener('change', filterMessages);
    document.getElementById('message-priority-filter').addEventListener('change', filterMessages);
    
    // Set up close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
});

async function loadMessages() {
    try {
        allMessages = await getMessagesByUser(currentUser.username);
        filteredMessages = [...allMessages];
        
        // Sort messages by date (newest first)
        filteredMessages.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        displayMessages();
        updateMessageStats();
        populateSenderFilter();
        
    } catch (error) {
        console.error('Error loading messages:', error);
        alert('Error loading messages');
    }
}

function displayMessages() {
    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';
    
    if (filteredMessages.length === 0) {
        messagesList.innerHTML = '<div class="no-data" style="text-align: center; padding: 40px; color: #7f8c8d;">No messages found</div>';
        return;
    }
    
    filteredMessages.forEach(message => {
        const messageCard = document.createElement('div');
        messageCard.className = `card ${message.read ? '' : 'unread'}`;
        
        const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
        const priorityClass = message.priority ? `priority-${message.priority}` : '';
        
        messageCard.innerHTML = `
            <div class="card-header">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div>
                        <h3 class="card-title">${message.subject}</h3>
                        <p style="margin: 5px 0; color: #7f8c8d;">From: ${message.senderName}</p>
                    </div>
                    <div style="text-align: right;">
                        <div class="message-priority ${priorityClass}">${message.priority || 'normal'}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">${date.toLocaleString()}</div>
                        ${!message.read ? '<div class="unread-indicator">●</div>' : ''}
                    </div>
                </div>
            </div>
            <div class="message-preview">
                <p>${message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content}</p>
            </div>
            <div class="message-actions">
                <button class="btn-secondary view-message" data-id="${message.id}">View</button>
                ${!message.read ? `<button class="btn-secondary mark-read" data-id="${message.id}">Mark as Read</button>` : ''}
                <button class="btn-secondary reply-message" data-sender="${message.senderUsername}" data-subject="Re: ${message.subject}">Reply</button>
            </div>
        `;
        
        messagesList.appendChild(messageCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-message').forEach(button => {
        button.addEventListener('click', () => {
            const messageId = button.getAttribute('data-id');
            viewMessage(messageId);
        });
    });
    
    document.querySelectorAll('.mark-read').forEach(button => {
        button.addEventListener('click', () => {
            const messageId = button.getAttribute('data-id');
            markAsRead(messageId);
        });
    });
    
    document.querySelectorAll('.reply-message').forEach(button => {
        button.addEventListener('click', () => {
            const sender = button.getAttribute('data-sender');
            const subject = button.getAttribute('data-subject');
            replyToMessage(sender, subject);
        });
    });
}

function filterMessages() {
    const statusFilter = document.getElementById('message-status-filter').value;
    const senderFilter = document.getElementById('message-sender-filter').value;
    const priorityFilter = document.getElementById('message-priority-filter').value;
    
    filteredMessages = allMessages.filter(message => {
        const matchesStatus = !statusFilter || 
            (statusFilter === 'unread' && !message.read) ||
            (statusFilter === 'read' && message.read);
        
        const matchesSender = !senderFilter || message.senderUsername === senderFilter;
        const matchesPriority = !priorityFilter || message.priority === priorityFilter;
        
        return matchesStatus && matchesSender && matchesPriority;
    });
    
    // Re-sort filtered messages
    filteredMessages.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
    });
    
    displayMessages();
}

function updateMessageStats() {
    const unreadCount = allMessages.filter(m => !m.read).length;
    const totalCount = allMessages.length;
    
    const today = new Date().toISOString().split('T')[0];
    const sentToday = allMessages.filter(m => {
        const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        return date.toISOString().split('T')[0] === today && m.senderUsername === currentUser.username;
    }).length;
    
    const receivedToday = allMessages.filter(m => {
        const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        return date.toISOString().split('T')[0] === today && m.senderUsername !== currentUser.username;
    }).length;
    
    document.getElementById('unread-count').textContent = unreadCount;
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('sent-today').textContent = sentToday;
    document.getElementById('received-today').textContent = receivedToday;
}

function populateSenderFilter() {
    const select = document.getElementById('message-sender-filter');
    select.innerHTML = '<option value="">All Senders</option>';
    
    const uniqueSenders = [...new Set(allMessages.map(m => m.senderUsername))];
    uniqueSenders.forEach(sender => {
        const message = allMessages.find(m => m.senderUsername === sender);
        const option = document.createElement('option');
        option.value = sender;
        option.textContent = message.senderName;
        select.appendChild(option);
    });
}

async function viewMessage(messageId) {
    const message = allMessages.find(m => m.id === messageId);
    if (!message) return;
    
    const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
    
    const messageDetail = document.getElementById('message-detail-content');
    messageDetail.innerHTML = `
        <h2>${message.subject}</h2>
        <div style="margin-bottom: 20px;">
            <p><strong>From:</strong> ${message.senderName}</p>
            <p><strong>To:</strong> ${currentUser.name}</p>
            <p><strong>Date:</strong> ${date.toLocaleString()}</p>
            <p><strong>Priority:</strong> ${message.priority || 'normal'}</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <h4>Message:</h4>
            <p style="white-space: pre-wrap;">${message.content}</p>
        </div>
        <div class="form-actions">
            ${!message.read ? `<button class="btn-primary" onclick="markAsRead('${messageId}')">Mark as Read</button>` : ''}
            <button class="btn-secondary" onclick="replyToMessage('${message.senderUsername}', 'Re: ${message.subject}')">Reply</button>
            <button class="btn-secondary close-modal">Close</button>
        </div>
    `;
    
    document.getElementById('message-detail-modal').style.display = 'block';
    
    // Mark as read if not already read
    if (!message.read) {
        await markAsRead(messageId);
    }
}

async function markAsRead(messageId) {
    try {
        const result = await markMessageAsRead(messageId);
        if (result.success) {
            // Update local data
            const message = allMessages.find(m => m.id === messageId);
            if (message) {
                message.read = true;
            }
            
            await loadMessages(); // Refresh the display
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function markAllAsRead() {
    const unreadMessages = allMessages.filter(m => !m.read);
    
    if (unreadMessages.length === 0) {
        alert('No unread messages to mark');
        return;
    }
    
    const confirmed = confirm(`Mark ${unreadMessages.length} messages as read?`);
    if (!confirmed) return;
    
    try {
        const promises = unreadMessages.map(message => markMessageAsRead(message.id));
        await Promise.all(promises);
        
        await loadMessages();
        alert('All messages marked as read');
        
    } catch (error) {
        console.error('Error marking all messages as read:', error);
        alert('Error marking messages as read');
    }
}

function replyToMessage(senderUsername, subject) {
    const replyUrl = `send-message.html?recipient=${encodeURIComponent(senderUsername)}&subject=${encodeURIComponent(subject)}`;
    window.location.href = replyUrl;
}

// Make functions globally available
window.markAsRead = markAsRead;
window.replyToMessage = replyToMessage;

