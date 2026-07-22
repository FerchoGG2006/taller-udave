import { useState } from 'react'
import { Wrench, Plus, Search, Edit2, Trash2, Clock } from 'lucide-react'
import { useServicios } from '../hooks/useServicios'
import type { ServicioItem } from '../hooks/useServicios'

export default function Servicios() {
  const { servicios, isLoading, addServicio, updateServicio, deleteServicio } = useServicios()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ServicioItem | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    precio: 0,
    tiempo_estimado_min: 60
  })

  const filteredServicios = servicios?.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.codigo && item.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenModal = (item?: ServicioItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        nombre: item.nombre,
        codigo: item.codigo || '',
        descripcion: item.descripcion || '',
        precio: item.precio,
        tiempo_estimado_min: item.tiempo_estimado_min || 0
      })
    } else {
      setEditingItem(null)
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        precio: 0,
        tiempo_estimado_min: 60
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await updateServicio.mutateAsync({ id: editingItem.id, ...formData })
      } else {
        await addServicio.mutateAsync(formData)
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error guardando servicio:', error)
      alert('Error guardando en el catálogo')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este servicio del catálogo?')) {
      await deleteServicio.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center">
            <Wrench className="w-8 h-8 mr-3 text-emerald-500" />
            Catálogo de Servicios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Administra la mano de obra, precios y tiempos estándar
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Servicio
        </button>
      </div>

      <div className="glass-panel p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Servicio</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Descripción</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Tiempo Est.</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Precio Base</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Cargando catálogo...</td>
                </tr>
              ) : filteredServicios?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No se encontraron servicios</td>
                </tr>
              ) : (
                filteredServicios?.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.nombre}</div>
                      {item.codigo && <div className="text-sm text-slate-500">{item.codigo}</div>}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.descripcion || '-'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 opacity-50" />
                        {item.tiempo_estimado_min ? `${item.tiempo_estimado_min} min` : '-'}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      ${item.precio.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingItem ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Servicio *</label>
                <input 
                  required
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.codigo}
                  onChange={e => setFormData({...formData, codigo: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                <textarea 
                  rows={2}
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Base *</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.precio}
                    onChange={e => setFormData({...formData, precio: parseFloat(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiempo (Minutos)</label>
                  <input 
                    type="number" 
                    value={formData.tiempo_estimado_min}
                    onChange={e => setFormData({...formData, tiempo_estimado_min: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addServicio.isPending || updateServicio.isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {addServicio.isPending || updateServicio.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
