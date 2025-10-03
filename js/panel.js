document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo()
})

async function loadUserInfo() {
  try {
    // First try to get user info from localStorage (saved during login)
    const storedUserInfo = localStorage.getItem("userInfo")

    if (storedUserInfo) {
      const userData = JSON.parse(storedUserInfo)

      // Update user name display
      const userNameElement = document.getElementById("userName")
      const userRoleElement = document.getElementById("userRole")
      const welcomeMessageElement = document.getElementById("welcomeMessage")

      if (userNameElement) {
        userNameElement.textContent = `${userData.nombres}`
      }

      if (userRoleElement) {
        userRoleElement.textContent = `${userData.rol}`
      }

      if (welcomeMessageElement) {
        welcomeMessageElement.textContent = `Bienvenido ${userData.nombres}`
      }

      console.log("[v0] Usuario cargado desde localStorage:", userData)
      return
    }

    // Fallback: if no localStorage data, redirect to login
    console.log("[v0] No hay información de usuario en localStorage, redirigiendo al login")
    window.location.href = "index.html"
  } catch (error) {
    console.error("[v0] Error al cargar información del usuario:", error)
    document.getElementById("userName").textContent = "Error al cargar"
    // Redirect to login on error
    setTimeout(() => {
      window.location.href = "index.html"
    }, 2000)
  }
}

async function logout() {
  try {
    localStorage.removeItem("userInfo")

    const response = await fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (result.success) {
      console.log("[v0] Sesión cerrada exitosamente")
      // Redirect to index page
      window.location.href = "index.html#login";  
    } else {
      console.error("[v0] Error al cerrar sesión:", result.message)
      // Even if server logout fails, redirect to login since localStorage is cleared
      window.location.href = "index.html"
    }
  } catch (error) {
    console.error("[v0] Error en logout:", error)
    // Even if server request fails, redirect to login since localStorage is cleared
    window.location.href = "index.html"
  }
}
