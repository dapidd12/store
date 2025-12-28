class AdminAuth {
    constructor() {
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
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;
        
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Show success message
            successDiv.textContent = 'Login berhasil! Mengalihkan...';
            successDiv.classList.remove('hidden');
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = '/admin/dashboard.html';
            }, 1000);
            
        } catch (error) {
            errorDiv.textContent = error.message || 'Login gagal. Periksa email dan password.';
            errorDiv.classList.remove('hidden');
        }
    }
    
    async handleLogout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            window.location.href = '/admin/index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuth();
});