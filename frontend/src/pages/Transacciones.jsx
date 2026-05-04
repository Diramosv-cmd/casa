import { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusCircle, Receipt, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const Transacciones = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useContext(AuthContext);

  // State para edición
  const [editId, setEditId] = useState(null);

  // Filters
  const [usuarioFiltro, setUsuarioFiltro] = useState(currentUser?.id?.toString() || '');
  const [mesFiltro, setMesFiltro] = useState((new Date().getMonth() + 1).toString());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [tipo, setTipo] = useState('Compra');
  const [transaccion, setTransaccion] = useState('Debito');
  const [cuotas, setCuotas] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [monto, setMonto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState('');

  const meses = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];

  useEffect(() => {
    fetchData();
  }, [usuarioFiltro, mesFiltro]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (usuarioFiltro) params.append('usuario_id', usuarioFiltro);
      if (mesFiltro) {
        params.append('mes', mesFiltro);
        params.append('anio', new Date().getFullYear().toString());
      }

      const [resTx, resCat, resMarcas, resUsers] = await Promise.all([
        api.get(`/transacciones?${params.toString()}`),
        api.get('/categorias'),
        api.get('/marcas'),
        api.get('/users')
      ]);
      setTransacciones(resTx.data);
      setCategorias(resCat.data);
      setMarcas(resMarcas.data);
      setUsuarios(resUsers.data);
      setCurrentPage(1); // Reset page on filter change
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tipo,
        transaccion,
        cuotas: transaccion === 'Credito' ? parseInt(cuotas) : null,
        categoria_id: parseInt(categoriaId),
        marca_id: parseInt(marcaId),
        monto: parseFloat(monto),
        observaciones
      };

      if (fecha) {
        payload.fecha = new Date(fecha).toISOString();
      }

      if (editId) {
        await api.put(`/transacciones/${editId}`, payload);
      } else {
        await api.post('/transacciones', payload);
      }

      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ocurrió un error al guardar la transacción');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        await api.delete(`/transacciones/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Error al eliminar transacción');
      }
    }
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setTipo(t.tipo);
    setTransaccion(t.transaccion);
    setCuotas(t.cuotas || '');
    setCategoriaId(t.categoria_id.toString());
    setMarcaId(t.marca_id.toString());
    setMonto(t.monto.toString());
    setObservaciones(t.observaciones || '');
    // Format fecha to YYYY-MM-DD for input[type="date"]
    const dateObj = new Date(t.fecha);
    const formattedDate = dateObj.toISOString().split('T')[0];
    setFecha(formattedDate);

    setShowForm(true);
  };

  const resetForm = () => {
    setEditId(null);
    setTipo('Compra');
    setTransaccion('Debito');
    setCuotas('');
    setCategoriaId('');
    setMarcaId('');
    setMonto('');
    setObservaciones('');
    setFecha('');
  };

  const marcasFiltradas = marcas.filter(m => m.categoria_id === parseInt(categoriaId));

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transacciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transacciones.length / itemsPerPage);

  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-slate-900">Transacciones</h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Mes:</label>
            <select
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="rounded-md border border-slate-300 p-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            >
              <option value="">Todos los meses</option>
              {meses.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Usuario:</label>
            <select
              value={usuarioFiltro}
              onChange={(e) => setUsuarioFiltro(e.target.value)}
              className="rounded-md border border-slate-300 p-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            >
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors shadow-sm ml-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-medium text-slate-900 mb-4">{editId ? 'Editar Transacción' : 'Registrar Transacción'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="Compra">Compra</option>
                <option value="Ingreso">Ingreso</option>
                <option value="Dividendo">Dividendo</option>
                <option value="Polla">Polla</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medio</label>
              <select value={transaccion} onChange={(e) => setTransaccion(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="Debito">Débito</option>
                <option value="Credito">Crédito</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>

            {transaccion === 'Credito' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cuotas</label>
                <input type="number" min="1" value={cuotas} onChange={(e) => setCuotas(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setMarcaId(''); }} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Seleccione...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} required disabled={!categoriaId} className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100">
                <option value="">Seleccione...</option>
                {marcasFiltradas.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto (CLP)</label>
              <input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <input type="text" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Cargando transacciones...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <p>No hay transacciones registradas</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((t) => {
                    const cat = categorias.find(c => c.id === t.categoria_id);
                    const usr = usuarios.find(u => u.id === t.usuario_id);
                    const isIngreso = t.tipo === 'Ingreso';
                    const canEdit = currentUser?.rol === 'admin' || t.usuario_id === currentUser?.id;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(t.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{t.tipo} - {t.transaccion}</div>
                          <div className="text-sm text-slate-500">{t.observaciones || '-'}</div>
                          {t.transaccion === 'Credito' && <div className="text-xs text-primary-600 mt-1">{t.cuotas} Cuotas</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {cat?.nombre || 'Desconocida'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {usr?.nombre || 'Desconocido'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${isIngreso ? 'text-green-600' : 'text-slate-900'}`}>
                          {isIngreso ? '+' : '-'}${t.monto.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          {canEdit ? (
                            <>
                              <button onClick={() => handleEdit(t)} className="text-primary-600 hover:text-primary-900 transition-colors">
                                <Edit2 className="w-4 h-4 inline" />
                              </button>
                              <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {!loading && transacciones.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, transacciones.length)}</span> de <span className="font-medium">{transacciones.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>

            {/* Controles móviles para paginación */}
            <div className="flex items-center justify-between w-full sm:hidden">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transacciones;
