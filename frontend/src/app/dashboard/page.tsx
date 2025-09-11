import QuickActions from '@/components/ui/QuickActions'
import ProtectedRoute from '@/components/layout/ProtectedRoute'


export default function HomePage() {

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ¡Bienvenido al Sistema de
              <br />
              Gestión de Arrendamientos!
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

            {/* Contenido principal */}
            <div className="lg:col-span-4">
              <div className="flex items-center justify-center min-h-[400px] lg:min-h-[500px]">
                <QuickActions />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}