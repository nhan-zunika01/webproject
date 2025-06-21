// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Script to handle redirecting to the registration form
function handleRegisterRedirect(event) {
  event.preventDefault();
  // We use a flag in localStorage because we can't directly manipulate the DOM of the next page
  localStorage.setItem("showRegisterForm", "true");
  window.location.href = "login.html";
}

// Attach event to both register buttons (hero and nav)
const heroRegisterBtn = document.querySelector("a.btn-primary");
const navRegisterBtn = document.querySelector("a.btn-register");

if (heroRegisterBtn) {
  heroRegisterBtn.addEventListener("click", handleRegisterRedirect);
}
if (navRegisterBtn) {
  navRegisterBtn.addEventListener("click", handleRegisterRedirect);
}

// In login.html, you'll need a script to check for this flag.
// Add the following to your auth.js inside the DOMContentLoaded event listener.
/* if (localStorage.getItem('showRegisterForm') === 'true') {
    if (typeof toggleForms === 'function') {
        toggleForms();
    }
    localStorage.removeItem('showRegisterForm'); // Clean up the flag
}
*/
