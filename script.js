document.addEventListener('DOMContentLoaded', () => {
  // Esta versión usa localStorage para conservar los datos en el navegador.
  // Para compartir datos entre dispositivos se requiere el backend incluido en el ZIP completo.
  const readList = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const readObject = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  };

  let products = readList('gastromind-community-products');
  const state = {
    activeCategory: 'todos',
    searchTerm: '',
    cart: readList('gastromind-cart'),
    favorites: readList('gastromind-favorites'),
    currentUser: readObject('gastromind-current-user')
  };

  const $ = (selector) => document.querySelector(selector);
  const productGrid = $('#product-grid');
  const noResults = $('#no-results');
  const searchInput = $('#search-input');
  const categoryButtons = [...document.querySelectorAll('.filter-btn')];
  const categoryLinks = [...document.querySelectorAll('[data-category-link]')];
  const cartDrawer = $('#cart-drawer');
  const cartItems = $('#cart-items');
  const cartEmpty = $('#cart-empty');
  const drawerFooter = $('#drawer-footer');
  const cartCount = $('#cart-count');
  const drawerCount = $('#drawer-count');
  const cartSubtotal = $('#cart-subtotal');
  const cartTotal = $('#cart-total');
  const checkoutTotal = $('#checkout-total');
  const toast = $('#toast');
  const toastMessage = $('#toast-message');
  const checkoutModal = $('#checkout-modal');
  const checkoutForm = $('#checkout-form');
  const orderSuccess = $('#order-success');
  const paymentInstructions = $('#payment-instructions');
  const fulfillmentSelect = $('select[name="fulfillment"]');
  const addressField = $('#address-field');
  const authModal = $('#auth-modal');
  const publishModal = $('#publish-modal');
  const inboxModal = $('#inbox-modal');
  const authForm = $('#auth-form');
  const publishForm = $('#publish-form');
  const accountButton = $('#open-auth');
  const notificationButton = $('#open-inbox');
  const notificationCount = $('#notification-count');
  const sellerInbox = $('#seller-inbox');
  const authTitle = $('#auth-title');
  const authDescription = $('#auth-description');
  const authSubmit = $('#auth-submit');
  const authSwitch = $('#auth-switch');
  const authSwitchCopy = $('#auth-switch-copy');
  let authMode = 'login';
  let publishAfterAuth = false;

  const formatPrice = (value) => `$${new Intl.NumberFormat('es-CO').format(value)}`;
  const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const getProduct = (id) => products.find(product => product.id === id);
  const getAccounts = () => readList('gastromind-accounts');
  const getProfiles = () => readList('gastromind-seller-profiles');
  const getNotifications = () => readList('gastromind-notifications');
  const getOrders = () => readList('gastromind-orders');

  function saveState() {
    localStorage.setItem('gastromind-cart', JSON.stringify(state.cart));
    localStorage.setItem('gastromind-favorites', JSON.stringify(state.favorites));
  }
  function saveProducts() { localStorage.setItem('gastromind-community-products', JSON.stringify(products)); }
  function saveAccounts(accounts) { localStorage.setItem('gastromind-accounts', JSON.stringify(accounts)); }
  function saveProfiles(profiles) { localStorage.setItem('gastromind-seller-profiles', JSON.stringify(profiles)); }
  function saveNotifications(notifications) { localStorage.setItem('gastromind-notifications', JSON.stringify(notifications)); }
  function saveOrders(orders) { localStorage.setItem('gastromind-orders', JSON.stringify(orders)); }

  function getCurrentProfile() {
    if (!state.currentUser?.username) return null;
    return getProfiles().find(profile => profile.username === state.currentUser.username) || null;
  }
  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }
  function syncOverlayScroll() {
    const open = [cartDrawer, checkoutModal, authModal, publishModal, inboxModal].some(element => element.classList.contains('is-open'));
    document.body.classList.toggle('no-scroll', open);
  }
  function setModalState(element, open) {
    element.classList.toggle('is-open', open);
    element.setAttribute('aria-hidden', String(!open));
    syncOverlayScroll();
  }

  function renderAccountButton() {
    if (state.currentUser?.username) {
      accountButton.textContent = `@${state.currentUser.username}`;
      accountButton.classList.add('is-signed-in');
      accountButton.title = 'Cerrar sesión';
    } else {
      accountButton.textContent = 'Iniciar sesión';
      accountButton.classList.remove('is-signed-in');
      accountButton.removeAttribute('title');
    }
    renderNotificationCount();
  }
  function renderNotificationCount() {
    const unread = state.currentUser?.username
      ? getNotifications().filter(notification => notification.recipient === state.currentUser.username && !notification.read).length
      : 0;
    notificationCount.hidden = unread === 0;
    notificationCount.textContent = unread > 9 ? '9+' : unread;
  }

  function productMatches(product) {
    const categoryMatch = state.activeCategory === 'todos'
      || (state.activeCategory === 'favoritos' && state.favorites.includes(product.id))
      || product.category === state.activeCategory;
    const searchable = `${product.title} ${product.description} ${product.type || ''} ${product.seller || ''}`.toLowerCase();
    return categoryMatch && searchable.includes(state.searchTerm);
  }
  function renderProducts() {
    const visible = products.filter(productMatches);
    productGrid.innerHTML = visible.map((product, index) => {
      const favorite = state.favorites.includes(product.id);
      return `<article class="product-card" style="animation-delay:${index * 55}ms">
        <div class="product-image-wrap"><div class="product-image" style="background-image:url('${product.image}')" role="img" aria-label="${escapeHTML(product.title)}"></div><span class="product-badge ${product.badgeClass || ''}">Comunidad</span><button class="product-favorite ${favorite ? 'is-favorite' : ''}" data-favorite="${product.id}" type="button" aria-label="Guardar favorito">${favorite ? '♥' : '♡'}</button></div>
        <div class="product-info"><div class="product-meta"><span>${escapeHTML(product.type || 'Creación local')}</span><i class="meta-dot"></i><span>Hecho hoy</span></div><h3>${escapeHTML(product.title)}</h3><p>${escapeHTML(product.description)}</p><span class="product-seller">Creado por <strong>@${escapeHTML(product.seller)}</strong></span><div class="product-bottom"><strong class="product-price">${formatPrice(product.price)}</strong><button class="add-btn" data-add="${product.id}" type="button">Agregar <span>＋</span></button></div></div>
      </article>`;
    }).join('');
    noResults.hidden = visible.length > 0;
    if (!products.length) {
      noResults.querySelector('h3').textContent = 'El menú está esperando su primera historia';
      noResults.querySelector('p').textContent = 'Sé la primera persona en compartir una creación con la comunidad GastroMind.';
      $('#clear-search').textContent = 'Publicar mi plato';
    } else {
      noResults.querySelector('h3').textContent = 'No encontramos ese antojo';
      noResults.querySelector('p').textContent = 'Prueba con otro nombre o revisa todas las opciones del menú.';
      $('#clear-search').textContent = 'Ver todo el menú';
    }
  }
  function setCategory(category) {
    state.activeCategory = category;
    categoryButtons.forEach(button => button.classList.toggle('active', button.dataset.category === category));
    $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderProducts();
  }

  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;
    const existing = state.cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else state.cart.push({ id, quantity: 1 });
    saveState(); renderCart(); showToast(`${product.title} añadido al carrito`);
  }
  function changeQuantity(id, amount) {
    const item = state.cart.find(line => line.id === id);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) state.cart = state.cart.filter(line => line.id !== id);
    saveState(); renderCart();
  }
  function getCartTotals() {
    const validCart = state.cart.filter(item => getProduct(item.id));
    if (validCart.length !== state.cart.length) { state.cart = validCart; saveState(); }
    return validCart.reduce((totals, item) => {
      const product = getProduct(item.id);
      totals.itemCount += item.quantity;
      totals.subtotal += product.price * item.quantity;
      return totals;
    }, { itemCount: 0, subtotal: 0 });
  }
  function renderCart() {
    const { itemCount, subtotal } = getCartTotals();
    cartCount.textContent = itemCount; drawerCount.textContent = `(${itemCount})`;
    cartSubtotal.textContent = formatPrice(subtotal); cartTotal.textContent = formatPrice(subtotal); checkoutTotal.textContent = formatPrice(subtotal);
    cartEmpty.hidden = state.cart.length > 0; drawerFooter.hidden = state.cart.length === 0;
    cartItems.innerHTML = state.cart.map(item => {
      const product = getProduct(item.id);
      return `<div class="cart-line"><div class="cart-line-image" style="background-image:url('${product.image}')"></div><div class="cart-line-content"><h3>${escapeHTML(product.title)}</h3><p>Por @${escapeHTML(product.seller)}</p><strong>${formatPrice(product.price * item.quantity)}</strong></div><div class="quantity-control"><button data-decrease="${product.id}" type="button">−</button><span>${item.quantity}</span><button data-increase="${product.id}" type="button">＋</button></div></div>`;
    }).join('');
  }
  function openCart() { setModalState(cartDrawer, true); }
  function closeCart() { setModalState(cartDrawer, false); }
  function resetCheckout() {
    checkoutForm.hidden = false;
    checkoutModal.querySelector('.modal-heading').hidden = false;
    orderSuccess.hidden = true;
    paymentInstructions.innerHTML = '';
  }
  function openCheckout() {
    if (!state.cart.length) return showToast('Agrega al menos un producto para continuar');
    resetCheckout(); setModalState(checkoutModal, true);
  }
  function closeCheckout() { setModalState(checkoutModal, false); resetCheckout(); }

  function updateAuthModal() {
    const registering = authMode === 'register';
    authTitle.textContent = registering ? 'Crea tu cuenta.' : 'Inicia sesión.';
    authDescription.textContent = registering ? 'Elige un nombre de usuario para que las personas identifiquen tus platos en el menú.' : 'Entra con tu cuenta para publicar tus platos y que las personas conozcan tu propuesta.';
    authSubmit.innerHTML = `${registering ? 'Crear cuenta' : 'Iniciar sesión'} <span>→</span>`;
    authSwitchCopy.textContent = registering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?';
    authSwitch.textContent = registering ? 'Inicia sesión' : 'Regístrate aquí';
    $('#auth-password').autocomplete = registering ? 'new-password' : 'current-password';
  }
  function openAuth(mode = 'login') { authMode = mode; updateAuthModal(); setModalState(authModal, true); }
  function closeAuth() { setModalState(authModal, false); authForm.reset(); }
  function openPublish() {
    if (!state.currentUser?.username) { publishAfterAuth = true; showToast('Inicia sesión para publicar tu plato'); return openAuth(); }
    const profile = getCurrentProfile();
    if (profile) {
      publishForm.elements.transferProvider.value = profile.transferProvider;
      publishForm.elements.transferRecipient.value = profile.transferRecipient;
      publishForm.elements.transferDetails.value = profile.transferDetails;
    }
    setModalState(publishModal, true);
  }
  function closePublish() { setModalState(publishModal, false); publishForm.reset(); }

  function renderInbox() {
    if (!state.currentUser?.username) return;
    const username = state.currentUser.username;
    const orders = getOrders().filter(order => order.seller === username);
    const notifications = getNotifications().filter(notification => notification.recipient === username);
    const notificationHtml = notifications.length ? notifications.map(notification => `<article class="inbox-item ${notification.read ? '' : 'is-unread'}"><strong>${escapeHTML(notification.title)}</strong><p>${escapeHTML(notification.message)}</p><small>${new Date(notification.createdAt).toLocaleString('es-CO')}</small></article>`).join('') : '<p class="inbox-empty">Aún no tienes avisos. Cuando una persona pida uno de tus platos, aparecerá aquí.</p>';
    const ordersHtml = orders.length ? orders.map(order => `<article class="seller-order"><div><strong>Pedido #${order.id}</strong><span>${escapeHTML(order.paymentMethod)}</span></div><p>${escapeHTML(order.buyerName)} · ${escapeHTML(order.buyerPhone)}</p><p>${order.items.map(item => `${item.quantity} × ${escapeHTML(item.title)}`).join(', ')}</p><small>${escapeHTML(order.fulfillment)} · ${formatPrice(order.total)}</small></article>`).join('') : '<p class="inbox-empty">Aún no tienes pedidos. Publica un plato para empezar.</p>';
    sellerInbox.innerHTML = `<section><h3>Avisos</h3>${notificationHtml}</section><section><h3>Pedidos recibidos</h3>${ordersHtml}</section>`;
  }
  function openInbox() {
    if (!state.currentUser?.username) { showToast('Inicia sesión para ver tus pedidos'); return openAuth(); }
    const notifications = getNotifications().map(notification => notification.recipient === state.currentUser.username ? { ...notification, read: true } : notification);
    saveNotifications(notifications); renderNotificationCount(); renderInbox(); setModalState(inboxModal, true);
  }
  function closeInbox() { setModalState(inboxModal, false); }

  document.addEventListener('click', event => {
    const add = event.target.closest('[data-add]'); if (add) addToCart(add.dataset.add);
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      const id = favorite.dataset.favorite;
      state.favorites = state.favorites.includes(id) ? state.favorites.filter(value => value !== id) : [...state.favorites, id];
      saveState(); renderProducts();
    }
    const increase = event.target.closest('[data-increase]'); if (increase) changeQuantity(increase.dataset.increase, 1);
    const decrease = event.target.closest('[data-decrease]'); if (decrease) changeQuantity(decrease.dataset.decrease, -1);
  });

  categoryButtons.forEach(button => button.addEventListener('click', () => setCategory(button.dataset.category)));
  categoryLinks.forEach(link => link.addEventListener('click', () => setCategory(link.dataset.categoryLink)));
  searchInput.addEventListener('input', event => { state.searchTerm = event.target.value.toLowerCase().trim(); renderProducts(); });
  $('#clear-search').addEventListener('click', () => { if (!products.length) return openPublish(); state.searchTerm = ''; state.activeCategory = 'todos'; searchInput.value = ''; categoryButtons.forEach(button => button.classList.toggle('active', button.dataset.category === 'todos')); renderProducts(); });

  $('#open-cart').addEventListener('click', openCart); $('#close-cart').addEventListener('click', closeCart); $('#drawer-backdrop').addEventListener('click', closeCart);
  $('#start-shopping').addEventListener('click', () => { closeCart(); $('#menu').scrollIntoView({ behavior: 'smooth' }); });
  $('#open-checkout').addEventListener('click', openCheckout); $('#close-checkout').addEventListener('click', closeCheckout); $('#checkout-backdrop').addEventListener('click', closeCheckout);
  $('#success-close').addEventListener('click', () => { closeCheckout(); $('#menu').scrollIntoView({ behavior: 'smooth' }); });
  $('#open-publish').addEventListener('click', openPublish); $('#close-publish').addEventListener('click', closePublish); $('#publish-backdrop').addEventListener('click', closePublish);
  notificationButton.addEventListener('click', openInbox); $('#close-inbox').addEventListener('click', closeInbox); $('#inbox-backdrop').addEventListener('click', closeInbox);
  $('#close-auth').addEventListener('click', closeAuth); $('#auth-backdrop').addEventListener('click', closeAuth);

  accountButton.addEventListener('click', () => {
    if (!state.currentUser?.username) return openAuth();
    const username = state.currentUser.username;
    state.currentUser = null; localStorage.removeItem('gastromind-current-user'); renderAccountButton(); showToast(`Sesión de @${username} cerrada`);
  });
  authSwitch.addEventListener('click', () => { authMode = authMode === 'login' ? 'register' : 'login'; updateAuthModal(); });
  authForm.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(authForm); const username = String(form.get('username') || '').trim().replace(/\s+/g, ''); const password = String(form.get('password') || '');
    if (username.length < 3 || password.length < 4) return showToast('Revisa tu nombre de usuario y contraseña');
    const accounts = getAccounts(); const existing = accounts.find(account => account.username.toLowerCase() === username.toLowerCase());
    if (authMode === 'register') { if (existing) return showToast('Ese nombre de usuario ya existe'); accounts.push({ username, password, createdAt: new Date().toISOString() }); saveAccounts(accounts); }
    else if (!existing || existing.password !== password) return showToast('Usuario o contraseña incorrectos');
    state.currentUser = { username }; localStorage.setItem('gastromind-current-user', JSON.stringify(state.currentUser)); renderAccountButton(); closeAuth(); showToast(authMode === 'register' ? `¡Bienvenido, @${username}!` : `Iniciaste sesión como @${username}`);
    if (publishAfterAuth) { publishAfterAuth = false; openPublish(); }
  });

  publishForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!state.currentUser?.username) return openAuth();
    const form = new FormData(publishForm); const image = form.get('image'); const title = String(form.get('title') || '').trim(); const description = String(form.get('description') || '').trim(); const price = Number(form.get('price'));
    const transferProvider = String(form.get('transferProvider') || '').trim(); const transferRecipient = String(form.get('transferRecipient') || '').trim(); const transferDetails = String(form.get('transferDetails') || '').trim();
    if (!(image instanceof File) || !image.size || !title || description.length < 12 || !Number.isFinite(price) || price <= 0 || !transferProvider || !transferRecipient || !transferDetails) return showToast('Completa la foto, descripción, precio y datos de transferencia');
    if (image.size > 1_500_000) return showToast('Usa una foto de máximo 1.5 MB para guardarla en el navegador');
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const username = state.currentUser.username;
      const profiles = getProfiles().filter(profile => profile.username !== username);
      profiles.push({ username, transferProvider, transferRecipient, transferDetails, updatedAt: new Date().toISOString() }); saveProfiles(profiles);
      products.unshift({ id: `plato-${Date.now()}`, title, description, price: Math.round(price), image: reader.result, seller: username, category: 'express', tags: [], type: 'Creación local', badge: 'Nuevo', badgeClass: 'badge-green', createdAt: new Date().toISOString() });
      saveProducts(); state.activeCategory = 'todos'; state.searchTerm = ''; searchInput.value = ''; categoryButtons.forEach(button => button.classList.toggle('active', button.dataset.category === 'todos')); renderProducts(); closePublish(); $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' }); showToast('Tu plato ya está en el menú');
    });
    reader.readAsDataURL(image);
  });

  fulfillmentSelect.addEventListener('change', () => { const delivery = fulfillmentSelect.value === 'Domicilio'; addressField.hidden = !delivery; addressField.querySelector('input').required = delivery; });
  checkoutForm.addEventListener('submit', event => {
    event.preventDefault(); if (!state.cart.length) return showToast('Agrega al menos un plato para continuar');
    const form = new FormData(checkoutForm); const buyerName = String(form.get('name') || '').trim(); const buyerPhone = String(form.get('phone') || '').trim(); const paymentMethod = String(form.get('paymentMethod') || 'Efectivo');
    const grouped = {};
    state.cart.forEach(line => { const product = getProduct(line.id); if (!product) return; (grouped[product.seller] ||= []).push({ product, quantity: line.quantity }); });
    const orders = getOrders(); const notifications = getNotifications(); const transfers = [];
    Object.entries(grouped).forEach(([seller, items]) => {
      const id = Math.floor(100000 + Math.random() * 899999); const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0); const profile = getProfiles().find(value => value.username === seller);
      orders.unshift({ id, seller, buyerName, buyerPhone, fulfillment: String(form.get('fulfillment')), address: String(form.get('address') || ''), notes: String(form.get('notes') || ''), paymentMethod, total, items: items.map(item => ({ title: item.product.title, quantity: item.quantity, price: item.product.price })), createdAt: new Date().toISOString() });
      notifications.unshift({ id: `notice-${id}`, recipient: seller, title: `Nuevo pedido #${id}`, message: `${buyerName} solicitó ${items.map(item => `${item.quantity} × ${item.product.title}`).join(', ')}. Pago: ${paymentMethod}.`, read: false, createdAt: new Date().toISOString() });
      if (paymentMethod === 'Transferencia' && profile) transfers.push(`<article class="transfer-card"><strong>Pedido #${id} · @${escapeHTML(seller)}</strong><span>${escapeHTML(profile.transferProvider)}</span><p>${escapeHTML(profile.transferRecipient)}<br>${escapeHTML(profile.transferDetails)}</p></article>`);
    });
    saveOrders(orders); saveNotifications(notifications); state.cart = []; saveState(); renderCart(); renderNotificationCount(); checkoutForm.hidden = true; checkoutModal.querySelector('.modal-heading').hidden = true; orderSuccess.hidden = false; $('#order-success-copy').textContent = paymentMethod === 'Transferencia' ? 'Estos son los datos de transferencia de cada persona creadora:' : 'Las personas creadoras recibirán los detalles de tu pedido y coordinarán el pago en efectivo contigo.'; paymentInstructions.innerHTML = transfers.join(''); showToast('Solicitud de pedido enviada');
  });

  $('#mobile-menu-btn').addEventListener('click', () => { const nav = $('#main-nav'); const open = nav.classList.toggle('is-open'); $('#mobile-menu-btn').setAttribute('aria-expanded', String(open)); });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => $('#main-nav').classList.remove('is-open')));
  if (localStorage.getItem('mesa-raiz-theme') === 'dark') document.body.classList.add('dark-mode');
  $('#theme-toggle').addEventListener('click', () => { const dark = document.body.classList.toggle('dark-mode'); localStorage.setItem('mesa-raiz-theme', dark ? 'dark' : 'light'); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeCart(); closeCheckout(); closeAuth(); closePublish(); closeInbox(); } });

  renderAccountButton(); renderProducts(); renderCart();



  // Lógica para comentarios interactivos
  const commentForm = $('#comment-form');
  const commentsList = $('#comments-list');
  const getComments = () => readList('gastromind-user-comments');

  function renderComments() {
    if (!commentsList) return;
    const comments = getComments();

    if (comments.length === 0) {
      commentsList.innerHTML = `<p style="color: var(--ink-soft); font-size: 0.8rem; grid-column: 1 / -1;">Aún no hay comentarios. ¡Sé el primero en dejar tu opinión!</p>`;
      return;
    }

    commentsList.innerHTML = comments.map(comment => {
      const initial = comment.author.charAt(0).toUpperCase();
      const stars = '★'.repeat(comment.rating) + '☆'.repeat(5 - comment.rating);
      return `
        <article class="review-card">
          <div class="stars">${stars}</div>
          <blockquote>“${escapeHTML(comment.text)}”</blockquote>
          <footer>
            <span class="review-avatar">${initial}</span>
            <span>
              <strong>${escapeHTML(comment.author)}</strong>
              <small>${comment.date}</small>
            </span>
          </footer>
        </article>
      `;
    }).join('');
  }

  if (commentForm) {
    commentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const author = $('#comment-author').value.trim();
      const rating = Number($('#comment-rating').value);
      const text = $('#comment-text').value.trim();

      if (!author || !text) return showToast('Completa todos los campos para publicar');

      const comments = getComments();
      comments.unshift({
        id: `comment-${Date.now()}`,
        author,
        rating,
        text,
        date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
      });

      localStorage.setItem('gastromind-user-comments', JSON.stringify(comments));
      commentForm.reset();
      renderComments();
      showToast('¡Gracias por tu comentario!');
    });
  }

  // Inicializar renderizado de comentarios
  renderComments();
});
