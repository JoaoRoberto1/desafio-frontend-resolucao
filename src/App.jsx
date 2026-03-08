import { useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_ENDPOINT = `${API_BASE}/api/read`

function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files?.[0]
    setError(null)
    setResult(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (!selected) {
      setFile(null)
      setPreviewUrl(null)
      return
    }
    if (!selected.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (JPG, PNG, etc.).')
      setFile(null)
      setPreviewUrl(null)
      return
    }
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }, [previewUrl])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (!dropped.type.startsWith('image/')) {
      setError('Arraste uma imagem (JPG, PNG, etc.).')
      return
    }
    setError(null)
    setResult(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(dropped)
    setPreviewUrl(URL.createObjectURL(dropped))
  }, [previewUrl])

  const handleDragOver = useCallback((e) => e.preventDefault(), [])

  const sendImage = useCallback(async () => {
    if (!file) {
      setError('Selecione ou arraste uma imagem primeiro.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('file', file)

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        let message = `Erro do servidor (${res.status}).`
        try {
          const data = JSON.parse(text)
          message = data.message || data.detail || message
        } catch {
          if (text) message = text
        }
        throw new Error(message)
      }

      const data = await res.json()
      const plate = data.plate ?? data.placa ?? data.result ?? '—'
      const rawConfidence = data.confidence ?? data.confianca ?? data.confidence_score ?? 0
      const confidencePercent = typeof rawConfidence === 'number' && rawConfidence <= 1
        ? Math.round(rawConfidence * 100)
        : Math.round(Number(rawConfidence) || 0)

      const newResult = {
        id: Date.now(),
        plate,
        confidence: confidencePercent,
        previewUrl,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }
      setResult(newResult)
      setHistory((prev) => [newResult, ...prev].slice(0, 20))
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Não foi possível conectar à API. Verifique se o servidor está ligado e a URL está correta.')
      } else {
        setError(err.message || 'Ocorreu um erro ao processar a imagem.')
      }
    } finally {
      setLoading(false)
    }
  }, [file, previewUrl])

  const chartData = history.map((h, i) => ({
    name: `#${history.length - i}`,
    confiança: h.confidence,
  })).reverse()

  const averageConfidence =
    history.length > 0
      ? Math.round(history.reduce((a, h) => a + h.confidence, 0) / history.length)
      : 0

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard – Leitura de Placas</h1>
        <p>Envie uma foto do veículo com a placa visível para obter a leitura e a confiança.</p>
      </header>

      <section className="upload-section" aria-label="Upload de imagem">
        <div
          className={`upload-zone ${previewUrl ? 'has-preview' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            id="file-input"
            accept="image/*"
            onChange={handleFileChange}
            className="upload-input"
            aria-label="Selecionar imagem do veículo"
          />
          {previewUrl ? (
            <div className="preview-wrap">
              <img src={previewUrl} alt="Preview do veículo" className="preview-image" />
              <span className="preview-label">Clique ou arraste outra imagem para trocar</span>
            </div>
          ) : (
            <label htmlFor="file-input" className="upload-label">
              <span className="upload-icon">📷</span>
              Clique para escolher ou arraste uma imagem aqui
            </label>
          )}
        </div>

        <button
          type="button"
          className="btn-send"
          onClick={sendImage}
          disabled={!file || loading}
          aria-busy={loading}
        >
          {loading ? 'Processando...' : 'Enviar para análise'}
        </button>
      </section>

      {loading && (
        <div className="loading-panel" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Loading... Aguarde o processamento da imagem.</p>
        </div>
      )}

      {error && (
        <div className="error-panel" role="alert">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {result && !loading && (
        <section className="result-panel" aria-label="Resultado da leitura">
          <h2>Resultado</h2>
          <div className="result-grid">
            <div className="result-preview">
              <img src={result.previewUrl} alt="Imagem enviada" />
            </div>
            <div className="result-data">
              <div className="result-item">
                <span className="result-label">Placa lida</span>
                <span className="result-value result-plate">{result.plate}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Confiança</span>
                <span className="result-value result-confidence">{result.confidence}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <>
          <section className="history-section" aria-label="Histórico da sessão">
            <h2>Histórico desta sessão</h2>
            <div className="table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Placa</th>
                    <th>Confiança</th>
                    <th>Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id}>
                      <td>{i + 1}</td>
                      <td className="plate-cell">{h.plate}</td>
                      <td>{h.confidence}%</td>
                      <td>{h.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="metrics-section" aria-label="Média de confiança">
            <h2>Média de confiança das últimas leituras</h2>
            <p className="average-value">Média: <strong>{averageConfidence}%</strong></p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickSuffix="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Confiança']} />
                  <Bar dataKey="confiança" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      <footer className="dashboard-footer">
        <p>Configure <code>VITE_API_URL</code> no <code>.env</code> se a API estiver em outro endereço.</p>
      </footer>
    </div>
  )
}

export default App
