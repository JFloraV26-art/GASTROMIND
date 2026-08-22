document.addEventListener('DOMContentLoaded', () => {
  // Extensión funcional: conserva el menú y los flujos originales; las cuentas y los platos nuevos viven localmente en el navegador.
  const products = [
    {
      id: 'lasana-casa', title: 'Lasaña de la casa', category: 'fuertes', tags: ['favoritos'], type: 'Para compartir', badge: 'Más pedido', badgeClass: '', price: 42000,
      description: 'Capas de pasta fresca, ragú lento y queso gratinado.', image: 'https://images.unsplash.com/photo-1574868235872-7dc72e9f3f4e?auto=format&fit=crop&w=900&q=85'
    },
    {
      id: 'bowl-cosecha', title: 'Bowl de cosecha', category: 'fuertes', tags: ['favoritos'], type: 'Vegetariano', badge: 'De temporada', badgeClass: 'badge-green', price: 28000,
      description: 'Granos, vegetales rostizados, hummus y aderezo de hierbas.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85'
    },
    {
      id: 'curry-coco', title: 'Curry de coco', category: 'fuertes', tags: ['favoritos'], type: 'Receta de la casa', badge: 'Favorito', badgeClass: 'badge-red', price: 34000,
      description: 'Curry suave de coco, vegetales y arroz jazmín aromático.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85'
    },
    {
      id: 'pollo-brasa', title: 'Pollo a la brasa', category: 'express', tags: [], type: 'Para el día a día', badge: 'Listo en 20 min', badgeClass: 'badge-green', price: 26000,
      description: 'Pollo marinado, papas rústicas y ensalada fresca.', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=85'
    },
    {
      id: 'tacos-callejeros', title: 'Tacos de la esquina', category: 'express', tags: ['favoritos'], type: 'Para compartir', badge: 'Nuevo', badgeClass: '', price: 31000,
      description: 'Seis tacos de birria, cebolla, cilantro y salsa de la casa.', image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=85'
    },
    {
      id: 'brownie-sal-marina', title: 'Brownie & sal marina', category: 'dulce', tags: ['favoritos'], type: 'Algo dulce', badge: 'Para cerrar bonito', badgeClass: 'badge-red', price: 14000,
      description: 'Chocolate oscuro, nueces tostadas y una pizca de sal.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85'
    }
  ];

  const readStoredList = (key) => {
    try {
      const savedValue = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(savedValue) ? savedValue : [];
    } catch (error) {
      return [];
    }
  };

  products.unshift(...readStoredList('gastromind-seller-products'));

  const state = {
    activeCategory: 'todos',
    searchTerm: '',
    cart: JSON.parse(localStorage.getItem('mesa-raiz-cart') || '[]'),
    favorites: JSON.parse(localStorage.getItem('mesa-raiz-favorites') || '[]'),
    currentUser: JSON.parse(localStorage.getItem('gastromind-current-user') || 'null')
  };

  const productGrid = document.getElementById('product-grid');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-input');
  const categoryButtons = [...document.querySelectorAll('.filter-btn')];
  const categoryLinks = [...document.querySelectorAll('[data-category-link]')];
  const cartDrawer = document.getElementById('cart-drawer');
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const drawerFooter = document.getElementById('drawer-footer');
  const cartCount = document.getElementById('cart-count');
  const drawerCount = document.getElementById('drawer-count');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTotal = document.getElementById('cart-total');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutTotal = document.getElementById('checkout-total');
  const checkoutForm = document.getElementById('checkout-form');
  const orderSuccess = document.getElementById('order-success');
  const fulfillmentSelect = document.querySelector('select[name="fulfillment"]');
  const addressField = document.getElementById('address-field');
  const authModal = document.getElementById('auth-modal');
  const publishModal = document.getElementById('publish-modal');
  const authForm = document.getElementById('auth-form');
  const publishForm = document.getElementById('publish-form');
  const accountButton = document.getElementById('open-auth');
  const authTitle = document.getElementById('auth-title');
  const authDescription = document.getElementById('auth-description');
  const authSubmit = document.getElementById('auth-submit');
  const authSwitch = document.getElementById('auth-switch');
  const authSwitchCopy = document.getElementById('auth-switch-copy');
  let authMode = 'login';
  let publishAfterAuth = false;

  const formatPrice = (value) => `$${new Intl.NumberFormat('es-CO').format(value)}`;
  const getProduct = (id) => products.find(product => product.id === id);
  const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

  function saveState() {
    localStorage.setItem('mesa-raiz-cart', JSON.stringify(state.cart));
    localStorage.setItem('mesa-raiz-favorites', JSON.stringify(state.favorites));
  }

  function getAccounts() {
    return readStoredList('gastromind-accounts');
  }

  function saveAccounts(accounts) {
    localStorage.setItem('gastromind-accounts', JSON.stringify(accounts));
  }

  function saveSellerProducts() {
    const sellerProducts = products.filter(product => product.isSellerProduct);
    localStorage.setItem('gastromind-seller-products', JSON.stringify(sellerProducts));
  }

  function syncOverlayScroll() {
    const hasOpenOverlay = [cartDrawer, checkoutModal, authModal, publishModal].some(element => element.classList.contains('is-open'));
    document.body.classList.toggle('no-scroll', hasOpenOverlay);
  }

  function renderAccountButton() {
    if (state.currentUser?.username) {
      accountButton.textContent = `@${state.currentUser.username}`;
      accountButton.classList.add('is-signed-in');
      accountButton.setAttribute('aria-label', `Cerrar sesión de ${state.currentUser.username}`);
      accountButton.title = 'Cerrar sesión';
      return;
    }
    accountButton.textContent = 'Iniciar sesión';
    accountButton.classList.remove('is-signed-in');
    accountButton.setAttribute('aria-label', 'Iniciar sesión');
    accountButton.removeAttribute('title');
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function productMatches(product) {
    const categoryMatch = state.activeCategory === 'todos'
      || (state.activeCategory === 'favoritos' && state.favorites.includes(product.id))
      || product.category === state.activeCategory;
    const searchable = `${product.title} ${product.description} ${product.type} ${product.seller || ''}`.toLowerCase();
    return categoryMatch && searchable.includes(state.searchTerm);
  }

  function renderProducts() {
    const visibleProducts = products.filter(productMatches);
    productGrid.innerHTML = visibleProducts.map((product, index) => {
      const isFavorite = state.favorites.includes(product.id);
      const seller = product.seller ? `<span class="product-seller">Creado por <strong>@${escapeHTML(product.seller)}</strong></span>` : '';
      return `
        <article class="product-card" style="animation-delay:${index * 55}ms">
          <div class="product-image-wrap">
            <div class="product-image" style="background-image:url('${product.image}')" role="img" aria-label="${escapeHTML(product.title)}"></div>
            <span class="product-badge ${product.badgeClass}">${product.badge}</span>
            <button class="product-favorite ${isFavorite ? 'is-favorite' : ''}" data-favorite="${product.id}" type="button" aria-label="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">${isFavorite ? '♥' : '♡'}</button>
          </div>
          <div class="product-info">
            <div class="product-meta"><span>${product.type}</span><i class="meta-dot"></i><span>Hecho hoy</span></div>
            <h3>${escapeHTML(product.title)}</h3>
            <p>${escapeHTML(product.description)}</p>
            ${seller}
            <div class="product-bottom"><strong class="product-price">${formatPrice(product.price)}</strong><button class="add-btn" data-add="${product.id}" type="button">Agregar <span>＋</span></button></div>
          </div>
        </article>`;
    }).join('');
    noResults.hidden = visibleProducts.length > 0;
  }

  function setCategory(category) {
    state.activeCategory = category;
    categoryButtons.forEach(button => button.classList.toggle('active', button.dataset.category === category));
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderProducts();
  }

  function addToCart(id) {
    const existing = state.cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else state.cart.push({ id, quantity: 1 });
    saveState();
    renderCart();
    showToast(`${getProduct(id).title} añadido al carrito`);
  }

  function changeQuantity(id, amount) {
    const item = state.cart.find(cartItem => cartItem.id === id);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) state.cart = state.cart.filter(cartItem => cartItem.id !== id);
    saveState();
    renderCart();
  }

  function getCartTotals() {
    const itemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = state.cart.reduce((total, item) => {
      const product = getProduct(item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
    return { itemCount, subtotal };
  }

  function renderCart() {
    const { itemCount, subtotal } = getCartTotals();
    cartCount.textContent = itemCount;
    drawerCount.textContent = `(${itemCount})`;
    cartSubtotal.textContent = formatPrice(subtotal);
    cartTotal.textContent = formatPrice(subtotal);
    checkoutTotal.textContent = formatPrice(subtotal);
    cartEmpty.hidden = state.cart.length > 0;
    drawerFooter.hidden = state.cart.length === 0;
    cartItems.innerHTML = state.cart.map(item => {
      const product = getProduct(item.id);
      if (!product) return '';
      return `<div class="cart-line"><div class="cart-line-image" style="background-image:url('${product.image}')"></div><div class="cart-line-content"><h3>${escapeHTML(product.title)}</h3><p>${escapeHTML(product.type)}</p><strong>${formatPrice(product.price * item.quantity)}</strong></div><div class="quantity-control"><button type="button" data-decrease="${product.id}" aria-label="Disminuir cantidad">−</button><span>${item.quantity}</span><button type="button" data-increase="${product.id}" aria-label="Aumentar cantidad">＋</button></div></div>`;
    }).join('');
  }

  function openCart() {
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeCart() {
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    syncOverlayScroll();
  }

  function openCheckout() {
    if (state.cart.length === 0) {
      showToast('Agrega al menos un producto para continuar');
      return;
    }
    checkoutModal.classList.add('is-open');
    checkoutModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeCheckout() {
    checkoutModal.classList.remove('is-open');
    checkoutModal.setAttribute('aria-hidden', 'true');
    syncOverlayScroll();
  }

  function updateAuthModal() {
    const isRegister = authMode === 'register';
    authTitle.textContent = isRegister ? 'Crea tu cuenta.' : 'Inicia sesión.';
    authDescription.textContent = isRegister
      ? 'Elige un nombre de usuario para que las personas identifiquen tus platos en el menú.'
      : 'Entra con tu cuenta para publicar tus platos y que las personas conozcan tu propuesta.';
    authSubmit.innerHTML = `${isRegister ? 'Crear cuenta' : 'Iniciar sesión'} <span>→</span>`;
    authSwitchCopy.textContent = isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?';
    authSwitch.textContent = isRegister ? 'Inicia sesión' : 'Regístrate aquí';
    document.getElementById('auth-password').autocomplete = isRegister ? 'new-password' : 'current-password';
  }

  function openAuth(mode = 'login') {
    authMode = mode;
    updateAuthModal();
    authModal.classList.add('is-open');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeAuth() {
    authModal.classList.remove('is-open');
    authModal.setAttribute('aria-hidden', 'true');
    authForm.reset();
    syncOverlayScroll();
  }

  function openPublish() {
    if (!state.currentUser?.username) {
      publishAfterAuth = true;
      showToast('Inicia sesión para publicar tu plato');
      openAuth();
      return;
    }
    publishModal.classList.add('is-open');
    publishModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closePublish() {
    publishModal.classList.remove('is-open');
    publishModal.setAttribute('aria-hidden', 'true');
    publishForm.reset();
    syncOverlayScroll();
  }

  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add]');
    if (addButton) addToCart(addButton.dataset.add);

    const favoriteButton = event.target.closest('[data-favorite]');
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      state.favorites = state.favorites.includes(id) ? state.favorites.filter(favoriteId => favoriteId !== id) : [...state.favorites, id];
      saveState();
      renderProducts();
      if (state.activeCategory === 'favoritos' && state.favorites.length === 0) showToast('Aún no tienes favoritos guardados');
    }

    const increaseButton = event.target.closest('[data-increase]');
    if (increaseButton) changeQuantity(increaseButton.dataset.increase, 1);
    const decreaseButton = event.target.closest('[data-decrease]');
    if (decreaseButton) changeQuantity(decreaseButton.dataset.decrease, -1);
  });

  categoryButtons.forEach(button => button.addEventListener('click', () => setCategory(button.dataset.category)));
  categoryLinks.forEach(link => link.addEventListener('click', () => setCategory(link.dataset.categoryLink)));
  searchInput.addEventListener('input', (event) => { state.searchTerm = event.target.value.toLowerCase().trim(); renderProducts(); });
  document.getElementById('clear-search').addEventListener('click', () => { state.searchTerm = ''; state.activeCategory = 'todos'; searchInput.value = ''; categoryButtons.forEach(button => button.classList.toggle('active', button.dataset.category === 'todos')); renderProducts(); });

  document.getElementById('open-cart').addEventListener('click', openCart);
  document.getElementById('close-cart').addEventListener('click', closeCart);
  document.getElementById('drawer-backdrop').addEventListener('click', closeCart);
  document.getElementById('start-shopping').addEventListener('click', () => { closeCart(); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); });
  document.getElementById('open-checkout').addEventListener('click', openCheckout);
  document.getElementById('close-checkout').addEventListener('click', closeCheckout);
  document.getElementById('checkout-backdrop').addEventListener('click', closeCheckout);
  document.getElementById('success-close').addEventListener('click', () => { closeCheckout(); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); });
  accountButton.addEventListener('click', () => {
    if (state.currentUser?.username) {
      const username = state.currentUser.username;
      state.currentUser = null;
      localStorage.removeItem('gastromind-current-user');
      renderAccountButton();
      showToast(`Sesión de @${username} cerrada`);
      return;
    }
    openAuth();
  });
  document.getElementById('open-publish').addEventListener('click', openPublish);
  document.getElementById('close-auth').addEventListener('click', closeAuth);
  document.getElementById('auth-backdrop').addEventListener('click', closeAuth);
  document.getElementById('close-publish').addEventListener('click', closePublish);
  document.getElementById('publish-backdrop').addEventListener('click', closePublish);
  authSwitch.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    updateAuthModal();
  });

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(authForm);
    const username = String(formData.get('username') || '').trim().replace(/\s+/g, '');
    const password = String(formData.get('password') || '');
    if (username.length < 3 || password.length < 4) {
      showToast('Revisa tu nombre de usuario y contraseña');
      return;
    }

    const accounts = getAccounts();
    const existingAccount = accounts.find(account => account.username.toLowerCase() === username.toLowerCase());
    if (authMode === 'register') {
      if (existingAccount) {
        showToast('Ese nombre de usuario ya existe');
        return;
      }
      accounts.push({ username, password, createdAt: new Date().toISOString() });
      saveAccounts(accounts);
    } else if (!existingAccount || existingAccount.password !== password) {
      showToast('Usuario o contraseña incorrectos');
      return;
    }

    state.currentUser = { username };
    localStorage.setItem('gastromind-current-user', JSON.stringify(state.currentUser));
    renderAccountButton();
    closeAuth();
    showToast(authMode === 'register' ? `¡Bienvenido, @${username}!` : `Sesión iniciada como @${username}`);
    if (publishAfterAuth) {
      publishAfterAuth = false;
      openPublish();
    }
  });

  publishForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.currentUser?.username) {
      openAuth();
      return;
    }
    const formData = new FormData(publishForm);
    const imageFile = formData.get('image');
    const title = String(formData.get('title') || '').trim();
    const price = Number(formData.get('price'));
    if (!(imageFile instanceof File) || !imageFile.size || !title || !Number.isFinite(price) || price <= 0) {
      showToast('Completa la foto, el nombre y el precio del plato');
      return;
    }
    if (imageFile.size > 1_500_000) {
      showToast('Usa una foto de máximo 1.5 MB para guardarla en el navegador');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const product = {
        id: `plato-${Date.now()}`,
        title,
        category: 'express',
        tags: [],
        type: 'Creación local',
        badge: 'Nuevo',
        badgeClass: 'badge-green',
        price: Math.round(price),
        description: `Plato compartido por @${state.currentUser.username}.`,
        seller: state.currentUser.username,
        image: reader.result,
        isSellerProduct: true,
        createdAt: new Date().toISOString()
      };
      products.unshift(product);
      saveSellerProducts();
      state.activeCategory = 'todos';
      state.searchTerm = '';
      searchInput.value = '';
      categoryButtons.forEach(button => button.classList.toggle('active', button.dataset.category === 'todos'));
      renderProducts();
      closePublish();
      document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Tu plato ya está en el menú');
    });
    reader.readAsDataURL(imageFile);
  });

  fulfillmentSelect.addEventListener('change', () => {
    const isDelivery = fulfillmentSelect.value === 'Domicilio';
    addressField.hidden = !isDelivery;
    addressField.querySelector('input').required = isDelivery;
  });

  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(checkoutForm);
    const customerName = formData.get('name');
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('mesa-raiz-last-order', JSON.stringify({ orderNumber, customerName, createdAt: new Date().toISOString(), cart: state.cart }));
    state.cart = [];
    saveState();
    renderCart();
    checkoutForm.hidden = true;
    checkoutModal.querySelector('.modal-heading').hidden = true;
    orderSuccess.hidden = false;
    orderSuccess.querySelector('h3').textContent = `¡Gracias, ${customerName}!`;
    showToast(`Solicitud #${orderNumber} enviada`);
  });

  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    const menuButton = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => document.getElementById('main-nav').classList.remove('is-open')));

  const savedTheme = localStorage.getItem('mesa-raiz-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('mesa-raiz-theme', isDark ? 'dark' : 'light');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeCart(); closeCheckout(); closeAuth(); closePublish(); }
  });

  renderAccountButton();
  renderProducts();
  renderCart();
});