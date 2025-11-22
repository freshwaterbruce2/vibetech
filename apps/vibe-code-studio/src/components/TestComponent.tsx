const TestComponent = () => {
  return (
    <div style={{ 
      padding: '20px', 
      background: '#1e1e1e', 
      color: '#d4d4d4', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>🎉 DeepCode Editor Test</h1>
      <p>If you can see this, the React app is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}

export default TestComponent