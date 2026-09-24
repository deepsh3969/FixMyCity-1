import {
  Camera,
  Car,
  Cpu,
  Database,
  GitMerge,
  MapPin,
  QrCode,
  Recycle,
  Shield,
  Signal,
  Wifi,
  WifiOff,
  Globe,
  Bell,
  Layers,
  ArrowRight,
  Construction,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, Badge } from '../components/UI'
import BrandLogo from '../components/BrandLogo'

const PIPELINE = [
  { icon: Car, label: 'Dashcam', sub: 'Vehicle captures road footage' },
  { icon: Camera, label: 'Video Frame', sub: 'Extract analysis frames' },
  { icon: Cpu, label: 'AI Detection', sub: 'CV model finds defects' },
  { icon: MapPin, label: 'GPS + Timestamp', sub: 'Geotag every detection' },
  { icon: Database, label: 'Pothole Event', sub: 'Create structured record' },
  { icon: GitMerge, label: 'Duplicate Check', sub: 'Cluster nearby detections' },
  { icon: Layers, label: 'Municipal GIS', sub: 'Plot on command map' },
  { icon: Construction, label: 'Maintenance', sub: 'Feed repair workflow' }
]

const EVENT_SCHEMA = [
  { field: 'eventId', example: 'EVT-2026-004821' },
  { field: 'timestamp', example: '2026-09-24T10:42:18Z' },
  { field: 'latitude', example: '19.21837' },
  { field: 'longitude', example: '72.97812' },
  { field: 'confidence', example: '0.91' },
  { field: 'severity', example: 'HIGH' },
  { field: 'defectType', example: 'Pothole' },
  { field: 'frameUrl', example: '/frames/evt-004821.jpg' },
  { field: 'roadSegment', example: 'NH-48 / EEH-Thane' },
  { field: 'source', example: 'DASHCAM' }
]

const CAPABILITIES = [
  {
    icon: Cpu,
    title: 'Frame-level Detection',
    body: 'A specialized computer-vision model (e.g. YLO-style detector via Python/OpenCV) scans high-frequency frames. Gemini handles higher-level image understanding, classification and evidence explanation — not continuous frame detection.',
    tag: 'Architecture ready'
  },
  {
    icon: GitMerge,
    title: 'Road Defect Clustering',
    body: 'Nearby detections from multiple vehicles (X, X+4m, X+7m) cluster into a single ROAD DEFECT CLUSTER — stronger evidence, no duplicate complaints.',
    tag: 'Architecture ready'
  },
  {
    icon: Layers,
    title: 'Condition Heatmap',
    body: 'Accumulated detections become road-condition heat zones (LOW → CRITICAL) for predictive maintenance prioritization.',
    tag: 'Architecture ready'
  },
  {
    icon: Recycle,
    title: 'Multi-source Merging',
    body: 'Citizen reports, dashcam detections and municipal inspections merge into one unified civic infrastructure record.',
    tag: 'Architecture ready'
  },
  {
    icon: Shield,
    title: 'Privacy-preserving',
    body: 'Future pipeline will auto-blur identifiable faces and license plates before storing or displaying frames. Privacy-preserving image processing is a hard requirement.',
    tag: 'Roadmap'
  },
  {
    icon: Eye,
    title: 'Recurring Defect Detection',
    body: 'When the same location reappears after repair, the system flags RECURRING ROAD DEFECT — surfacing poor repair quality, drainage issues or traffic stress (cause claimed only when evidence supports it).',
    tag: 'Roadmap'
  }
]

const ROADMAP_STAGES = [
  { stage: 'TODAY', desc: 'Citizen reports potholes using a smartphone.', live: true },
  { stage: 'FUTURE', desc: 'Vehicles become mobile road sensors.', live: false }
]

export default function DashcamRoadmap() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <BrandLogo variant="md" className="mt-1" />
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">AI Road Monitoring</h1>
              <Badge variant="warning">Coming Soon</Badge>
            </div>
            <p className="text-slate-500 text-sm max-w-2xl">
              Future: vehicles become mobile road-condition sensors — automatically detecting potholes
              and feeding them into the municipal infrastructure system.
            </p>
          </div>
        </div>
      </div>

      {/* Positioning */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-slate-200 md:col-span-1">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Problem</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                The problem isn&apos;t reporting potholes. The problem is <strong>proving they were fixed</strong>.
              </p>
            </div>
            <div className="h-px bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Solution</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                FixMyCity connects reporting, repair, AI verification and municipal accountability.
              </p>
            </div>
            <div className="h-px bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Core Innovation</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                We verify the <strong>location</strong>, not just the repair.
              </p>
            </div>
            <div className="h-px bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Future</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                With AI-enabled dashcams, every vehicle can become a road-condition sensor.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 md:col-span-2">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Conceptual Pipeline</h3>
              <Badge variant="warning">Conceptual — Not Implemented</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PIPELINE.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.label} className="relative">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 h-full">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-2.5">
                        <Icon className="w-5 h-5 text-cyan-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mb-0.5">{step.label}</p>
                      <p className="text-[11px] text-slate-500 leading-snug">{step.sub}</p>
                    </div>
                    {i < PIPELINE.length - 1 && i % 4 !== 3 && (
                      <ArrowRight className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Today</p>
                </div>
                <p className="text-sm text-slate-700">Citizen reports potholes using a smartphone.</p>
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Signal className="w-4 h-4 text-cyan-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">Future</p>
                </div>
                <p className="text-sm text-slate-700">Vehicles become mobile road sensors — continuously monitored roads.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 italic">
              From citizen-reported potholes to continuously monitored roads. Every vehicle can become a road-condition sensor.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event schema */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Detection Event Schema</h3>
            <Badge variant="warning">Design Only</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">Each future dashcam detection would produce a record like this:</p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {EVENT_SCHEMA.map((f) => (
              <div key={f.field} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-mono font-bold text-cyan-600 uppercase">{f.field}</p>
                <p className="text-xs text-slate-600 font-mono truncate" title={f.example}>{f.example}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Planned Capabilities</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon
            return (
              <Card key={cap.title} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-600" />
                    </div>
                    <Badge variant={cap.tag === 'Roadmap' ? 'warning' : 'primary'}>{cap.tag}</Badge>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1.5">{cap.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{cap.body}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Supporting roadmap cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <WifiOff className="w-4 h-4 text-slate-500" />
              <h4 className="font-semibold text-sm text-slate-900">Offline / Mobile Reporting</h4>
              <Badge variant="warning">Coming Soon</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capture → store locally → queue with GPS → auto-sync when online. Architecture prepared;
              no fake offline functionality is presented as working today.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-slate-500" />
              <h4 className="font-semibold text-sm text-slate-900">QR Verification</h4>
              <Badge variant="warning">Coming Soon</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Each resolved complaint gets a QR code → scan for complaint details, before/after images,
              verification result, location and resolution status. Transparent public verification.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-slate-500" />
              <h4 className="font-semibold text-sm text-slate-900">Multilingual Support</h4>
              <Badge variant="primary">Architecture Ready</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Translation structure prepared for English · Hindi · Marathi. Strings are not hardcoded
              throughout components — languages can be added without rewrites.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications architecture */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-slate-900">Notification Architecture</h3>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid sm:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wide text-blue-600 mb-2">Citizen</p>
            <ul className="space-y-1 text-slate-600">
              <li>Complaint received</li>
              <li>Complaint assigned</li>
              <li>Repair started</li>
              <li>Evidence uploaded</li>
              <li>Repair verified</li>
              <li>Repair rejected</li>
            </ul>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-amber-600 mb-2">Contractor</p>
            <ul className="space-y-1 text-slate-600">
              <li>New assignment</li>
              <li>Deadline reminder</li>
              <li>Evidence accepted</li>
              <li>Evidence rejected</li>
              <li>Manual review required</li>
            </ul>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-purple-600 mb-2">Municipality</p>
            <ul className="space-y-1 text-slate-600">
              <li>New complaint</li>
              <li>High severity pothole</li>
              <li>Verification mismatch</li>
              <li>Repeated pothole</li>
              <li>Large hotspot</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400 pb-4">
        This page describes future architecture and roadmap. Dashcam detection is not yet live —
        no simulated detections are presented as real.
      </p>
    </div>
  )
}
