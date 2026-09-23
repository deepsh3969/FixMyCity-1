import { useState } from 'react'
import { Badge, Card, CardContent, Button } from '../components/UI'
import { CheckCircle, XCircle, HelpCircle, RefreshCw, Zap } from 'lucide-react'

const demoCases = [
  {
    id: 'case-a',
    label: 'CASE A — Perfect Repair',
    description: 'Contractor uploaded high-quality before/after photos from same viewpoint. GPS matches within 2m. All landmarks visible. Clear pothole fill evidence.',
    result: {
      gps: 29,
      viewpoint: 19,
      landmark: 19,
      roadScene: 19,
      pothole: 10,
      totalScore: 96,
      decision: 'VERIFIED',
      confidence: 'HIGH',
      distanceMeters: 2,
      explanation: [
        'GPS coordinates match within 2 meters of original report',
        'Camera viewpoint nearly identical to before photo (98% match)',
        'All 3 reference landmarks (signboard, building corner, tree) clearly visible',
        'Road surface texture and markings match perfectly',
        'Pothole completely filled with proper compaction visible'
      ],
      fallbackMode: false
    },
    color: 'var(--accent-green)',
    icon: CheckCircle
  },
  {
    id: 'case-b',
    label: 'CASE B — Fraudulent Submission',
    description: 'Contractor uploaded stock photo from internet. GPS is 500m away. No landmarks match. Different road type. No pothole visible in after photo.',
    result: {
      gps: 3,
      viewpoint: 2,
      landmark: 1,
      roadScene: 3,
      pothole: 0,
      totalScore: 9,
      decision: 'REJECTED',
      confidence: 'HIGH',
      distanceMeters: 520,
      explanation: [
        'GPS location 520 meters from original report — different street entirely',
        'Viewpoint completely different (indoor photo vs outdoor street view)',
        'Zero landmarks match — no common reference points detected',
        'Road scene shows residential lane vs arterial road in original',
        'After photo shows no pothole repair — appears to be stock image'
      ],
      fallbackMode: false
    },
    color: 'var(--accent-red)',
    icon: XCircle
  },
  {
    id: 'case-c',
    label: 'CASE C — Ambiguous Evidence',
    description: 'Contractor uploaded photos from similar angle but 25m GPS drift. Two landmarks visible. Road matches. Pothole fill visible but lighting differs significantly.',
    result: {
      gps: 15,
      viewpoint: 12,
      landmark: 10,
      roadScene: 15,
      pothole: 6,
      totalScore: 58,
      decision: 'MANUAL_REVIEW',
      confidence: 'MEDIUM',
      distanceMeters: 25,
      explanation: [
        'GPS drift of 25 meters — acceptable but not ideal',
        'Viewpoint shifted ~15 degrees — likely different phone height',
        '2 of 3 landmarks visible — building corner and utility pole present',
        'Road surface and markings consistent with original location',
        'Pothole fill visible but shadows obscure compaction quality — recommend manual inspection'
      ],
      fallbackMode: false
    },
    color: 'var(--accent-amber)',
    icon: HelpCircle
  }
]

export default function JudgeDemoPanel({ onSelectCase, selectedCaseId, isExpanded = true }) {
  const [expanded, setExpanded] = useState(isExpanded)
  
  const handleCaseSelect = (caseId) => {
    onSelectCase?.(caseId)
  }

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-[var(--z-floating)]">
        <Button 
          onClick={() => setExpanded(true)} 
          className="shadow-xl animate-pulse-ring"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        >
          <Zap className="w-5 h-5 mr-2" />
          Judge Demo Controls
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-floating)] w-80 animate-slide-up">
      <Card className="shadow-xl border-[var(--border-subtle)] overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-cyan-dim)' }}>
                <Zap className="w-5 h-5 text-[var(--accent-cyan)]" />
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-primary)]">Judge Demo Controls</h4>
                <p className="text-xs text-[var(--text-muted)]">Simulate AI verification scenarios</p>
              </div>
            </div>
            <button 
              onClick={() => setExpanded(false)}
              className="p-1 rounded hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
              aria-label="Collapse"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {demoCases.map((caseItem) => {
              const isSelected = selectedCaseId === caseItem.id
              const ResultIcon = caseItem.icon
              return (
                <button
                  key={caseItem.id}
                  onClick={() => handleCaseSelect(caseItem.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isSelected 
                      ? `ring-2` 
                      : 'hover:bg-[var(--bg-card-hover)]'
                  }`}
                  style={{ 
                    borderColor: isSelected ? caseItem.color : 'transparent',
                    backgroundColor: isSelected ? `${caseItem.color}15` : 'transparent'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${caseItem.color}20` }}>
                      <ResultIcon className="w-5 h-5" style={{ color: caseItem.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-[var(--text-primary)]">{caseItem.label}</span>
                        {isSelected && (
                          <Badge variant="success" className="text-xs">ACTIVE</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{caseItem.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge 
                          variant={caseItem.result.decision === 'VERIFIED' ? 'success' : caseItem.result.decision === 'REJECTED' ? 'danger' : 'warning'}
                          className="text-xs"
                        >
                          {caseItem.result.decision}
                        </Badge>
                        <span className="text-xs font-mono text-[var(--accent-cyan)]">{caseItem.result.totalScore}/100</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
            <p className="text-xs text-[var(--text-muted)] text-center">
              Click a case to load simulated verification data into the Verification Panel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}