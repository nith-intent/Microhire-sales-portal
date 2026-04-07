import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LeadForm } from "./components/LeadForm";
import "./styles/variables.css";
import "./index.css";

function App() {
  return (
    <>
      <Header />
      <div className="container">
        <main role="main" className="pb-3">
          <LeadForm />
        </main>
      </div>
      <Footer />
    </>
  );
}

export default App;
