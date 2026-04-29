export default function ProductCard({ name, price }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "10px"
    }}>
      <h3>{name}</h3>
      <p>{price}</p>
    </div>
  );
}
