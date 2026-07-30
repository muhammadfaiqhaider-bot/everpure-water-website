// Protect the page before any UI logic runs.
const adminToken = localStorage.getItem('everpureAdminToken');

if (!adminToken) {
  window.location.replace('admin-login.html');
} else {
  document.addEventListener('DOMContentLoaded', () => {
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

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortOrder = document.getElementById('sortOrder');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const totalOrdersElement = document.getElementById('totalOrders');
    const pendingOrdersElement = document.getElementById('pendingOrders');
    const deliveredOrdersElement = document.getElementById('deliveredOrders');
    const revenueElement = document.querySelectorAll('.summary-card .summary-value')[3];

    const STORAGE_KEY = 'everpureAdminOrders';
    let orders = [];
    const filters = { search: '', status: 'all', sort: 'newest' };

    const fetchDeliveredOrders = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/orders/history');
        if (!response.ok) {
          throw new Error('Failed to load history');
        }

        const data = await response.json();
        return Array.isArray(data.orders) ? data.orders : [];
      } catch (error) {
        console.error('Unable to load delivered orders:', error);
        return [];
      }
    };

    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const normalizeOrder = (order, fallbackId = '') => ({
      _id: order._id || order.id || fallbackId,
      id: order.id || order._id || fallbackId,
      fullName: order.fullName || order.customerName || order.name || 'Customer',
      phone: order.phone || 'Not provided',
      deliveryArea: order.deliveryArea || order.area || 'Not provided',
      deliveryDate: order.deliveryDate || order.createdAt || order.orderDate || new Date().toISOString(),
      status: order.status || 'Pending',
      price: Number(order.price || 0),
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
      deliveredAt: order.deliveredAt || ''
    });

    const getStoredOrders = () => {
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

    const saveOrders = (orderList) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderList.map((order) => normalizeOrder(order))));
    };

    const updateSummary = (orderList) => {
      const total = orderList.length;
      const pending = orderList.filter((order) => {
        const status = String(order.status || 'Pending').toLowerCase();
        return status === 'pending' || status === 'processing';
      }).length;
      const delivered = orderList.filter((order) => {
        const status = String(order.status || 'Pending').toLowerCase();
        return status === 'delivered';
      }).length;
      const revenue = orderList.filter((order) => String(order.status || 'Pending').toLowerCase() === 'delivered').reduce((sum, order) => sum + Number(order.price || 0), 0);

      if (totalOrdersElement) {
        totalOrdersElement.textContent = String(total);
      }
      if (pendingOrdersElement) {
        pendingOrdersElement.textContent = String(pending);
      }
      if (deliveredOrdersElement) {
        deliveredOrdersElement.textContent = String(delivered);
      }
      if (revenueElement) {
        revenueElement.textContent = `Rs.${revenue}`;
      }
    };

    const getFilteredOrders = (orderList) => {
      const searchText = filters.search.trim().toLowerCase();
      const statusText = filters.status.toLowerCase();
      let filtered = orderList.filter((order) => {
        const matchesSearch = !searchText || String(order.fullName || '').toLowerCase().includes(searchText) || String(order.phone || '').toLowerCase().includes(searchText);
        const matchesStatus = statusText === 'all' || String(order.status || 'Pending').toLowerCase() === statusText;
        return matchesSearch && matchesStatus;
      });

      filtered = filtered.filter((order) => String(order.status || 'Pending').toLowerCase() === 'delivered');

      if (filters.sort === 'oldest') {
        filtered = filtered.slice().sort((left, right) => new Date(left.createdAt || left.deliveryDate) - new Date(right.createdAt || right.deliveryDate));
      } else {
        filtered = filtered.slice().sort((left, right) => new Date(right.createdAt || right.deliveryDate) - new Date(left.createdAt || left.deliveryDate));
      }

      return filtered;
    };

    const renderRows = (orderList) => {
      if (!ordersTableBody) {
        return;
      }

      const visibleOrders = getFilteredOrders(orderList);
      if (!visibleOrders.length) {
        ordersTableBody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <div class="empty-icon" aria-hidden="true">📦</div>
                <h3>No delivered orders found.</h3>
                <p>Completed deliveries will appear here after you mark them delivered.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      ordersTableBody.innerHTML = visibleOrders.map((order) => {
        const status = String(order.status || 'Pending');
        const priceValue = Number.isFinite(Number(order.price)) ? `Rs.${Number(order.price)}` : 'Rs.0';
        return `
          <tr>
            <td>${escapeHtml(order._id || order.id || 'N/A')}</td>
            <td>${escapeHtml(order.fullName || 'Customer')}</td>
            <td>${escapeHtml(order.phone || 'Not provided')}</td>
            <td>${escapeHtml(order.deliveryArea || 'Not provided')}</td>
            <td>${escapeHtml(new Date(order.deliveryDate || order.createdAt || order.orderDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }))}</td>
            <td>${escapeHtml(status)}</td>
            <td>${escapeHtml(priceValue)}</td>
            <td><button type="button" class="header-btn secondary-btn" data-action="delete" data-id="${escapeHtml(order._id || order.id || '')}">Delete</button></td>
          </tr>
        `;
      }).join('');

      ordersTableBody.querySelectorAll('[data-action="delete"]').forEach((button) => {
        button.addEventListener('click', () => {
          const orderId = button.getAttribute('data-id');
          const confirmed = window.confirm('Delete this delivered order from history?');
          if (!confirmed) {
            return;
          }

          orders = orders.filter((order) => String(order._id || order.id) !== String(orderId));
          saveOrders(orders);
          updateSummary(orders);
          renderRows(orders);
        });
      });
    };

    [searchInput, statusFilter, sortOrder].forEach((element) => {
      if (element) {
        element.addEventListener('input', () => {
          if (element === searchInput) {
            filters.search = element.value;
          } else if (element === statusFilter) {
            filters.status = element.value;
          } else if (element === sortOrder) {
            filters.sort = element.value;
          }
          renderRows(orders);
        });
      }
    });

    const loadHistory = async () => {
      const deliveredOrders = await fetchDeliveredOrders();
      const storedOrders = getStoredOrders();
      const mergedOrders = [...storedOrders.filter((order) => String(order.status || 'Pending').toLowerCase() === 'delivered'), ...deliveredOrders]
        .filter((order, index, list) => list.findIndex((item) => String(item._id || item.id) === String(order._id || order.id)) === index);

      orders = mergedOrders.map((order) => normalizeOrder(order));
      saveOrders(orders);
      updateSummary(orders);
      renderRows(orders);
    };

    loadHistory();
  });
}
