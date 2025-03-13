import FileUpload from './components/FileUpload';
import Stats from './components/Stats';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
    return (
        <div className="container">
            <h1>Company Knowledge Hub</h1>
            <FileUpload />
            <Stats />
            <ChatInterface />
        </div>
    );
}

export default App;