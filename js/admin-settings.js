class AdminSettings {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
    }
    
    async loadSettings() {
        try {
            // Load from Supabase table 'settings' (need to create this table)
            const { data, error } = await this.supabase
                .from('settings')
                .select('*')
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }
            
            if (data) {
                this.fillForms(data);
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('error', 'Gagal memuat pengaturan: ' + error.message);
        }
    }
    
    fillForms(data) {
        // General Settings
        document.getElementById('maintenanceMode').checked = data.maintenance_mode || false;
        document.getElementById('maintenanceMessage').value = data.maintenance_message || '';
        document.getElementById('analyticsId').value = data.analytics_id || '';
        document.getElementById('facebookPixelId').value = data.facebook_pixel_id || '';
        document.getElementById('customCSS').value = data.custom_css || '';
        document.getElementById('customJSHeader').value = data.custom_js_header || '';
        document.getElementById('customJSFooter').value = data.custom_js_footer || '';
        
        // Email Settings
        document.getElementById('adminEmail').value = data.admin_email || '';
        document.getElementById('supportEmail').value = data.support_email || '';
        document.getElementById('smtpHost').value = data.smtp_host || '';
        document.getElementById('smtpPort').value = data.smtp_port || '';
        document.getElementById('smtpUsername').value = data.smtp_username || '';
        document.getElementById('smtpPassword').value = data.smtp_password || '';
    }
    
    setupEventListeners() {
        const generalForm = document.getElementById('generalSettingsForm');
        const emailForm = document.getElementById('emailSettingsForm');
        
        generalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });
        
        emailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmailSettings();
        });
    }
    
    async saveGeneralSettings() {
        const saveBtn = document.getElementById('saveGeneralBtn');
        const originalText = saveBtn.textContent;
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.classList.add('opacity-50');
        
        try {
            const formData = {
                maintenance_mode: document.getElementById('maintenanceMode').checked,
                maintenance_message: document.getElementById('maintenanceMessage').value.trim(),
                analytics_id: document.getElementById('analyticsId').value.trim(),
                facebook_pixel_id: document.getElementById('facebookPixelId').value.trim(),
                custom_css: document.getElementById('customCSS').value.trim(),
                custom_js_header: document.getElementById('customJSHeader').value.trim(),
                custom_js_footer: document.getElementById('customJSFooter').value.trim(),
                updated_at: new Date().toISOString()
            };
            
            // Save to Supabase
            const { data: existingSettings } = await this.supabase
                .from('settings')
                .select('id')
                .single();
            
            let result;
            
            if (existingSettings) {
                result = await this.supabase
                    .from('settings')
                    .update(formData)
                    .eq('id', existingSettings.id);
            } else {
                result = await this.supabase
                    .from('settings')
                    .insert([formData]);
            }
            
            if (result.error) throw result.error;
            
            this.showMessage('success', 'Pengaturan umum berhasil disimpan');
            
        } catch (error) {
            console.error('Error saving general settings:', error);
            this.showMessage('error', 'Gagal menyimpan pengaturan umum: ' + error.message);
            
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            saveBtn.classList.remove('opacity-50');
        }
    }
    
    async saveEmailSettings() {
        const saveBtn = document.getElementById('saveEmailBtn');
        const originalText = saveBtn.textContent;
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.classList.add('opacity-50');
        
        try {
            const formData = {
                admin_email: document.getElementById('adminEmail').value.trim(),
                support_email: document.getElementById('supportEmail').value.trim(),
                smtp_host: document.getElementById('smtpHost').value.trim(),
                smtp_port: parseInt(document.getElementById('smtpPort').value) || null,
                smtp_username: document.getElementById('smtpUsername').value.trim(),
                smtp_password: document.getElementById('smtpPassword').value.trim(),
                updated_at: new Date().toISOString()
            };
            
            // Validation for email
            if (formData.admin_email && !this.isValidEmail(formData.admin_email)) {
                throw new Error('Format email administrator tidak valid');
            }
            
            if (formData.support_email && !this.isValidEmail(formData.support_email)) {
                throw new Error('Format email support tidak valid');
            }
            
            // Save to Supabase
            const { data: existingSettings } = await this.supabase
                .from('settings')
                .select('id')
                .single();
            
            let result;
            
            if (existingSettings) {
                result = await this.supabase
                    .from('settings')
                    .update(formData)
                    .eq('id', existingSettings.id);
            } else {
                result = await this.supabase
                    .from('settings')
                    .insert([formData]);
            }
            
            if (result.error) throw result.error;
            
            this.showMessage('success', 'Pengaturan email berhasil disimpan');
            
        } catch (error) {
            console.error('Error saving email settings:', error);
            this.showMessage('error', 'Gagal menyimpan pengaturan email: ' + error.message);
            
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            saveBtn.classList.remove('opacity-50');
        }
    }
    
    showResetConfirmation() {
        document.getElementById('resetModal').classList.remove('hidden');
        document.getElementById('resetConfirmText').value = '';
        document.getElementById('confirmResetBtn').disabled = true;
    }
    
    async resetAllData() {
        if (!confirm('Yakin ingin menghapus SEMUA DATA? Tindakan ini TIDAK DAPAT DIBATALKAN!')) {
            return;
        }
        
        const confirmBtn = document.getElementById('confirmResetBtn');
        const originalText = confirmBtn.textContent;
        
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Menghapus...';
        confirmBtn.classList.add('opacity-50');
        
        try {
            // Delete all data from all tables
            const tables = ['products', 'testimonials', 'faqs', 'orders', 'settings'];
            
            for (const table of tables) {
                const { error } = await this.supabase
                    .from(table)
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                
                if (error) throw error;
            }
            
            // Close modal
            document.getElementById('resetModal').classList.add('hidden');
            
            this.showMessage('success', 'Semua data berhasil direset');
            
            // Reload page after 2 seconds
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error resetting data:', error);
            this.showMessage('error', 'Gagal mereset data: ' + error.message);
            
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            confirmBtn.classList.remove('opacity-50');
        }
    }
    
    async exportData() {
        try {
            // Get data from all tables
            const data = {};
            
            const tables = ['website_settings', 'products', 'testimonials', 'faqs', 'orders', 'settings'];
            
            for (const table of tables) {
                const { data: tableData, error } = await this.supabase
                    .from(table)
                    .select('*');
                
                if (error) throw error;
                
                data[table] = tableData || [];
            }
            
            // Create and download JSON file
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('success', 'Data berhasil diekspor');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('error', 'Gagal mengekspor data: ' + error.message);
        }
    }
    
    async clearCache() {
        try {
            // Clear browser cache
            if (caches) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            // Clear localStorage
            localStorage.clear();
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            this.showMessage('success', 'Cache berhasil dibersihkan');
            
            // Refresh after 1 second
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showMessage('error', 'Gagal membersihkan cache: ' + error.message);
        }
    }
    
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showMessage(type, text) {
        const messageDiv = document.getElementById('message');
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
        const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
        
        messageDiv.innerHTML = `
            <div class="${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-3 ${type === 'success' ? 'text-green-400' : 'text-red-400'}" fill="currentColor" viewBox="0 0 20 20">
                        ${type === 'success' 
                            ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>'
                            : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>'
                        }
                    </svg>
                    <span>${text}</span>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 5000);
    }
}

// Initialize settings management
document.addEventListener('DOMContentLoaded', () => {
    window.adminSettings = new AdminSettings();
});