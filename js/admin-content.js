class AdminContent {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }
    
    async init() {
        await this.loadContent();
        this.setupEventListeners();
        this.updatePreview(); // Initial preview update
    }
    
    async loadContent() {
        try {
            const { data, error } = await this.supabase
                .from('website_settings')
                .select('*')
                .single();
            
            if (error) throw error;
            
            if (data) {
                this.fillForm(data);
            }
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.showMessage('error', 'Gagal memuat konten: ' + error.message);
        }
    }
    
    fillForm(data) {
        document.getElementById('siteName').value = data.site_name || '';
        document.getElementById('siteTagline').value = data.site_tagline || '';
        document.getElementById('heroTitle').value = data.hero_title || '';
        document.getElementById('heroDescription').value = data.hero_description || '';
        document.getElementById('ctaText').value = data.cta_text || 'Beli Sekarang';
        
        // Handle badges array
        const badges = Array.isArray(data.badges) ? data.badges.join(', ') : '';
        document.getElementById('badges').value = badges;
        
        document.getElementById('primaryColor').value = data.primary_color || '#3b82f6';
        document.getElementById('primaryColorText').value = data.primary_color || '#3b82f6';
        document.getElementById('darkModeDefault').checked = data.dark_mode_default || false;
        document.getElementById('metaTitle').value = data.meta_title || '';
        document.getElementById('metaDescription').value = data.meta_description || '';
        
        this.updatePreview();
    }
    
    setupEventListeners() {
        const form = document.getElementById('contentForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContent();
        });
    }
    
    async saveContent() {
        const saveBtn = document.getElementById('saveContentBtn');
        const originalText = saveBtn.textContent;
        
        // Disable button and show loading
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.classList.add('opacity-50');
        
        try {
            const formData = {
                site_name: document.getElementById('siteName').value.trim(),
                site_tagline: document.getElementById('siteTagline').value.trim(),
                hero_title: document.getElementById('heroTitle').value.trim(),
                hero_description: document.getElementById('heroDescription').value.trim(),
                cta_text: document.getElementById('ctaText').value.trim(),
                badges: document.getElementById('badges').value
                    .split(',')
                    .map(badge => badge.trim())
                    .filter(badge => badge !== ''),
                primary_color: document.getElementById('primaryColor').value,
                dark_mode_default: document.getElementById('darkModeDefault').checked,
                meta_title: document.getElementById('metaTitle').value.trim(),
                meta_description: document.getElementById('metaDescription').value.trim(),
                updated_at: new Date().toISOString()
            };
            
            // Validation
            if (!formData.site_name || !formData.hero_title || !formData.cta_text) {
                throw new Error('Nama website, judul hero, dan teks CTA wajib diisi');
            }
            
            if (formData.meta_title && formData.meta_title.length > 60) {
                throw new Error('Meta title maksimal 60 karakter');
            }
            
            if (formData.meta_description && formData.meta_description.length > 160) {
                throw new Error('Meta description maksimal 160 karakter');
            }
            
            // Check if settings exist
            const { data: existingSettings } = await this.supabase
                .from('website_settings')
                .select('id')
                .single();
            
            let result;
            
            if (existingSettings) {
                // Update existing settings
                result = await this.supabase
                    .from('website_settings')
                    .update(formData)
                    .eq('id', existingSettings.id);
            } else {
                // Insert new settings
                result = await this.supabase
                    .from('website_settings')
                    .insert([formData]);
            }
            
            if (result.error) throw result.error;
            
            this.showMessage('success', 'Konten website berhasil disimpan');
            
        } catch (error) {
            console.error('Error saving content:', error);
            this.showMessage('error', 'Gagal menyimpan konten: ' + error.message);
            
        } finally {
            // Restore button state
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            saveBtn.classList.remove('opacity-50');
        }
    }
    
    updatePreview() {
        // This function is called from inline script in HTML
        // It updates the preview based on form values
    }
    
    showMessage(type, text) {
        const messageDiv = document.getElementById('message');
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
        const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
        
        messageDiv.innerHTML = `
            <div class="${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded-lg mb-4">
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
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 5000);
    }
}

// Initialize content management when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminContent = new AdminContent();
});