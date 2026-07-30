// Protect the dashboard before any other logic runs.
const adminToken = localStorage.getItem('everpureAdminToken');

if (!adminToken) {
  window.location.replace('admin-login.html');
} else {
  document.addEventListener('DOMContentLoaded', async () => {
    const adminUsernameElement = document.getElementById('adminUsername');
    if (adminUsernameElement) {
      adminUsernameElement.textContent = localStorage.getItem('everpureAdminUsername') || 'Admin';
    }

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

    const dateElement = document.getElementById('currentDate');
    const totalOrdersElement = document.getElementById('totalOrders');
    const pendingOrdersElement = document.getElementById('pendingOrders');
    const deliveredOrdersElement = document.getElementById('todayDeliveries');
    const ordersContainer = document.querySelector('.orders-list');
    const searchInput = document.getElementById('customerSearch');
    const phoneSearch = document.getElementById('phoneSearch');
    const statusFilter = document.getElementById('statusFilter');
    const sortOrder = document.getElementById('sortOrder');

    const STORAGE_KEY = 'everpureAdminOrders';
    const defaultOrders = [
      {
        _id: 'demo-ali',
        fullName: 'Ali Khan',
        phone: '0300-1234567',
        deliveryArea: 'Gulshan Colony',
        address: 'House 18, Street 4, Gulshan Colony, Rawalpindi',
        status: 'Pending',
        deliveryDate: '2026-07-30',
        deliveryTime: 'Morning',
        bottle19L: 2,
        bottle1_5L: 1,
        bottle500ml: 0,
        notes: 'Please ring the bell before arrival.',
        price: 950,
        createdAt: '2026-07-30T08:30:00.000Z',
        updatedAt: '2026-07-30T08:30:00.000Z'
      },
      {
        _id: 'demo-sara',
        fullName: 'Sara Ahmed',
        phone: '0312-9876543',
        deliveryArea: 'Blue Area',
        address: 'Flat 6, Blue Area Apartments, Islamabad',
        status: 'Processing',
        deliveryDate: '2026-08-01',
        deliveryTime: 'Afternoon',
        bottle19L: 0,
        bottle1_5L: 3,
        bottle500ml: 2,
        notes: 'No special instructions.',
        price: 1100,
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z'
      }
    ];

    let orders = [];
    const filters = { search: '', phone: '', status: 'all', sort: 'newest' };

    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

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
      return parts.length ? parts.join(' • ') : 'No product details';
    };

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

    const normalizeOrder = (order, fallbackId = '') => ({
      _id: order._id || order.id || fallbackId,
      id: order.id || order._id || fallbackId,
      fullName: order.fullName || order.customerName || order.name || 'Customer',
      phone: order.phone || 'Not provided',
      deliveryArea: order.deliveryArea || order.area || 'Not provided',
      address: order.address || 'Address not provided',
      status: order.status || 'Pending',
      deliveryDate: order.deliveryDate || order.createdAt || order.orderDate || new Date().toISOString(),
      deliveryTime: order.deliveryTime || 'Not selected',
      bottle19L: Number(order.bottle19L || order.bottles19L || 0),
      bottle1_5L: Number(order.bottle1_5L || order.bottles1_5L || 0),
      bottle500ml: Number(order.bottle500ml || order.bottles500ml || 0),
      notes: order.notes || 'No special instructions.',
      price: Number(order.price || 0),
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
      deliveredAt: order.deliveredAt || ''
    });

    const saveOrders = (orderList) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderList.map((order) => normalizeOrder(order))));
    };

    const loadStoredOrders = () => {
      try {
        const storedValue = localStorage.getItem(STORAGE_KEY);
        if (!storedValue) {
          return [];
        }

        const parsed = JSON.parse(storedValue);
        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.map((order, index) => normalizeOrder(order, `stored-${index + 1}`));
      } catch (error) {
        console.warn('Unable to parse stored orders.', error);
        return [];
      }
    };

    const fetchRemoteOrders = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/orders');
        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        const remoteOrders = Array.isArray(data.orders) ? data.orders : [];
        return remoteOrders.map((order, index) => normalizeOrder(order, `remote-${index + 1}`));
      } catch (error) {
        return [];
      }
    };

    const isSameDay = (left, right) => {
      const first = new Date(left);
      const second = new Date(right);
      return first.getFullYear() === second.getFullYear()
        && first.getMonth() === second.getMonth()
        && first.getDate() === second.getDate();
    };

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
      const todayDeliveries = orderList.filter((order) => {
        const status = String(order.status || 'Pending').toLowerCase();
        return status === 'delivered' && isSameDay(order.deliveredAt || order.updatedAt || order.createdAt, new Date());
      }).length;

      if (totalOrdersElement) {
        totalOrdersElement.textContent = String(total);
      }
      if (pendingOrdersElement) {
        pendingOrdersElement.textContent = String(pending);
      }
      if (deliveredOrdersElement) {
        deliveredOrdersElement.textContent = String(todayDeliveries);
      }
    };

    const getFilteredOrders = (orderList) => {
      const searchText = filters.search.trim().toLowerCase();
      const phoneText = filters.phone.trim().toLowerCase();
      const statusText = filters.status.toLowerCase();

      let filtered = orderList.filter((order) => {
        const status = String(order.status || 'Pending').toLowerCase();
        const matchesSearch = !searchText || String(order.fullName || '').toLowerCase().includes(searchText);
        const matchesPhone = !phoneText || String(order.phone || '').toLowerCase().includes(phoneText);
        const matchesStatus = statusText === 'all' || status === statusText;
        return matchesSearch && matchesPhone && matchesStatus;
      });

      filtered = filtered.filter((order) => String(order.status || 'Pending').toLowerCase() !== 'delivered');

      if (filters.sort === 'oldest') {
        filtered = filtered.slice().sort((left, right) => new Date(left.createdAt || left.deliveryDate) - new Date(right.createdAt || right.deliveryDate));
      } else {
        filtered = filtered.slice().sort((left, right) => new Date(right.createdAt || right.deliveryDate) - new Date(left.createdAt || left.deliveryDate));
      }

      return filtered;
    };

    const renderOrders = (orderList) => {
      if (!ordersContainer) {
        return;
      }

      const visibleOrders = getFilteredOrders(orderList);
      ordersContainer.innerHTML = '';

      if (!visibleOrders.length) {
        ordersContainer.innerHTML = '<div class="order-card"><p>No orders available.</p></div>';
        return;
      }

      const fragment = document.createDocumentFragment();
      visibleOrders.forEach((order) => {
        fragment.appendChild(createOrderCard(order));
      });
      ordersContainer.appendChild(fragment);
    };

    const markOrderAsDelivered = (orderId, button) => {
      if (!orderId || !button) {
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Updating...';

      const deliveredAt = new Date().toISOString();
      orders = orders.map((order) => {
        if (String(order._id || order.id) === String(orderId)) {
          return {
            ...order,
            status: 'Delivered',
            deliveredAt,
            updatedAt: deliveredAt,
            deliveryDate: order.deliveryDate || deliveredAt
          };
        }
        return order;
      });

      saveOrders(orders);
      updateStatistics(orders);
      renderOrders(orders);
      button.disabled = false;
      button.textContent = originalText;
      window.setTimeout(() => {
        window.location.assign('admin-history.html');
      }, 220);
    };

    const deleteOrder = (orderId) => {
      const confirmed = window.confirm('Delete this order permanently?');
      if (!confirmed) {
        return;
      }

      orders = orders.filter((order) => String(order._id || order.id) !== String(orderId));
      saveOrders(orders);
      updateStatistics(orders);
      renderOrders(orders);
    };

    const attachCardInteractions = (card, orderData = null) => {
      const viewButton = card.querySelector('.view-btn');
      if (viewButton && !viewButton.dataset.bound) {
        viewButton.dataset.bound = 'true';
        viewButton.addEventListener('click', (event) => {
          event.stopPropagation();
          const isOpen = card.classList.contains('expanded');
          card.classList.toggle('expanded', !isOpen);
          viewButton.textContent = isOpen ? 'View' : 'Hide';
        });
      }

      card.querySelectorAll('.action-btn').forEach((button) => {
        if (button.dataset.bound) {
          return;
        }

        button.dataset.bound = 'true';
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const action = button.getAttribute('data-action');
          const orderId = String(orderData?._id || orderData?.id || '');

          if (action === 'view') {
            return;
          }

          if (action === 'deliver' && orderData) {
            markOrderAsDelivered(orderId, button);
            return;
          }

          if (action === 'delete' && orderData) {
            deleteOrder(orderId);
          }
        });
      });
    };

    const createOrderCard = (order) => {
      const card = document.createElement('article');
      card.className = 'order-card';

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
      const priceValue = Number.isFinite(Number(order.price)) ? `Rs. ${Number(order.price)}` : 'N/A';
      const isDelivered = statusText.toLowerCase() === 'delivered';

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
            <button type="button" class="action-btn view-btn" data-action="view">View</button>
            <button type="button" class="action-btn delivered-btn" data-action="deliver" ${isDelivered ? 'disabled' : ''}>${isDelivered ? 'Delivered' : 'Mark Delivered'}</button>
            <button type="button" class="action-btn delete-btn" data-action="delete">Delete</button>
            <span class="meta-pill">Price: ${escapeHtml(priceValue)}</span>
          </div>
        </div>
      `;

      attachCardInteractions(card, order);
      return card;
    };

    if (dateElement) {
      const today = new Date();
      dateElement.textContent = today.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    [searchInput, phoneSearch, statusFilter, sortOrder].forEach((element) => {
      if (element) {
        element.addEventListener('input', () => {
          if (element === searchInput) {
            filters.search = element.value;
          } else if (element === phoneSearch) {
            filters.phone = element.value;
          } else if (element === statusFilter) {
            filters.status = element.value;
          } else if (element === sortOrder) {
            filters.sort = element.value;
          }

          renderOrders(orders);
        });
      }
    });

    try {
      const storedOrders = loadStoredOrders();
      const remoteOrders = await fetchRemoteOrders();
      orders = storedOrders.length ? storedOrders : remoteOrders.length ? remoteOrders : defaultOrders.map((order, index) => normalizeOrder(order, `default-${index + 1}`));
      saveOrders(orders);
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
