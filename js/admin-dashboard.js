class AdminDashboard {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }
    
    async init() {
        await this.loadUserInfo();
        await this.loadStats();
        await this.loadCharts();
        await this.loadRecentActivities();
    }
    
    async loadUserInfo() {
        const user = await window.adminAuth.getCurrentUser();
        if (user) {
            document.getElementById('userInitial').textContent = 
                user.email.charAt(0).toUpperCase();
            document.getElementById('userName').textContent = 
                user.email.split('@')[0];
            document.getElementById('userEmail').textContent = user.email;
        }
    }
    
    async loadStats() {
        try {
            // Load products stats
            const { data: products, error: productsError } = await this.supabase
                .from('products')
                .select('id, is_active');
            
            if (!productsError && products) {
                const totalProducts = products.length;
                const activeProducts = products.filter(p => p.is_active).length;
                
                document.getElementById('totalProducts').textContent = totalProducts;
                document.getElementById('activeProductsText').textContent = 
                    `${activeProducts} aktif`;
            }
            
            // Load testimonials stats
            const { data: testimonials, error: testimonialsError } = await this.supabase
                .from('testimonials')
                .select('id, is_active');
            
            if (!testimonialsError && testimonials) {
                const totalTestimonials = testimonials.length;
                const activeTestimonials = testimonials.filter(t => t.is_active).length;
                
                document.getElementById('totalTestimonials').textContent = totalTestimonials;
                document.getElementById('activeTestimonialsText').textContent = 
                    `${activeTestimonials} aktif`;
            }
            
            // Load FAQ stats
            const { data: faqs, error: faqsError } = await this.supabase
                .from('faqs')
                .select('id, is_active');
            
            if (!faqsError && faqs) {
                const totalFAQ = faqs.length;
                const activeFAQ = faqs.filter(f => f.is_active).length;
                
                document.getElementById('totalFAQ').textContent = totalFAQ;
                document.getElementById('activeFAQText').textContent = 
                    `${activeFAQ} aktif`;
            }
            
            // Load orders stats
            const { data: orders, error: ordersError } = await this.supabase
                .from('orders')
                .select('id, status');
            
            if (!ordersError && orders) {
                const totalOrders = orders.length;
                const pendingOrders = orders.filter(o => o.status === 'pending').length;
                
                document.getElementById('totalOrders').textContent = totalOrders;
                document.getElementById('pendingOrdersText').textContent = 
                    `${pendingOrders} pending`;
            }
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    async loadCharts() {
        try {
            // Orders Chart
            const ordersCtx = document.getElementById('ordersChart').getContext('2d');
            const { data: orders } = await this.supabase
                .from('orders')
                .select('status, created_at');
            
            const ordersByStatus = orders?.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {}) || {};
            
            new Chart(ordersCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(ordersByStatus),
                    datasets: [{
                        data: Object.values(ordersByStatus),
                        backgroundColor: [
                            '#3b82f6', // pending - blue
                            '#10b981', // paid - green
                            '#ef4444', // failed - red
                            '#f59e0b', // refunded - yellow
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            // Products Chart
            const productsCtx = document.getElementById('productsChart').getContext('2d');
            const { data: products } = await this.supabase
                .from('products')
                .select('product_type, is_active');
            
            const productsByType = products?.reduce((acc, product) => {
                const type = product.product_type === 'lifetime' ? 'Lifetime' : 'Digital';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {}) || {};
            
            new Chart(productsCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(productsByType),
                    datasets: [{
                        label: 'Jumlah Produk',
                        data: Object.values(productsByType),
                        backgroundColor: '#3b82f6',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }
    
    async loadRecentActivities() {
        try {
            // Combine recent activities from multiple tables
            const activities = [];
            
            // Get recent products
            const { data: recentProducts } = await this.supabase
                .from('products')
                .select('name, updated_at')
                .order('updated_at', { ascending: false })
                .limit(5);
            
            if (recentProducts) {
                recentProducts.forEach(product => {
                    activities.push({
                        time: new Date(product.updated_at),
                        activity: `Produk "${product.name}" diperbarui`,
                        user: 'Admin',
                        status: 'updated'
                    });
                });
            }
            
            // Get recent orders
            const { data: recentOrders } = await this.supabase
                .from('orders')
                .select('customer_email, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (recentOrders) {
                recentOrders.forEach(order => {
                    activities.push({
                        time: new Date(order.created_at),
                        activity: `Order baru dari ${order.customer_email}`,
                        user: 'Customer',
                        status: order.status
                    });
                });
            }
            
            // Sort by time and get top 10
            activities.sort((a, b) => b.time - a.time);
            const recentActivities = activities.slice(0, 10);
            
            // Render activities
            const container = document.getElementById('recentActivities');
            container.innerHTML = '';
            
            if (recentActivities.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-8 text-gray-500">
                            Tidak ada aktivitas terbaru
                        </td>
                    </tr>
                `;
                return;
            }
            
            recentActivities.forEach(activity => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                
                const timeStr = this.formatTime(activity.time);
                const statusClass = this.getStatusClass(activity.status);
                
                row.innerHTML = `
                    <td class="py-4">
                        <div class="text-sm text-gray-500">${timeStr}</div>
                    </td>
                    <td class="py-4">
                        <div class="font-medium">${activity.activity}</div>
                    </td>
                    <td class="py-4">
                        <div class="text-sm">${activity.user}</div>
                    </td>
                    <td class="py-4">
                        <span class="${statusClass} px-3 py-1 rounded-full text-xs font-medium">
                            ${activity.status}
                        </span>
                    </td>
                `;
                
                container.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }
    
    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) {
            return `${diffMins} menit lalu`;
        } else if (diffHours < 24) {
            return `${diffHours} jam lalu`;
        } else if (diffDays < 7) {
            return `${diffDays} hari lalu`;
        } else {
            return date.toLocaleDateString('id-ID');
        }
    }
    
    getStatusClass(status) {
        const classes = {
            'updated': 'bg-blue-100 text-blue-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'paid': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'refunded': 'bg-purple-100 text-purple-800'
        };
        
        return classes[status] || 'bg-gray-100 text-gray-800';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});