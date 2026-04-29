import { useState } from 'react'

export default function UploadPage() {
  const [title, setTitle] = useState('')
  const [result, setResult] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setResult('Product created: ' + title)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Product</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Product name"
          style={{ padding: 10, marginBottom: 10 }}
        />

        <br />

        <button type="submit">Create</button>
      </form>

      {result && <p>{result}</p>}
    </div>
  )
}
