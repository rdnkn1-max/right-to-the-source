export default function Home() {
  const sellers = [
    { id: 1, name: "RDNKN Brand", location: "Orlando, FL" },
    { id: 2, name: "Country Crafts Co", location: "Nashville, TN" },
    { id: 3, name: "Farm Fresh Goods", location: "Austin, TX" },
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🔥 The Source</h1>
      <p>Find local brands near you</p>

      {sellers.map((seller) => (
        <div key={seller.id} style={{
          border: "1px solid #ddd",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "10px"
        }}>
          <h3>{seller.name}</h3>
          <p>{seller.location}</p>
        </div>
      ))}
    </div>
  );
}