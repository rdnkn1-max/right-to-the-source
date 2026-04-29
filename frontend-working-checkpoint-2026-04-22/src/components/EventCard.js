export default function EventCard({ title, date }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "10px"
    }}>
      <h3>{title}</h3>
      <p>{date}</p>
    </div>
  );
}