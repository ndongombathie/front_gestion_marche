import { Route, Routes } from 'react-router-dom'
import { AppLayout, ProtectedRoute, PublicLayout } from './components/Layout'
import HomePage from './pages/public/HomePage'
import OpportunitiesPage from './pages/public/OpportunitiesPage'
import OpportunityDetailPage from './pages/public/OpportunityDetailPage'
import AboutPage from './pages/public/AboutPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import BesoinsPage from './pages/besoins/BesoinsPage'
import MarchesPage from './pages/marches/MarchesPage'
import MarcheDetailPage from './pages/marches/MarcheDetailPage'
import AppelsOffresPage from './pages/appelsoffres/AppelsOffresPage'
import AppelOffreDetailPage from './pages/appelsoffres/AppelOffreDetailPage'
import EvaluationsPage from './pages/evaluations/EvaluationsPage'
import AttributionsPage from './pages/attributions/AttributionsPage'
import LivraisonsPage from './pages/livraisons/LivraisonsPage'
import FournisseursPage from './pages/fournisseurs/FournisseursPage'
import UtilisateursPage from './pages/utilisateurs/UtilisateursPage'
import MaterielsPage from './pages/materiels/MaterielsPage'
import RapportsPage from './pages/rapports/RapportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ProfilPage from './pages/profil/ProfilPage'
import FournisseurDashboardPage from './pages/fournisseur/FournisseurDashboardPage'
import FournisseurOpportunitesPage from './pages/fournisseur/FournisseurOpportunitesPage'
import FournisseurOffresPage from './pages/fournisseur/FournisseurOffresPage'
import FournisseurOffreDetailPage from './pages/fournisseur/FournisseurOffreDetailPage'
import FournisseurMarchesPage from './pages/fournisseur/FournisseurMarchesPage'
import FournisseurLivraisonsPage from './pages/fournisseur/FournisseurLivraisonsPage'
import NotFoundPage from './pages/public/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/opportunites" element={<OpportunitiesPage />} />
        <Route path="/opportunites/:id" element={<OpportunityDetailPage />} />
        <Route path="/a-propos" element={<AboutPage />} />
      </Route>

      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/besoins" element={<BesoinsPage />} />
          <Route path="/marches" element={<MarchesPage />} />
          <Route path="/marches/:id" element={<MarcheDetailPage />} />
          <Route path="/appels-offres" element={<AppelsOffresPage />} />
          <Route path="/appels-offres/:id" element={<AppelOffreDetailPage />} />
          <Route path="/evaluations" element={<EvaluationsPage />} />
          <Route path="/attributions" element={<AttributionsPage />} />
          <Route path="/livraisons" element={<LivraisonsPage />} />
          <Route path="/fournisseurs" element={<FournisseursPage />} />
          <Route path="/utilisateurs" element={<UtilisateursPage />} />
          <Route path="/materiels" element={<MaterielsPage />} />
          <Route path="/rapports" element={<RapportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profil" element={<ProfilPage />} />

          <Route path="/fournisseur" element={<FournisseurDashboardPage />} />
          <Route path="/fournisseur/opportunites" element={<FournisseurOpportunitesPage />} />
          <Route path="/fournisseur/offres" element={<FournisseurOffresPage />} />
          <Route path="/fournisseur/offres/:id" element={<FournisseurOffreDetailPage />} />
          <Route path="/fournisseur/marches" element={<FournisseurMarchesPage />} />
          <Route path="/fournisseur/livraisons" element={<FournisseurLivraisonsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
