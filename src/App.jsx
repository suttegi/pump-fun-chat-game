import { useEffect, useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [userWordCounts, setUserWordCounts] = useState({}); // { user: totalWordCount }
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onopen = () => setConnectionStatus("connected");

    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const withTime = { ...msg, _ts: Date.now() };
        setMessages((prev) => [...prev.slice(-49), withTime]);

        const text = msg.text || msg.message || msg.content || msg.body || msg.data;
        const wordCount =
          typeof text === "string"
            ? text.trim().split(/\s+/).filter(Boolean).length
            : 0;

        const user = msg.user || "Anonymous";

        setUserWordCounts((prev) => ({
          ...prev,
          [user]: (prev[user] || 0) + wordCount,
        }));
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    wsRef.current.onerror = () => setConnectionStatus("error");
    wsRef.current.onclose = () => setConnectionStatus("disconnected");

    return () => wsRef.current && wsRef.current.close();
  }, []);

  // данные для диаграммы
  const labels = Object.keys(userWordCounts);
  const values = Object.values(userWordCounts);

  const data = {
    labels,
    datasets: [
      {
        label: "Количество слов",
        data: values,
        backgroundColor: labels.map(
          (_, i) => `hsl(${(i * 60) % 360}, 70%, 50%)`
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Word Battle — рейтинг игроков" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Word Battle Game</h1>
        <p>Кто напишет больше слов — тот победит!</p>
        <p className={`status ${connectionStatus}`}>Status: {connectionStatus}</p>
      </header>

      <div className="main">
        <div className="chart-card">
          <h2 className="section-title">Диаграмма слов по юзерам</h2>
          <div className="chart">
            <Bar data={data} options={options} />
          </div>
        </div>

        <div className="chat-card">
          <div className="chat-header">
            <h2>Live Chat</h2>
          </div>
          <div className="chat-body">
            {messages.map((msg, idx) => {
              const text =
                msg.text || msg.message || msg.content || msg.body || msg.data;
              return (
                <div key={idx} className="chat-message">
                  <div className="avatar">
                    {(msg.user || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="msg-content">
                    <p className="msg-user">{msg.user || "Anonymous"}</p>
                    <p className="msg-text">{text || JSON.stringify(msg)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
