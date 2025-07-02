import React, { useEffect, useState } from "react";

interface Mesure {
  date: string;
  epd: number;
  epg: number;
  epTotal: number;
}

const ResultsPage = () => {
  const [mesures, setMesures] = useState<Mesure[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("mesures");
    if (data) {
      setMesures(JSON.parse(data));
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Mesures enregistrées</h1>
      {mesures.length === 0 ? (
        <p style={styles.text}>Aucune mesure enregistrée.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>EPD (mm)</th>
              <th>EPG (mm)</th>
              <th>EP Total (mm)</th>
            </tr>
          </thead>
          <tbody>
            {mesures.map((m, i) => (
              <tr key={i}>
                <td>{m.date}</td>
                <td>{m.epd}</td>
                <td>{m.epg}</td>
                <td>{m.epTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    minHeight: "100vh",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
  },
  th: {
    border: "1px solid #ccc",
    padding: 10,
    backgroundColor: "#eee",
  },
  td: {
    border: "1px solid #ccc",
    padding: 10,
  },
};

export default ResultsPage;
