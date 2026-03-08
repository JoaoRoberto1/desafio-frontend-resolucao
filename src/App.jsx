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
const API_ENDPOINT = `${API_BASE}/api/recognize-plate`

function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [emailCopied, setEmailCopied] = useState(false)

  const EMAIL = 'joao.robertodof@gmail.com'

  const handleEmailClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    } catch {
      // Fallback se clipboard não estiver disponível
    }
  }, [])

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
      formData.append('file', file)

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        let message = `Erro do servidor (${res.status}).`
        try {
          const errData = JSON.parse(text)
          message = errData.detail || errData.message || message
        } catch {
          if (text) message = text
        }
        throw new Error(message)
      }

      const data = await res.json()
      // Backend retorna { status, mensagem, dados: [{ placa, confianca }, ...] }
      const dados = data.dados ?? []
      const primeiro = dados[0]
      const plate = primeiro?.placa ?? 'Nenhuma placa detectada'
      const confidencePercent = primeiro ? Math.round(Number(primeiro.confianca) || 0) : 0

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
        <p className="footer-credit">Desenvolvido por João Roberto</p>
        <div className="footer-icons" aria-label="Links de contato">
          <a
            href="https://www.linkedin.com/in/joão-roberto-de-oliveira-felix-780471296"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="footer-icon"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="https://wa.me/5585991984682?text=Olá%2C%20vim%20pelo%20seu%20portfolio!"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="footer-icon"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            onClick={handleEmailClick}
            aria-label="Copiar e-mail"
            className="footer-icon"
            title={emailCopied ? 'E-mail copiado!' : 'Copiar e-mail'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            {emailCopied && <span className="footer-email-feedback">E-mail copiado!</span>}
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
