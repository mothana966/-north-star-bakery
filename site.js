"use strict";

// The products are kept in a small data array so the buttons and saved list use the same names.
const bakeryProducts = [
  { id: "bread", name: "Fresh Bread" },
  { id: "pastries", name: "Pastries" },
  { id: "cakes", name: "Celebration Cakes" }
];
const storageKeys = { favorites: "northstar-favorites", requestType: "northstar-request-type" };
const validationFields = ["full-name", "email", "request-type", "pickup-date", "items"];

function loadStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function saveStored(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { /* The page still works when browser storage is disabled. */ }
}

function getFavorites() {
  const stored = loadStored(storageKeys.favorites, []);
  if (!Array.isArray(stored)) return [];
  return [...new Set(stored.filter(id => bakeryProducts.some(product => product.id === id)))];
}

function renderFavorites() {
  const favorites = getFavorites();
  const list = document.querySelector("#favorite-list");
  const status = document.querySelector("#favorite-status");
  document.querySelectorAll("[data-favorite]").forEach(button => {
    const selected = favorites.includes(button.dataset.favorite);
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = selected ? "Remove from favorites" : "Save as favorite";
  });
  if (list) {
    list.replaceChildren();
    favorites.forEach(id => {
      const product = bakeryProducts.find(item => item.id === id);
      const item = document.createElement("li");
      item.textContent = product.name;
      list.append(item);
    });
  }
  if (status) status.textContent = favorites.length
    ? `${favorites.length} saved: ${favorites.map(id => bakeryProducts.find(item => item.id === id).name).join(", ")}.`
    : "No favorites saved yet. Choose a product above to keep it on your list.";
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const updated = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
  saveStored(storageKeys.favorites, updated);
  renderFavorites();
}

function setupFavorites() {
  document.querySelectorAll("[data-favorite]").forEach(button => {
    button.addEventListener("click", () => toggleFavorite(button.dataset.favorite));
  });
  renderFavorites();
}

function showError(field, message) {
  const error = document.getElementById(`${field.id}-error`);
  if (error) error.textContent = message;
  if (message) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}

function validateField(field) {
  const value = field.value.trim();
  let message = "";
  if (field.id === "full-name") {
    if (!value) message = "Please enter your name.";
    else if (value.length < 2) message = "Your name needs at least 2 characters.";
  } else if (field.id === "email") {
    if (!value) message = "Please enter your email address.";
    else if (!field.validity.valid) message = "Please enter a valid email address.";
  } else if (field.id === "request-type") {
    if (!value) message = "Please select a request type.";
  } else if (field.id === "pickup-date") {
    const isPreorder = document.getElementById("request-type").value === "preorder";
    if (isPreorder && !value) message = "Choose a pickup date for a pre-order.";
    else if (value) {
      const today = new Date();
      const localToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
      if (value < localToday) message = "The pickup date cannot be in the past.";
    }
  } else if (field.id === "items") {
    if (!value) message = "Tell us what you would like to order or ask.";
    else if (value.length < 10) message = "Please add at least 10 characters of detail.";
  }
  showError(field, message);
  return message === "";
}

function setupContactForm() {
  const form = document.getElementById("request-form");
  if (!form) return;
  form.noValidate = true; // Built-in HTML validation still works when JavaScript is unavailable.
  const typeField = document.getElementById("request-type");
  const savedType = loadStored(storageKeys.requestType, "");
  if (savedType === "preorder" || savedType === "question") typeField.value = savedType;
  typeField.addEventListener("change", () => {
    saveStored(storageKeys.requestType, typeField.value);
    validateField(typeField);
    if (document.getElementById("pickup-date").value || typeField.value === "preorder")
      validateField(document.getElementById("pickup-date"));
  });
  validationFields.forEach(id => {
    const field = document.getElementById(id);
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) validateField(field);
    });
    field.addEventListener("blur", () => validateField(field));
  });
  const favoriteButton = document.getElementById("add-favorites");
  favoriteButton.addEventListener("click", () => {
    const selected = getFavorites().map(id => bakeryProducts.find(p => p.id === id).name);
    const notes = document.getElementById("items");
    const feedback = document.getElementById("favorite-import-status");
    if (!selected.length) {
      feedback.textContent = "You have no saved items. Visit the Products page to save a favorite.";
      return;
    }
    const line = `Interested in: ${selected.join(", ")}.`;
    if (!notes.value.includes(line)) notes.value = `${notes.value.trim()}${notes.value.trim() ? "\n" : ""}${line}`;
    typeField.value = "preorder";
    saveStored(storageKeys.requestType, "preorder");
    validateField(typeField);
    if (notes.hasAttribute("aria-invalid")) validateField(notes);
    feedback.textContent = "Your saved items were added to the request details.";
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    let firstInvalid = null;
    validationFields.forEach(id => {
      const field = document.getElementById(id);
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    const result = document.getElementById("form-result");
    if (firstInvalid) {
      result.hidden = true;
      firstInvalid.focus();
      return;
    }
    result.hidden = false;
    result.textContent = "The form passed its checks. This is a class website preview, so your request has not been sent to the bakery.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupFavorites();
  setupContactForm();
});
