class AdminAuth {
    constructor() {
        // Ensure supabase client is loaded before proceeding
        if (!window.supabaseClient) {
            console.error('Supabase client not found. Pastikan js/supabase.js dimuat sebelum admin-auth.js');
            return;
        }
        this.supabase = window.supabaseClient;
        this.init();
    }
    
    init() {
        // Check if user is already logged in
        this.checkAuth();
        
        // Setup login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Setup logout button if exists
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    async checkAuth() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            // If on login page and already logged in, redirect to dashboard
            if (window.location.pathname.includes('admin/index.html') && session) {
                window.location.href = '/admin/dashboard.html';
                return;
            }
            
            // If on admin pages and not logged in, redirect to login
            if (window.location.pathname.includes('/admin/') && 
                !window.location.pathname.includes('index.html') && 
                !session) {
                window.location.href = '/admin/index.html';
                return;
            }
            
            return session;
        } catch (error) {
            console.error('Error checking auth session:', error);
            window.__utilsUI?.showMessage('error', error?.message || String(error));
            return null;
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        const rememberEl = document.getElementById('remember');
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        
        const email = emailEl?.value || '';
        const password = passwordEl?.value || '';
        const remember = rememberEl?.checked || false;
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Show success message
            if (successDiv) {
                successDiv.textContent = 'Login berhasil! Mengalihkan...';
                successDiv.classList.remove('hidden');
            } else {
                window.__utilsUI?.showMessage('success', 'Login berhasil! Mengalihkan...');
            }
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = '/admin/dashboard.html';
            }, 1000);
            
        } catch (error) {
            const msg = error?.message || String(error) || 'Login gagal. Periksa email dan password.';
            if (errorDiv) {
                errorDiv.textContent = msg;
                errorDiv.classList.remove('hidden');
            } else {
                window.__utilsUI?.showMessage('error', msg);
            }
        }
    }
    
    async handleLogout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            window.location.href = '/admin/index.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.__utilsUI?.showMessage('error', error?.message || String(error));
        }
    }
    
    async getCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.adminAuth = new AdminAuth();
    } catch (err) {
        console.error('Failed to initialize AdminAuth:', err);
    }
});
