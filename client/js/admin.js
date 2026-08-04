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

    // Show today's date and load orders from the backend.
  const dateElement = document.getElementById('currentDate');
  const totalOrdersElement = document.getElementById('totalOrders');
  const pendingOrdersElement = document.getElementById('pendingOrders');
  const todayDeliveriesElement = document.getElementById('todayDeliveries');
  const revenueElement = document.getElementById('revenueValue');
  const ordersList = document.querySelector('.orders-list');
  const modalBackdrop = document.getElementById('orderModalBackdrop');
  const modalCloseButton = document.getElementById('orderModalClose');
  const modalContent = document.getElementById('orderModalContent');
  const customerSearchInput = document.getElementById('customerSearch');
  const phoneSearchInput = document.getElementById('phoneSearch');
  const statusFilterSelect = document.getElementById('statusFilter');
  const sortSelect = document.getElementById('sortOrder');
  let allOrders = [];
  let viewHandlersBound = false;
  const filters = {
    searchTerm: '',
    status: 'all',
    sortBy: 'newest',
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

  const calculateRevenue = (orders) => {
    return orders.filter((order) => String(order.status || 'Pending').toLowerCase() === 'delivered').reduce((sum, order) => sum + Number(order.price || 0), 0);
  };

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
    const revenue = calculateRevenue(orders);

    if (totalOrdersElement) {
      totalOrdersElement.textContent = String(total);
    }

    if (pendingOrdersElement) {
      pendingOrdersElement.textContent = String(pending);
    }

    if (todayDeliveriesElement) {
      todayDeliveriesElement.textContent = String(todaysDeliveries);
    }

    if (revenueElement) {
      revenueElement.textContent = `Rs.${revenue}`;
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

  // Normalize text so search filtering stays case-insensitive.
  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  // Search across customer name, phone number, and delivery area.
  const matchesSearchTerm = (order, searchTerm) => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    if (!normalizedSearchTerm) return true;

    const searchTerms = normalizedSearchTerm.split(/\s+/).filter(Boolean);
    const searchableText = `${order.fullName || ''} ${order.phone || ''} ${order.deliveryArea || ''}`.toLowerCase();

    return searchTerms.some((term) => searchableText.includes(term));
  };

  // Match the selected status filter without calling the backend again.
  const matchesStatusFilter = (order, selectedStatus) => {
    if (!selectedStatus || selectedStatus === 'all') return true;
    return normalizeText(order.status) === normalizeText(selectedStatus);
  };

  // Sort the current list using the order creation timestamp.
  const sortOrders = (orders, sortBy) => {
    const sortedOrders = [...orders];

    sortedOrders.sort((firstOrder, secondOrder) => {
      const firstTime = new Date(firstOrder.createdAt || 0).getTime();
      const secondTime = new Date(secondOrder.createdAt || 0).getTime();

      if (sortBy === 'oldest') {
        return firstTime - secondTime;
      }

      return secondTime - firstTime;
    });

    return sortedOrders;
  };

  // Combine search, filter, and sort from the already loaded orders array.
  const getVisibleOrders = () => {
    const filteredOrders = allOrders.filter((order) => {
      return matchesSearchTerm(order, filters.searchTerm)
        && matchesStatusFilter(order, filters.status);
    });

    return sortOrders(filteredOrders, filters.sortBy);
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

  const renderOrderDetails = (order) => {
    const statusText = order.status || 'Pending';
    const createdDate = order.createdAt ? formatDate(order.createdAt) : 'Not available';
    const totalPrice = Number(order.price || 0);
    const createdTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }) : 'Not available';

    const productItems = [];
    if (Number(order.bottle19L) > 0) {
      productItems.push(`<span class="modal-product-item">19L bottles × ${order.bottle19L}</span>`);
    }
    if (Number(order.bottle1_5L) > 0) {
      productItems.push(`<span class="modal-product-item">1.5L bottles × ${order.bottle1_5L}</span>`);
    }
    if (Number(order.bottle500ml) > 0) {
      productItems.push(`<span class="modal-product-item">500ml bottles × ${order.bottle500ml}</span>`);
    }

    const productMarkup = productItems.length
      ? `<div class="modal-product-list">${productItems.join('')}</div>`
      : '<p>No products selected.</p>';

    return `
      <h3>${escapeHtml(order.fullName || 'Customer')}</h3>
      <div class="modal-section">
        <div class="modal-grid">
          <div>
            <span class="modal-label">Phone</span>
            <div class="modal-value">${escapeHtml(order.phone || 'Not provided')}</div>
          </div>
          <div>
            <span class="modal-label">Email</span>
            <div class="modal-value">${escapeHtml(order.email || 'Not provided')}</div>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-address">
          <span class="address-icon">📍</span>
          <div>
            <h4>Full Delivery Address</h4>
            <p>${escapeHtml(order.address || 'Address not provided')}</p>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-grid">
          <div>
            <span class="modal-label">Delivery Area</span>
            <div class="modal-value">${escapeHtml(order.deliveryArea || 'Not provided')}</div>
          </div>
          <div>
            <span class="modal-label">Delivery Date</span>
            <div class="modal-value">${escapeHtml(order.deliveryDate || 'Not provided')}</div>
          </div>
          <div>
            <span class="modal-label">Delivery Time</span>
            <div class="modal-value">${escapeHtml(order.deliveryTime || 'Not provided')}</div>
          </div>
          <div>
            <span class="modal-label">Order Status</span>
            <div class="modal-value">${escapeHtml(statusText)}</div>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <h4>Products Ordered</h4>
        ${productMarkup}
      </div>

      <div class="modal-section">
        <h4>Total Price</h4>
        <p>Rs.${escapeHtml(totalPrice)}</p>
      </div>

      <div class="modal-section">
        <h4>Customer Notes</h4>
        <p>${escapeHtml(order.notes || 'No special instructions.')}</p>
      </div>

      <div class="modal-section">
        <h4>Created</h4>
        <p>${escapeHtml(`${createdDate} at ${createdTime}`)}</p>
      </div>
    `;
  };

  const openOrderModal = (order) => {
    if (!modalBackdrop || !modalContent) return;
    modalContent.innerHTML = renderOrderDetails(order);
    modalBackdrop.classList.add('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
  };

  const closeOrderModal = () => {
    if (!modalBackdrop || !modalContent) return;
    modalBackdrop.classList.remove('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    modalContent.innerHTML = '';
  };

  const renderOrders = (orders) => {
    if (!ordersList) return;

    ordersList.innerHTML = '';

    if (!orders.length) {
      const emptyMessage = allOrders.length ? 'No matching orders found.' : 'No orders available.';
      ordersList.innerHTML = `<div class="order-card"><p>${emptyMessage}</p></div>`;
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
      const totalPrice = Number(order.price || 0);

      const card = document.createElement('article');
      card.className = 'order-card';
      card.dataset.orderId = order._id || '';
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
            <span class="price-badge">Rs.${escapeHtml(totalPrice)}</span>
            <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
            <button type="button" class="order-card__toggle" aria-expanded="false">Show</button>
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

          <div class="price-strip">
            <span class="price-label">Total Price</span>
            <span class="price-value">Rs.${escapeHtml(totalPrice)}</span>
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

  const updateOrderInState = (updatedOrder) => {
    allOrders = allOrders.map((order) => {
      if (order._id === updatedOrder._id) {
        return updatedOrder;
      }
      return order;
    });
  };

  const updateDashboardStatsFromState = () => {
    const total = allOrders.length;
    const pending = allOrders.filter((order) => {
      const status = (order.status || 'Pending').toLowerCase();
      return status === 'pending';
    }).length;

    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todaysDeliveries = allOrders.filter((order) => order.deliveryDate === todayString).length;
    const revenue = calculateRevenue(allOrders);

    if (totalOrdersElement) {
      totalOrdersElement.textContent = String(total);
    }

    if (pendingOrdersElement) {
      pendingOrdersElement.textContent = String(pending);
    }

    if (todayDeliveriesElement) {
      todayDeliveriesElement.textContent = String(todaysDeliveries);
    }

    if (revenueElement) {
      revenueElement.textContent = `Rs.${revenue}`;
    }
  };

  const refreshOrderCardUI = () => {
    if (!ordersList) return;

    const visibleOrders = getVisibleOrders();
    renderOrders(visibleOrders);
    attachToggleHandlers();
    attachViewHandlers();
    attachDeliveredHandlers();
    attachDeleteHandlers();
  };

  const markOrderAsDelivered = async (orderId) => {
    const confirmed = window.confirm('Mark this order as Delivered?');
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/delivered`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update order status.');
      }

      const updatedOrder = data.order;
      updateOrderInState(updatedOrder);
      updateDashboardStatsFromState();
      refreshOrderCardUI();
    } catch (error) {
      console.error('Unable to mark order as delivered:', error);
      window.alert('Unable to update the order status. Please try again.');
    }
  };

  const handleOrdersListClick = (event) => {
    const viewButton = event.target.closest('.view-btn');
    if (!viewButton) return;

    const card = viewButton.closest('.order-card');
    if (!card) return;

    const selectedOrder = allOrders.find((order) => order._id === card.dataset.orderId);
    if (selectedOrder) {
      openOrderModal(selectedOrder);
    }
  };

  const attachViewHandlers = () => {
    if (!ordersList || viewHandlersBound) return;

    ordersList.addEventListener('click', handleOrdersListClick);
    viewHandlersBound = true;
  };

  const attachDeliveredHandlers = () => {
    if (!ordersList) return;

    ordersList.querySelectorAll('.delivered-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.order-card');
        if (!card) return;

        const selectedOrder = allOrders.find((order) => order._id === card.dataset.orderId);
        if (selectedOrder) {
          markOrderAsDelivered(selectedOrder._id);
        }
      });
    });
  };

  const deleteOrder = async (orderId) => {
    const confirmed = window.confirm('Delete Order\n\nAre you sure you want to permanently delete this order?');
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete order.');
      }

      allOrders = allOrders.filter((order) => order._id !== orderId);
      updateDashboardStatsFromState();
      refreshOrderCardUI();

      if (ordersList) {
        const successMessage = document.createElement('div');
        successMessage.className = 'order-card';
        successMessage.innerHTML = '<p>Order deleted successfully.</p>';
        ordersList.prepend(successMessage);
        setTimeout(() => successMessage.remove(), 2500);
      }
    } catch (error) {
      console.error('Unable to delete order:', error);
      window.alert('Unable to delete the order. Please try again.');
    }
  };

  const attachDeleteHandlers = () => {
    if (!ordersList) return;

    ordersList.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.order-card');
        if (!card) return;

        const selectedOrder = allOrders.find((order) => order._id === card.dataset.orderId);
        if (selectedOrder) {
          deleteOrder(selectedOrder._id);
        }
      });
    });
  };

  const applyCurrentView = () => {
    refreshOrderCardUI();
  };

  const attachFilterHandlers = () => {
    if (customerSearchInput) {
      customerSearchInput.addEventListener('input', () => {
        filters.searchTerm = [customerSearchInput.value, phoneSearchInput ? phoneSearchInput.value : '']
          .filter(Boolean)
          .join(' ')
          .trim();
        applyCurrentView();
      });
    }

    if (phoneSearchInput) {
      phoneSearchInput.addEventListener('input', () => {
        filters.searchTerm = [customerSearchInput ? customerSearchInput.value : '', phoneSearchInput.value]
          .filter(Boolean)
          .join(' ')
          .trim();
        applyCurrentView();
      });
    }

    if (statusFilterSelect) {
      statusFilterSelect.addEventListener('change', () => {
        filters.status = statusFilterSelect.value || 'all';
        applyCurrentView();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        filters.sortBy = sortSelect.value || 'newest';
        applyCurrentView();
      });
    }
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
      allOrders = orders;

      updateDashboardStats(orders);
      attachFilterHandlers();
      refreshOrderCardUI();
    } catch (error) {
      console.error('Unable to load orders:', error);
      ordersList.innerHTML = '<div class="order-card"><p>Unable to load orders.</p></div>';
    }
  };

  if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeOrderModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (event) => {
      if (event.target === modalBackdrop) {
        closeOrderModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('is-open')) {
      closeOrderModal();
    }
  });

  loadOrders();
  });
}