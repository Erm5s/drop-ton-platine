import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/Home";
import ProfilePage from "@/pages/Profile";

function App() {
    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/profil/:username" element={<ProfilePage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
