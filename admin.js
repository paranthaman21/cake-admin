/*
  Cake Origin - Admin JavaScript Logic
  Handles: Authentication, CRUD, Dashboard Stats
*/

// --- Auth Guard ---
function checkAuth() {
    const isLoginPage = window.location.href.includes('index.html');
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'index.html';
    } else if (isLoggedIn && isLoginPage) {
        window.location.href = 'dashboard.html';
    }
}

checkAuth();

// --- Constants ---
// --- Constants ---
// No default products needed, we fetch from DB

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Top Bar Logic
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Login Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;

            if (u === 'cakeorigin' && p === 'cakeorigin**606801') {
                sessionStorage.setItem('adminLoggedIn', 'true');
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid Credentials!');
            }
        });
    }

    // Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        });
    }

    // Dashboard Logic
    if (window.location.href.includes('dashboard.html')) {
        updateDashboardStats();
    }

    // Products List Logic
    if (window.location.href.includes('products.html')) {
        renderProductTable();
    }

    // Add Product Logic
    if (window.location.href.includes('add-product.html')) {
        initAddProduct();
    }
});

// --- Data Helpers ---
async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false }); // Newest first for admin

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }
    return data;
}

// --- Dashboard ---
async function updateDashboardStats() {
    const products = await fetchProducts();
    const total = products.length;
    const inStock = products.filter(p => p.stock).length;
    const outStock = total - inStock;

    document.getElementById('total-cakes').innerText = total;
    document.getElementById('stock-in').innerText = inStock;
    document.getElementById('stock-out').innerText = outStock;
}

// --- Product Table ---
async function renderProductTable() {
    const products = await fetchProducts();
    const tbody = document.getElementById('product-table-body');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No products found in database.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map((p) => {
        // Handle images
        let imgSrc = p.image && p.image.length > 10 ? p.image : 'https://placehold.co/100x100?text=No+Img';
        return `
        <tr>
            <td>
                <img src="${imgSrc}" class="product-img-thumb" alt="">
            </td>
            <td>
                <div style="font-weight:600;">${p.name}</div>
                <div style="font-size:0.8rem; color:#888;">${p.category}</div>
            </td>
            <td>₹${p.price}</td>
            <td>
                <span class="status-badge ${p.stock ? 'status-in' : 'status-out'}" 
                      style="cursor:pointer;"
                      onclick="toggleStock(${p.id}, ${p.stock})">
                    ${p.stock ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <a href="add-product.html?id=${p.id}" class="action-btn" style="color:blue; margin-right:5px;"><i class="fa-solid fa-pen"></i></a>
                <button class="action-btn" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

// Global Functions for HTML onClick events
window.toggleStock = async function (id, currentStatus) {
    const { error } = await supabase
        .from('products')
        .update({ stock: !currentStatus })
        .eq('id', id);

    if (error) {
        alert("Error updating stock: " + error.message);
    } else {
        renderProductTable();
    }
};

window.deleteProduct = async function (id) {
    if (confirm('Are you sure you want to delete this cake?')) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting product: " + error.message);
        } else {
            renderProductTable();
        }
    }
};

// --- Add / Edit Product ---
// --- Add / Edit Product ---
async function initAddProduct() {
    // Check if Supabase is connected
    if (typeof supabase === 'undefined') {
        alert("Database connection failed. Please reload the page.");
        return;
    }

    const form = document.getElementById('add-product-form');
    if (!form) return;

    const imgInput = document.getElementById('p-image');
    const preview = document.getElementById('preview-img');
    const pageTitle = document.querySelector('.top-bar h2');
    const submitBtn = form.querySelector('button[type="submit"]');

    let imageBase64 = ''; // Store base64 string
    let editId = null;

    // Check URL params for Edit Mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
        editId = urlParams.get('id');
        pageTitle.innerText = "Edit Cake";
        submitBtn.innerText = "Update Product";

        // Fetch existing data
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', editId)
                .single();

            if (data) {
                document.getElementById('p-name').value = data.name;
                document.getElementById('p-price').value = data.price;
                document.getElementById('p-category').value = data.category;
                document.getElementById('p-egg').value = data.egg_type;
                document.getElementById('p-stock').checked = data.stock;

                if (data.image) {
                    imageBase64 = data.image;
                    preview.src = data.image;
                    preview.parentElement.style.display = 'flex';
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Image Preview & Conversion
    imgInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imageBase64 = e.target.result;
                preview.src = imageBase64;
                preview.parentElement.style.display = 'flex'; // Show container
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Warning for big images
        if (imageBase64 && imageBase64.length > 2000000) {
            alert("Image is too large! Please use an image URL or a smaller file (under 2MB).");
            // Fail gracefully or continue? User might want to try anyway.
            // But Supabase often rejects > 1MB in text fields.
        }

        const productData = {
            name: document.getElementById('p-name').value,
            price: Number(document.getElementById('p-price').value),
            category: document.getElementById('p-category').value,
            egg_type: document.getElementById('p-egg').value,
            stock: document.getElementById('p-stock').checked,
            image: imageBase64 || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
            description: 'Delicious fresh cake'
        };

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Saving...";
        submitBtn.disabled = true;

        try {
            let dbError;

            if (editId) {
                // Update
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editId);
                dbError = error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                dbError = error;
            }

            if (dbError) {
                throw dbError;
            } else {
                alert(editId ? 'Product Updated Successfully!' : 'Product Added Successfully!');
                window.location.href = 'products.html';
            }
        } catch (err) {
            console.error(err);
            alert('Error saving product: ' + err.message);
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}
