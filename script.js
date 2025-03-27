let port;
let writer;
// Function to connect to Arduino
document.getElementById('connectBtn').addEventListener('click', connectToArduino());
async function connectToArduino() {
    try {
        port = await navigator.serial.requestPort(); // Request access to serial port
        await port.open({ baudRate: 9600 }); // Match Arduino baud rate
        writer = port.writable.getWriter();
        console.log('Connected to Arduino');
    } catch (error) {
        console.error('Error connecting to Arduino:', error);
    }
}
// Function to send data to Arduino
async function sendData(data) {
    if (writer) {
        await writer.write(new TextEncoder().encode(data));
        console.log('Sent:', data);
    } else {
        console.error('Not connected to Arduino!');
    }
}
// Button listeners
document.getElementById('connectBtn').addEventListener('click', connectToArduino());



// // // API endpoints (adjust these if your backend uses different ports)
const apiUrl = "http://localhost:3000";    // REST API base URL
const socketUrl = "http://localhost:5000";   // Socket.io server URL
let moistureChart = null;
const socket = io("http://localhost:5000");


// Function: Initialize application when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  initChartFromHistory();
  getMoistureData();
  setInterval(getMoistureData, 10000); // Poll every 10 seconds

  // Connect to Socket.io for real-time updates
  const socket = io(socketUrl);
  socket.on("moistureData", (moistureValue) => {
    console.log("Real-time moistureData:", moistureValue);
    document.getElementById("moisture").textContent = moistureValue;

    const pumpStatus = (moistureValue > 600) ? "ON" : "OFF";
    document.getElementById("pump-status").textContent = pumpStatus;
    document.getElementById("pump-status").style.color = (moistureValue > 600) ? "green" : "red";

    updateChartData(moistureValue);
  });
});



// Function: Fetch historical moisture data and initialize the chart
async function initChartFromHistory() {
  try {
    const response = await fetch(`${apiUrl}/history`);
    const history = await response.json();
    if (!Array.isArray(history) || history.length === 0) {
      console.warn("No moisture history found. Initializing empty chart...");
      createEmptyChart();
      return;
    }
    // Reverse order so oldest data appears first
    const labels = history.map(entry => new Date(entry.timestamp).toLocaleTimeString()).reverse();
    const values = history.map(entry => entry.moistureLevel).reverse();
    createChart(labels, values);
  } catch (error) {
    console.error("Error fetching history:", error);
    createEmptyChart();
  }
}

// Function: Create the Chart.js chart
function createChart(labels, data) {
  const ctx = document.getElementById("moistureChart").getContext("2d");
  moistureChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Moisture Level (%)",
        data: data,
        borderColor: "green",
        borderWidth: 1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 1023 } // Change max if needed
      }
    }
  });
}

// Function: Create an empty chart if no history is available
function createEmptyChart() {
  createChart([], []);
}

// Function: Update the chart with a new data point (for real-time updates)
function updateChartData(newMoisture) {
  if (!moistureChart) return;
  const now = new Date().toLocaleTimeString();
  moistureChart.data.labels.push(now);
  moistureChart.data.datasets[0].data.push(newMoisture);
  // Optionally limit the data points to the last 20 entries
  if (moistureChart.data.labels.length > 20) {
    moistureChart.data.labels.shift();
    moistureChart.data.datasets[0].data.shift();
  }
  moistureChart.update();
}

// Function: Fetch the current moisture data from the backend
async function getMoistureData() {
  try {
    const response = await fetch(`${apiUrl}/moisture`);
    const data = await response.json();
    document.getElementById("moisture").textContent = data.moistureLevel;
    document.getElementById("pump-status").textContent = data.pumpStatus;
  } catch (error) {
    console.error("Error fetching moisture data:", error);
  }
}

async function disconnectArduino() {
  if (port) {
      await writer.close();
      await port.close();
      port = null;
      document.getElementById('status').textContent = "Status: Disconnected";
      console.log('🔌 Disconnected from Arduino');
  }
}
//experiment

document.addEventListener("DOMContentLoaded", function () {
  const disconnectSerial = document.getElementById("control");

  if (disconnectSerial) {
      disconnectSerial.addEventListener("click", function (event) {
        window.location.href = "index3.html"; // Manually navigate
          // Prevent page reload

          fetch("http://localhost:5000/disconnect-serial", { // Adjust URL if needed
              method: "POST",
          })
          .then(response => response.json())
          .then(data => {
              console.log(data.message);
              alert(data.message);
          })
          .catch(error => console.error("❌ Error disconnecting serial port:", error));
      });
  } else {
      console.error("❌ Error: Element with ID 'disconnectSerial' not found.");
  }
});
//
document.getElementById("reconnectSerial").addEventListener("click", function () {
  fetch("http://localhost:5000/reconnect-serial", { method: "POST" })
      .then(response => response.json())
      .then(data => alert(data.message))
      .catch(error => console.error("❌ Error reconnecting serial port:", error));
});
document.getElementById("control").addEventListener("click", function(event) {
  // event.preventDefault();  // Remove this if it blocks navigation
  window.location.href = "index3.html"; // Manually navigate
});

