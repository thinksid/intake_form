import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardView from '@/components/admin/DashboardView'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const questionnaires = await prisma.questionnaires.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      questions: {
        orderBy: { display_order: 'asc' },
      },
      _count: {
        select: { responses: true },
      },
    },
  })

  return <DashboardView questionnaires={questionnaires} />
}
