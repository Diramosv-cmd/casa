import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user: currentUser } = useContext(AuthContext);

  // Default filters: logged-in user and current month
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [mesFiltro, setMesFiltro] = useState((new Date().getMonth() + 1).toString());

  useEffect(() => {
    if (currentUser?.id && !usuarioFiltro) {
      setUsuarioFiltro(currentUser.id.toString());
    }
  }, [currentUser, usuarioFiltro]);

  const meses = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (usuarioFiltro) params.append('usuario_id', usuarioFiltro);
        if (mesFiltro) {
            params.append('mes', mesFiltro);
            params.append('anio', new Date().getFullYear().toString()); // Asumimos año actual para simplificar
        }
          
        const [resTx, resCat, resUsers] = await Promise.all([
          api.get(`/transacciones?${params.toString()}`),
          api.get('/categorias'),
          api.get('/users')
        ]);
        setTransacciones(resTx.data);
        setCategorias(resCat.data);
        setUsuarios(resUsers.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [usuarioFiltro, mesFiltro]);

  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-4rem)]">Cargando...</div>;

  const ingresos = transacciones.filter(t => t.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.monto, 0);
  const gastos = transacciones.filter(t => t.tipo !== 'Ingreso').reduce((acc, curr) => acc + curr.monto, 0);
  const balance = ingresos - gastos;

  // Datos para Pie Chart (Gastos por Categoría)
  const gastosPorCategoria = categorias.map(cat => {
    const total = transacciones
      .filter(t => t.tipo !== 'Ingreso' && t.categoria_id === cat.id)
      .reduce((acc, curr) => acc + curr.monto, 0);
    return { name: cat.nombre, value: total };
  }).filter(c => c.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
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
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
              <p className="text-2xl font-semibold text-slate-900">${ingresos.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Gastos Totales</p>
              <p className="text-2xl font-semibold text-slate-900">${gastos.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Balance</p>
              <p className="text-2xl font-semibold text-slate-900">${balance.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Gastos por Categoría</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gastosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString('es-CL')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Últimos Gastos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gastosPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString('es-CL')}`} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
