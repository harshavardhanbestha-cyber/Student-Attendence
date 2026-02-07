// Configuration
const CONFIG = {
    // Replace this with your actual Google Form URL
    GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScce0Y8djY07-pLNnZBQAhjids9JZlAdRavgF6a1Ia576Ap0w/viewform?usp=publish-editor',
    // Google Apps Script Web App URL (after deploying the script)
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxTdFaER2W72LD9AjJS1TukfAr8dd7ou8Yi2uwFC-uvxXL-hyU1Z9AqrDdmY3akLJQc/exec', // Paste your Apps Script URL here after deployment
    // For demo purposes, we'll use localStorage as a simple database
    // In production, you would connect to a real backend/database
    STORAGE_KEY: 'attendance_records',
    REFRESH_INTERVAL: 10000, // Refresh every 10 seconds
    USE_GOOGLE_SHEETS: true, // Set to true after setting up Apps Script
    APPROVAL_STORAGE_KEY: 'attendance_approvals' // Key for storing approvals
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeQRCode();
    loadAttendanceRecords();
    updateStats();
    updateCurrentTime();
    startAutoRefresh();

    // Listen for storage changes (for demo purposes)
    window.addEventListener('storage', function (e) {
        if (e.key === CONFIG.STORAGE_KEY) {
            loadAttendanceRecords();
            updateStats();
        }
    });
});

// Generate QR Code
function initializeQRCode() {
    const qrcodeContainer = document.getElementById('qrcode');

    // Clear any existing QR code
    qrcodeContainer.innerHTML = '';

    // Generate QR code linking to Google Form
    new QRCode(qrcodeContainer, {
        text: CONFIG.GOOGLE_FORM_URL,
        width: 200,
        height: 200,
        colorDark: '#1e293b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Open form directly
function openForm() {
    window.open(CONFIG.GOOGLE_FORM_URL, '_blank');
}

// Load attendance records from storage or Google Sheets
async function loadAttendanceRecords() {
    let records = [];

    // Try to fetch from Google Sheets if configured
    if (CONFIG.USE_GOOGLE_SHEETS && CONFIG.APPS_SCRIPT_URL) {
        try {
            records = await fetchFromGoogleSheets();
            // Save to localStorage as backup
            saveAttendanceRecords(records);
        } catch (error) {
            console.error('Error fetching from Google Sheets:', error);
            // Fall back to localStorage
            records = getAttendanceRecords();
        }
    } else {
        // Use localStorage
        records = getAttendanceRecords();
    }

    displayAttendanceRecords(records);
}

// Fetch data from Google Sheets via Apps Script
async function fetchFromGoogleSheets() {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch from Google Sheets');
    }
    const data = await response.json();

    // Transform data to match our format
    return data.map(item => ({
        id: new Date(item.timestamp).getTime(),
        name: item.name,
        usn: item.usn,
        timestamp: item.timestamp,
        status: 'present'
    }));
}

// Display attendance records
function displayAttendanceRecords(records) {
    const attendanceList = document.getElementById('attendanceList');

    if (records.length === 0) {
        attendanceList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No attendance records yet</p>
                <small>Students will appear here after scanning the QR code</small>
            </div>
        `;
        updateStats();
        return;
    }

    // Sort by timestamp (most recent first)
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Get approval statuses
    const approvals = getApprovalStatuses();

    // Generate HTML for each record
    const recordsHTML = records.map(record => {
        // Default to 'pending' if no status found
        const status = approvals[record.id] || 'pending';

        // Config for badge display
        let badgeHtml = '';
        let buttonsHtml = '';

        if (status === 'pending') {
            badgeHtml = `
                <div class="status-badge status-pending">
                    <span>⏳</span> Pending
                </div>
            `;
            buttonsHtml = `
                <button class="btn-accept" onclick="acceptAttendance('${record.id}')">✓ Allow</button>
                <button class="btn-reject" onclick="rejectAttendance('${record.id}')">✗ Deny</button>
            `;
        } else if (status === 'accepted') {
            badgeHtml = `
                <div class="status-badge status-accepted">
                    <span>✅</span> Allowed
                </div>
            `;
            // Option to undo? For now just show status
        } else if (status === 'rejected') {
            badgeHtml = `
                <div class="status-badge status-rejected">
                    <span>❌</span> Denied
                </div>
            `;
        }

        return `
        <div class="attendance-item" data-status="${status}" data-name="${escapeHtml(record.name)}" data-usn="${escapeHtml(record.usn || '')}">
            <div class="student-info">
                <div class="student-name">${escapeHtml(record.name)}</div>
                ${record.usn ? `<div class="student-usn">USN: ${escapeHtml(record.usn)}</div>` : ''}
                <div class="student-time">
                    <span>🕐</span>
                    ${formatDateTime(record.timestamp)}
                </div>
            </div>
            <div class="action-buttons">
                ${badgeHtml}
                ${buttonsHtml}
            </div>
        </div>
        `;
    }).join('');

    attendanceList.innerHTML = recordsHTML;

    // Re-apply filter if needed (to hide items that might have changed status if filter is active)
    filterAttendance();

    updateLastUpdate();
    updateStats();
}

// Get approval statuses from localStorage
function getApprovalStatuses() {
    const stored = localStorage.getItem(CONFIG.APPROVAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Save a status change
function saveApprovalStatus(id, status) {
    const approvals = getApprovalStatuses();
    approvals[id] = status;
    localStorage.setItem(CONFIG.APPROVAL_STORAGE_KEY, JSON.stringify(approvals));

    // Refresh display to show new status
    loadAttendanceRecords();
}

// Global functions for buttons
window.acceptAttendance = function (id) {
    saveApprovalStatus(id, 'accepted');
};

window.rejectAttendance = function (id) {
    saveApprovalStatus(id, 'rejected');
};

// Update filter function to handle status
function filterAttendance() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const items = document.querySelectorAll('.attendance-item');

    items.forEach(item => {
        const name = item.dataset.name.toLowerCase();
        const usn = item.dataset.usn.toLowerCase();
        const status = item.dataset.status;

        const matchesSearch = name.includes(searchTerm) || usn.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        if (matchesSearch && matchesStatus) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Get attendance records from localStorage
function getAttendanceRecords() {
    try {
        const records = localStorage.getItem(CONFIG.STORAGE_KEY);
        return records ? JSON.parse(records) : [];
    } catch (error) {
        console.error('Error loading attendance records:', error);
        return [];
    }
}

// Save attendance records to localStorage
function saveAttendanceRecords(records) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
        console.error('Error saving attendance records:', error);
    }
}

// Add a new attendance record (for demo/testing purposes)
function addAttendanceRecord(name, usn = '') {
    const records = getAttendanceRecords();
    const newRecord = {
        id: Date.now(),
        name: name,
        usn: usn,
        timestamp: new Date().toISOString(),
        status: 'present'
    };

    records.push(newRecord);
    saveAttendanceRecords(records);
    displayAttendanceRecords(records);
}

// Update statistics
function updateStats() {
    const records = getAttendanceRecords();
    const approvals = getApprovalStatuses();
    const today = new Date().toDateString();

    // Total count (Registered)
    document.getElementById('totalCount').textContent = records.length;

    // Today's count (Only Accepted)
    const todayCount = records.filter(record => {
        const recordDate = new Date(record.timestamp).toDateString();
        const status = approvals[record.id] || 'pending';
        return recordDate === today && status === 'accepted';
    }).length;
    document.getElementById('todayCount').textContent = todayCount;
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('currentTime').textContent = timeString;

    // Update every second
    setTimeout(updateCurrentTime, 1000);
}

// Update last update timestamp
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Refresh attendance data
async function refreshAttendance() {
    const refreshBtn = document.querySelector('.btn-refresh');
    const refreshIcon = refreshBtn.querySelector('.refresh-icon');

    // Add spinning animation
    refreshIcon.style.transform = 'rotate(360deg)';

    // Reload data
    await loadAttendanceRecords();

    // Reset animation
    setTimeout(() => {
        refreshIcon.style.transform = 'rotate(0deg)';
    }, 500);
}

// Auto-refresh functionality
function startAutoRefresh() {
    setInterval(async () => {
        await loadAttendanceRecords();
    }, CONFIG.REFRESH_INTERVAL);
}

// Filter attendance by search
function filterAttendance() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const attendanceItems = document.querySelectorAll('.attendance-item');

    attendanceItems.forEach(item => {
        const studentName = item.querySelector('.student-name').textContent.toLowerCase();
        const studentUsn = item.querySelector('.student-usn')?.textContent.toLowerCase() || '';

        if (studentName.includes(searchInput) || studentUsn.includes(searchInput)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Export to CSV/Excel
function exportToExcel() {
    const records = getAttendanceRecords();

    if (records.length === 0) {
        alert('No attendance records to export!');
        return;
    }

    // Sort by timestamp
    records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Create CSV content
    let csv = 'Timestamp,Student Name,USN,Status\n';

    // Get approval statuses
    const approvals = getApprovalStatuses();

    records.forEach(record => {
        const timestamp = formatDateTime(record.timestamp);
        const name = record.name.replace(/,/g, ';'); // Replace commas to avoid CSV issues
        const usn = record.usn || 'N/A';
        // Get status from approvals, default to pending
        const statusKey = approvals[record.id] || 'pending';
        const status = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

        csv += `"${timestamp}","${name}","${usn}","${status}"\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${date}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Attendance exported successfully!');
}

// Format date and time
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const dateString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return `${dateString} at ${timeString}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Demo function: Add sample data for testing
function addSampleData() {
    const sampleData = [
        { name: 'Rahul Sharma', usn: '1MS21CS001' },
        { name: 'Priya Patel', usn: '1MS21CS002' },
        { name: 'Amit Kumar', usn: '1MS21CS003' },
        { name: 'Sneha Singh', usn: '1MS21CS004' },
        { name: 'Arjun Reddy', usn: '1MS21CS005' },
        { name: 'Kavya Nair', usn: '1MS21CS006' },
        { name: 'Rohan Gupta', usn: '1MS21CS007' },
        { name: 'Ananya Iyer', usn: '1MS21CS008' }
    ];

    sampleData.forEach((student, index) => {
        setTimeout(() => {
            addAttendanceRecord(student.name, student.usn);
        }, index * 500);
    });
}

// Expose functions to console for testing
window.addSampleData = addSampleData;
window.addAttendanceRecord = addAttendanceRecord;
window.exportToExcel = exportToExcel;

console.log('%c🎓 QR Attendance System Loaded!', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6;');

// Show connection status
if (CONFIG.USE_GOOGLE_SHEETS && CONFIG.APPS_SCRIPT_URL) {
    console.log('%c✅ Google Sheets: CONNECTED', 'color: #10b981; font-weight: bold;');
    console.log('%c📊 Data source: Google Sheets', 'color: #8b5cf6;');
    console.log('%c🔄 Auto-refresh: Every 10 seconds', 'color: #8b5cf6;');
} else if (CONFIG.USE_GOOGLE_SHEETS && !CONFIG.APPS_SCRIPT_URL) {
    console.log('%c⚠️  Google Sheets: NOT CONFIGURED', 'color: #f59e0b; font-weight: bold;');
    console.log('%c📝 Add your Apps Script URL in script.js line 5', 'color: #f59e0b;');
    console.log('%c💾 Data source: localStorage (demo mode)', 'color: #8b5cf6;');
} else {
    console.log('%c💾 Data source: localStorage (demo mode)', 'color: #8b5cf6;');
    console.log('%c📝 To enable Google Sheets: Set USE_GOOGLE_SHEETS to true', 'color: #8b5cf6;');
}

console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6;');
console.log('%cCommands:', 'color: #6366f1; font-weight: bold;');
console.log('%c  addSampleData()                           - Add demo students', 'color: #8b5cf6;');
console.log('%c  addAttendanceRecord("Name", "USN")        - Add one student', 'color: #8b5cf6;');
console.log('%c  exportToExcel()                           - Download CSV file', 'color: #8b5cf6;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6;');
