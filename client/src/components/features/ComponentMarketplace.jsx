import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiDownload, FiStar, FiEye, FiCode, FiCopy, FiSearch, FiSliders, FiNavigation, FiBarChart2, FiX, FiGitMerge, FiRefreshCw, FiZap, FiMail, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ComponentMarketplace = ({ onComponentSelected, currentCode }) => {
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [integrationMode, setIntegrationMode] = useState('merge'); // 'merge' or 'replace'
  const [integrationInstructions, setIntegrationInstructions] = useState('');

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
    {
      id: 5,
      name: 'Modern Navbar',
      category: 'navigation',
      description: 'Responsive navbar with logo, menu items, and mobile hamburger',
      code: `function ModernNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Brand
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <button className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

window.MainComponent = ModernNavbar;`,
      tags: ['navbar', 'navigation', 'responsive', 'header'],
      downloads: 3200,
      rating: 4.9,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
    {
      id: 6,
      name: 'Contact Form',
      category: 'forms',
      description: 'Beautiful contact form with validation and submit handling',
      code: `function ContactForm() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = React.useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Get In Touch</h2>
      
      {submitted && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          Thank you! Your message has been sent.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="What's this about?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Your message here..."
          />
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}

window.MainComponent = ContactForm;`,
      tags: ['form', 'contact', 'validation', 'input'],
      downloads: 1850,
      rating: 4.8,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
    {
      id: 7,
      name: 'Tic Tac Toe Game',
      category: 'games',
      description: 'Classic Tic Tac Toe game with win detection and reset',
      code: `function TicTacToe() {
  const [board, setBoard] = React.useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = React.useState(true);
  const [winner, setWinner] = React.useState(null);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else if (!newBoard.includes(null)) {
      setWinner('Draw');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const Square = ({ value, onClick }) => (
    <button
      onClick={onClick}
      className="w-20 h-20 text-3xl font-bold bg-white border-2 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
      disabled={value || winner}
    >
      {value}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">Tic Tac Toe</h1>
        
        <div className="text-center mb-4">
          {winner ? (
            <p className="text-2xl font-semibold text-purple-600">
              {winner === 'Draw' ? "It's a Draw!" : \`\${winner} Wins!\`}
            </p>
          ) : (
            <p className="text-xl text-gray-700">
              Next player: <span className="font-bold text-purple-600">{isXNext ? 'X' : 'O'}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {board.map((square, index) => (
            <Square
              key={index}
              value={square}
              onClick={() => handleClick(index)}
            />
          ))}
        </div>

        <button
          onClick={resetGame}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}

window.MainComponent = TicTacToe;`,
      tags: ['game', 'tic-tac-toe', 'interactive', 'fun'],
      downloads: 950,
      rating: 4.7,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
    {
      id: 8,
      name: 'Memory Card Game',
      category: 'games',
      description: 'Flip cards to find matching pairs - memory game',
      code: `function MemoryGame() {
  const [cards, setCards] = React.useState([]);
  const [flipped, setFlipped] = React.useState([]);
  const [matched, setMatched] = React.useState([]);
  const [moves, setMoves] = React.useState(0);

  React.useEffect(() => {
    const symbols = ['🎯', '🚀', '⭐', '🎨', '🎵', '🎮'];
    const gameCards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({ id: index, symbol, flipped: false }));
    setCards(gameCards);
  }, []);

  const handleCardClick = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setMoves(moves + 1);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        setMatched([...matched, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const resetGame = () => {
    const symbols = ['🎯', '🚀', '⭐', '🎨', '🎵', '🎮'];
    const gameCards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({ id: index, symbol, flipped: false }));
    setCards(gameCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Memory Game</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Moves: <span className="font-bold">{moves}</span></p>
            <p className="text-sm text-gray-600">Matched: <span className="font-bold">{matched.length / 2}/6</span></p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 text-4xl rounded-lg flex items-center justify-center text-white font-bold hover:scale-105 transition-transform"
                disabled={isFlipped}
              >
                {isFlipped ? card.symbol : '?'}
              </button>
            );
          })}
        </div>

        {matched.length === 12 && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
            🎉 Congratulations! You won in {moves} moves!
          </div>
        )}

        <button
          onClick={resetGame}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

window.MainComponent = MemoryGame;`,
      tags: ['game', 'memory', 'cards', 'puzzle'],
      downloads: 650,
      rating: 4.6,
      author: 'AetherBuild',
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
    {
      id: 9,
      name: 'Snake Game',
      category: 'games',
      description: 'Classic Snake game with arrow key controls',
      code: `function SnakeGame() {
  const [snake, setSnake] = React.useState([{ x: 10, y: 10 }]);
  const [food, setFood] = React.useState({ x: 15, y: 15 });
  const [direction, setDirection] = React.useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = React.useState(false);
  const [score, setScore] = React.useState(0);

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;
      const keyMap = {
        'ArrowUp': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 }
      };
      if (keyMap[e.key]) {
        setDirection(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver]);

  React.useEffect(() => {
    if (gameOver) return;
    const gameLoop = setInterval(() => {
      setSnake(prev => {
        const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || prev.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          return prev;
        }
        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setFood({ x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) });
          setScore(score + 1);
          return newSnake;
        }
        return newSnake.slice(0, -1);
      });
    }, 150);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, score]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection({ x: 1, y: 0 });
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Snake Game</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Score: <span className="font-bold text-green-600">{score}</span></p>
          </div>
        </div>
        <div className="grid grid-cols-20 gap-0.5 bg-gray-800 p-2 rounded-lg mb-4" style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}>
          {Array.from({ length: 400 }).map((_, i) => {
            const x = i % 20;
            const y = Math.floor(i / 20);
            const isSnake = snake.some(seg => seg.x === x && seg.y === y);
            const isFood = food.x === x && food.y === y;
            return (
              <div
                key={i}
                className={\`w-4 h-4 \${isSnake ? 'bg-green-500' : isFood ? 'bg-red-500 rounded-full' : 'bg-gray-700'}\`}
              />
            );
          })}
        </div>
        {gameOver && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            Game Over! Final Score: {score}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={resetGame}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {gameOver ? 'Play Again' : 'Reset'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">Use arrow keys to play</p>
      </div>
    </div>
  );
}

window.MainComponent = SnakeGame;`,
      tags: ['game', 'snake', 'arcade', 'classic'],
      downloads: 1200,
      rating: 4.8,
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
    { id: 'games', name: 'Games', icon: FiZap },
    { id: 'forms', name: 'Forms', icon: FiMail },
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
    setSelectedComponent(component);
    setShowIntegrationModal(true);
  };

  const handleIntegration = () => {
    if (!selectedComponent) return;

    let finalCode = selectedComponent.code;

    if (integrationMode === 'merge' && currentCode && currentCode.trim()) {
      // Merge with existing code using AI-like logic
      if (integrationInstructions.trim()) {
        // User provided specific instructions - we'll append the component
        // In a real app, you'd use AI to intelligently merge
        finalCode = `${currentCode}\n\n// Added ${selectedComponent.name} component\n${selectedComponent.code}`;
      } else {
        // Simple merge: append as a new component
        const existingComponentMatch = currentCode.match(/function\s+(\w+)\s*\(/);
        const newComponentMatch = selectedComponent.code.match(/function\s+(\w+)\s*\(/);
        
        if (existingComponentMatch && newComponentMatch) {
          const existingComponentName = existingComponentMatch[1];
          const newComponentName = newComponentMatch[1];
          
          // Remove window.MainComponent from new component
          let newComponentCode = selectedComponent.code.replace(/window\.MainComponent\s*=\s*\w+;?\s*$/, '').trim();
          
          // Merge: keep existing component, add new one, update MainComponent
          finalCode = `${currentCode}\n\n${newComponentCode}\n\n// You can use ${newComponentName} in your ${existingComponentName} component`;
        } else {
          finalCode = `${currentCode}\n\n${selectedComponent.code}`;
        }
      }
    }

    onComponentSelected(finalCode);
    toast.success(`${integrationMode === 'merge' ? 'Merged' : 'Replaced'} ${selectedComponent.name} ${integrationMode === 'merge' ? 'with' : 'in'} your project!`);
    setShowIntegrationModal(false);
    setSelectedComponent(null);
    setIntegrationInstructions('');
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

      {/* Integration Modal */}
      <AnimatePresence>
        {showIntegrationModal && selectedComponent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowIntegrationModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Add {selectedComponent.name}</h3>
                <button
                  onClick={() => setShowIntegrationModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-6">{selectedComponent.description}</p>

              {/* Integration Mode Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">How would you like to add this component?</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIntegrationMode('merge')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        integrationMode === 'merge'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FiGitMerge className={`w-5 h-5 ${integrationMode === 'merge' ? 'text-purple-400' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium text-white">Merge with existing code</div>
                          <div className="text-xs text-gray-400 mt-1">Add this component alongside your current code</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setIntegrationMode('replace')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        integrationMode === 'replace'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FiRefreshCw className={`w-5 h-5 ${integrationMode === 'replace' ? 'text-purple-400' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium text-white">Replace current code</div>
                          <div className="text-xs text-gray-400 mt-1">Replace your current component with this one</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Integration Instructions (for merge mode) */}
                {integrationMode === 'merge' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Integration instructions (optional)
                    </label>
                    <textarea
                      value={integrationInstructions}
                      onChange={(e) => setIntegrationInstructions(e.target.value)}
                      placeholder="e.g., 'Add this as a sidebar component', 'Place it below the header', 'Use it in the main layout'"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tell us how you want to integrate this component with your existing code
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIntegrationModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIntegration}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  {integrationMode === 'merge' ? (
                    <>
                      <FiGitMerge className="w-4 h-4" />
                      Merge Component
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="w-4 h-4" />
                      Replace Code
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ComponentMarketplace;
