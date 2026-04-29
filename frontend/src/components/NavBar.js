import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', borderBottom: '1px solid #ddd' }}>
      <Link to="/">Home</Link>
      <Link to="/map">Map</Link>
    </div>
  );
}