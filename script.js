// Conexión a Supabase para GastroMind
const SUPABASE_URL = 'https://jjkhnslifdtitiberhhl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_e6CmLfGd2AtZEny20KpjeA_ntspmoQn';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  const readList = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const readObject = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  };

  let products = [];

  async function cargarPlatosDesdeSupabase() {
    const { data, error } = await _supabase
      .from('platos')
      .select('*');

    if (error) {
      console.error('Error al cargar platos desde Supabase:', error.message);
      return;
    }

    products = data.map(item => ({
      id: String(item.id),
      title: item.nombre || 'Plato Culinario',
      description: item.descripcion || 'Sin descripción',
      price: item.precio || 0,
      category: item.categoria || 'fuertes',
      image: item.imagen_url || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500',
      seller: item.creador || 'Comunidad'
    }));

    renderProducts();
  }

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
  const getProduct = (id) => products.find(product => String(product.id) === String(id));
  const getAccounts = () => readList('gastromind-accounts');
  const getProfiles = () => readList('gastromind-seller-profiles');
  const getNotifications = () => readList('gastromind-notifications');
  const getOrders = () => readList('gastromind-orders');

  function saveState() {
    localStorage.setItem('gastromind-cart', JSON.stringify(state.cart));
    localStorage.setItem('gastromind-favorites', JSON.stringify(state.favorites));
  }
  function saveAccounts(accounts) { localStorage.setItem('gastromind-accounts', JSON.stringify(accounts)); }
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
    const open = [cartDrawer, checkoutModal, authModal, publishModal, inboxModal].some(element => element?.classList.contains('is-open'));
    document.body.classList.toggle('no-scroll', open);
  }
  function setModalState(element, open) {
    if (!element) return;
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
      || (state.activeCategory === 'favoritos' && state.favorites.includes(String(product.id)))
      || product.category === state.activeCategory;
    const searchable = `${product.title} ${product.description} ${product.seller || ''}`.toLowerCase();
    return categoryMatch && searchable.includes(state.searchTerm);
  }

  function renderProducts() {
    if (!productGrid) return;
    const visible = products.filter(productMatches);
    productGrid.innerHTML = visible.map((product, index) => {
      const favorite = state.favorites.includes(String(product.id));
      return `<article class="product-card" style="animation-delay:${index * 55}ms">
        <div class="product-image-wrap">
          <div class="product-image" style="background-image:url('${product.image}')" role="img" aria-label="${escapeHTML(product.title)}"></div>
          <span class="product-badge">Comunidad</span>
          <button class="product-favorite ${favorite ? 'is-favorite' : ''}" data-favorite="${product.id}" type="button" aria-label="Guardar favorito">${favorite ? '♥' : '♡'}</button>
        </div>
        <div class="product-info">
          <div class="product-meta"><span>Creación local</span><i class="meta-dot"></i><span>Hecho hoy</span></div>
          <h3>${escapeHTML(product.title)}</h3>
          <p>${escapeHTML(product.description)}</p>
          <span class="product-seller">Creado por <strong>@${escapeHTML(product.seller)}</strong></span>
          <div class="product-bottom">
            <strong class="product-price">${formatPrice(product.price)}</strong>
            <button class="add-btn" data-add="${product.id}" type="button">Seleccionar <span>＋</span></button>
          </div>
        </div>
      </article>`;
    }).join('');
    
    noResults.hidden = visible.length > 0;
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
    const existing = state.cart.find(item => String(item.id) === String(id));
    if (existing) existing.quantity += 1;
    else state.cart.push({ id: String(id), quantity: 1 });
    saveState(); renderCart(); showToast(`${product.title} añadido al carrito`);
  }

  function changeQuantity(id, amount) {
    const item = state.cart.find(line => String(line.id) === String(id));
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) state.cart = state.cart.filter(line => String(line.id) !== String(id));
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
      return `<div class="cart-line">
        <div class="cart-line-image" style="background-image:url('${product.image}')"></div>
        <div class="cart-line-content">
          <h3>${escapeHTML(product.title)}</h3>
          <p>Por @${escapeHTML(product.seller)}</p>
          <strong>${formatPrice(product.price * item.quantity)}</strong>
        </div>
        <div class="quantity-control">
          <button data-decrease="${product.id}" type="button">−</button>
          <span>${item.quantity}</span>
          <button data-increase="${product.id}" type="button">＋</button>
        </div>
      </div>`;
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
      publishForm.elements.transferProvider.value = profile.transferProvider || '';
      publishForm.elements.transferRecipient.value = profile.transferRecipient || '';
      publishForm.elements.transferDetails.value = profile.transferDetails || '';
    }
    setModalState(publishModal, true);
  }
  function closePublish() { setModalState(publishModal, false); publishForm.reset(); }

  document.addEventListener('click', event => {
    const add = event.target.closest('[data-add]'); if (add) addToCart(add.dataset.add);
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      const id = String(favorite.dataset.favorite);
      state.favorites = state.favorites.includes(id) ? state.favorites.filter(value => value !== id) : [...state.favorites, id];
      saveState(); renderProducts();
    }
    const increase = event.target.closest('[data-increase]'); if (increase) changeQuantity(increase.dataset.increase, 1);
    const decrease = event.target.closest('[data-decrease]'); if (decrease) changeQuantity(decrease.dataset.decrease, -1);
  });

  categoryButtons.forEach(button => button.addEventListener('click', () => setCategory(button.dataset.category)));
  categoryLinks.forEach(link => link.addEventListener('click', () => setCategory(link.dataset.categoryLink)));
  if (searchInput) searchInput.addEventListener('input', event => { state.searchTerm = event.target.value.toLowerCase().trim(); renderProducts(); });

  $('#open-cart').addEventListener('click', openCart);
  $('#close-cart').addEventListener('click', closeCart);
  $('#drawer-backdrop').addEventListener('click', closeCart);
  $('#start-shopping').addEventListener('click', () => { closeCart(); $('#menu').scrollIntoView({ behavior: 'smooth' }); });
  $('#open-checkout').addEventListener('click', openCheckout);
  $('#close-checkout').addEventListener('click', closeCheckout);
  $('#checkout-backdrop').addEventListener('click', closeCheckout);
  $('#success-close').addEventListener('click', () => { closeCheckout(); $('#menu').scrollIntoView({ behavior: 'smooth' }); });
  $('#open-publish').addEventListener('click', openPublish);
  $('#close-publish').addEventListener('click', closePublish);
  $('#publish-backdrop').addEventListener('click', closePublish);
  if (notificationButton) notificationButton.addEventListener('click', () => setModalState(inboxModal, true));
  if ($('#close-inbox')) $('#close-inbox').addEventListener('click', () => setModalState(inboxModal, false));
  $('#close-auth').addEventListener('click', closeAuth);
  $('#auth-backdrop').addEventListener('click', closeAuth);

  accountButton.addEventListener('click', () => {
    if (!state.currentUser?.username) return openAuth();
    const username = state.currentUser.username;
    state.currentUser = null; localStorage.removeItem('gastromind-current-user'); renderAccountButton(); showToast(`Sesión de @${username} cerrada`);
  });
  
  authSwitch.addEventListener('click', () => { authMode = authMode === 'login' ? 'register' : 'login'; updateAuthModal(); });
  
  authForm.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(authForm);
    const username = String(form.get('username') || '').trim().replace(/\s+/g, '');
    const password = String(form.get('password') || '');
    if (username.length < 3 || password.length < 4) return showToast('Revisa tu nombre de usuario y contraseña');
    const accounts = getAccounts();
    const existing = accounts.find(account => account.username.toLowerCase() === username.toLowerCase());
    
    if (authMode === 'register') {
      if (existing) return showToast('Ese nombre de usuario ya existe');
      accounts.push({ username, password, createdAt: new Date().toISOString() });
      saveAccounts(accounts);
    } else if (!existing || existing.password !== password) {
      return showToast('Usuario o contraseña incorrectos');
    }
    
    state.currentUser = { username };
    localStorage.setItem('gastromind-current-user', JSON.stringify(state.currentUser));
    renderAccountButton();
    closeAuth();
    showToast(authMode === 'register' ? `¡Bienvenido, @${username}!` : `Iniciaste sesión como @${username}`);
    if (publishAfterAuth) { publishAfterAuth = false; openPublish(); }
  });

  // Evento corregido para publicar plato en Supabase
  publishForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!state.currentUser?.username) return openAuth();
    const form = new FormData(publishForm);
    const image = form.get('image');
    const title = String(form.get('title') || '').trim();
    const description = String(form.get('description') || '').trim();
    const price = Number(form.get('price'));

    if (!(image instanceof File) || !image.size || !title || description.length < 5 || !Number.isFinite(price) || price <= 0) {
      return showToast('Completa la foto, descripción y precio del plato');
    }

    const reader = new FileReader();
    reader.addEventListener('load', async () => {
      const username = state.currentUser?.username || 'Anónimo';

      const { error } = await _supabase
        .from('platos')
        .insert([
          {
            nombre: title,
            descripcion: description,
            precio: Math.round(price),
            categoria: 'fuertes',
            imagen_url: reader.result,
            creador: username
          }
        ]);

      if (error) {
        showToast('Error al publicar: ' + error.message);
        return;
      }

      showToast('¡Plato publicado con éxito!');
      await cargarPlatosDesdeSupabase();
      closePublish();
      publishForm.reset();
    });

    reader.readAsDataURL(image);
  });

  fulfillmentSelect.addEventListener('change', () => {
    const delivery = fulfillmentSelect.value === 'Domicilio';
    addressField.hidden = !delivery;
    addressField.querySelector('input').required = delivery;
  });

  checkoutForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!state.cart.length) return showToast('Agrega al menos un plato para continuar');
    state.cart = [];
    saveState();
    renderCart();
    checkoutForm.hidden = true;
    checkoutModal.querySelector('.modal-heading').hidden = true;
    orderSuccess.hidden = false;
    showToast('Solicitud de pedido enviada');
  });

  // Inicializar la carga desde la base de datos Supabase
  await cargarPlatosDesdeSupabase();
  renderAccountButton();
  renderCart();
});