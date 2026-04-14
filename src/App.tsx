import IDE from './components/IDE';
import './index.css';

function App() {
  if (!window.crossOriginIsolated) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-md p-8 bg-[#111] border border-[#222] rounded-xl shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Open in New Tab</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Kiri Code uses WebContainers which require Cross-Origin Isolation. This feature is not available inside the preview iframe.
          </p>
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
          >
            Open Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <IDE />
    </div>
  );
}

export default App;
