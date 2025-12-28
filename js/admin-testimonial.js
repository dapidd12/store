class AdminTestimonials {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentTestimonial = null;
        this.init();
    }
    
    async init() {
        await this.loadTestimonials();
        await this.updateStats();
        this.setupEventListeners();
    }
    
    async loadTestimonials() {
        try {
            const { data, error } = await this.supabase
                .from('testimonials')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            this.renderTestimonialsTable(data || []);
            
        } catch (error) {
            console.error('Error loading testimonials:', error);
            this.showMessage('error', 'Gagal memuat testimoni: ' + error.message);
        }
    }
    
    renderTestimonialsTable(testimonials) {
        const container = document.getElementById('testimonialsTableBody');
        
        if (!testimonials || testimonials.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        Belum ada testimoni. Klik "Tambah Testimoni" untuk menambahkan.
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = testimonials.map(testimonial => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span class="text-primary-600 font-bold">
                                ${testimonial.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">
                                ${testimonial.name}
                            </div>
                            <div class="text-sm text-gray-500">
                                ${testimonial.role || '-'}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        ${Array(5).fill(0).map((_, i) => `
                            <svg class="w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}" 
                                 fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        `).join('')}
                        <span class="ml-2 text-sm text-gray-600">${testimonial.rating}/5</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate">
                        "${testimonial.content}"
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${testimonial.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'}">
                        ${testimonial.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${testimonial.display_order || 0}
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="adminTestimonials.editTestimonial('${testimonial.id}')" 
                            class="text-primary-600 hover:text-primary-900 mr-3">
                        Edit
                    </button>
                    <button onclick="adminTestimonials.toggleStatus('${testimonial.id}', ${!testimonial.is_active})"
                            class="${testimonial.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} mr-3">
                        ${testimonial.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onclick="adminTestimonials.deleteTestimonial('${testimonial.id}', '${testimonial.name}')"
                            class="text-red-600 hover:text-red-900">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async updateStats() {
        try {
            const { data: testimonials } = await this.supabase
                .from('testimonials')
                .select('id, rating, is_active');
            
            if (!testimonials) return;
            
            const total = testimonials.length;
            const active = testimonials.filter(t => t.is_active).length;
            const averageRating = testimonials.length > 0 
                ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
                : '0.0';
            
            document.getElementById('totalTestimonials').textContent = total;
            document.getElementById('activeTestimonials').textContent = active;
            document.getElementById('averageRating').textContent = averageRating;
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    setupEventListeners() {
        const form = document.getElementById('testimonialForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTestimonial();
        });
    }
    
    openModal(testimonial = null) {
        this.currentTestimonial = testimonial;
        const modal = document.getElementById('testimonialModal');
        const title = document.getElementById('modalTitle');
        
        if (testimonial) {
            title.textContent = 'Edit Testimoni';
            this.fillForm(testimonial);
        } else {
            title.textContent = 'Tambah Testimoni Baru';
            this.resetForm();
        }
        
        modal.classList.remove('hidden');
    }
    
    closeModal() {
        const modal = document.getElementById('testimonialModal');
        modal.classList.add('hidden');
        this.currentTestimonial = null;
        this.resetForm();
    }
    
    fillForm(testimonial) {
        document.getElementById('testimonialId').value = testimonial.id;
        document.getElementById('name').value = testimonial.name;
        document.getElementById('role').value = testimonial.role || '';
        document.getElementById('content').value = testimonial.content;
        document.getElementById('displayOrder').value = testimonial.display_order || 0;
        document.getElementById('isActive').checked = testimonial.is_active;
        
        // Set rating stars
        const rating = testimonial.rating || 5;
        document.querySelector(`#starRating input[value="${rating}"]`).checked = true;
    }
    
    resetForm() {
        document.getElementById('testimonialForm').reset();
        document.getElementById('testimonialId').value = '';
        document.getElementById('displayOrder').value = 0;
        document.getElementById('isActive').checked = true;
        document.querySelector('#starRating input[value="5"]').checked = true;
    }
    
    async saveTestimonial() {
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.classList.add('opacity-50');
        
        try {
            const rating = document.querySelector('#starRating input[name="rating"]:checked').value;
            
            const formData = {
                name: document.getElementById('name').value.trim(),
                role: document.getElementById('role').value.trim() || null,
                content: document.getElementById('content').value.trim(),
                rating: parseInt(rating),
                display_order: parseInt(document.getElementById('displayOrder').value) || 0,
                is_active: document.getElementById('isActive').checked,
                created_at: this.currentTestimonial ? undefined : new Date().toISOString()
            };
            
            // Validation
            if (!formData.name || !formData.content) {
                throw new Error('Nama dan isi testimoni wajib diisi');
            }
            
            if (formData.rating < 1 || formData.rating > 5) {
                throw new Error('Rating harus antara 1-5');
            }
            
            let result;
            const testimonialId = document.getElementById('testimonialId').value;
            
            if (testimonialId) {
                result = await this.supabase
                    .from('testimonials')
                    .update(formData)
                    .eq('id', testimonialId);
            } else {
                result = await this.supabase
                    .from('testimonials')
                    .insert([formData]);
            }
            
            if (result.error) throw result.error;
            
            this.showMessage('success', 
                testimonialId ? 'Testimoni berhasil diperbarui' : 'Testimoni berhasil ditambahkan');
            
            this.closeModal();
            await this.loadTestimonials();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error saving testimonial:', error);
            this.showMessage('error', 'Gagal menyimpan testimoni: ' + error.message);
            
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            saveBtn.classList.remove('opacity-50');
        }
    }
    
    async editTestimonial(testimonialId) {
        try {
            const { data, error } = await this.supabase
                .from('testimonials')
                .select('*')
                .eq('id', testimonialId)
                .single();
            
            if (error) throw error;
            
            if (data) {
                this.openModal(data);
            }
        } catch (error) {
            console.error('Error loading testimonial:', error);
            this.showMessage('error', 'Gagal memuat testimoni: ' + error.message);
        }
    }
    
    async toggleStatus(testimonialId, newStatus) {
        if (!confirm(`Apakah Anda yakin ingin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} testimoni ini?`)) {
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('testimonials')
                .update({ is_active: newStatus })
                .eq('id', testimonialId);
            
            if (error) throw error;
            
            this.showMessage('success', 
                `Testimoni berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            
            await this.loadTestimonials();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error toggling testimonial status:', error);
            this.showMessage('error', 'Gagal mengubah status testimoni: ' + error.message);
        }
    }
    
    async deleteTestimonial(testimonialId, testimonialName) {
        if (!confirm(`Apakah Anda yakin ingin menghapus testimoni "${testimonialName}"?`)) {
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('testimonials')
                .delete()
                .eq('id', testimonialId);
            
            if (error) throw error;
            
            this.showMessage('success', 'Testimoni berhasil dihapus');
            await this.loadTestimonials();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            this.showMessage('error', 'Gagal menghapus testimoni: ' + error.message);
        }
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

// Initialize testimonials management
document.addEventListener('DOMContentLoaded', () => {
    window.adminTestimonials = new AdminTestimonials();
});