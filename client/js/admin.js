// Added at the very top of admin.js to protect the dashboard before any other logic runs.
const adminToken = localStorage.getItem('everpureAdminToken');

// If the admin token is missing, redirect immediately and prevent the rest of the dashboard code from running.
if (!adminToken) {
  window.location.replace('admin-login.html');
} else {
  // Continue loading the dashboard normally when a valid token is present.
  document.addEventListener('DOMContentLoaded', async () => {
    // Populate the admin username element if it exists on the page.
    const adminUsernameElement = document.getElementById('adminUsername');
    if (adminUsernameElement) {
      adminUsernameElement.textContent = localStorage.getItem('everpureAdminUsername') || 'Admin';
    }

    // Handle the logout button with a confirmation prompt before clearing the session.
    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        const confirmed = window.confirm('Are you sure you want to logout?');

        if (!confirmed) {
          return;
        }

        localStorage.removeItem('everpureAdminToken');
        localStorage.removeItem('everpureAdminUsername');
        window.location.replace('admin-login.html');
      });
    }

    // Cache the page elements that are used by the dashboard UI.
    const dateElement = document.getElementById('currentDate');
    const totalOrdersElement = document.getElementById('totalOrders');
    const pendingOrdersElement = document.getElementById('pendingOrders');
    const deliveredOrdersElement = document.getElementById('deliveredOrders') || document.getElementById('todayDeliveries');
    const ordersContainer = document.querySelector('.orders-list');

    // Keep the live list of fetched orders in memory for stat updates and rendering.
    let orders = [];

    // Update the visible date inside the header when the element exists.
    if (dateElement) {
      const today = new Date();
      dateElement.textContent = today.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    // Safely escape values before they are inserted into the DOM.
    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Determine the appropriate status class for styling each card.
    const getStatusClass = (status) => {
      const normalizedStatus = String(status || 'Pending').toLowerCase();

      if (normalizedStatus === 'delivered') {
        return 'delivered';
      }

      if (normalizedStatus === 'processing') {
        return 'processing';
      }

      return 'pending';
    };

    // Format a date to a readable string without breaking on invalid values.
    const formatDate = (value) => {
      if (!value) {
        return 'Not provided';
      }

      const parsedDate = new Date(value);
      if (Number.isNaN(parsedDate.getTime())) {
        return escapeHtml(value);
      }

      return parsedDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    };

    // Build a short product summary from the order data when available.
    const buildProductSummary = (order) => {
      const parts = [];

      if (Number(order.bottle19L) > 0) {
        parts.push(`19L × ${order.bottle19L}`);
      }

      if (Number(order.bottle1_5L) > 0) {
        parts.push(`1.5L × ${order.bottle1_5L}`);
      }

      if (Number(order.bottle500ml) > 0) {
        parts.push(`500ml × ${order.bottle500ml}`);
      }

      if (!parts.length) {
        return 'No product details';
      }

      return parts.join(' • ');
    };

    // Build a quantity summary so each card shows a compact product overview.
    const buildQuantitySummary = (order) => {
      const totals = [];

      if (Number(order.bottle19L) > 0) {
        totals.push(`${order.bottle19L} × 19L`);
      }

      if (Number(order.bottle1_5L) > 0) {
        totals.push(`${order.bottle1_5L} × 1.5L`);
      }

      if (Number(order.bottle500ml) > 0) {
        totals.push(`${order.bottle500ml} × 500ml`);
      }

      return totals.join(' • ') || '—';
    };

    // Fetch all orders from the backend using the existing API endpoint.
    const fetchOrders = async () => {
      const response = await fetch('http://localhost:3000/api/orders');

      if (!response.ok) {
        throw new Error('Unable to load orders from the server.');
      }

      const data = await response.json();
      return Array.isArray(data.orders) ? data.orders : [];
    };

    // Update the dashboard statistics with the latest order values.
    const updateStatistics = (orderList) => {
      const total = orderList.length;
      const pending = orderList.filter((order) => {
        const status = String(order.status || 'Pending').toLowerCase();
        return status === 'pending' || status === 'processing';
      }).length;
      const delivered = orderList.filter((order) => {
        const status = String(order.status || 'Pending').toLowerCase();
        return status === 'delivered';
      }).length;

      if (totalOrdersElement) {
        totalOrdersElement.textContent = String(total);
      }

      if (pendingOrdersElement) {
        pendingOrdersElement.textContent = String(pending);
      }

      if (deliveredOrdersElement) {
        deliveredOrdersElement.textContent = String(delivered);
      }
    };

    // Create one card for each order without hardcoding customer names.
    const createOrderCard = (order) => {
      const card = document.createElement('article');
      card.className = 'order-card expanded';

      const statusText = String(order.status || 'Pending');
      const statusClass = getStatusClass(statusText);
      const fullName = order.fullName || order.customerName || order.name || 'Customer';
      const phone = order.phone || 'Not provided';
      const area = order.deliveryArea || order.area || 'Not provided';
      const orderId = order._id ? `Order #${String(order._id).slice(-6).toUpperCase()}` : 'Order #N/A';
      const deliveryDate = formatDate(order.deliveryDate || order.createdAt || order.orderDate);
      const deliveryTime = order.deliveryTime || 'Not selected';
      const productSummary = buildProductSummary(order);
      const quantitySummary = buildQuantitySummary(order);
      const priceValue = order.price || 'Pending';

      card.innerHTML = `
        <div class="order-card__header">
          <div>
            <h3>${escapeHtml(fullName)}</h3>
            <div class="meta-row">
              <span class="order-id">${escapeHtml(orderId)}</span>
              <span class="meta-pill">${escapeHtml(deliveryDate)}</span>
              <span class="meta-pill">${escapeHtml(deliveryTime)}</span>
            </div>
          </div>

          <div class="order-card__header-actions">
            <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
          </div>
        </div>

        <div class="order-card__body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">📞 Phone</span>
              <span class="info-value">${escapeHtml(phone)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📍 Area</span>
              <span class="info-value">${escapeHtml(area)}</span>
            </div>
          </div>

          <div class="address-block">
            <span class="address-icon">📍</span>
            <div>
              <h4>Delivery Address</h4>
              <p>${escapeHtml(order.address || 'Address not provided')}</p>
            </div>
          </div>

          <div class="product-section">
            <h4>Product Summary</h4>
            <p>${escapeHtml(productSummary)}</p>
            <p class="info-value">${escapeHtml(quantitySummary)}</p>
          </div>

          <div class="notes-block">
            <h4>💬 Notes</h4>
            <p>${escapeHtml(order.notes || 'No special instructions.')}</p>
          </div>

          <div class="card-actions">
            <span class="meta-pill">Price: ${escapeHtml(priceValue)}</span>
          </div>
        </div>
      `;

      return card;
    };

    // Render every fetched order into the existing container.
    const renderOrders = (orderList) => {
      if (!ordersContainer) {
        return;
      }

      ordersContainer.innerHTML = '';

      if (!orderList.length) {
        ordersContainer.innerHTML = '<div class="order-card"><p>No orders available.</p></div>';
        return;
      }

      const fragment = document.createDocumentFragment();
      orderList.forEach((order) => {
        fragment.appendChild(createOrderCard(order));
      });

      ordersContainer.appendChild(fragment);
    };

    // Load the dashboard data and update the UI.
    try {
      orders = await fetchOrders();
      updateStatistics(orders);
      renderOrders(orders);
    } catch (error) {
      console.error('Unable to load orders:', error);

      if (ordersContainer) {
        ordersContainer.innerHTML = '<div class="order-card"><p>Unable to load orders right now.</p></div>';
      }
    }
  });
}
