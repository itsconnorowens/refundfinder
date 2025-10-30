export default function NotFound() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>Go Home</a>
    </div>
  );
}
