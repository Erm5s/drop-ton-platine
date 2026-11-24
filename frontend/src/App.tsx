import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import Footer from "@/components/Footer";
import HomePage from "@/pages/Home";
import ProfilePage from "@/pages/Profile";
import GamesPage from "@/pages/Games";
import GamePage from "@/pages/Game";
import CreatorsPage from "@/pages/Creators";
import PartnersPage from "@/pages/Partners";
import TermsPage from "@/pages/Terms";
import CookiesPage from "@/pages/Cookies";
import AboutPage from "@/pages/About";
import LeaderboardPage from "@/pages/Leaderboard";
import ConnectionPage from "@/pages/Connection";
import LinkPSNPage from "@/pages/LinkPSN";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ScrollToTop />
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/profile/:username" element={<ProfilePage />} />
                            <Route path="/games" element={<GamesPage />} />
                            <Route path="/games/:id" element={<GamePage />} />
                            <Route path="/createurs" element={<CreatorsPage />} />
                            <Route path="/partenaires" element={<PartnersPage />} />
                            <Route path="/cgu" element={<TermsPage />} />
                            <Route path="/cookies" element={<CookiesPage />} />
                            <Route path="/qui-sommes-nous" element={<AboutPage />} />
                            <Route path="/classement" element={<LeaderboardPage />} />
                            <Route path="/connection" element={<ConnectionPage />} />
                            <Route path="/link-psn" element={<LinkPSNPage />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
