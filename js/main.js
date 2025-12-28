// Main application logic
class DigitalStore {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        await this.loadProducts();
        await this.loadTestimonials();
        await this.loadFAQ();
        this.setupEventListeners();
    }
    
    async loadSettings() {
        try {
            const { data, error } = await this.supabase
                .from('website_settings')
                .select('*')
                .single();
            
            if (error) throw error;
            
            if (data) {
                // Update hero section
                document.getElementById('hero-title').textContent = data.hero_title;
                document.getElementById('hero-description').textContent = data.hero_description;
                document.getElementById('hero-cta').textContent = data.cta_text;
                document.getElementById('final-cta').textContent = data.cta_text;
                
                // Update badges
                const badgesContainer = document.getElementById('hero-badges');
                if (data.badges && Array.isArray(data.badges)) {
                    data.badges.forEach(badge => {
                        const badgeElement = document.createElement('span');
                        badgeElement.className = 'px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium';
                        badgeElement.textContent = badge;
                        badgesContainer.appendChild(badgeElement);
                    });
                }
                
                // Update site info
                document.getElementById('site-name').textContent = data.site_name;
                document.getElementById('footer-site-name').textContent = data.site_name;
                document.getElementById('footer-tagline').textContent = data.site_tagline;
                document.getElementById('copyright-text').textContent = 
                    `© ${new Date().getFullYear()} ${data.site_name}. All rights reserved.`;
                
                // Update meta
                document.title = data.meta_title || data.site_name;
                
                // Update primary color
                if (data.primary_color) {
                    this.updatePrimaryColor(data.primary_color);
                }
                
                // Set dark mode if configured
                if (data.dark_mode_default && !localStorage.getItem('theme')) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            const container = document.getElementById('products-container');
            container.innerHTML = '';
            
            if (data && data.length > 0) {
                data.forEach(product => {
                    const productElement = this.createProductCard(product);
                    container.appendChild(productElement);
                });
                
                // Load features from first product
                if (data[0].features) {
                    this.loadFeatures(data[0].features);
                }
                
                // Load preview from first product
                if (data[0].preview_url) {
                    this.loadPreview(data[0].preview_url, data[0].preview_type);
                }
            } else {
                container.innerHTML = `
                    <div class="col-span-3 text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400">Tidak ada produk tersedia saat ini.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }
    
    createProductCard(product) {
        const discountPercentage = product.original_price > 0 
            ? Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)
            : 0;
        
        const card = document.createElement('div');
        card.className = 'card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col relative';
        card.setAttribute('data-aos', 'fade-up');
        
        if (product.is_featured) {
            card.classList.add('border-2', 'border-primary-500');
            card.innerHTML += `
                <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                    <span class="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        POPULER
                    </span>
                </div>
            `;
        }
        
        card.innerHTML += `
            <div class="mb-6">
                <h3 class="text-2xl font-bold mb-2">${product.name}</h3>
                <p class="text-gray-600 dark:text-gray-400">${product.short_description}</p>
            </div>
            
            <div class="mb-6 flex-grow">
                <div class="space-y-3">
                    ${product.bullet_points && Array.isArray(product.bullet_points) 
                        ? product.bullet_points.map(point => 
                            `<div class="flex items-start">
                                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span>${point}</span>
                            </div>`
                        ).join('')
                        : ''
                    }
                </div>
            </div>
            
            <div class="mb-6">
                <div class="flex items-baseline mb-2">
                    ${product.original_price > 0 && product.original_price > product.discounted_price 
                        ? `<span class="text-2xl line-through text-gray-400 mr-3">Rp ${product.original_price.toLocaleString()}</span>`
                        : ''
                    }
                    <span class="text-4xl font-bold">Rp ${product.discounted_price.toLocaleString()}</span>
                </div>
                
                ${discountPercentage > 0 
                    ? `<span class="inline-block bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm font-semibold px-3 py-1 rounded-full">
                        Hemat ${discountPercentage}%
                    </span>`
                    : ''
                }
                
                ${product.product_type === 'lifetime' 
                    ? `<div class="mt-3">
                        <span class="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-semibold px-3 py-1 rounded-full">
                            Lifetime Access
                        </span>
                    </div>`
                    : ''
                }
            </div>
            
            <button onclick="digitalStore.handlePurchase('${product.id}')" 
                    class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-xl transition duration-300 transform hover:scale-105">
                Beli Sekarang
            </button>
        `;
        
        return card;
    }
    
    loadFeatures(features) {
        const container = document.getElementById('features-container');
        if (!features || !Array.isArray(features)) return;
        
        container.innerHTML = '';
        
        features.forEach((feature, index) => {
            const featureElement = document.createElement('div');
            featureElement.className = 'card-hover bg-white dark:bg-gray-800 rounded-xl p-6';
            featureElement.setAttribute('data-aos', 'fade-up');
            featureElement.setAttribute('data-aos-delay', (index * 100));
            
            featureElement.innerHTML = `
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-bold mb-2">${feature.title || 'Fitur Unggulan'}</h3>
                <p class="text-gray-600 dark:text-gray-400">${feature.description || ''}</p>
            `;
            
            container.appendChild(featureElement);
        });
    }
    
    async loadPreview(previewUrl, previewType) {
        const container = document.getElementById('preview-container');
        if (!previewUrl) return;
        
        try {
            if (previewType === 'image') {
                container.innerHTML = `
                    <div class="rounded-xl overflow-hidden">
                        <img src="${previewUrl}" 
                             alt="Preview Produk" 
                             class="w-full h-auto rounded-lg shadow-lg"
                             loading="lazy">
                    </div>
                `;
            } else if (previewType === 'video') {
                container.innerHTML = `
                    <div class="rounded-xl overflow-hidden">
                        <video class="w-full rounded-lg shadow-lg" controls poster="${previewUrl}/thumbnail">
                            <source src="${previewUrl}" type="video/mp4">
                            Browser Anda tidak mendukung tag video.
                        </video>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading preview:', error);
        }
    }
    
    async loadTestimonials() {
        try {
            const { data, error } = await this.supabase
                .from('testimonials')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .limit(6);
            
            if (error) throw error;
            
            const container = document.getElementById('testimonials-container');
            container.innerHTML = '';
            
            if (data && data.length > 0) {
                data.forEach((testimonial, index) => {
                    const testimonialElement = this.createTestimonialCard(testimonial, index);
                    container.appendChild(testimonialElement);
                });
            }
        } catch (error) {
            console.error('Error loading testimonials:', error);
        }
    }
    
    createTestimonialCard(testimonial, index) {
        const card = document.createElement('div');
        card.className = 'card-hover bg-white dark:bg-gray-800 rounded-xl p-6';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100));
        
        // Generate star rating
        const stars = Array(5).fill(0).map((_, i) => 
            i < testimonial.rating 
                ? '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>'
                : '<svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>'
        ).join('');
        
        card.innerHTML = `
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                    <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${testimonial.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                    <h4 class="font-bold">${testimonial.name}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${testimonial.role}</p>
                </div>
            </div>
            
            <div class="flex mb-4">
                ${stars}
            </div>
            
            <p class="text-gray-600 dark:text-gray-400 italic">"${testimonial.content}"</p>
        `;
        
        return card;
    }
    
    async loadFAQ() {
        try {
            const { data, error } = await this.supabase
                .from('faqs')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            const container = document.getElementById('faq-container');
            container.innerHTML = '';
            
            if (data && data.length > 0) {
                data.forEach(faq => {
                    const faqElement = this.createFAQItem(faq);
                    container.appendChild(faqElement);
                });
            }
        } catch (error) {
            console.error('Error loading FAQ:', error);
        }
    }
    
    createFAQItem(faq) {
        const item = document.createElement('div');
        item.className = 'card-hover bg-white dark:bg-gray-800 rounded-xl p-6';
        item.setAttribute('data-aos', 'fade-up');
        
        item.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer" onclick="this.parentElement.classList.toggle('active')">
                <h3 class="text-lg font-bold">${faq.question}</h3>
                <svg class="w-6 h-6 transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="mt-4 text-gray-600 dark:text-gray-400 hidden">
                ${faq.answer}
            </div>
        `;
        
        // Add click handler for toggle
        item.querySelector('div').addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('svg');
            
            content.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
        });
        
        return item;
    }
    
    updatePrimaryColor(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Update Tailwind config
        const style = document.createElement('style');
        style.textContent = `
            .text-primary-500 { color: ${color}; }
            .bg-primary-500 { background-color: ${color}; }
            .border-primary-500 { border-color: ${color}; }
        `;
        document.head.appendChild(style);
    }
    
    handlePurchase(productId) {
        // In a real app, this would integrate with payment gateway
        alert(`Pembelian produk ${productId} akan diproses. Implementasi payment gateway diperlukan.`);
        
        // Example: Redirect to payment page
        // window.location.href = `/checkout.html?product=${productId}`;
    }
    
    setupEventListeners() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize the store when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.digitalStore = new DigitalStore();
});