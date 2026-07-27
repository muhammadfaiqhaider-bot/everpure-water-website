// Show today's date and load orders from the backend.
document.addEventListener('DOMContentLoaded', async () => {
  const dateElement = document.getElementById('currentDate');
  const totalOrdersElement = document.getElementById('totalOrders');
  const pendingOrdersElement = document.getElementById('pendingOrders');
  const todayDeliveriesElement = document.getElementById('todayDeliveries');
  const ordersList = document.querySelector('.orders-list');
  const modalBackdrop = document.getElementById('orderModalBackdrop');
  const modalCloseButton = document.getElementById('orderModalClose');
  const modalContent = document.getElementById('orderModalContent');
  let allOrders = [];

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

  const renderOrderDetails = (order) => {
    const statusText = order.status || 'Pending';
    const createdDate = order.createdAt ? formatDate(order.createdAt) : 'Not available';
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

  const refreshOrderCardUI = () => {
    if (!ordersList) return;

    renderOrders(allOrders);
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

  const attachViewHandlers = () => {
    if (!ordersList) return;

    ordersList.addEventListener('click', (event) => {
      const viewButton = event.target.closest('.view-btn');
      if (!viewButton) return;

      const card = viewButton.closest('.order-card');
      if (!card) return;

      const selectedOrder = allOrders.find((order) => order._id === card.dataset.orderId);
      if (selectedOrder) {
        openOrderModal(selectedOrder);
      }
    });
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
      renderOrders(orders);
      attachToggleHandlers();
      attachViewHandlers();
      attachDeliveredHandlers();
      attachDeleteHandlers();
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
