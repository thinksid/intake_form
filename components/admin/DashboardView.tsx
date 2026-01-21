'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Copy,
  Edit,
  Eye,
  Trash2,
  LogOut,
  FileText,
  Clock,
  CheckCircle,
  Check
} from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: string
  is_required: boolean
  display_order: number
}

interface Questionnaire {
  id: string
  session_id: string
  title: string
  client_name: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  created_at: string | Date | null
  completed_at: string | Date | null
  questions: Question[]
  _count: { responses: number }
}

export default function DashboardView({ questionnaires }: { questionnaires: Questionnaire[] }) {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Not Started</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="warning"><FileText className="w-3 h-3 mr-1" /> In Progress</Badge>
      case 'COMPLETED':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const copyToClipboard = async (sessionId: string) => {
    const url = `${window.location.origin}/intake/${sessionId}`
    await navigator.clipboard.writeText(url)
    setCopiedId(sessionId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return

    try {
      const res = await fetch(`/api/admin/questionnaires/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-electric-lime/5">
      {/* Header */}
      <header className="bg-thinksid-navy sticky top-0 z-10 shadow-elevated">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="https://invnydvuebmoytslovdh.supabase.co/storage/v1/object/sign/site%20images/white.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2RiZDUxYS1mMGNjLTRiNDktOWFkYi00ZmIxOGY4Y2U1ZDIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzaXRlIGltYWdlcy93aGl0ZS5wbmciLCJpYXQiOjE3Njg5Njg4NDYsImV4cCI6MTgwMDUwNDg0Nn0.9PmzMlzKa-Oj_G7V5Hd5PBFHMwxfpi_mOhu4GzbdJj0"
              alt="Antigravity Logo"
              width={120}
              height={38}
              className="h-8 w-auto"
              priority
            />
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <h1 className="text-lg md:text-xl font-semibold font-heading text-white hidden sm:block">
              Admin Dashboard
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/40"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold font-heading text-thinksid-navy">
              Questionnaires
            </h2>
            <p className="text-slate-gray mt-1">
              {questionnaires.length} total questionnaire{questionnaires.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="cta"
            onClick={() => router.push('/admin/questionnaire/new')}
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New
          </Button>
        </div>

        {/* Empty State */}
        {questionnaires.length === 0 ? (
          <Card className="card-hover">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-thinksid-navy/5 flex items-center justify-center">
                <FileText className="w-8 h-8 text-thinksid-navy/40" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-thinksid-navy mb-2">
                No questionnaires yet
              </h3>
              <p className="text-slate-gray mb-6 max-w-sm mx-auto">
                Create your first questionnaire to start collecting responses from clients
              </p>
              <Button
                variant="cta"
                onClick={() => router.push('/admin/questionnaire/new')}
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Questionnaire
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Questionnaire List */
          <div className="grid gap-4">
            {questionnaires.map((q, index) => (
              <Card
                key={q.id}
                className="card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold font-heading text-lg text-thinksid-navy truncate">
                          {q.title}
                        </h3>
                        {getStatusBadge(q.status)}
                      </div>
                      <p className="text-slate-gray">
                        Client: <span className="font-medium text-thinksid-navy">{q.client_name}</span>
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-gray">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {q.questions.length} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {q._count.responses} responses
                        </span>
                        <span>Created {formatDate(q.created_at)}</span>
                        {q.completed_at && (
                          <span className="text-electric-lime-foreground">
                            Completed {formatDate(q.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(q.session_id)}
                        className="min-w-[100px]"
                      >
                        {copiedId === q.session_id ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-electric-lime" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/questionnaire/${q.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {q.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/questionnaire/${q.id}/responses`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Responses
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
