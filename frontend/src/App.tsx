import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/Home";
import ProfilePage from "@/pages/Profile";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/:username" element={<ProfilePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
