import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Users, Trash2, Edit2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Usuarios = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/users');
      setUsuarios(res.data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsuarios();
      } catch (err) {
        alert(err.response?.data?.detail || 'Error al eliminar usuario');
      }
    }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword('');
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editId}`, { nombre, email, password: password || undefined });
      setShowEditForm(false);
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al actualizar usuario');
    }
  };

  if (currentUser?.rol !== 'admin') {
    return <div className="text-center mt-20 text-red-500 font-bold">No tienes permisos para ver esta página.</div>;
  }

  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-4rem)]">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Users className="w-6 h-6 text-primary-600" />
          <span>Gestión de Usuarios</span>
        </h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

      {showEditForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Editar Usuario</h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña (Opcional)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Actualizar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button onClick={() => handleEdit(u)} className="text-primary-600 hover:text-primary-900"><Edit2 className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(u.id)} disabled={u.id === currentUser.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usuarios;
