class AdminProducts {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentProduct = null;
        this.init();
    }
    
    async init() {
        await this.loadProducts();
        this.setupEventListeners();
    }
    
    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            this.renderProductsTable(data || []);
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showMessage('error', 'Gagal memuat produk: ' + error.message);
        }
    }
    
    renderProductsTable(products) {
        const container = document.getElementById('productsTableBody');
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        Belum ada produk. Klik "Tambah Produk" untuk menambahkan.
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span class="text-primary-600 font-bold">
                                ${product.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">
                                ${product.name}
                                ${product.is_featured ? '<span class="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Featured</span>' : ''}
                            </div>
                            <div class="text-sm text-gray-500">
                                ${product.short_description?.substring(0, 50) || 'Tidak ada deskripsi'}...
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        Rp ${product.discounted_price.toLocaleString()}
                    </div>
                    <div class="text-sm text-gray-500 line-through">
                        ${product.original_price > product.discounted_price ? `Rp ${product.original_price.toLocaleString()}` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${product.product_type === 'lifetime' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'}">
                        ${product.product_type === 'lifetime' ? 'Lifetime' : 'Digital'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'}">
                        ${product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="adminProducts.editProduct('${product.id}')" 
                            class="text-primary-600 hover:text-primary-900 mr-3">
                        Edit
                    </button>
                    <button onclick="adminProducts.toggleStatus('${product.id}', ${!product.is_active})"
                            class="${product.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} mr-3">
                        ${product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onclick="adminProducts.deleteProduct('${product.id}', '${product.name}')"
                            class="text-red-600 hover:text-red-900">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    setupEventListeners() {
        // Add product button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openModal();
        });
        
        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        // Close modal on outside click
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }
    
    openModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        
        if (product) {
            title.textContent = 'Edit Produk';
            this.fillForm(product);
        } else {
            title.textContent = 'Tambah Produk Baru';
            this.resetForm();
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    closeModal() {
        const modal = document.getElementById('productModal');
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        this.currentProduct = null;
        this.resetForm();
    }
    
    fillForm(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productType').value = product.product_type;
        document.getElementById('shortDescription').value = product.short_description || '';
        document.getElementById('fullDescription').value = product.full_description || '';
        document.getElementById('originalPrice').value = product.original_price;
        document.getElementById('discountedPrice').value = product.discounted_price;
        document.getElementById('displayOrder').value = product.display_order || 0;
        document.getElementById('isActive').checked = product.is_active;
        document.getElementById('isFeatured').checked = product.is_featured;
        document.getElementById('bulletPoints').value = Array.isArray(product.bullet_points) 
            ? product.bullet_points.join('\n') 
            : '';
        document.getElementById('previewUrl').value = product.preview_url || '';
        document.getElementById('previewType').value = product.preview_type || 'image';
        document.getElementById('fileUrl').value = product.file_url || '';
    }
    
    resetForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('displayOrder').value = 0;
        document.getElementById('isActive').checked = true;
        document.getElementById('isFeatured').checked = false;
        document.getElementById('previewType').value = 'image';
    }
    
    async saveProduct() {
        const form = document.getElementById('productForm');
        const saveBtn = document.getElementById('saveBtn');
        
        // Disable button and show loading
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.classList.add('opacity-50');
        
        try {
            const formData = {
                name: document.getElementById('productName').value.trim(),
                product_type: document.getElementById('productType').value,
                short_description: document.getElementById('shortDescription').value.trim(),
                full_description: document.getElementById('fullDescription').value.trim(),
                original_price: parseFloat(document.getElementById('originalPrice').value),
                discounted_price: parseFloat(document.getElementById('discountedPrice').value),
                display_order: parseInt(document.getElementById('displayOrder').value) || 0,
                is_active: document.getElementById('isActive').checked,
                is_featured: document.getElementById('isFeatured').checked,
                bullet_points: document.getElementById('bulletPoints').value
                    .split('\n')
                    .filter(point => point.trim() !== '')
                    .map(point => point.trim()),
                preview_url: document.getElementById('previewUrl').value.trim() || null,
                preview_type: document.getElementById('previewType').value,
                file_url: document.getElementById('fileUrl').value.trim() || null,
                updated_at: new Date().toISOString()
            };
            
            // Validation
            if (!formData.name) {
                throw new Error('Nama produk wajib diisi');
            }
            
            if (formData.original_price < 0 || formData.discounted_price < 0) {
                throw new Error('Harga tidak boleh negatif');
            }
            
            if (formData.discounted_price > formData.original_price) {
                throw new Error('Harga diskon tidak boleh lebih besar dari harga normal');
            }
            
            let result;
            const productId = document.getElementById('productId').value;
            
            if (productId) {
                // Update existing product
                result = await this.supabase
                    .from('products')
                    .update(formData)
                    .eq('id', productId);
            } else {
                // Insert new product
                result = await this.supabase
                    .from('products')
                    .insert([formData]);
            }
            
            if (result.error) throw result.error;
            
            this.showMessage('success', 
                productId ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
            
            this.closeModal();
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showMessage('error', 'Gagal menyimpan produk: ' + error.message);
            
        } finally {
            // Restore button state
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            saveBtn.classList.remove('opacity-50');
        }
    }
    
    async editProduct(productId) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            
            if (error) throw error;
            
            if (data) {
                this.openModal(data);
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showMessage('error', 'Gagal memuat produk: ' + error.message);
        }
    }
    
    async toggleStatus(productId, newStatus) {
        if (!confirm(`Apakah Anda yakin ingin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} produk ini?`)) {
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('products')
                .update({ is_active: newStatus })
                .eq('id', productId);
            
            if (error) throw error;
            
            this.showMessage('success', 
                `Produk berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error toggling product status:', error);
            this.showMessage('error', 'Gagal mengubah status produk: ' + error.message);
        }
    }
    
    async deleteProduct(productId, productName) {
        if (!confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('products')
                .delete()
                .eq('id', productId);
            
            if (error) throw error;
            
            this.showMessage('success', 'Produk berhasil dihapus');
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage('error', 'Gagal menghapus produk: ' + error.message);
        }
    }
    
    showMessage(type, text) {
        // Create or update message element
        let messageDiv = document.getElementById('message');
        
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'message';
            messageDiv.className = 'fixed top-4 right-4 z-50 max-w-sm';
            document.body.appendChild(messageDiv);
        }
        
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
        
        messageDiv.innerHTML = `
            <div class="${bgColor} border ${borderColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
                <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    ${type === 'success' 
                        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>'
                        : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>'
                    }
                </svg>
                <span>${text}</span>
            </div>
        `;
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// Initialize products management when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminProducts = new AdminProducts();
});