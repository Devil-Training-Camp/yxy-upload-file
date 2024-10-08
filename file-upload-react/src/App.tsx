import UploadFile from '@/pages/upload-file';
import reactLogo from '@/assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 style={{ textAlign: 'center' }}>Vite + React</h1>
      <UploadFile />
    </>
  );
}

export default App;
