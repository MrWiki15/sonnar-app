// public/service-worker.js
self.addEventListener("push", (event) => {
  let data;

  // Verificar si el mensaje es JSON
  if (event.data) {
    try {
      data = event.data.json(); // Parsear el mensaje como JSON
    } catch (error) {
      console.error("Error parsing push message:", error);
      data = {
        title: "Mensaje no válido",
        body: "El mensaje recibido no está en formato JSON.",
      };
    }
  } else {
    data = {
      title: "Notificación",
      body: "¡Hay un nuevo evento en la plataforma!",
    };
  }

  const title = data.title || "Nuevo evento creado";
  const options = {
    body: data.body || "¡Hay un nuevo evento en la plataforma!",
    icon: "/public/sonar.gif", // Icono de la notificación
    badge: "/public/sonar.gif", // Icono pequeño de la notificación
    data: {
      url: data.url || "https://localhost:8081/buscar", // URL a la que se redirigirá al hacer clic
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Manejar clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Cerrar la notificación

  // Abrir la URL especificada en la notificación
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url) // Abrir la URL en una nueva pestaña
    );
  }
});
