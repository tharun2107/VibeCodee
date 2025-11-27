import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiFolder, FiGlobe, FiTrash2, FiClock, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const ProjectDashboard = ({ token, onCreateProject, onOpenProject, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await axios.get(`${apiBase}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`${apiBase}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Project deleted');
      loadProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              AetherBuild
            </h1>
            <p className="text-gray-400">
              Welcome back, {user?.email}
            </p>
          </div>
          <div className="flex gap-4">
            <motion.button
              onClick={onLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </motion.button>
            <motion.button
              onClick={onCreateProject}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              <FiPlus className="w-5 h-5" />
              New Project
            </motion.button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FiFolder className="w-20 h-20 text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <motion.button
              onClick={onCreateProject}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center gap-2 mx-auto hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              <FiPlus className="w-5 h-5" />
              Create Project
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onOpenProject(project._id)}
                className="group relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <FiFolder className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FiClock className="w-4 h-4" />
                        {formatDate(project.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(project._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {project.deployedLinks && project.deployedLinks.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <FiGlobe className="w-4 h-4" />
                      Deployed Links
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.deployedLinks.slice(0, 2).map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
                        >
                          View Live
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
                  Open Project
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;

