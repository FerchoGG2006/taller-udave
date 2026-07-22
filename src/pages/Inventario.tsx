import { useState } from 'react'
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { useInventario } from '../hooks/useInventario'
import type { InventarioItem } from '../hooks/useInventario'
import { cn } from '../lib/utils'

export default function Inventario() {
  const { inventario, isLoading, addInventario, updateInventario, deleteInventario } = useInventario()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    categoria: '',
    cantidad_stock: 0,
    stock_minimo: 2,
    precio_compra: 0,
    precio_venta: 0
  })

  const filteredInventario = inventario?.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.codigo && item.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenModal = (item?: InventarioItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        nombre: item.nombre,
        codigo: item.codigo || '',
        descripcion: item.descripcion || '',
        categoria: item.categoria || '',
        cantidad_stock: item.cantidad_stock,
        stock_minimo: item.stock_minimo,
        precio_compra: item.precio_compra,
        precio_venta: item.precio_venta
      })
    } else {
      setEditingItem(null)
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        categoria: '',
        cantidad_stock: 0,
        stock_minimo: 2,
        precio_compra: 0,
        precio_venta: 0
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await updateInventario.mutateAsync({ id: editingItem.id, ...formData })
      } else {
        await addInventario.mutateAsync(formData)
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error guardando item:', error)
      alert('Error guardando en inventario')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteInventario.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center">
            <Package className="w-8 h-8 mr-3 text-blue-500" />
            Inventario
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestiona tus repuestos, productos y alertas de stock
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

      <div className="glass-panel p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Producto</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Categoría</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Stock</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Precio Venta</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Cargando inventario...</td>
                </tr>
              ) : filteredInventario?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No se encontraron productos</td>
                </tr>
              ) : (
                filteredInventario?.map((item) => {
                  const isLowStock = item.cantidad_stock <= item.stock_minimo;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.nombre}</div>
                        {item.codigo && <div className="text-sm text-slate-500">{item.codigo}</div>}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {item.categoria || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold px-2 py-1 rounded-md text-sm",
                            isLowStock 
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}>
                            {item.cantidad_stock}
                          </span>
                          {isLowStock && <span title="Stock bajo"><AlertTriangle className="w-4 h-4 text-amber-500" /></span>}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                        ${item.precio_venta.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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
                  )
                })
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
                {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                <input 
                  required
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código / SKU</label>
                  <input 
                    type="text" 
                    value={formData.codigo}
                    onChange={e => setFormData({...formData, codigo: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <input 
                    type="text" 
                    value={formData.categoria}
                    onChange={e => setFormData({...formData, categoria: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad Stock</label>
                  <input 
                    required
                    type="number" 
                    value={formData.cantidad_stock}
                    onChange={e => setFormData({...formData, cantidad_stock: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Mínimo</label>
                  <input 
                    required
                    type="number" 
                    value={formData.stock_minimo}
                    onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Costo</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.precio_compra}
                    onChange={e => setFormData({...formData, precio_compra: parseFloat(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Venta *</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.precio_venta}
                    onChange={e => setFormData({...formData, precio_venta: parseFloat(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  disabled={addInventario.isPending || updateInventario.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {addInventario.isPending || updateInventario.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
