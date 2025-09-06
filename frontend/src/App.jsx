import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      <Loader />
      <Leva hidden/>
      
      {/* Left Side - 3D Avatar */}
      <div className="w-1/2 h-full relative">
        <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
          <Experience />
        </Canvas>
        
        {/* Avatar Section Header */}
        <div className="absolute top-4 left-4 backdrop-blur-md bg-white bg-opacity-80 p-3 rounded-lg shadow-lg">
          <h2 className="font-bold text-lg text-gray-800">🐍 Python Tutor</h2>
          <p className="text-sm text-gray-600">Your AI Learning Assistant</p>
        </div>
      </div>
      
      {/* Right Side - Whiteboard */}
      <div className="w-1/2 h-full flex flex-col">
        <UI />
      </div>
    </div>
  );
}

export default App;
