import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user: currentUser } = useContext(AuthContext);

  // Filters
  const [usuarioFiltro, setUsuarioFiltro] = useState(currentUser?.id?.toString() || null);
  const [mesFiltro, setMesFiltro] = useState((new Date().getMonth() + 1).toString());
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear().toString());
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');

  useEffect(() => {
    if (currentUser?.id && usuarioFiltro === null) {
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
  const anios = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (usuarioFiltro) params.append('usuario_id', usuarioFiltro);
        // We fetch the whole year to show the trend chart
        if (anioFiltro) params.append('anio', anioFiltro);
        if (categoriaFiltro) params.append('categoria_id', categoriaFiltro);
        if (marcaFiltro) params.append('marca_id', marcaFiltro);
          
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [usuarioFiltro, mesFiltro, anioFiltro, categoriaFiltro, marcaFiltro]);

  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-4rem)]">Cargando...</div>;

  // Filter data for KPIs and specific month charts
  const transaccionesFiltradas = mesFiltro 
    ? transacciones.filter(t => (new Date(t.fecha).getMonth() + 1).toString() === mesFiltro)
    : transacciones;

  const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.monto, 0);
  const gastos = transaccionesFiltradas.filter(t => t.tipo !== 'Ingreso' && t.transaccion !== 'Credito').reduce((acc, curr) => acc + curr.monto, 0);
  const gastoCredito = transaccionesFiltradas.filter(t => t.transaccion === 'Credito').reduce((acc, curr) => acc + curr.monto, 0);
  const balance = ingresos - gastos;

  // Pie Chart (Gastos por Categoría) - filtered by month
  const gastosPorCategoria = categorias.map(cat => {
    const total = transaccionesFiltradas
      .filter(t => t.tipo !== 'Ingreso' && t.categoria_id === cat.id)
      .reduce((acc, curr) => acc + curr.monto, 0);
    return { name: cat.nombre, value: total };
  }).filter(c => c.value > 0);

  // Bar Chart (Gastos por Usuario) - filtered by month
  const gastosPorUsuario = usuarios.map(u => {
    const total = transaccionesFiltradas
      .filter(t => t.tipo !== 'Ingreso' && t.usuario_id === u.id)
      .reduce((acc, curr) => acc + curr.monto, 0);
    return { name: u.nombre, value: total };
  }).filter(u => u.value > 0);

  // Combined Chart Data (Ingresos, Gastos y Balance por Mes) - whole year
  const dataMensual = meses.map(m => {
    const mesTx = transacciones.filter(t => (new Date(t.fecha).getMonth() + 1).toString() === m.value);
    const inc = mesTx.filter(t => t.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.monto, 0);
    const gas = mesTx.filter(t => t.tipo !== 'Ingreso' && t.transaccion !== 'Credito').reduce((acc, curr) => acc + curr.monto, 0);
    return { 
      name: m.label.substring(0, 3), 
      ingresos: inc, 
      gastos: gas, 
      balance: inc - gas 
    };
  });

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
            <label className="text-sm font-medium text-slate-700">Año:</label>
            <select 
              value={anioFiltro}
              onChange={(e) => setAnioFiltro(e.target.value)}
              className="rounded-md border border-slate-300 p-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            >
              {anios.map(a => (
                <option key={a} value={a}>{a}</option>
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
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Categoría:</label>
            <select 
              value={categoriaFiltro}
              onChange={(e) => { setCategoriaFiltro(e.target.value); setMarcaFiltro(''); }}
              className="rounded-md border border-slate-300 p-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Marca:</label>
            <select 
              value={marcaFiltro}
              onChange={(e) => setMarcaFiltro(e.target.value)}
              disabled={!categoriaFiltro}
              className="rounded-md border border-slate-300 p-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm disabled:bg-slate-100"
            >
              <option value="">Todas las marcas</option>
              {marcas.filter(m => m.categoria_id === parseInt(categoriaFiltro)).map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(ingresos)}</p>
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
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(gastos)}</p>
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
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Deuda Tarjeta</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(gastoCredito)}</p>
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
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Gastos por Usuario</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gastosPorUsuario}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Resumen Mensual ({anioFiltro})</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dataMensual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
