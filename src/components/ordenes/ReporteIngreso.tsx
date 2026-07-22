import type { OrdenFull } from '../../types'
import { Printer, X } from 'lucide-react'

interface ReporteIngresoProps {
  orden: OrdenFull
  onClose: () => void
}

export function ReporteIngreso({ orden, onClose }: ReporteIngresoProps) {
  const handlePrint = () => {
    window.print()
  }

  const { vehiculos, checklist_ingreso, order_number, fecha_ingreso } = orden
  const cliente = vehiculos?.clientes

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:static print:block">
      {/* Botones (No imprimibles) */}
      <div className="absolute top-4 right-4 flex gap-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Imprimir Reporte
        </button>
        <button 
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Documento Imprimible */}
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 print:shadow-none print:w-full print:max-w-full print:h-auto print:overflow-visible print:p-0">
        
        {/* Encabezado */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Reporte de Ingreso</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Orden de Servicio #{order_number}</p>
          </div>
          <div className="text-right text-sm font-medium text-slate-600">
            <p>Fecha de Ingreso:</p>
            <p className="font-bold">{new Date(fecha_ingreso).toLocaleString()}</p>
          </div>
        </div>

        {/* Datos Cliente y Vehículo */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Datos del Cliente</h3>
            <p className="font-bold text-slate-800">{cliente?.nombre}</p>
            <p className="text-slate-600 text-sm">{cliente?.telefono}</p>
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Datos del Vehículo</h3>
            <p className="font-bold text-slate-800">{vehiculos?.marca} {vehiculos?.modelo} <span className="text-slate-500 text-sm">({vehiculos?.anio})</span></p>
            <p className="text-slate-600 text-sm">Placa: <span className="font-bold uppercase">{vehiculos?.placa}</span></p>
            {vehiculos?.color && <p className="text-slate-600 text-sm">Color: {vehiculos.color}</p>}
          </div>
        </div>

        {/* Checklist */}
        <div className="mb-8">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Inspección Inicial</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Kilometraje</p>
              <p className="font-black text-slate-800 text-lg">{checklist_ingreso?.kilometraje ? `${checklist_ingreso.kilometraje} km` : 'No registrado'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Nivel de Gasolina</p>
              <p className="font-black text-slate-800 text-lg uppercase">{checklist_ingreso?.nivel_gasolina || 'No registrado'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
            {Object.entries(checklist_ingreso?.elementos || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center border-b border-slate-100 pb-1">
                <span className="capitalize text-slate-700">{key.replace('_', ' ')}</span>
                <span className={`font-bold ${value ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {value ? 'SI' : 'NO'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        {checklist_ingreso?.notas_danos && (
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Daños Previos / Observaciones</h3>
            <p className="text-slate-700 text-sm leading-relaxed p-4 bg-amber-50 border border-amber-200 rounded-xl">
              {checklist_ingreso.notas_danos}
            </p>
          </div>
        )}

        {/* Fotos */}
        {checklist_ingreso?.fotos && checklist_ingreso.fotos.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Evidencia Fotográfica</h3>
            <div className="grid grid-cols-2 gap-4">
              {checklist_ingreso.fotos.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100">
                  <img src={url} alt={`Evidencia ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Firmas */}
        <div className="mt-16 pt-8 border-t-2 border-slate-800 flex justify-between px-12">
          <div className="text-center w-48">
            <div className="border-t border-slate-400 pt-2 text-xs font-bold text-slate-600 uppercase">
              Firma Taller
            </div>
          </div>
          <div className="text-center w-48">
            <div className="border-t border-slate-400 pt-2 text-xs font-bold text-slate-600 uppercase">
              Firma Cliente
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 text-center mt-8">
          Al firmar este documento, el cliente acepta el estado del vehículo detallado en el presente reporte de ingreso.
        </p>

      </div>
    </div>
  )
}
