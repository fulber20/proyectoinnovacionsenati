// js/adds.js
setTimeout(() => {
  const splash = document.getElementById("splash");
  const login = document.getElementById("login");

  splash.style.animation = "fadeIn 0.5s ease-out reverse";

  setTimeout(() => {
    splash.style.display = "none";
    login.style.display = "flex";
  }, 500);
}, 3000);

function showNotification(message, color = "#e74c3c") {
  const notif = document.getElementById("notification");
  const notifMsg = document.getElementById("notificationMessage");

  notifMsg.textContent = message;
  notif.style.background = color;
  notif.style.display = "block";

  setTimeout(() => (notif.style.opacity = "1"), 50);
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => (notif.style.display = "none"), 500);
  }, 3000);
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const button = e.target.querySelector("button");
  const originalText = button.textContent;
  const identifier = e.target.querySelector('input[type="text"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  if (!identifier.trim() || !password.trim()) {
    showNotification("Por favor, completa todos los campos.");
    return;
  }

  button.textContent = "Verificando...";
  button.style.background = "#95a5a6";
  button.disabled = true;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      let errorMessage = "Credenciales incorrectas";
      if (response.status === 400) {
        errorMessage = "Usuario o contraseña incorrectos";
      } else if (response.status === 401) {
        errorMessage = "Usuario inactivo o credenciales incorrectas";
      } else if (response.status >= 500) {
        errorMessage = "Error del servidor, intenta de nuevo más tarde";
      }

      button.textContent = "✗ Error";
      button.style.background = "#e74c3c";
      showNotification(errorMessage);

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        button.disabled = false;
      }, 800);
      return;
    }

    const result = await response.json();
     console.log("[v0] Rol del usuario:", result.user.rol);

  // 🔒 Validar estado y rol
  if (
    result.user.estado === "Activo" &&
    (result.user.rol === "Administrador" || result.user.rol === "Gerente")
  ) {
    localStorage.setItem("userInfo", JSON.stringify(result.user));
    console.log("[v0] userInfo guardado en localStorage:", result.user);

    button.textContent = "✓ Acceso Concedido";
    button.style.background = "#27ae60";
    showNotification("Inicio de sesión exitoso", "#27ae60");

    setTimeout(() => {
      window.location.href = "dashboard.html"; // Redirige al dashboard
    },1000);
    } else {
      button.textContent = "✗ Error";
      button.style.background = "#e74c3c";
      showNotification("Error: Credenciales incorrectas o usuario inactivo.");

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        button.disabled = false;
      }, 800);
    }
  } catch (err) {
    console.error("[v0] Error en login:", err);
    let networkError = "Error de conexión";
    if (err.message.includes("Failed to fetch")) {
      networkError = "No se pudo conectar al servidor (localhost:3000)";
    }

    button.textContent = "✗ Error";
    button.style.background = "#e74c3c";
    showNotification(networkError);

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      button.disabled = false;
    }, 500);
  }
});

function togglePassword() {
  const input = document.getElementById("password");
  const icon = document.getElementById("toggleIcon");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("focus", () => {
    input.parentElement.style.transform = "scale(1.02)";
  });
  input.addEventListener("blur", () => {
    input.parentElement.style.transform = "scale(1)";
  });
});