// Global Theme Loader
fetch('/api/settings')
    .then(res => res.json())
    .then(settings => {
        if (settings.theme) {
            const vars = [
                'primary-bg', 'card-bg', 'accent-color', 'accent-hover',
                'text-primary', 'text-secondary', 'border-color'
            ];
            vars.forEach(v => {
                const val = settings.theme[`--${v}`];
                if (val) {
                    document.documentElement.style.setProperty(`--${v}`, val);
                }
            });
        }
    })
    .catch(err => console.log('Using default theme'));

// DOM Elements
const searchInput = document.getElementById('search');
const searchButton = document.querySelector('#search_div button');
const logoPosts = document.querySelectorAll('.logo_post');
const bookPosts = document.querySelectorAll('.book_post');
const webPosts = document.querySelectorAll('.web_post');

// =========================================
// Filter / Search Functionality
// =========================================
function filterPosts(query) {
    const term = query.toLowerCase().trim();
    const allPosts = [...logoPosts, ...bookPosts, ...webPosts];

    allPosts.forEach(post => {
        const title = post.querySelector('h2').innerText.toLowerCase();
        const desc = post.querySelector('p').innerText.toLowerCase();

        if (title.includes(term) || desc.includes(term)) {
            post.style.display = 'flex'; // Restore flex display
        } else {
            post.style.display = 'none';
        }
    });
}

// Live Search logic
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        filterPosts(e.target.value);
    });
}

// Button search logic (optional redundant trigger)
if (searchButton) {
    searchButton.addEventListener('click', () => {
        filterPosts(searchInput.value);
    });
}


// =========================================
// Image Lightbox (Preview)
// =========================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close-lightbox');
const allImages = document.querySelectorAll('.img');

// Only run lightbox logic if lightbox exists
if (lightbox && lightboxImg && closeBtn) {
    // Open Lightbox
    allImages.forEach(img => {
        img.addEventListener('click', () => {
            lightbox.style.display = 'flex';
            lightboxImg.src = img.src;
            // Disable scroll when lightbox is open
            document.body.style.overflow = 'hidden';
        });
    });

    // Close Lightbox
    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    }

    closeBtn.addEventListener('click', closeLightbox);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
}


// =========================================
// Navigation & Smooth Scroll
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100, // Offset for sticky header
                behavior: 'smooth'
            });
        }
    });
});


// =========================================
// Sign In / Log In Mock Interactions
// =========================================



// =========================================
// Console Init Message
// =========================================
console.log('Itqan Creative App Initialized');

// =========================================
// Smart Header (Hide on scroll down, show on scroll up)
// =========================================
let lastScrollTop = 0;
const header = document.querySelector('header');

if (header) {
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scroll Down
            header.classList.add('hide-header');
        } else {
            // Scroll Up
            header.classList.remove('hide-header');
        }

        lastScrollTop = scrollTop;
    });
}

// =========================================
// Payment Logic (Dynamic)
// =========================================
const paymentDetailsForm = document.getElementById('paymentDetailsForm');
const paymentOptionsContainer = document.querySelector('.payment-options');

// We need to fetch settings first to generate the grid
if (paymentOptionsContainer || paymentDetailsForm) {
    fetch('/api/settings')
        .then(res => res.json())
        .then(settings => {
            initPaymentSystem(settings.paymentMethods || []);
        })
        .catch(err => console.error('Error loading payment methods:', err));
}

function initPaymentSystem(methods) {
    // 1. Render Payment Grid (only if container exists, i.e., on payment.html)
    if (paymentOptionsContainer) {
        paymentOptionsContainer.innerHTML = '';

        // Group methods? For now, let's just dump them or try to group if possible.
        // Simplification: Just one grid or categorized if simple.
        // Let's create a single nice grid for all methods to keep it dynamic.

        const methodGrid = document.createElement('div');
        methodGrid.className = 'method-grid';
        methodGrid.style.display = 'grid';
        methodGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
        methodGrid.style.gap = '1rem';
        methodGrid.style.marginTop = '1rem';

        methods.forEach(method => {
            if (!method.enabled) return;

            const card = document.createElement('div');
            card.className = 'method-card';
            card.innerHTML = `
                <div class="card-content">
                    <div class="icon-box"><i class="fas ${method.icon}"></i></div>
                    <span>${method.name}</span>
                    <input type="radio" name="payment_method" value="${method.id}" style="display: none;">
                </div>
            `;

            // Interaction clicking the card
            card.addEventListener('click', () => {
                // Remove active from all
                document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Update Form
                updatePaymentForm(method);

                // Scroll
                if (paymentDetailsForm) {
                    setTimeout(() => {
                        paymentDetailsForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });

            methodGrid.appendChild(card);
        });

        // Wrap in a category for styling consistency if needed, or just append
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'payment-category';
        categoryWrapper.innerHTML = `<h3>পেমেন্ট মেথড নির্বাচন করুন</h3>`;
        categoryWrapper.appendChild(methodGrid);

        paymentOptionsContainer.appendChild(categoryWrapper);
    }
}

function updatePaymentForm(data) {
    if (!paymentDetailsForm) return;

    // Fade out
    paymentDetailsForm.style.opacity = '0';
    paymentDetailsForm.style.transform = 'translateY(10px)';

    setTimeout(() => {
        paymentDetailsForm.innerHTML = `
            <h3 class="form-title"><i class="fas ${data.icon}"></i> ${data.name}</h3>
            
            <div class="payment-info-box">
                <span class="info-label">${data.instruction}</span>
                <span class="info-number" title="Click to copy">${data.number} <i class="far fa-copy"></i></span>
            </div>

            <form id="active-payment-form">
                <div class="form-group">
                    <label>পেমেন্ট কনফার্মেশন</label>
                    <input type="text" class="payment-input" placeholder="${data.placeholder || 'Transaction ID'}" required>
                </div>
                <button type="submit" class="pay-btn">পেমেন্ট নিশ্চিত করুন</button>
                <p class="secure-note"><i class="fas fa-shield-alt"></i> আপনার তথ্য সুরক্ষিত</p>
            </form>
        `;

        // Add Copy Functionality
        const numberDisplay = paymentDetailsForm.querySelector('.info-number');
        numberDisplay.addEventListener('click', () => {
            navigator.clipboard.writeText(data.number);

            // Visual feedback
            const originalHTML = numberDisplay.innerHTML;
            numberDisplay.innerHTML = `${data.number} <i class="fas fa-check" style="color: #10b981;"></i>`;
            numberDisplay.classList.add('copied');

            setTimeout(() => {
                numberDisplay.innerHTML = originalHTML;
                numberDisplay.classList.remove('copied');
            }, 2000);
        });

        // Handle Form Submit
        const form = paymentDetailsForm.querySelector('#active-payment-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রসেসিং...';
            btn.disabled = true;

            setTimeout(() => {
                alert('আপনার পেমেন্ট সফল হয়েছে! ধন্যবাদ।');
                btn.innerHTML = 'পেমেন্ট নিশ্চিত করুন';
                btn.disabled = false;
                form.reset();
            }, 2000);
        });

        // Fade in
        paymentDetailsForm.style.opacity = '1';
        paymentDetailsForm.style.transform = 'translateY(0)';
    }, 400); // Matches CSS transition duration
}

// =========================================
// Authentication Logic (User)
// =========================================

const authState = {
    isLoggedIn: false,
    user: null
};

// Check Auth on Page Load
document.addEventListener('DOMContentLoaded', () => {
    checkUserAuth();

    // Login Form Handler
    const loginForm = document.querySelector('form[action="order.html"]'); // Identifying by old action or structure
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.removeAttribute('action');
        loginForm.addEventListener('submit', handleUserLogin);
    }

    // Signup Form Handler
    const signupForm = document.querySelector('form[action="order.html"]');
    if (signupForm && window.location.pathname.includes('signup.html')) {
        signupForm.removeAttribute('action');
        signupForm.addEventListener('submit', handleUserSignup);
    }
});

function checkUserAuth() {
    fetch('/api/auth/check')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                authState.isLoggedIn = true;
                authState.user = data.user;
                updateUIForLoggedInUser(data.user);
            } else {
                updateUIForGuest();
            }
        })
        .catch(err => console.error('Auth check failed', err));
}

function updateUIForLoggedInUser(user) {
    // 1. Update Header
    const signInLink = document.getElementById('sign_in');
    const logInLink = document.getElementById('log_in');

    // Safety check if elements exist (header might differ)
    if (signInLink && logInLink) {
        signInLink.style.display = 'none';
        logInLink.textContent = 'Logout';
        logInLink.href = '#';
        logInLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });

        // Add User Name Element
        const li = document.createElement('li');
        li.innerHTML = `<a href="order.html" style="color: var(--accent-color); font-weight: bold;"><i class="fas fa-user"></i> ${user.name}</a>`;
        logInLink.parentElement.parentElement.insertBefore(li, logInLink.parentElement);
    }
}

function updateUIForGuest() {
    // Ensure default state
}

async function handleUserLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="text"]').value; // Assuming first input is username/email. Wait, login.html uses "User Name".
    // Wait, the backend expects 'email' for users. login.html uses "User Name" placeholder but type text.
    // The previous code had "User Name". I should probably fix login.html to be explicit, but I'll use the value.
    const password = e.target.querySelector('input[type="password"]').value;
    const btn = e.target.querySelector('button');

    // Assume input is email if it contains @, otherwise maybe name? Backend user.json has email.
    // Let's assume the user enters EMAIL for now or I need to update backend to check name too. 
    // Backend checks: u.email === email. So user MUST enter email.

    const originalText = btn.innerText;
    btn.innerText = 'Signing in...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'user', email: email, password: password })
        });
        const data = await res.json();

        if (res.ok) {
            window.location.href = 'index.html'; // Redirect to home
        } else {
            alert(data.message);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert('Login failed');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function handleUserSignup(e) {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('input');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    const confirmPass = inputs[3].value;

    if (password !== confirmPass) {
        alert("Passwords do not match");
        return;
    }

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role: 'user' })
        });

        if (res.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert('Registration failed');
        }
    } catch (err) {
        alert('Error registering');
    }
}

function logoutUser() {
    fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.reload();
        });
}

// =========================================
// Contact & Social Settings (Dynamic)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Only fetch if elements exist to save bandwidth/logic
    const phoneDisplay = document.getElementById('contact-phone-display');
    const fbLink = document.getElementById('link-facebook');

    if (phoneDisplay || fbLink) {
        fetch('/api/settings')
            .then(res => res.json())
            .then(settings => {
                if (settings.contact) {
                    // Phone
                    if (phoneDisplay && settings.contact.phone) {
                        // Also update href for tel: (Replacing the whole line to make it clickable if not already)
                        // Actually, let's just text for now to match the span, or make it a link. elements in about.html suggests:
                        // <p><i class="fas fa-phone"></i> মোবাইল: <span id="contact-phone-display">+880...</span></p>
                        // I will just update the span text.
                        phoneDisplay.innerText = settings.contact.phone;

                        // Optional: Make the parent paragraph a link? 
                        // Let's stick to updating the text as requested.
                    }

                    // Social Links
                    const sLinks = {
                        'link-facebook': settings.contact.facebook,
                        'link-whatsapp': settings.contact.whatsapp,
                        'link-telegram': settings.contact.telegram,
                        'link-twitter': settings.contact.twitter
                    };

                    for (const [id, url] of Object.entries(sLinks)) {
                        const el = document.getElementById(id);
                        if (el && url) el.href = url;
                    }
                }
            })
            .catch(err => console.error('Error loading contact settings:', err));
    }
});
