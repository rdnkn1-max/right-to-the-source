import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/home">Home</Link> |{" "}
      <Link to="/explore">Explore</Link> |{" "}
      <Link to="/map">Map</Link> |{" "}
      <Link to="/events">Events</Link> |{" "}
      <Link to="/seller">Seller Profile</Link> |{" "}
      <Link to="/profile">Profile</Link>
    </nav>
  );
}
