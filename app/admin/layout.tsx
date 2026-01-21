import { Providers } from '@/lib/session'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}
