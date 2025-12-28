class AdminFAQ {
    constructor() {
        // ensure supabase client is available
        if (!window.supabaseClient) {
            console.error('Supabase client not found. Ensure js/supabase.js is loaded before admin-faq.js');
            return;
        }
        this.supabase = window.supabaseClient;
        this.currentFAQ = null;
        this.sortable = null;
        this.init();
    }
    
    async init() {
        await this.loadFAQ();
        await this.updateStats();
        this.setupEventListeners();
        this.initSortable();
    }
    
    async loadFAQ() {
        try {
            const { data, error } = await this.supabase
                .from('faqs')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            this.renderFAQList(data || []);
            
        } catch (error) {
            console.error('Error loading FAQ:', error);
            this.showMessage('error', 'Gagal memuat FAQ: ' + (error?.message || String(error)));
        }
    }
    
    renderFAQList(faqs) {
        const container = document.getElementById('faqList');
        if (!container) return;
        
        if (!faqs || faqs.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-gray-500">
                    Belum ada FAQ. Klik "Tambah FAQ" untuk menambahkan.
                </div>
            `;
            return;
        }
        
        container.innerHTML = faqs.map(faq => `
            <div class="faq-item p-6 hover:bg-gray-50 cursor-move" data-id="${faq.id}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                                <span class="text-primary-600 font-bold">${faq.display_order || 0}</span>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900">${faq.question}</h3>
                        </div>
                        <div class="ml-11">
                            <div class="text-gray-600 mb-4">
                                ${faq.answer && faq.answer.length > 150 ? faq.answer.substring(0, 150) + '...' : (faq.answer || '')}
                            </div>
                            <div class="flex items-center space-x-4">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                    ${faq.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'}">
                                    ${faq.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                                <span class="text-sm text-gray-500">
                                    Dibuat: ${faq.created_at ? new Date(faq.created_at).toLocaleDateString('id-ID') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex items-center space-x-2">
                        <button onclick="adminFAQ.editFAQ('${faq.id}')" 
                                class="p-2 text-primary-600 hover:text-primary-900 rounded-lg hover:bg-primary-50">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.8 15.8"/>
                            </svg>
                        </button>
                        <button onclick="adminFAQ.toggleStatus('${faq.id}', ${!faq.is_active})"
                                class="p-2 ${faq.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} rounded-lg hover:bg-gray-100">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </button>
                        <button onclick="adminFAQ.deleteFAQ('${faq.id}', '${(faq.question||'').substring(0, 50).replace(/'/g, "\\'") }')"
                                class="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"/>
                            </svg>
                        </button>
                        <div class="w-8 h-8 flex items-center justify-center text-gray-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Reinitialize sortable after rendering
        if (this.sortable) {
            this.sortable.destroy();
        }
        this.initSortable();
    }
    
    initSortable() {
        const container = document.getElementById('faqList');
        if (!container) return;
        
        this.sortable = new Sortable(container, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.faq-item',
            onEnd: () => {
                const saveBtn = document.getElementById('saveOrderBtn');
                if (saveBtn) saveBtn.classList.remove('hidden');
            }
        });
    }
    
    async saveOrder() {
        const saveBtn = document.getElementById('saveOrderBtn');
        const originalText = saveBtn ? saveBtn.textContent : '';
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Menyimpan...';
            saveBtn.classList.add('opacity-50');
        }
        
        try {
            const items = document.querySelectorAll('.faq-item');
            const updates = [];
            
            items.forEach((item, index) => {
                const id = item.getAttribute('data-id');
                updates.push({
                    id: id,
                    display_order: index
                });
            });
            
            // Update each FAQ with new order
            for (const update of updates) {
                const { error } = await this.supabase
                    .from('faqs')
                    .update({ display_order: update.display_order })
                    .eq('id', update.id);
                
                if (error) throw error;
            }
            
            this.showMessage('success', 'Urutan FAQ berhasil disimpan');
            if (saveBtn) saveBtn.classList.add('hidden');
            
        } catch (error) {
            console.error('Error saving order:', error);
            this.showMessage('error', 'Gagal menyimpan urutan: ' + (error?.message || String(error)));
            
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                saveBtn.classList.remove('opacity-50');
            }
        }
    }
    
    async updateStats() {
        try {
            const { data: faqs } = await this.supabase
                .from('faqs')
                .select('id, is_active');
            
            if (!faqs) return;
            
            const total = faqs.length;
            const active = faqs.filter(f => f.is_active).length;
            
            const totalEl = document.getElementById('totalFaq');
            const activeEl = document.getElementById('activeFaq');
            if (totalEl) totalEl.textContent = total;
            if (activeEl) activeEl.textContent = active;
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    setupEventListeners() {
        const form = document.getElementById('faqForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFAQ();
            });
        }
        
        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            saveOrderBtn.addEventListener('click', () => {
                this.saveOrder();
            });
        }
    }
    
    openModal(faq = null) {
        this.currentFAQ = faq;
        const modal = document.getElementById('faqModal');
        const title = document.getElementById('modalTitle');
        
        if (!modal) return;
        
        if (faq) {
            if (title) title.textContent = 'Edit FAQ';
            this.fillForm(faq);
        } else {
            if (title) title.textContent = 'Tambah FAQ Baru';
            this.resetForm();
        }
        
        modal.classList.remove('hidden');
    }
    
    closeModal() {
        const modal = document.getElementById('faqModal');
        if (modal) modal.classList.add('hidden');
        this.currentFAQ = null;
        this.resetForm();
    }
    
    fillForm(faq) {
        const faqIdEl = document.getElementById('faqId');
        const questionEl = document.getElementById('question');
        const answerEl = document.getElementById('answer');
        const displayOrderEl = document.getElementById('displayOrder');
        const isActiveEl = document.getElementById('isActive');
        if (faqIdEl) faqIdEl.value = faq.id || '';
        if (questionEl) questionEl.value = faq.question || '';
        if (answerEl) answerEl.value = faq.answer || '';
        if (displayOrderEl) displayOrderEl.value = faq.display_order || 0;
        if (isActiveEl) isActiveEl.checked = !!faq.is_active;
    }
    
    resetForm() {
        const form = document.getElementById('faqForm');
        if (form) form.reset();
        const faqIdEl = document.getElementById('faqId');
        const displayOrderEl = document.getElementById('displayOrder');
        const isActiveEl = document.getElementById('isActive');
        if (faqIdEl) faqIdEl.value = '';
        if (displayOrderEl) displayOrderEl.value = 0;
        if (isActiveEl) isActiveEl.checked = true;
    }
    
    async saveFAQ() {
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn ? saveBtn.textContent : '';
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Menyimpan...';
            saveBtn.classList.add('opacity-50');
        }
        
        try {
            const questionEl = document.getElementById('question');
            const answerEl = document.getElementById('answer');
            const displayOrderEl = document.getElementById('displayOrder');
            const isActiveEl = document.getElementById('isActive');
            
            const formData = {
                question: questionEl?.value.trim() || '',
                answer: answerEl?.value.trim() || '',
                display_order: parseInt(displayOrderEl?.value) || 0,
                is_active: !!(isActiveEl && isActiveEl.checked)
            };
            
            // Validation
            if (!formData.question || !formData.answer) {
                throw new Error('Pertanyaan dan jawaban wajib diisi');
            }
            
            let result;
            const faqId = (document.getElementById('faqId') && document.getElementById('faqId').value) || '';
            
            if (faqId) {
                result = await this.supabase
                    .from('faqs')
                    .update(formData)
                    .eq('id', faqId);
            } else {
                result = await this.supabase
                    .from('faqs')
                    .insert([formData]);
            }
            
            if (result && result.error) throw result.error;
            
            this.showMessage('success', 
                faqId ? 'FAQ berhasil diperbarui' : 'FAQ berhasil ditambahkan');
            
            this.closeModal();
            await this.loadFAQ();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error saving FAQ:', error);
            this.showMessage('error', 'Gagal menyimpan FAQ: ' + (error?.message || String(error)));
            
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                saveBtn.classList.remove('opacity-50');
            }
        }
    }
    
    async editFAQ(faqId) {
        try {
            const { data, error } = await this.supabase
                .from('faqs')
                .select('*')
                .eq('id', faqId)
                .single();
            
            if (error) throw error;
            
            if (data) {
                this.openModal(data);
            }
        } catch (error) {
            console.error('Error loading FAQ:', error);
            this.showMessage('error', 'Gagal memuat FAQ: ' + (error?.message || String(error)));
        }
    }
    
    async toggleStatus(faqId, newStatus) {
        if (!confirm(`Apakah Anda yakin ingin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} FAQ ini?`)) {
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('faqs')
                .update({ is_active: newStatus })
                .eq('id', faqId);
            
            if (error) throw error;
            
            this.showMessage('success', 
                `FAQ berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            
            await this.loadFAQ();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error toggling FAQ status:', error);
            this.showMessage('error', 'Gagal mengubah status FAQ: ' + (error?.message || String(error)));
        }
    }
    
    async deleteFAQ(faqId, question) {
        if (!confirm(`Apakah Anda yakin ingin menghapus FAQ "${question}"?`)) {
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('faqs')
                .delete()
                .eq('id', faqId);
            
            if (error) throw error;
            
            this.showMessage('success', 'FAQ berhasil dihapus');
            await this.loadFAQ();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            this.showMessage('error', 'Gagal menghapus FAQ: ' + (error?.message || String(error)));
        }
    }
    
    showMessage(type, text) {
        // delegate to utils UI if available
        try {
            if (window.__utilsUI && typeof window.__utilsUI.showMessage === 'function') {
                window.__utilsUI.showMessage(type, text);
                return;
            }
        } catch (e) {
            console.error('utilsUI.showMessage error', e);
        }
        
        // fallback: ensure message container and render
        let messageDiv = document.getElementById('message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'message';
            messageDiv.className = 'fixed top-4 right-4 z-50 max-w-sm';
            document.body.appendChild(messageDiv);
        }
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
        const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
        
        messageDiv.innerHTML = `
            <div class="${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-3 ${type === 'success' ? 'text-green-400' : 'text-red-400'}" fill="currentColor" viewBox="0 0 20 20">
                        ${type === 'success' 
                            ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>'
                            : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>'}
                    </svg>
                    <span>${text}</span>
                </div>
            </div>
        `;
        
        if (messageDiv._timeout) clearTimeout(messageDiv._timeout);
        messageDiv._timeout = setTimeout(() => {
            if (messageDiv) messageDiv.remove();
        }, 5000);
    }
}

// Initialize FAQ management
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.adminFAQ = new AdminFAQ();
        } catch (err) {
            console.error('Failed to initialize AdminFAQ:', err);
        }
    });
}
