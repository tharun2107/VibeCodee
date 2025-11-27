import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiClock, FiZap, FiHardDrive, FiGlobe, FiBarChart2, FiRefreshCw } from 'react-icons/fi';

const PerformanceAnalytics = ({ fileTree, activeFileId }) => {
  const [metrics, setMetrics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const flattenFileTree = (nodes = []) => {
    return nodes.reduce((acc, node) => {
      if (node.type === 'file') {
        acc.push(node);
      }
      if (node.children) {
        acc.push(...flattenFileTree(node.children));
      }
      return acc;
    }, []);
  };

  const insightNotes = useMemo(() => {
    if (!metrics) return [];
    const notes = [];

    if (metrics.complexityScore >= 70) {
      notes.push('Complexity is getting high — consider refactoring large components.');
    } else if (metrics.complexityScore <= 40) {
      notes.push('Structure looks clean and maintainable. Keep it up!');
    }

    if (metrics.consoleLogs > 0) {
      notes.push(`Detected ${metrics.consoleLogs} console statements. Remove them before shipping.`);
    }

    if (metrics.inlineStyles > 5) {
      notes.push('A lot of inline styles detected. Consider extracting them to Tailwind or CSS files.');
    }

    if (metrics.accessibilityTags < 3) {
      notes.push('Add more semantic or aria-* attributes to improve accessibility.');
    } else {
      notes.push('Great! Accessibility attributes detected in this file.');
    }

    if (metrics.hooks > 5) {
      notes.push('Many hooks in a single file. Split logic into custom hooks or smaller components.');
    }

    return notes;
  }, [metrics]);

  // Analyze current code for performance metrics
  const analyzePerformance = () => {
    setIsAnalyzing(true);

    // Simulate analysis (in real app, this would call an API)
    setTimeout(() => {
      const flatFiles = flattenFileTree(fileTree);
      const currentFile = flatFiles.find(f => f.id === activeFileId);
      const code = currentFile?.content || '';

      // Calculate metrics
      const linesOfCode = code.split('\n').filter(line => line.trim()).length;
      const components = (code.match(/function\s+[A-Z]\w*|const\s+[A-Z]\w*\s*=\s*\(/g) || []).length;
      const hooks = (code.match(/use[A-Z]\w*/g) || []).length;
      const imports = (code.match(/^import/gm) || []).length;
      const consoleLogs = (code.match(/console\.(log|warn|error|info)/g) || []).length;
      const inlineStyles = (code.match(/style\s*=\s*\{/g) || []).length;
      const accessibilityTags = (code.match(/aria-|role=|alt="/g) || []).length;

      // Estimate bundle size (rough calculation)
      const estimatedBundleSize = Math.round(code.length * 2.5); // Rough estimate

      // Performance score (0-100)
      let score = 100;
      if (linesOfCode > 200) score -= 10;
      if (hooks > 5) score -= 5;
      if (imports > 10) score -= 15;
      if (code.includes('console.log')) score -= 10;
      score = Math.max(0, Math.min(100, score));

      const complexityScore = Math.min(
        100,
        Math.round(linesOfCode / 4 + components * 5 + hooks * 6 + Math.max(imports - 6, 0) * 3)
      );

      const maintainabilityScore = Math.max(
        0,
        100 - Math.round(linesOfCode / 3 + consoleLogs * 5 + inlineStyles * 2)
      );

      setMetrics({
        fileName: currentFile?.name || 'Active file',
        linesOfCode,
        components,
        hooks,
        imports,
        estimatedBundleSize,
        score,
        loadTime: Math.round(Math.random() * 2000 + 500), // Simulated
        renderTime: Math.round(Math.random() * 100 + 20), // Simulated
        consoleLogs,
        inlineStyles,
        accessibilityTags,
        complexityScore,
        maintainabilityScore,
      });

      setIsAnalyzing(false);
    }, 2000);
  };

  useEffect(() => {
    if (fileTree.length > 0 && activeFileId) {
      analyzePerformance();
    }
  }, [fileTree, activeFileId]);

  const MetricCard = ({ icon: Icon, title, value, unit, color = 'blue', description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-300">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <FiBarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
            <p className="text-sm text-gray-400">
              {metrics?.fileName ? `Analyzing: ${metrics.fileName}` : 'AI-powered code insights'}
            </p>
          </div>
        </div>
        <motion.button
          onClick={analyzePerformance}
          disabled={isAnalyzing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 text-gray-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {isAnalyzing ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-400">Analyzing your code...</p>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Performance Score */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mb-3">
              <span className="text-2xl font-bold text-white">{metrics.score}</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">Performance Score</h4>
            <p className="text-sm text-gray-400">
              {metrics.score >= 80 ? 'Excellent!' :
               metrics.score >= 60 ? 'Good' :
               metrics.score >= 40 ? 'Fair' : 'Needs improvement'}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              icon={FiHardDrive}
              title="Lines of Code"
              value={metrics.linesOfCode}
              description="Total code lines"
            />
            <MetricCard
              icon={FiZap}
              title="Components"
              value={metrics.components}
              description="React components"
            />
            <MetricCard
              icon={FiClock}
              title="Load Time"
              value={metrics.loadTime}
              unit="ms"
              description="Estimated load time"
            />
            <MetricCard
              icon={FiGlobe}
              title="Bundle Size"
              value={Math.round(metrics.estimatedBundleSize / 1024)}
              unit="KB"
              description="Estimated bundle size"
            />
            <MetricCard
              icon={FiZap}
              title="Complexity"
              value={metrics.complexityScore}
              description="Computed complexity index"
            />
            <MetricCard
              icon={FiClock}
              title="Maintainability"
              value={metrics.maintainabilityScore}
              description="Higher is easier to maintain"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Suggestions */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4" />
                Optimization Suggestions
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                {metrics.hooks > 5 && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    Consider reducing the number of hooks for better performance
                  </li>
                )}
                {metrics.imports > 10 && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    High number of imports - consider code splitting
                  </li>
                )}
                {metrics.linesOfCode > 200 && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Consider breaking down into smaller components
                  </li>
                )}
                {metrics.consoleLogs > 0 && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Remove console statements before deployment
                  </li>
                )}
                {metrics.inlineStyles > 5 && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                    Extract inline styles into reusable classes
                  </li>
                )}
                {metrics.hooks <= 5 &&
                  metrics.imports <= 10 &&
                  metrics.linesOfCode <= 200 &&
                  metrics.consoleLogs === 0 &&
                  metrics.inlineStyles <= 5 && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Code looks well-structured!
                    </li>
                  )}
              </ul>
            </div>

            {/* Insight Notes */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4" />
                Deep Insights
              </h4>
              {insightNotes.length === 0 ? (
                <p className="text-sm text-gray-400">No additional insights detected.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-300">
                  {insightNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiBarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Load a file to see performance analytics</p>
        </div>
      )}
    </motion.div>
  );
};

export default PerformanceAnalytics;
