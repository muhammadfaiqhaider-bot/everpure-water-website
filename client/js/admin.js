// Show today's date and load orders from the backend.
document.addEventListener('DOMContentLoaded', async () => {
  const dateElement = document.getElementById('currentDate');
  const totalOrdersElement = document.getElementById('totalOrders');
  const pendingOrdersElement = document.getElementById('pendingOrders');
  const todayDeliveriesElement = document.getElementById('todayDeliveries');
  const ordersList = document.querySelector('.orders-list');

  if (dateElement) {
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Keep the dashboard cards in sync with the API response.
  const updateDashboardStats = (orders) => {
    const total = orders.length;
    const pending = orders.filter((order) => {
      const status = (order.status || 'Pending').toLowerCase();
      return status === 'pending';
    }).length;

    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todaysDeliveries = orders.filter((order) => order.deliveryDate === todayString).length;

    if (totalOrdersElement) {
      totalOrdersElement.textContent = String(total);
    }

    if (pendingOrdersElement) {
      pendingOrdersElement.textContent = String(pending);
    }

    if (todayDeliveriesElement) {
      todayDeliveriesElement.textContent = String(todaysDeliveries);
    }
  };

  const escapeHtml = (value) => {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getStatusClass = (status) => {
    const normalizedStatus = (status || 'Pending').toLowerCase();
    if (normalizedStatus === 'delivered') return 'delivered';
    if (normalizedStatus === 'processing') return 'processing';
    return 'pending';
  };

  const formatDate = (value) => {
    if (!value) return 'Not provided';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return escapeHtml(value);
    return parsedDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const buildProductBadges = (order) => {
    const productItems = [];

    if (Number(order.bottle19L) > 0) {
      productItems.push(`<span class="product-badge">19L Bottle × ${order.bottle19L}</span>`);
    }

    if (Number(order.bottle1_5L) > 0) {
      productItems.push(`<span class="product-badge">1.5L Bottle × ${order.bottle1_5L}</span>`);
    }

    if (Number(order.bottle500ml) > 0) {
      productItems.push(`<span class="product-badge">500ml Bottle × ${order.bottle500ml}</span>`);
    }

    return productItems.join('');
  };

  const renderOrders = (orders) => {
    if (!ordersList) return;

    ordersList.innerHTML = '';

    if (!orders.length) {
      ordersList.innerHTML = '<div class="order-card"><p>No orders available.</p></div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    orders.forEach((order) => {
      const statusText = order.status || 'Pending';
      const statusClass = getStatusClass(statusText);
      const orderId = order._id ? `Order #${String(order._id).slice(-6).toUpperCase()}` : 'Order #N/A';
      const notesText = order.notes ? order.notes : 'No special instructions.';
      const deliveryDateText = formatDate(order.deliveryDate);
      const deliveryTimeText = order.deliveryTime || 'Not selected';
      const deliveryAreaText = order.deliveryArea || 'Not provided';

      const card = document.createElement('article');
      card.className = 'order-card expanded';
      card.innerHTML = `
        <div class="order-card__header">
          <div>
            <h3>${escapeHtml(order.fullName || 'Customer')}</h3>
            <div class="meta-row">
              <span class="order-id">${escapeHtml(orderId)}</span>
              <span class="meta-pill">${escapeHtml(deliveryDateText)}</span>
              <span class="meta-pill">${escapeHtml(deliveryTimeText)}</span>
              <span class="meta-pill">Area: ${escapeHtml(deliveryAreaText)}</span>
            </div>
          </div>

          <div class="order-card__header-actions">
            <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
            <button type="button" class="order-card__toggle" aria-expanded="true">Hide</button>
          </div>
        </div>

        <div class="order-card__body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">📞 Phone</span>
              <span class="info-value">${escapeHtml(order.phone || 'Not provided')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📧 Email</span>
              <span class="info-value">${escapeHtml(order.email || 'Not provided')}</span>
            </div>
          </div>

          <div class="address-block">
            <span class="address-icon">📍</span>
            <div>
              <h4>Full Delivery Address</h4>
              <p>${escapeHtml(order.address || 'Address not provided')}</p>
            </div>
          </div>

          <div class="product-section">
            <h4>Order Details</h4>
            <div class="product-badges">
              ${buildProductBadges(order)}
            </div>
          </div>

          <div class="notes-block">
            <h4>💬 Customer Notes</h4>
            <p>${escapeHtml(notesText)}</p>
          </div>

          <div class="card-actions">
            <button type="button" class="action-btn view-btn">View</button>
            <button type="button" class="action-btn delivered-btn">Mark Delivered</button>
            <button type="button" class="action-btn delete-btn">Delete</button>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    ordersList.appendChild(fragment);
  };

  const attachToggleHandlers = () => {
    document.querySelectorAll('.order-card__toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.order-card');
        if (!card) return;

        const isExpanded = card.classList.toggle('expanded');
        button.textContent = isExpanded ? 'Hide' : 'Show';
        button.setAttribute('aria-expanded', String(isExpanded));
      });
    });
  };

  const loadOrders = async () => {
    if (!ordersList) return;

    ordersList.innerHTML = '<div class="order-card"><p>Loading orders...</p></div>';

    try {
      const response = await fetch('http://localhost:3000/api/orders');
      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = await response.json();
      const orders = Array.isArray(data.orders) ? data.orders : [];

      updateDashboardStats(orders);
      renderOrders(orders);
      attachToggleHandlers();
    } catch (error) {
      console.error('Unable to load orders:', error);
      ordersList.innerHTML = '<div class="order-card"><p>Unable to load orders.</p></div>';
    }
  };

  loadOrders();
});
