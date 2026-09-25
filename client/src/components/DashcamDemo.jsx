import { useEffect, useRef, useState } from 'react'
import { Upload, Film, AlertTriangle, RefreshCw, Cpu, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, Badge, Button, Spinner } from '../components/UI'
import api from '../utils/api'

export default function DashcamDemo() {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [svc, setSvc] = useState(undefined)

  useEffect(() => {
    let alive = true
    api.get('/ai/dashcam/status', { timeout: 8000 })
      .then(({ data }) => { if (alive) setSvc(data) })
      .catch((err) => {
        if (alive) setSvc({ unavailable: true, error: err.response?.data?.error || 'Service unavailable' })
      })
    return () => { alive = false }
  }, [])

  const run = async () => {
    if (!file) return
    setStatus('processing')
    setError(null)
    setResult(null)
    const fd = new FormData()
    fd.append('video', file)
    fd.append('includeAnnotated', '1')
    try {
      const { data } = await api.post('/ai/dashcam/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
      })
      setResult(data)
      setStatus('done')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Processing failed.')
      setStatus('error')
    }
  }

  const stat = (label, value, tone = 'text-[var(--text-primary)]') => (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-2)] p-4">
      <p className="tech-label text-[var(--accent-cyan)] mb-1.5">{label}</p>
      <p className={`mono-num text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h3 className="panel-title text-[var(--accent-cyan)]">Dashcam Demo — Video Analysis</h3>
          </div>
          <Badge variant="warning">DEMO VIDEO</Badge>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          Upload a recorded road video. Frames are actually processed by the local AI service —
          every number below is measured from your video, never simulated.
        </p>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {svc?.unavailable && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)]">
            <AlertTriangle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Demo service unavailable</p>
              <p className="text-[var(--text-secondary)]">{svc.error}</p>
            </div>
          </div>
        )}

        {svc && !svc.unavailable && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-2)] text-[var(--text-secondary)]">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              Detector: {svc.yoloAvailable ? 'heuristic-cv + YOLO context' : 'heuristic-cv (classical CV)'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-2)] text-[var(--text-secondary)]">
              {svc.yoloPotholeTrained ? 'Pothole model: trained' : 'Pothole model: not trained (COCO weights not used as pothole detector)'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-2)] text-[var(--text-secondary)]">
              Max {svc.maxUploadMb} MB · {svc.maxDurationS}s
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,.mp4,.mov,.avi,.mkv,.webm"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setStatus('idle')
              setResult(null)
              setError(null)
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="flex-1 justify-center"
          >
            <Upload className="w-4 h-4" />
            {file ? file.name : 'Upload dashcam video'}
          </Button>
          <Button
            onClick={run}
            disabled={!file || status === 'processing'}
            className="justify-center"
          >
            {status === 'processing' ? <Spinner size="sm" /> : <Film className="w-4 h-4" />}
            {status === 'processing' ? 'Processing…' : 'Analyze video'}
          </Button>
        </div>

        {status === 'processing' && (
          <div className="rounded-xl border border-[rgba(34,211,238,0.3)] bg-[var(--accent-cyan-dim)] p-4 flex items-center gap-3">
            <Spinner size="sm" />
            <div className="text-sm">
              <p className="font-semibold text-[var(--accent-cyan)]">PROCESSING VIDEO…</p>
              <p className="text-[var(--text-secondary)] text-xs">Extracting frames and running detection on real footage.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(245,158,11,0.35)] bg-[var(--accent-amber-dim)]">
            <AlertTriangle className="w-5 h-5 text-[var(--accent-amber)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Analysis failed</p>
              <p className="text-[var(--text-secondary)]">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={run}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}

        {status === 'done' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pill pill-verified uppercase">DEMO VIDEO · ANALYZED</span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {result.video?.width}×{result.video?.height} · {result.video?.fps} fps · {result.video?.durationS}s
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stat('Frames Processed', result.framesProcessed)}
              {stat(
                'Potholes Detected',
                result.potholesDetected,
                result.potholesDetected > 0 ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'
              )}
              {stat(
                'Average Confidence',
                result.averageConfidence === null ? '—' : result.averageConfidence.toFixed(3),
                result.averageConfidence === null ? 'text-[var(--text-muted)]' : 'text-[var(--accent-cyan)]'
              )}
              {stat(
                'Road Defect Clusters',
                result.roadDefectClusters,
                result.roadDefectClusters > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-2)] text-xs text-[var(--text-secondary)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" />
              <span>
                {result.detector?.note} · Confidence method: {result.confidenceMethod} ·
                Processed in {result.processingTimeMs}ms
                {result.detectionsTruncated ? ' · Detection list truncated to first 50' : ''}
                {result.annotatedVideoUrl && (
                  <>
                    {' · '}
                    <a
                      className="text-[var(--accent-cyan)] underline underline-offset-2"
                      href={`/api/ai${result.annotatedVideoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open annotated video
                    </a>
                  </>
                )}
              </span>
            </div>

            {result.detections?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <th className="py-2 pr-3 font-medium">Frame</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Confidence</th>
                      <th className="py-2 pr-3 font-medium">Region (x,y,w,h)</th>
                      <th className="py-2 font-medium">Center</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.detections.slice(0, 12).map((d, i) => (
                      <tr key={i} className="border-b border-[var(--border-subtle)]/60">
                        <td className="py-2 pr-3 font-mono">{d.frame}</td>
                        <td className="py-2 pr-3">{d.type}</td>
                        <td className="py-2 pr-3 font-mono text-[var(--accent-cyan)]">{d.confidence.toFixed(3)}</td>
                        <td className="py-2 pr-3 font-mono">{d.bbox.join(', ')}</td>
                        <td className="py-2 font-mono">{d.center.map((v) => v.toFixed(3)).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.detections.length > 12 && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    Showing 12 of {result.detections.length} detections.
                  </p>
                )}
              </div>
            )}

            {result.potholesDetected === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic">
                No pothole regions met the detector&apos;s thresholds in this video — reported honestly as zero.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
