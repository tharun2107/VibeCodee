import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiDownload, FiStar, FiEye, FiCode, FiCopy, FiSearch, FiSliders, FiNavigation, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ComponentMarketplace = ({ onComponentSelected }) => {
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock component data (in real app, this would come from an API)
  const mockComponents = [
    {
      id: 1,
      name: 'TodoList',
      category: 'productivity',
      description: 'A beautiful todo list component with drag & drop',
      code: `function TodoList() {
  const [todos, setTodos] = React.useState([]);
  const [input, setInput] = React.useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Todo List</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => setTodos(todos.map(t =>
                t.id === todo.id ? { ...t, completed: !t.completed } : t
              ))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className={\`flex-1 \${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}\`}>
              {todo.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.MainComponent = TodoList;`,
      tags: ['todo', 'productivity', 'list'],
      downloads: 1250,
      rating: 4.8,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      name: 'WeatherCard',
      category: 'ui',
      description: 'Beautiful weather display card with animations',
      code: `function WeatherCard() {
  const [weather, setWeather] = React.useState({
    city: 'New York',
    temperature: 22,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12
  });

  return (
    <div className="max-w-sm mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 text-white">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">{weather.city}</h2>
        <div className="text-6xl font-light mb-2">{weather.temperature}°C</div>
        <p className="text-blue-100">{weather.condition}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-semibold">{weather.humidity}%</div>
          <div className="text-sm text-blue-100">Humidity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold">{weather.windSpeed} km/h</div>
          <div className="text-sm text-blue-100">Wind Speed</div>
        </div>
      </div>
    </div>
  );
}

window.MainComponent = WeatherCard;`,
      tags: ['weather', 'card', 'dashboard'],
      downloads: 890,
      rating: 4.6,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      name: 'NavigationMenu',
      category: 'navigation',
      description: 'Responsive navigation menu with mobile support',
      code: `function NavigationMenu() {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <span className="font-bold text-xl text-gray-800">Brand</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                {isOpen ? (
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 0 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/>
                ) : (
                  <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 0 1-1V6a1 1 0 0 1-1 1H4a1 1 0 0 0-1 1v10a1 1 0 0 1 1-1z"/>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

window.MainComponent = NavigationMenu;`,
      tags: ['navigation', 'menu', 'responsive'],
      downloads: 2100,
      rating: 4.9,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
    },
    {
      id: 4,
      name: 'DataTable',
      category: 'data',
      description: 'Sortable data table with search and pagination',
      code: `function DataTable() {
  const [data, setData] = React.useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  ]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('name')}
              >
                Name
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('email')}
              >
                Email
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('status')}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.email}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={\`inline-flex px-2 py-1 text-xs font-semibold rounded-full \${
                    item.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }\`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.MainComponent = DataTable;`,
      tags: ['table', 'data', 'search', 'sort'],
      downloads: 750,
      rating: 4.7,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Components', icon: FiPackage },
    { id: 'ui', name: 'UI Components', icon: FiEye },
    { id: 'productivity', name: 'Productivity', icon: FiCode },
    { id: 'navigation', name: 'Navigation', icon: FiNavigation },
    { id: 'data', name: 'Data Display', icon: FiBarChart2 },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setComponents(mockComponents);
      setFilteredComponents(mockComponents);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = components;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(comp => comp.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(comp =>
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredComponents(filtered);
  }, [components, selectedCategory, searchQuery]);

  const handleComponentSelect = (component) => {
    onComponentSelected(component.code);
    toast.success(`Added ${component.name} to your project!`);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <FiPackage className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Component Marketplace</h3>
          <p className="text-sm text-gray-400">Pre-built components to accelerate development</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Components Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading components...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComponents.map((component) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="aspect-video bg-gray-700 relative overflow-hidden">
                <img
                  src={component.preview}
                  alt={component.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => copyCode(component.code)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <FiCopy className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">{component.name}</h4>
                  <div className="flex items-center gap-1">
                    <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-300">{component.rating}</span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-3">{component.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {component.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {component.downloads} downloads • by {component.author}
                  </div>
                  <motion.button
                    onClick={() => handleComponentSelect(component)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <FiDownload className="w-3 h-3" />
                    Use
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredComponents.length === 0 && !loading && (
        <div className="text-center py-12">
          <FiPackage className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No components found matching your criteria</p>
        </div>
      )}
    </motion.div>
  );
};

export default ComponentMarketplace;
