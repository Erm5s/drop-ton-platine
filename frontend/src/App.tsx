import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/Home";
import ProfilePage from "@/pages/Profile";
import GamesPage from "@/pages/Games";
import ConnectionPage from "@/pages/Connection";
import LinkPSNPage from "@/pages/LinkPSN";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/profile/:username" element={<ProfilePage />} />
                            <Route path="/games" element={<GamesPage />} />
                            <Route path="/connection" element={<ConnectionPage />} />
                            <Route path="/link-psn" element={<LinkPSNPage />} />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
