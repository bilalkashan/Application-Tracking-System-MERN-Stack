import socket from "./socket";

export function initSocketListener() {
  try {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user?._id) {
      socket.emit("register", user._id);
      console.debug("socketListener: registered user", user._id);
    }

    socket.on("newNotification", (notif) => {
      window.dispatchEvent(
        new CustomEvent("app:newNotification", { detail: notif })
      );
    });

    socket.on("newMessage", (data) => {
      window.dispatchEvent(new CustomEvent("app:newMessage", { detail: data }));
    });

    socket.on("connect", () => {
      console.debug("socketListener: connected", socket.id);
    });
    const onAuthChange = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          socket.auth = { token };
          if (!socket.connected) socket.connect();
          else {
            socket.disconnect();
            socket.connect();
          }
        }
      } catch (e) {
        console.warn("socketListener auth change error", e);
      }
    };
    window.addEventListener("auth:tokenChanged", onAuthChange);
  } catch (e) {
    console.warn("socketListener init error:", e.message || e);
  }
}

initSocketListener();

export default socket;
