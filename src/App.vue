<script setup>
// Perubahan kecil untuk refresh deploy
import { ref, onMounted, computed, watch } from 'vue'

const pizzas = ref([])
const sizes = ref([])
const allToppings = ref([])
const selectedPizzaId = ref(null)
const selectedSizeId = ref(null)
const selectedToppingsIds = ref([])
const totalPrice = ref(0)
const showOrderSuccessModal = ref(false)
const isNavOpen = ref(false)

const BASE_PATH = '/project-pizza'

const selectedPizza = computed(() => {
  return pizzas.value.find((p) => p.id === selectedPizzaId.value)
})

const selectedSize = computed(() => {
  return sizes.value.find((s) => s.id === selectedSizeId.value)
})

const loadData = async () => {
  try {
    const [pizzaRes, sizeRes, toppingRes] = await Promise.all([
      fetch(`${BASE_PATH}/json/pizza-list.json`),
      fetch(`${BASE_PATH}/json/size-list.json`),
      fetch(`${BASE_PATH}/json/topping-list.json`),
    ])

    const pizzaData = await pizzaRes.json()
    const sizeData = await sizeRes.json()
    const toppingData = await toppingRes.json()

    pizzas.value = pizzaData.data
    sizes.value = sizeData.data
    allToppings.value = toppingData.data

    if (pizzas.value.length > 0) {
      selectPizza(pizzas.value.find((p) => p.id === 1) || pizzas.value?.[0])
    }

    if (sizes.value.length > 0) {
      selectedSizeId.value = sizes.value?.[0].id
    }

    calculateTotalPrice()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

const selectPizza = (pizza) => {
  selectedPizzaId.value = pizza.id
  selectedSizeId.value = sizes.value[0].id
  selectedToppingsIds.value = []
  calculateTotalPrice()
}

const isToppingAllowed = (toppingId) => {
  if (!selectedPizza.value) {
    return false
  }
  return selectedPizza.value.toppings.includes(toppingId)
}

const getToppingDetails = (toppingId) => {
  return allToppings.value.find((t) => t.id === toppingId)
}

const calculateTotalPrice = () => {
  let currentPrice = 0

  if (selectedPizza.value) {
    currentPrice += selectedPizza.value.discount.is_active
      ? selectedPizza.value.discount.final_price
      : selectedPizza.value.price
  }

  if (selectedSize.value) {
    currentPrice += selectedSize.value.extra_price
  }

  selectedToppingsIds.value.forEach((toppingId) => {
    const topping = allToppings.value.find((t) => t.id === toppingId)
    if (topping && isToppingAllowed(toppingId)) {
      currentPrice += topping.price
    }
  })

  totalPrice.value = currentPrice
}

const handleOrderNow = () => {
  showOrderSuccessModal.value = true
}

const toggleNav = () => {
  isNavOpen.value = !isNavOpen.value
}

watch(selectedPizzaId, () => {
  selectedToppingsIds.value = selectedToppingsIds.value.filter((toppingId) =>
    isToppingAllowed(toppingId),
  )
  calculateTotalPrice()
})

watch(
  [selectedSizeId, selectedToppingsIds],
  () => {
    calculateTotalPrice()
  },
  { deep: true },
)

const getPizzaImage = (id) => {
  if (id === 1) return `${BASE_PATH}/img/pizza/Cheese Pizza.png`
  if (id === 2) return `${BASE_PATH}/img/pizza/Veggie Pizza.png`
  if (id === 3) return `${BASE_PATH}/img/pizza/Classical Pizza.png`
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div id="app">
    <header class="navbar">
      <div class="container navbar-content">
        <h1 class="logo">Food<span class="primary">now</span></h1>
        <nav class="nav-links">
          <ul>
            <li><a href="#" class="active">Home</a></li>
            <li><a href="#">Order</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Contact us</a></li>
          </ul>
        </nav>
        <div class="auth-buttons">
          <button class="btn login-btn">Login</button>
          <button class="btn register-btn">Register</button>
        </div>
        <button class="hamburger-menu" @click="toggleNav" :class="{ open: isNavOpen }">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </header>
    <div class="mobile-menu-wrapper" :class="{ open: isNavOpen }">
      <div class="mobile-menu-content">
        <button class="close-menu-btn" @click="toggleNav" aria-label="Close menu">&times;</button>
        <nav>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Order</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </nav>
        <div class="auth-buttons">
          <button class="btn login-btn">Login</button>
          <button class="btn register-btn">Register</button>
        </div>
      </div>
    </div>

    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <h2>Pizza order</h2>
      </div>
    </section>

    <main class="container pizza-order-form">
      <div class="form-section">
        <h2>Choose your Pizza</h2>
        <div class="pizza-selection">
          <div
            v-for="pizza in pizzas"
            :key="pizza.id"
            class="pizza-card"
            :class="{ selected: selectedPizza && selectedPizza.id === pizza.id }"
            @click="selectPizza(pizza)"
          >
            <input
              type="radio"
              :id="'pizza-' + pizza.id"
              :value="pizza.id"
              v-model="selectedPizzaId"
              class="pizza-radio"
              hidden
            />
            <label :for="'pizza-' + pizza.id" class="pizza-label">
              <img :src="getPizzaImage(pizza.id)" :alt="pizza.name" class="pizza-image" />
              <div class="pizza-details">
                <h3>{{ pizza.name }}</h3>
                <p v-if="pizza.discount.is_active" class="price">
                  <span class="old-price">${{ pizza.price.toFixed(2) }}</span>
                  ${{ pizza.discount.final_price.toFixed(2) }}
                </p>
                <p v-else class="price">${{ pizza.price.toFixed(2) }}</p>
              </div>
              <span v-if="pizza.discount.is_active" class="offer-tag">OFFER</span>
            </label>
          </div>
        </div>

        <h2>Custom Pizza</h2>

        <div class="size-selection">
          <h3>Size</h3>
          <div class="size-options">
            <div v-for="size in sizes" :key="size.id" class="size-option">
              <input
                type="radio"
                :id="'size-' + size.id"
                :value="size.id"
                v-model="selectedSizeId"
                @change="calculateTotalPrice"
              />
              <label :for="'size-' + size.id">
                {{ size.name }}
                <span v-if="size.extra_price > 0"> (+${{ size.extra_price.toFixed(2) }})</span>
              </label>
            </div>
          </div>
        </div>

        <div class="topping-selection">
          <h3>Toppings</h3>
          <div class="topping-options">
            <div v-for="topping in allToppings" :key="topping.id" class="topping-option">
              <input
                type="checkbox"
                :id="'topping-' + topping.id"
                :value="topping.id"
                v-model="selectedToppingsIds"
                :disabled="!isToppingAllowed(topping.id)"
                @change="calculateTotalPrice"
              />
              <label
                :for="'topping-' + topping.id"
                :class="{ 'disabled-topping': !isToppingAllowed(topping.id) }"
              >
                {{ topping.name }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <aside class="payment-summary">
        <h2>Payment Summary</h2>
        <div class="summary-details-list">
          <div v-if="selectedPizza" class="summary-item">
            <p>{{ selectedPizza.name }}</p>
            <p>
              ${{
                (selectedPizza.discount.is_active
                  ? selectedPizza.discount.final_price
                  : selectedPizza.price
                ).toFixed(2)
              }}
            </p>
          </div>

          <div v-if="selectedSize && selectedSize.extra_price > 0" class="summary-item">
            <p>Size - {{ selectedSize.name }}</p>
            <p>+${{ selectedSize.extra_price.toFixed(2) }}</p>
          </div>
          <div v-else-if="selectedSize" class="summary-item">
            <p>Size - {{ selectedSize.name }}</p>
            <p>$0.00</p>
          </div>

          <div v-for="toppingId in selectedToppingsIds" :key="toppingId" class="summary-item">
            <template v-if="getToppingDetails(toppingId)">
              <p>{{ getToppingDetails(toppingId).name }}</p>
              <p>${{ getToppingDetails(toppingId).price.toFixed(2) }}</p>
            </template>
          </div>
        </div>

        <div class="summary-total">
          <p>Total Price</p>
          <p class="total-price">${{ totalPrice.toFixed(2) }}</p>
        </div>
        <button class="btn order-now-btn" @click="handleOrderNow">Order Now</button>
      </aside>
    </main>

    <div v-if="showOrderSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-icon">
          <img src="/img/invoice.png" alt="Order Success" class="custom-success-icon" />
        </div>
        <h3>My Order Success!</h3>
        <p>Order received. Thank you, we have received your order successfully.</p>
        <button class="btn modal-close-btn" @click="showOrderSuccessModal = false">Close</button>
      </div>
    </div>

    <footer class="footer">
      <div class="container footer-content">
        <div class="footer-brand">
          <h1 class="logo">Food<span class="primary-footer">now</span></h1>
          <p>Find Us :</p>
          <div class="social-icons">
            <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a>
          </div>
        </div>

        <div class="footer-links">
          <h3>Navigation</h3>
          <div class="navigation-columns">
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">Order</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
            <ul>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Login</a></li>
              <li><a href="#">Register</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-contact">
          <h3>Contact</h3>
          <p><i class="fas fa-envelope"></i> Food.now@mail.com</p>
          <p><i class="fas fa-phone"></i> +62848477102943</p>
          <p><i class="fab fa-whatsapp"></i> +628184938494</p>
        </div>

        <div class="footer-location">
          <h3>Location</h3>
          <p><i class="fas fa-map-marker-alt"></i> Kerobokan</p>
          <p>
            Jl. Raya Kerobokan Br Taman, Kuta No.98, Kerobokan Kelod, Kec. Kuta Utara, Kabupaten
            Badung, Bali 80361
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container">
          <p>
            Copyright © 2022 Foodnow. All Rights Reserved. Powered by PT. Timedoor Indonesia. |
            Privacy Policy
          </p>
          <p>
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service
            apply.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.btn.login-btn {
  background-color: transparent;
  color: var(--white);
  border: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.btn.login-btn:hover {
  color: #e67e00;
}

.btn.register-btn,
.order-now-btn {
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.btn.register-btn:hover,
.order-now-btn:hover {
  background-color: #e67e00;
}

.primary {
  color: var(--white);
}

.navbar {
  background-color: transparent;
  padding: 15px 0;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
  color: var(--white);
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  z-index: 10;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 20px;
}

.nav-links {
  flex: 1;
  display: flex;
  justify-content: center;
}

.mobile-menu-content {
  display: none;
}

.nav-links ul {
  display: flex;
  gap: 30px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links ul li a {
  color: var(--white);
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;
}

.nav-links ul li a:hover,
.nav-links ul li a.active {
  color: var(--primary-color);
}

.auth-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.logo {
  color: var(--primary-color);
  font-size: 34px;
  margin: 0;
}

.hamburger-menu {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1100;
  position: relative;
}

.hamburger-menu .bar {
  width: 100%;
  height: 3px;
  background-color: var(--white);
  border-radius: 5px;
  transition: all 0.3s ease;
}

.hamburger-menu.open .bar:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger-menu.open .bar:nth-child(2) {
  opacity: 0;
}

.hamburger-menu.open .bar:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

.hero-section {
  position: relative;
  height: 600px;
  background: url('/img/hero.png') no-repeat center center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  text-align: center;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-content h2 {
  font-size: 5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  color: var(--primary-color);
  font-weight: bold;
}

.pizza-order-form {
  display: flex;
  gap: 30px;
  padding: 40px 0;
  align-items: flex-start;
}

.form-section {
  flex: 2;
  background-color: var(--white);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.form-section h2 {
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 2.2em;
}

.pizza-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.pizza-card {
  border: 2px solid var(--border-color);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background-color: var(--white);
  flex: 1;
  min-width: 280px;
}

.pizza-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.1);
}

.pizza-card.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
}

.pizza-radio {
  display: none;
}

.pizza-label {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  cursor: pointer;
}

.pizza-image {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.pizza-card.selected .pizza-image {
  border-color: var(--primary-color);
}

.pizza-details h3 {
  margin: 0 0 5px 0;
  color: var(--secondary-color);
}

.pizza-details .price {
  font-size: 1.1em;
  font-weight: bold;
  color: var(--primary-color);
}

.pizza-details .old-price {
  text-decoration: line-through;
  color: var(--text-color);
  font-weight: normal;
  margin-right: 5px;
}

.offer-tag {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--primary-color);
  color: var(--white);
  padding: 5px 10px;
  border-bottom-left-radius: 10px;
  font-size: 0.8em;
  font-weight: bold;
}

.size-selection,
.topping-selection {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.size-selection:last-of-type,
.topping-selection:last-of-type {
  border-bottom: none;
}

.size-selection h3,
.topping-selection h3 {
  color: var(--secondary-color);
  font-size: 1.4em;
  margin-bottom: 15px;
}

.size-options {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
}

.size-option input[type='radio'] {
  margin-right: 8px;
}

.size-option label {
  cursor: pointer;
  font-size: 1.1em;
}

.topping-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.topping-option {
  background-color: var(--light-gray);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.topping-option input[type='checkbox'] {
  accent-color: var(--primary-color);
}

.topping-option label {
  cursor: pointer;
  font-size: 0.95em;
  color: var(--text-color);
}

.topping-option:has(input[type='checkbox']:checked) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.topping-option:has(input[type='checkbox']:checked) label {
  color: var(--white);
}

.topping-option input[type='checkbox']:disabled + label {
  color: var(--disabled-color);
  cursor: not-allowed;
}

.topping-option input[type='checkbox']:disabled {
  accent-color: var(--disabled-color);
}

.topping-option.disabled-topping {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f0f0f0;
}

.topping-option.disabled-topping label {
  color: var(--disabled-color);
  cursor: not-allowed;
}

.payment-summary {
  flex: 1;
  background-color: var(--white);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  /* position: sticky; */
  top: 20px;
  max-width: 480px;
  width: 100%;
}

.payment-summary h2 {
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.8em;
}

.summary-details-list {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px dashed var(--border-color);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-item p {
  margin: 0;
  font-size: 1.1em;
  color: var(--text-color);
}

.summary-item p:last-child {
  font-weight: bold;
  color: var(--secondary-color);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.summary-total p {
  margin: 0;
  font-size: 1.2em;
  font-weight: bold;
}

.summary-total .total-price {
  font-size: 1.8em;
  color: var(--primary-color);
}

.order-now-btn {
  width: 100%;
  font-size: 1.2em;
  padding: 12px 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Latar belakang gelap transparan */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Pastikan di atas semua elemen lain */
}

/* Gaya untuk Konten Modal */
.modal-content {
  background-color: var(--white);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 90%; /* Responsif */
  transform: translateY(-20px); /* Sedikit animasi masuk */
  animation: modalFadeIn 0.3s ease-out forwards;
}

/* Animasi sederhana untuk modal */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  color: var(--primary-color);
  margin-bottom: 15px;
  font-size: 1.8em;
}

.modal-content p {
  color: var(--text-color);
  margin-bottom: 25px;
  line-height: 1.6;
}

.modal-close-btn {
  background-color: var(--primary-color);
  color: var(--white);
  padding: 12px 30px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s ease;
}

.modal-close-btn:hover {
  background-color: #e67e00;
}

.footer {
  /* background-color: #333; */
  color: black;
  padding: 40px 0 20px;
  font-size: 0.9em;
  margin-top: 50px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.footer-brand,
.footer-links,
.footer-contact,
.footer-location {
  flex: 1;
  min-width: 200px;
  margin-bottom: 20px;
}

.footer-brand .logo {
  font-size: 32px;
  margin-bottom: 15px;
}

.footer-brand p {
  margin-bottom: 10px;
}

.logo .primary-footer {
  color: black;
}

.social-icons {
  display: flex;
  gap: 15px;
}

.social-icon {
  color: var(--primary-color);
  font-size: 20px;
  transition: color 0.3s ease;
}

.social-icon:hover {
  color: #e67e00;
}

.footer-links h3,
.footer-contact h3,
.footer-location h3 {
  color: var(--primary-color);
  margin-bottom: 15px;
  font-size: 1.2em;
}

.navigation-columns {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  min-width: 80px;
}

.footer-links ul li {
  margin-bottom: 8px;
}

.footer-links ul li a {
  color: black;
  text-decoration: none;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.footer-links ul li a:hover {
  color: var(--primary-color);
}

.footer-contact p,
.footer-location p {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.footer-contact p i,
.footer-location p i {
  color: var(--primary-color);
  margin-top: 3px;
}

.footer-bottom {
  border-top: 1px solid #444;
  padding-top: 20px;
  text-align: center;
  color: #bbb;
  margin-top: 30px;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
  .pizza-order-form {
    flex-direction: column;
    align-items: center;
  }

  .form-section,
  .payment-summary {
    width: 100%;
    max-width: 600px;
  }

  .payment-summary {
    position: static;
    margin-top: 30px;
  }

  .hero-content h2 {
    font-size: 3em;
  }

  .footer-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .footer-brand,
  .footer-links,
  .footer-contact,
  .footer-location {
    width: 100%;
    max-width: 300px;
    margin-bottom: 20px;
  }

  .footer-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .navigation-columns {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .social-icons {
    justify-content: center;
    width: 100%;
  }

  .footer-links ul {
    text-align: center;
  }

  .footer-contact p,
  .footer-location p {
    justify-content: center;
  }

  .footer-bottom {
    text-align: center;
  }
}

@media (max-width: 991px) and (min-width: 769px) {
  .navbar-content {
    /* Mengurangi gap antar item agar lebih rapat */
    gap: 15px; /* Atau sesuaikan nilai ini sesuai kebutuhan */
    justify-content: space-between; /* Pastikan tetap tersebar */
    padding: 0 15px; /* Sedikit padding di samping */
  }

  .nav-links ul {
    /* Mengurangi gap antar item menu */
    gap: 15px;
  }

  .nav-links ul li a {
    /* Menyesuaikan ukuran font agar lebih ringkas */
    font-size: 0.9em;
  }

  .auth-buttons {
    /* Mengurangi gap antar tombol */
    gap: 8px;
  }

  .btn.login-btn,
  .btn.register-btn {
    /* Menyesuaikan padding tombol */
    padding: 8px 15px;
    font-size: 0.9em;
  }

  .logo {
    /* Menyesuaikan ukuran logo jika terlalu besar */
    font-size: 30px;
  }
}

@media (max-width: 480px) {
  .navbar-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    position: relative;
  }

  .pizza-selection {
    flex-direction: column;
  }

  .pizza-card {
    min-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  /* Reduce modal size on small screens */
  .modal-content {
    max-width: 280px;
    width: 90%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .pizza-card {
    min-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  .pizza-selection {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .hamburger-menu {
    display: flex;
    z-index: 1000;
    margin-right: 20px; /* Tambahkan ini untuk margin kanan */
  }

  .navbar-content { /* Tambahkan ini untuk memastikan logo di kiri dan hamburger di kanan */
    justify-content: space-between;
    flex-wrap: nowrap; /* Pastikan tidak wrap */
    padding: 0 20px;
  }

  .navbar nav,
  .auth-buttons {
    display: none;
  }

  .mobile-menu-wrapper {
    display: block;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7); /* Latar belakang gelap transparan */
    box-shadow: none;
    z-index: 1100;
    padding: 20px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    overflow-y: auto;
    transition:
      opacity 0.3s ease,
      visibility 0.3s ease;
  }
  .mobile-menu-wrapper.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .mobile-menu-content {
    background-color: var(--white);
    border-radius: 10px;
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  .mobile-menu-content .auth-buttons {
    margin-top: 20px;
  }
  .hamburger-menu {
    z-index: 1200;
  }

  .close-menu-btn {
    background: transparent;
    border: none;
    font-size: 2.5rem;
    color: var(--text-color);
    cursor: pointer;
    position: absolute;
    top: 7px;
    right: 42px;
    z-index: 10;
  }

  .mobile-menu-wrapper.open {
    opacity: 1;
    visibility: visible;
  }

  .mobile-menu-wrapper nav ul {
    flex-direction: column;
    gap: 0;
    padding: 0;
    margin: 0;
    text-align: center;
  }

  .mobile-menu-wrapper nav ul li a {
    display: block;
    padding: 12px 20px;
    color: var(--text-color);
    text-decoration: none;
    transition: background-color 0.3s ease;
    cursor: pointer;
  }

  .mobile-menu-wrapper nav ul li {
    list-style: none;
    border-bottom: 1px solid var(--border-color);
  }

  .mobile-menu-wrapper nav ul li a:hover {
    background-color: var(--light-gray);
    color: var(--primary-color);
  }

  .mobile-menu-wrapper .auth-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px 20px;
  }

  .mobile-menu-wrapper .login-btn {
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
    width: 100%;
  }

  .mobile-menu-wrapper .register-btn {
    background-color: var(--primary-color);
    color: var(--white);
    width: 100%;
  }

  .hero-content h2 {
    font-size: 2em;
  }

  .hero-content p {
    font-size: 1em;
  }

  .pizza-order-form {
    padding: 20px 10px;
  }

  .form-section,
  .payment-summary {
    padding: 20px;
  }

  .topping-option {
    padding: 6px 12px;
    font-size: 0.9em;
  }
}
</style>
