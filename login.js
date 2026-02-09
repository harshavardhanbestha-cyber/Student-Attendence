const LOGIN_CONFIG = {
    // PASTE YOUR NEW 'EMAIL SENDER' APPS SCRIPT URL HERE:
    EMAIL_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwgNRJDteeLz3YZKk_PBQfdZ_0XD0K27VzGcbG1j2wI8ZRz0g5LcHdpoiIhfDZmzJNOhw/exec',

    // Allowed emails (Security Check)
    ALLOWED_EMAILS: ['harshavardhanbestha@gmail.com', 'avxqt001@gmail.com']
};

let currentOTP = null;
let currentEmail = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
    }

    // Allow pressing Enter to submit
    document.getElementById('email').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendOTP();
    });

    document.getElementById('otp').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') verifyOTP();
    });
});

async function sendOTP() {
    const emailInput = document.getElementById('email');
    const sendBtn = document.getElementById('sendBtn');
    const email = emailInput.value.trim();

    if (!email || !validateEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Restrict access to specific emails
    if (LOGIN_CONFIG.ALLOWED_EMAILS && !LOGIN_CONFIG.ALLOWED_EMAILS.includes(email)) {
        showMessage('Access Denied: This email is not authorized.', 'error');
        return;
    }

    // Restrict access to specific emails
    if (LOGIN_CONFIG.ALLOWED_EMAILS && !LOGIN_CONFIG.ALLOWED_EMAILS.includes(email)) {
        showMessage('Access Denied: This email is not authorized.', 'error');
        return;
    }

    setLoading(sendBtn, true, 'Sending...');
    showMessage('', 'none'); // Clear messages

    try {
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        currentOTP = otp;
        currentEmail = email;

        // Construct the URL for the Apps Script
        // Action: send_email
        const url = `${LOGIN_CONFIG.EMAIL_SCRIPT_URL}?action=send_email&email=${encodeURIComponent(email)}&subject=${encodeURIComponent('Your Login OTP')}&body=${encodeURIComponent('Your OTP is: ' + otp)}`;

        // Use GET request with 'no-cors' mode to avoid preflight OPTIONS issues
        // Note: In 'no-cors' mode, we can't read the response status or body, so we assume success if no network error occurs.
        await fetch(url, {
            method: 'GET',
            mode: 'no-cors'
        });

        // Since we can't read the response in no-cors, we assume it worked.
        // The email should arrive shortly.
        showMessage(`OTP sent to ${email}`, 'success');
        showOTPSection();

    } catch (error) {
        console.error('Error sending OTP:', error);
        showMessage('Failed to send OTP. Check console/network.', 'error');
    } finally {
        setLoading(sendBtn, false, '<span>📩</span> Send OTP');
    }
}

function verifyOTP() {
    const otpInput = document.getElementById('otp');
    const verifyBtn = document.getElementById('verifyBtn');
    const userOTP = otpInput.value.trim();

    if (!userOTP) {
        showMessage('Please enter the OTP.', 'error');
        return;
    }

    setLoading(verifyBtn, true, 'Verifying...');

    if (userOTP === currentOTP) {
        // Success
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', currentEmail); // Optional: store who logged in

        showMessage('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        // Fail
        showMessage('Invalid OTP. Please try again.', 'error');
        setLoading(verifyBtn, false, '<span>🔓</span> Verify & Login');
    }
}

function showOTPSection() {
    document.getElementById('emailSection').style.display = 'none';
    document.getElementById('otpSection').style.display = 'block';
    document.getElementById('otp').value = '';
    document.getElementById('otp').focus();
}

function resetLogin() {
    document.getElementById('emailSection').style.display = 'block';
    document.getElementById('otpSection').style.display = 'none';
    currentOTP = null;
    showMessage('', 'none');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(msg, type) {
    const box = document.getElementById('messageBox');
    if (type === 'none') {
        box.style.display = 'none';
        return;
    }
    box.textContent = msg;
    box.className = type === 'error' ? 'msg-error' : 'msg-success';
    box.style.display = 'block';
}

function setLoading(btn, isLoading, content) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spin">↻</span> ' + content;
        btn.style.opacity = '0.7';
    } else {
        btn.disabled = false;
        btn.innerHTML = content;
        btn.style.opacity = '1';
    }
}
